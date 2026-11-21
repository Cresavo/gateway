// SPDX-License-Identifier: AGPL-3.0-only
import { isIP } from "node:net";
import { loopbackTestLimits } from "./limits.js";
// Runtime configuration. The default is loopback-only. Serving beyond loopback
// needs every one of the explicit flags below; a partial configuration refuses to start.

const LOOPBACK = new Set(["127.0.0.1", "::1"]);
const WILDCARD = new Set(["0.0.0.0", "::"]);

export function publicOrigin(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/")
    throw new Error("GATEWAY_PUBLIC_ORIGIN must be a bare https:// origin");
  return url.origin;
}

export function loadConfig(env = process.env) {
  const port = Number(env.PORT || 3218);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Set a valid PORT");
  if (!env.SALON_ORIGIN) throw new Error("Set SALON_ORIGIN");
  const host = env.GATEWAY_LISTEN_HOST || "127.0.0.1";
  const remote = env.GATEWAY_ALLOW_REMOTE === "1";
  if (env.GATEWAY_ALLOW_REMOTE !== undefined && !["0", "1"].includes(env.GATEWAY_ALLOW_REMOTE))
    throw new Error("GATEWAY_ALLOW_REMOTE must be 0 or 1");
  const hops = Number(env.GATEWAY_TRUST_PROXY_HOPS || 0);
  if (!Number.isInteger(hops) || hops < 0 || hops > 5) throw new Error("GATEWAY_TRUST_PROXY_HOPS must be 0 to 5");
  const store = rateLimitStore(env, remote);
  const testLimits = loopbackProofLimits(env, remote);
  if (!remote) {
    if (!LOOPBACK.has(host)) throw new Error("Non-loopback GATEWAY_LISTEN_HOST requires GATEWAY_ALLOW_REMOTE=1");
    if (env.GATEWAY_PUBLIC_ORIGIN || hops) throw new Error("GATEWAY_PUBLIC_ORIGIN and proxy hops require GATEWAY_ALLOW_REMOTE=1");
    return { port, host, salon: env.SALON_ORIGIN, serviceToken: env.GATEWAY_SERVICE_TOKEN,
      options: { ...store, ...(testLimits ? { limits: loopbackTestLimits } : {}) } };
  }
  if (!LOOPBACK.has(host) && !WILDCARD.has(host)) throw new Error("GATEWAY_LISTEN_HOST must be loopback, 0.0.0.0 or ::");
  if (!env.GATEWAY_PUBLIC_ORIGIN) throw new Error("GATEWAY_ALLOW_REMOTE=1 requires GATEWAY_PUBLIC_ORIGIN");
  if (hops < 1) throw new Error("GATEWAY_ALLOW_REMOTE=1 requires a TLS-terminating proxy: set GATEWAY_TRUST_PROXY_HOPS");
  const salon = new URL(env.SALON_ORIGIN);
  if (salon.protocol !== "https:") throw new Error("GATEWAY_ALLOW_REMOTE=1 requires an https:// SALON_ORIGIN");
  return {
    port, host, salon: env.SALON_ORIGIN, serviceToken: env.GATEWAY_SERVICE_TOKEN,
    options: { publicOrigin: publicOrigin(env.GATEWAY_PUBLIC_ORIGIN), trustProxyHops: hops, ...store },
  };
}

function loopbackProofLimits(env, remote) {
  const value = env.GATEWAY_LOOPBACK_TEST_LIMITS;
  if (value === undefined || value === "0") return false;
  if (value !== "1") throw new Error("GATEWAY_LOOPBACK_TEST_LIMITS must be 0 or 1");
  if (remote || env.VERCEL || env.GATEWAY_RATE_LIMIT_REDIS_URL)
    throw new Error("GATEWAY_LOOPBACK_TEST_LIMITS is for local proofs on loopback only");
  return true;
}

// Shared rate-limit store. Required wherever more than one instance can run
// (GATEWAY_REQUIRE_SHARED_LIMITS=1, or automatically on Vercel). The URL holds a
// password: it is validated here and never logged or echoed in errors.
function rateLimitStore(env, remote) {
  const value = env.GATEWAY_RATE_LIMIT_REDIS_URL;
  const required = env.GATEWAY_REQUIRE_SHARED_LIMITS === "1" || Boolean(env.VERCEL);
  if (!value) {
    if (required) throw new Error("Shared rate limits are required here: set GATEWAY_RATE_LIMIT_REDIS_URL");
    return {};
  }
  let url;
  try { url = new URL(value); } catch { throw new Error("GATEWAY_RATE_LIMIT_REDIS_URL is not a valid URL"); }
  const local = LOOPBACK.has(url.hostname) || url.hostname === "[::1]";
  if (!(url.protocol === "rediss:" || (url.protocol === "redis:" && local)))
    throw new Error("GATEWAY_RATE_LIMIT_REDIS_URL must use rediss://, or redis:// on loopback");
  if (remote && !local && url.protocol !== "rediss:") throw new Error("Remote mode needs TLS to the rate-limit store");
  return { rateLimitStoreUrl: value };
}

// The client key used for rate limiting. With N trusted proxy hops the
// address is the Nth entry from the right of X-Forwarded-For; entries further
// left were written by the client and are ignored. Invalid entries fall back to
// the socket address. IPv4-mapped IPv6 is unmapped and IPv6 is keyed per /64,
// so one client cannot mint fresh buckets by rotating addresses in its prefix.
export function clientAddress(req, hops) {
  const socket = req.socket.remoteAddress ?? "unknown";
  let address = socket;
  if (hops) {
    const header = req.headers["x-forwarded-for"];
    const list = typeof header === "string" ? header.split(",").map(part => part.trim()).filter(Boolean) : [];
    const candidate = list.length >= hops ? list[list.length - hops] : undefined;
    if (candidate && isIP(candidate)) address = candidate;
  }
  return normaliseAddress(address);
}

export function normaliseAddress(address) {
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(address);
  if (mapped) return mapped[1];
  if (isIP(address) !== 6) return address;
  const [head, tail = ""] = address.toLowerCase().split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const groups = address.includes("::") ? [...left, ...Array(8 - left.length - right.length).fill("0"), ...right] : left;
  return groups.slice(0, 4).map(g => g.replace(/^0+(?=.)/, "")).join(":") + "::/64";
}

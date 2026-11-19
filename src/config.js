// SPDX-License-Identifier: AGPL-3.0-only
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
  if (!remote) {
    if (!LOOPBACK.has(host)) throw new Error("Non-loopback GATEWAY_LISTEN_HOST requires GATEWAY_ALLOW_REMOTE=1");
    if (env.GATEWAY_PUBLIC_ORIGIN || hops) throw new Error("GATEWAY_PUBLIC_ORIGIN and proxy hops require GATEWAY_ALLOW_REMOTE=1");
    return { port, host, salon: env.SALON_ORIGIN, serviceToken: env.GATEWAY_SERVICE_TOKEN, options: {} };
  }
  if (!LOOPBACK.has(host) && !WILDCARD.has(host)) throw new Error("GATEWAY_LISTEN_HOST must be loopback, 0.0.0.0 or ::");
  if (!env.GATEWAY_PUBLIC_ORIGIN) throw new Error("GATEWAY_ALLOW_REMOTE=1 requires GATEWAY_PUBLIC_ORIGIN");
  if (hops < 1) throw new Error("GATEWAY_ALLOW_REMOTE=1 requires a TLS-terminating proxy: set GATEWAY_TRUST_PROXY_HOPS");
  const salon = new URL(env.SALON_ORIGIN);
  if (salon.protocol !== "https:") throw new Error("GATEWAY_ALLOW_REMOTE=1 requires an https:// SALON_ORIGIN");
  return {
    port, host, salon: env.SALON_ORIGIN, serviceToken: env.GATEWAY_SERVICE_TOKEN,
    options: { publicOrigin: publicOrigin(env.GATEWAY_PUBLIC_ORIGIN), trustProxyHops: hops },
  };
}

// The client address used for rate limiting. With N trusted proxy hops the
// address is the Nth entry from the right of X-Forwarded-For; entries further
// left were written by the client and are ignored.
export function clientAddress(req, hops) {
  const socket = req.socket.remoteAddress ?? "unknown";
  if (!hops) return socket;
  const header = req.headers["x-forwarded-for"];
  if (typeof header !== "string") return socket;
  const list = header.split(",").map(part => part.trim()).filter(Boolean);
  return list.length >= hops ? list[list.length - hops] : socket;
}

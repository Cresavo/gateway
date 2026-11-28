// SPDX-License-Identifier: AGPL-3.0-only
// Rate limits shared by every gateway instance through Redis (or any server that
// speaks the Redis protocol, such as Valkey). Works on Vercel, on a container
// host or on a single machine. Same windows and semantics as the in-memory limiter.
import { createHash } from "node:crypto";
import { Redis } from "ioredis";
import { defaultLimits, rateLimiter } from "./limits.js";

// Atomic across instances: check every bucket first, count only when all have room.
// Returns 0 when admitted, otherwise the longest remaining window in milliseconds.
const TAKE = `
local retry = 0
for i = 1, #KEYS do
  local count = tonumber(redis.call('GET', KEYS[i]) or '0')
  if count >= tonumber(ARGV[2 * i - 1]) then
    local ttl = redis.call('PTTL', KEYS[i])
    if ttl < 0 then
      redis.call('PEXPIRE', KEYS[i], ARGV[2 * i])
      ttl = tonumber(ARGV[2 * i])
    end
    if ttl > retry then retry = ttl end
  end
end
if retry > 0 then return retry end
for i = 1, #KEYS do
  redis.call('INCR', KEYS[i])
  if redis.call('PTTL', KEYS[i]) < 0 then redis.call('PEXPIRE', KEYS[i], ARGV[2 * i]) end
end
return 0
`;
const PREFIX = "cresavo-gateway:rl:v1:";
const CREATE_BUCKETS = new Set(["booking_create", "proposal_create"]);

export function providerNamespace(salon) {
  return createHash("sha256").update(new URL(salon).origin).digest("hex").slice(0, 32);
}

// When the store cannot answer: reads fall back to this instance's own limiter,
// creates are refused. A store outage must never lift the write limits.
/** @param {string} url @param {{ limits?: typeof defaultLimits, namespace?: string, redis?: Redis }} [options] */
export function sharedRateLimiter(url, { limits = defaultLimits, namespace = "default", redis: client } = {}) {
  const redis = client ?? new Redis(url, {
    enableOfflineQueue: false, maxRetriesPerRequest: 1, commandTimeout: 500, connectTimeout: 2000,
  });
  // Without a listener ioredis prints errors, which can include the connection URL.
  redis.on("error", () => {});
  const local = rateLimiter(limits);
  async function take(ip, buckets) {
    const keys = buckets.map(bucket => PREFIX + namespace + ":" + bucket + ":" + ip);
    const args = buckets.flatMap(bucket => [limits[bucket].limit, limits[bucket].windowMs]);
    try {
      const retryMs = Number(await redis.eval(TAKE, keys.length, ...keys, ...args));
      return retryMs > 0 ? { ok: false, retryAfter: Math.max(1, Math.ceil(retryMs / 1000)) } : { ok: true };
    } catch {
      if (buckets.some(bucket => CREATE_BUCKETS.has(bucket))) return { ok: false, retryAfter: 30 };
      return local(ip, buckets);
    }
  }
  take.close = () => redis.quit().catch(() => redis.disconnect());
  return take;
}

// SPDX-License-Identifier: AGPL-3.0-only
// Per-client-IP rate limits enforced before any request reaches the salon.
// The salon sees every split-mode request as coming from the gateway, so it
// cannot apply its own per-IP limits to agent traffic; the gateway does it.
// Per-salon limits remain the salon's job. State is in memory and per process:
// run exactly one gateway instance per provider (see docs/HOSTING.md).

export const defaultLimits = Object.freeze({
  read: { limit: 60, windowMs: 60_000 },
  proposal_create: { limit: 5, windowMs: 3_600_000 },
  booking_create: { limit: 5, windowMs: 3_600_000 },
});

const createTools = {
  create_booking: "booking_create", usp_bookings_create: "booking_create",
  create_proposal: "proposal_create",
};
const MAX_KEYS = 100_000;

// Returns every bucket a request consumes. All requests consume "read";
// creates additionally consume their own create bucket.
export function classify(method, pathname, body) {
  const buckets = ["read"];
  if (method === "POST" && pathname === "/api/v1/bookings") buckets.push("booking_create");
  if (method === "POST" && pathname === "/api/v1/proposals") buckets.push("proposal_create");
  if (method === "POST" && pathname === "/api/v1/mcp" && body) {
    let rpc;
    try { rpc = JSON.parse(body.toString("utf8")); } catch { return buckets; }
    for (const message of Array.isArray(rpc) ? rpc : [rpc]) {
      const name = message?.method === "tools/call" ? message.params?.name : undefined;
      if (typeof name === "string" && Object.hasOwn(createTools, name) && !buckets.includes(createTools[name]))
        buckets.push(createTools[name]);
    }
  }
  return buckets;
}

export function rateLimiter(limits = defaultLimits, now = Date.now) {
  const windows = new Map();
  function prune(time) {
    for (const [key, entry] of windows) if (entry.resetAt <= time) windows.delete(key);
  }
  // Checks all buckets first and only then counts, so a refused request does
  // not consume quota in the buckets that still had room.
  return function take(ip, buckets) {
    const time = now();
    if (windows.size > MAX_KEYS) prune(time);
    let retryAfterMs = 0;
    const entries = buckets.map(bucket => {
      const rule = limits[bucket];
      const key = bucket + "\0" + ip;
      let entry = windows.get(key);
      if (!entry || entry.resetAt <= time) {
        entry = { count: 0, resetAt: time + rule.windowMs };
        windows.set(key, entry);
      }
      if (entry.count >= rule.limit) retryAfterMs = Math.max(retryAfterMs, entry.resetAt - time);
      return entry;
    });
    if (retryAfterMs > 0) return { ok: false, retryAfter: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
    for (const entry of entries) entry.count++;
    return { ok: true };
  };
}

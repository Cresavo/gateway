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
// creates additionally consume their own create bucket. `rpc` is the already
// parsed JSON-RPC message for MCP POSTs (batches are refused before this point).
export function classify(method, pathname, rpc) {
  const buckets = ["read"];
  if (method === "POST" && pathname === "/api/v1/bookings") buckets.push("booking_create");
  if (method === "POST" && pathname === "/api/v1/proposals") buckets.push("proposal_create");
  if (method === "POST" && pathname === "/api/v1/mcp") {
    const name = rpc?.method === "tools/call" ? rpc.params?.name : undefined;
    if (typeof name === "string" && Object.hasOwn(createTools, name)) buckets.push(createTools[name]);
  }
  return buckets;
}

// Parses an MCP POST body once. The gateway forwards the re-serialised result,
// so the limiter and the MCP handler can never read different messages.
// Returns undefined for anything that is not a single JSON-RPC object.
export function parseMcpBody(body) {
  if (!body) return undefined;
  let text = body.toString("utf8");
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  try {
    const rpc = JSON.parse(text);
    return rpc && typeof rpc === "object" && !Array.isArray(rpc) ? rpc : undefined;
  } catch { return undefined; }
}

export function rateLimiter(limits = defaultLimits, now = Date.now, maxKeys = MAX_KEYS) {
  const windows = new Map();
  let lastPrune = 0;
  function prune(time) {
    lastPrune = time;
    for (const [key, entry] of windows) if (entry.resetAt <= time) windows.delete(key);
  }
  // Checks all buckets first and only then counts, so a refused request does
  // not consume quota in the buckets that still had room.
  return function take(ip, buckets) {
    const time = now();
    if (windows.size >= maxKeys && time - lastPrune >= 1000) prune(time);
    let retryAfterMs = 0;
    const entries = [];
    for (const bucket of buckets) {
      const rule = limits[bucket];
      const key = bucket + "\0" + ip;
      let entry = windows.get(key);
      if (!entry || entry.resetAt <= time) {
        // Fail closed when the table is full of live windows: never grow without bound.
        if (!entry && windows.size >= maxKeys) return { ok: false, retryAfter: 60 };
        entry = { count: 0, resetAt: time + rule.windowMs };
        windows.set(key, entry);
      }
      if (entry.count >= rule.limit) retryAfterMs = Math.max(retryAfterMs, entry.resetAt - time);
      entries.push(entry);
    }
    if (retryAfterMs > 0) return { ok: false, retryAfter: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
    for (const entry of entries) entry.count++;
    return { ok: true };
  };
}

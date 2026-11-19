// SPDX-License-Identifier: AGPL-3.0-only
const reads = /^\/api\/v1\/(?:services|availability|bookings\/[\w-]{1,128}|proposals\/[\w-]{1,128})$/;
const writes = /^\/api\/v1\/(?:bookings|proposals|bookings\/[\w-]{1,128}\/cancel)$/;

export function allowedRoute(method, path) {
  return (method === "GET" && reads.test(path)) || (method === "POST" && writes.test(path));
}

export function providerOrigin(value) {
  const url = new URL(value);
  const local = ["127.0.0.1", "[::1]"].includes(url.hostname);
  if ((url.protocol !== "https:" && !(url.protocol === "http:" && local)) ||
      url.username || url.password || url.search || url.hash || url.pathname !== "/")
    throw new Error("Invalid salon origin");
  return url.origin;
}

export function errorReply(status, code, message) {
  return Response.json({ apiVersion: "v1", error: { code, message } },
    { status, headers: { "cache-control": "no-store" } });
}

export function connectProvider(value, serviceToken) {
  if (typeof serviceToken !== "string" || !/^[a-f0-9]{64}$/.test(serviceToken))
    throw new Error("Set GATEWAY_SERVICE_TOKEN to a random 32-byte lowercase hex token");
  const origin = providerOrigin(value);
  return function bindClient(headers) {
    // Shared only inside one incoming HTTP request. Every new request gets a
    // new closure; the salon rechecks authority on the actual operation too.
    const identity = new Headers({ accept: "application/json", "x-booking-gateway-token": serviceToken });
    for (const name of ["authorization", "x-api-key"]) {
      if (headers.has(name)) identity.set(name, headers.get(name));
    }
    const invalidProfile = () => errorReply(503, "provider_configuration_invalid", "Salon connection is not configured for gateway access.");
    const unavailable = () => errorReply(503, "provider_unavailable", "Salon unavailable. Retry with the same booking key.");
    async function request(url, options, access = false) {
      const upstream = await fetch(url, { ...options, redirect: "error", signal: AbortSignal.timeout(15000) });
      if (upstream.status >= 500) {
        await upstream.body?.cancel();
        return unavailable();
      }
      const jsonType = upstream.headers.get("content-type")?.split(";")[0].trim().toLowerCase() === "application/json";
      let payload;
      if (jsonType) {
        try { payload = await upstream.json(); } catch { /* Handled below without reflecting the body. */ }
      } else { await upstream.body?.cancel(); }
      if (!payload || typeof payload !== "object" || Array.isArray(payload))
        return access && upstream.ok ? invalidProfile() : errorReply(502, "provider_invalid_response", "Invalid salon response.");
      if (access && upstream.ok && (payload.apiVersion !== "v1" || payload.providerMode !== "split" || !Array.isArray(payload.scopes)))
        return invalidProfile();
      const out = new Headers({ "cache-control": "no-store" });
      for (const name of ["retry-after", "www-authenticate", "x-booking-lab-api"])
        if (upstream.headers.has(name)) out.set(name, upstream.headers.get(name));
      return Response.json(payload, { status: upstream.status, headers: out });
    }
    let accessPromise;
    return async function call(method, path, search = "", body, key) {
      const internal = method === "GET" && path === "/api/v1/access";
      if (!internal && !allowedRoute(method, path)) throw new Error("Invalid provider operation");
      if (!identity.has("authorization") && !identity.has("x-api-key"))
        return errorReply(401, "unauthorized", "An agent credential is required.");
      try {
        accessPromise ??= request(new URL("/api/v1/access", origin), { method: "GET", headers: identity }, true);
        const access = await accessPromise;
        if (!access.ok || internal) return access.clone();
        // The salon v1 cancel operation has no approval step.
        if (method === "POST" && path.endsWith("/cancel"))
          return errorReply(403, "mandate_denied", "Cancellation requires an approved cancellation proposal.");
        const url = new URL(path, origin);
        url.search = search;
        const forward = new Headers(identity);
        if (key) forward.set("idempotency-key", key);
        if (body !== undefined) forward.set("content-type", "application/json");
        return await request(url, { method, headers: forward, body });
      } catch { return unavailable(); }
    };
  };
}

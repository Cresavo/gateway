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
  return async function call(headers, method, path, search = "", body, key) {
    const internal = method === "GET" && path === "/api/v1/access";
    if (!internal && !allowedRoute(method, path)) throw new Error("Invalid provider operation");
    const url = new URL(path, origin);
    url.search = search;
    const forward = new Headers({ accept: "application/json" });
    for (const name of ["authorization", "x-api-key"]) {
      if (headers.has(name)) forward.set(name, headers.get(name));
    }
    if (!forward.has("authorization") && !forward.has("x-api-key"))
      return errorReply(401, "unauthorized", "An agent credential is required.");
    // Only the configured service identity crosses this hop; inbound headers are untrusted.
    forward.set("x-booking-gateway-token", serviceToken);
    if (key) forward.set("idempotency-key", key);
    if (body !== undefined) forward.set("content-type", "application/json");
    try {
      const upstream = await fetch(url, { method, headers: forward, body, redirect: "error",
        signal: AbortSignal.timeout(15000) });
      if (!upstream.headers.get("content-type")?.includes("application/json"))
        return errorReply(502, "provider_invalid_response", "Invalid salon response.");
      const out = new Headers({ "cache-control": "no-store", "content-type": "application/json" });
      for (const name of ["retry-after", "www-authenticate", "x-booking-lab-api"])
        if (upstream.headers.has(name)) out.set(name, upstream.headers.get(name));
      return new Response(await upstream.text(), { status: upstream.status, headers: out });
    } catch {
      return errorReply(503, "provider_unavailable", "Salon unavailable. Retry with the same booking key.");
    }
  };
}

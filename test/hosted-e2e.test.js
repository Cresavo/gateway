// SPDX-License-Identifier: AGPL-3.0-only
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { createServer } from "node:http";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { gateway } from "../src/server.js";
import { start } from "./e2e/fixture-provider.js";

let provider;

export async function startHosted(options) {
  assert.deepEqual(Object.keys(options).sort(), ["day", "gatewayOrigin"]);
  assert.ok(provider);
  return {
    agentKey: provider.agentKey,
    approve: provider.approve,
    calendar: input => provider.owner("calendar", input),
    close: async () => {},
  };
}

test("--gateway uses an already running gateway without an operator or a service credential", async () => {
  const date = new Date(Date.now() + 3 * 86400000);
  while ([0, 6].includes(date.getUTCDay())) date.setUTCDate(date.getUTCDate() + 1);
  const day = date.toISOString().slice(0, 10);
  const serviceToken = randomBytes(32).toString("hex");
  provider = await start({ serviceToken, day });
  const server = gateway(provider.salon, serviceToken);
  const received = [];
  server.prependListener("request", request => {
    received.push({
      serviceTokenAbsent: request.headers["x-booking-gateway-token"] === undefined,
      validAgent: request.headers.authorization === "Bearer " + provider.agentKey,
    });
  });
  const previousArgs = process.argv;
  const previousExit = process.exitCode;
  try {
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const { port } = server.address();
    process.argv = [process.execPath, "scripts/e2e.js", "--gateway", "http://127.0.0.1:" + port,
      "--adapter", fileURLToPath(import.meta.url)];
    await import("../scripts/e2e.js");
    assert.equal(process.exitCode, 0);
    assert.ok(received.length > 0);
    assert.ok(received.every(request => request.serviceTokenAbsent && request.validAgent));
  } finally {
    process.argv = previousArgs;
    process.exitCode = previousExit;
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await provider.close();
  }
});

test("--gateway refuses a redirect before contacting its target", async () => {
  let targetRequests = 0;
  const target = createServer((_request, response) => {
    targetRequests++;
    response.writeHead(503).end();
  });
  target.listen(0, "127.0.0.1");
  await once(target, "listening");
  let redirects = 0;
  const redirector = createServer((_request, response) => {
    redirects++;
    response.writeHead(307, { location: "http://127.0.0.1:" + target.address().port + "/api/v1/mcp" }).end();
  });
  const previousArgs = process.argv;
  const previousExit = process.exitCode;
  try {
    redirector.listen(0, "127.0.0.1");
    await once(redirector, "listening");
    process.argv = [process.execPath, "scripts/e2e.js", "--gateway", "http://127.0.0.1:" + redirector.address().port,
      "--adapter", fileURLToPath(import.meta.url)];
    await import("../scripts/e2e.js?redirect-test");
    assert.equal(process.exitCode, 1);
    assert.ok(redirects > 0);
    assert.equal(targetRequests, 0);
  } finally {
    process.argv = previousArgs;
    process.exitCode = previousExit;
    for (const server of [redirector, target]) {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    }
  }
});

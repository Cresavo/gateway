// SPDX-License-Identifier: AGPL-3.0-only
import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";
import { gateway } from "../src/server.js";

const serviceToken = randomBytes(32).toString("hex");

test("discovery advertises this gateway's contracts on its own origin", async t => {
  const server = gateway("http://127.0.0.1:1", serviceToken);
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());
  const origin = "http://127.0.0.1:" + server.address().port;
  const profile = await (await fetch(origin + "/.well-known/usp")).json();
  const channels = profile.usp.services["dev.usp-protocol.services"];
  assert.deepEqual(channels.map(c => c.endpoint), [origin + "/api/v1", origin + "/api/v1/mcp"]);
  const links = await (await fetch(origin + "/llms.txt")).text();
  assert.ok(links.includes(origin + "/api/v1/mcp"));
  const spec = await (await fetch(channels[0].schema)).text();
  assert.match(spec, /openapi: 3.1.0/);
  assert.match(spec, /Idempotency-Key/);
});

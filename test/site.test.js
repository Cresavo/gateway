// SPDX-License-Identifier: AGPL-3.0-only
import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";
import { request } from "node:http";
import { test } from "node:test";
import { gateway } from "../src/server.js";

const serviceToken = randomBytes(32).toString("hex");

async function listen(t, server) {
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  return "http://127.0.0.1:" + server.address().port;
}

test("landing page is static, script-free, locked down by CSP and needs no salon", async t => {
  const base = await listen(t, gateway("http://127.0.0.1:1", serviceToken));
  const page = await fetch(base + "/");
  assert.equal(page.status, 200);
  assert.match(page.headers.get("content-type"), /text\/html/);
  const csp = page.headers.get("content-security-policy");
  assert.match(csp, /default-src 'none'/);
  assert.doesNotMatch(csp, /script-src|unsafe-inline/);
  assert.equal(page.headers.get("referrer-policy"), "no-referrer");
  const html = await page.text();
  assert.doesNotMatch(html, /<script/i);
  assert.ok(!html.includes("{{ORIGIN}}"), "every placeholder is substituted");
  assert.ok(html.includes(base + "/api/v1/mcp"), "advertises this gateway's own MCP endpoint");
  const css = await fetch(base + "/assets/site.css");
  assert.equal(css.status, 200);
  assert.match(css.headers.get("content-type"), /text\/css/);
  assert.equal((await fetch(base + "/assets/other.css")).status, 404);
});

test("landing page uses the configured public origin and keeps Host pinning", async t => {
  const base = await listen(t, gateway("http://127.0.0.1:1", serviceToken,
    { publicOrigin: "https://gateway.example.test", trustProxyHops: 1 }));
  assert.equal((await fetch(base + "/")).status, 403);
  const html = await new Promise((resolve, reject) => {
    request(base + "/", { headers: { host: "gateway.example.test" } }, res => {
      let data = ""; res.on("data", c => { data += c; }); res.on("end", () => resolve(data));
    }).on("error", reject).end();
  });
  assert.ok(html.includes("https://gateway.example.test/api/v1/mcp"));
});

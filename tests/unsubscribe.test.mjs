// Run: node --test tests/unsubscribe.test.mjs (Node 22+, no dependencies)
import { test } from "node:test";
import assert from "node:assert/strict";
import { HEADERS, page, stateForStatus, tokenFrom } from "../functions/_lib/unsubscribe.js";
import { onRequestGet, onRequestPost } from "../functions/unsubscribe/index.js";

const TOKEN = `1.10000000-0000-4000-8000-000000000001.${"a".repeat(43)}`;
const url = (t) => `https://cuesic.com/unsubscribe/?token=${encodeURIComponent(t)}`;

test("tokens: only the exact shape", () => {
  assert.equal(tokenFrom(url(TOKEN)), TOKEN);
  assert.equal(tokenFrom("https://cuesic.com/unsubscribe/"), null);
  assert.equal(tokenFrom(url(`${TOKEN}"><script>`)), null);
  assert.equal(tokenFrom(url("preview")), null);
});

test("opening the page changes nothing and loads nothing from elsewhere", async () => {
  let fetched = false;
  globalThis.fetch = () => { fetched = true; };
  const res = await onRequestGet({ request: new Request(url(TOKEN)), env: { SUPABASE_URL: "https://x.supabase.co" } });
  const body = await res.text();
  assert.equal(fetched, false);
  assert.match(body, /<form method="post">/);
  assert.doesNotMatch(body, /(src|href)="https?:/); // only same-site links and images
  assert.equal(res.headers.get("Referrer-Policy"), "no-referrer");
  assert.equal(res.headers.get("Cache-Control"), "no-store");
});

test("the button forwards a one-click unsubscribe and shows the answer", async () => {
  const calls = [];
  for (const [status, expected] of [[200, "unsubscribed</h1>"], [400, "link doesn&#39;t work"], [503, "Something went wrong"]]) {
    globalThis.fetch = async (u, init) => { calls.push({ u, init }); return new Response("", { status }); };
    const res = await onRequestPost({ request: new Request(url(TOKEN), { method: "POST" }), env: { SUPABASE_URL: "https://x.supabase.co/" } });
    assert.match(await res.text(), new RegExp(expected));
  }
  assert.equal(calls[0].u, `https://x.supabase.co/functions/v1/email-unsubscribe?token=${encodeURIComponent(TOKEN)}`);
  assert.equal(calls[0].init.body, "List-Unsubscribe=One-Click&source=page");
});

test("no token, or no config: never forwards", async () => {
  let fetched = 0;
  globalThis.fetch = async () => { fetched++; return new Response(""); };
  const bad = await onRequestPost({ request: new Request("https://cuesic.com/unsubscribe/", { method: "POST" }), env: { SUPABASE_URL: "https://x.supabase.co" } });
  assert.equal(bad.status, 400);
  const unset = await onRequestPost({ request: new Request(url(TOKEN), { method: "POST" }), env: {} });
  assert.equal(unset.status, 503);
  assert.equal(fetched, 0);
});

test("pages", () => {
  for (const s of ["confirm", "done", "invalid", "error"]) assert.match(page(s), /<h1>/);
  assert.equal(stateForStatus(204), "done");
  assert.equal(HEADERS["X-Robots-Tag"], "noindex, nofollow");
});

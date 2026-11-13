// Run: node --test tests/openLink.test.mjs (Node 22+, no dependencies)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const aasa = JSON.parse(readFileSync(new URL("../.well-known/apple-app-site-association", import.meta.url), "utf8"));
const page = readFileSync(new URL("../open/index.html", import.meta.url), "utf8");

test("Universal Links cover /open/ as well as /e/ and /j/", () => {
  const paths = aasa.applinks.details[0].components.map((c) => c["/"]);
  assert.deepEqual(paths, ["/e/*", "/j/*", "/open/*"]);
  assert.deepEqual(aasa.applinks.details[0].appIDs, ["S5N5645L8S.com.ibansal0319.ravehub"]);
});

test("the open page tries the app and never redirects to the App Store by itself", () => {
  assert.match(page, /ravehub:\/\/home/);
  assert.doesNotMatch(page, /location\.(replace|href)\s*=?\s*\(?\s*["']https:\/\/apps\.apple\.com/);
  assert.doesNotMatch(page, /setTimeout/);
  assert.match(page, /id="fallback" href="https:\/\/apps\.apple\.com\//);
});

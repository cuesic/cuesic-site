// Run: node --test tests/eventPreview.test.mjs (Node 22+, no dependencies)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FALLBACK_IMAGE, attributeValue, buildPreview, eventIdFromUrl, formatEventWhen, formatEventWhere, normalizeEventId,
} from "../functions/_lib/eventPreview.js";

const ID = "03e14adc-ff07-4e8c-a913-6bc80170be92";

test("ids: uuid only, lowercased", () => {
  assert.equal(normalizeEventId(ID.toUpperCase()), ID);
  assert.equal(normalizeEventId("abc"), null);
  assert.equal(normalizeEventId(`${ID}'or 1=1`), null);
  assert.equal(normalizeEventId(""), null);
  assert.equal(normalizeEventId(null), null);
});

test("ids from ?id= and /e/<id>", () => {
  assert.equal(eventIdFromUrl(new URL(`https://cuesic.com/e/?id=${ID}`)), ID);
  assert.equal(eventIdFromUrl(new URL(`https://cuesic.com/e/${ID}`)), ID);
  assert.equal(eventIdFromUrl(new URL(`https://cuesic.com/e/${ID}/`)), ID);
  assert.equal(eventIdFromUrl(new URL("https://cuesic.com/e/")), null);
  assert.equal(eventIdFromUrl(new URL("https://cuesic.com/e/?id=nope")), null);
  assert.equal(eventIdFromUrl(new URL("https://cuesic.com/e/%E0%A4%A")), null);
});

test("attributeValue escapes & (HTMLRewriter escapes the quotes)", () => {
  assert.equal(attributeValue("R&amp;B & House"), "R&amp;amp;B &amp; House");
});

test("single-night show: venue-local time", () => {
  const when = formatEventWhen({
    event_date: "2026-10-11", event_datetime: "2026-10-12T05:30:00+00:00", timezone: "America/Los_Angeles",
  });
  assert.equal(when, "Sun, October 11, 2026 · 10:30 PM PDT");
});

test("no time or no zone: date only", () => {
  assert.equal(formatEventWhen({ event_date: "2026-10-11", event_datetime: null, timezone: "America/New_York" }), "Sun, October 11, 2026");
  assert.equal(formatEventWhen({ event_date: "2026-10-11", event_datetime: "2026-10-12T05:30:00Z", timezone: null }), "Sun, October 11, 2026");
  assert.equal(formatEventWhen({ event_date: "2026-10-11", event_datetime: "2026-10-12T05:30:00Z", timezone: "Not/AZone" }), "Sun, October 11, 2026");
});

test("festival range", () => {
  assert.equal(
    formatEventWhen({ event_date: "2027-03-26", event_end_date: "2027-03-28", event_datetime: null, timezone: "America/New_York" }),
    "Fri, March 26 – Sun, March 28, 2027",
  );
});

test("bad date: null", () => {
  assert.equal(formatEventWhen({ event_date: null }), null);
});

test("where", () => {
  assert.equal(formatEventWhere({ venue_name: "LIV Nightclub", city: "Las Vegas", state: "NV" }), "LIV Nightclub, Las Vegas, NV");
  assert.equal(formatEventWhere({ venue_name: "Pacha NYC", city: "New York", state: "NY" }), "Pacha NYC, New York, NY");
  assert.equal(formatEventWhere({ venue_name: "Echostage Washington", city: "Washington", state: "DC" }), "Echostage Washington, DC");
  assert.equal(formatEventWhere({ venue_name: null, city: "Miami", state: "FL" }), "Miami, FL");
  assert.equal(formatEventWhere({}), "");
});

test("buildPreview with flyer", () => {
  const p = buildPreview({
    name: "Prospa", venue_name: "LIV Nightclub at Fontainebleau", city: "Las Vegas", state: "NV",
    event_date: "2026-10-11", event_datetime: "2026-10-12T05:30:00+00:00", timezone: "America/Los_Angeles",
    thumbnail_image_url: "https://i.scdn.co/image/abc", is_canceled: false,
  }, ID);
  assert.equal(p.title, "Prospa");
  assert.equal(p.pageTitle, "Prospa · Cuesic");
  assert.equal(p.description, "Sun, October 11, 2026 · 10:30 PM PDT · LIV Nightclub at Fontainebleau, Las Vegas, NV. See who's going on Cuesic.");
  assert.equal(p.image, "https://i.scdn.co/image/abc");
  assert.equal(p.imageWidth, null);
  assert.equal(p.url, `https://cuesic.com/e/?id=${ID}`);
});

test("buildPreview without flyer, or a non-https one, uses the fallback", () => {
  for (const thumbnail_image_url of [null, "", "http://x.com/a.jpg", "not a url"]) {
    const p = buildPreview({ name: "X", event_date: "2026-10-11", thumbnail_image_url }, ID);
    assert.equal(p.image, FALLBACK_IMAGE);
    assert.equal(p.imageWidth, "1200");
    assert.equal(p.imageHeight, "630");
  }
});

test("buildPreview: canceled, blank name", () => {
  assert.equal(buildPreview({ name: "X", event_date: "2026-10-11", is_canceled: true }, ID).title, "Canceled: X");
  assert.equal(buildPreview({ name: "  ", event_date: null }, ID).description, "See who's going on Cuesic.");
});

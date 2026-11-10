// Serves the static /e/ bounce page with Open Graph / Twitter tags for the
// shared event, so link previews (iMessage, WhatsApp, Slack…) show the event's
// name, date, venue and flyer. Crawlers don't run JavaScript, which is why this
// has to happen on the server.
//
// The page body and its script are never touched: only the <title> text and
// the og:/twitter: meta tags. Any problem at all (no id, bad id, event not
// found or not public, Supabase slow or down, missing config) serves the
// unchanged static page, exactly as before this function existed.
//
// Config (Cloudflare Pages → Settings → Variables): SUPABASE_URL and
// SUPABASE_ANON_KEY. Without them the static page is served.

import { EVENT_COLUMNS, attributeValue, buildPreview, eventIdFromUrl, normalizeEventId } from "./eventPreview.js";

const SUPABASE_TIMEOUT_MS = 2000;
const CACHE_SECONDS = 300;

function staticPage(context) {
  // Always the page at /e/ itself: /e/<id> has no file of its own, and asking
  // for /e/index.html would get a redirect (Pages strips .html).
  const url = new URL(context.request.url);
  url.pathname = "/e/";
  url.search = "";
  return context.env.ASSETS.fetch(new Request(url.toString(), { method: "GET" }));
}

async function fetchRow(env, id, signal) {
  const base = String(env.SUPABASE_URL).replace(/\/+$/, "");
  const url = `${base}/rest/v1/events?select=${EVENT_COLUMNS}&id=eq.${id}&limit=1`;
  const res = await fetch(url, {
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`, Accept: "application/json" },
    signal,
    // Lets Cloudflare's edge cache the lookup too, so repeat shares and
    // crawler retries don't all reach the database.
    cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true },
  });
  if (!res.ok) throw new Error(`supabase ${res.status}`);
  const rows = await res.json();
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

// Only active (published) events get a preview. A portal merge leaves the old
// row inactive with merged_into_event_id set; old links to it are previewed
// as the surviving event, which is what the app opens too. One hop only.
async function loadPublicEvent(env, id) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS);
  try {
    let row = await fetchRow(env, id, controller.signal);
    if (row && !row.is_active) {
      const target = normalizeEventId(row.merged_into_event_id);
      row = target && target !== id ? await fetchRow(env, target, controller.signal) : null;
    }
    return row && row.is_active === true && !row.merged_into_event_id ? row : null;
  } finally {
    clearTimeout(timer);
  }
}

function setContent(value) {
  return { element(el) { el.setAttribute("content", attributeValue(value)); } };
}

function rewrite(response, preview) {
  const meta = (attr, name) => `meta[${attr}="${name}"]`;
  const imageSize = (value) => ({
    element(el) {
      if (value) el.setAttribute("content", attributeValue(value));
      else el.remove();
    },
  });
  return new HTMLRewriter()
    .on("title", { element(el) { el.setInnerContent(preview.pageTitle); } })
    .on(meta("property", "og:title"), setContent(preview.title))
    .on(meta("property", "og:description"), setContent(preview.description))
    .on(meta("property", "og:url"), setContent(preview.url))
    .on(meta("property", "og:image"), setContent(preview.image))
    .on(meta("property", "og:image:width"), imageSize(preview.imageWidth))
    .on(meta("property", "og:image:height"), imageSize(preview.imageHeight))
    .on(meta("property", "og:image:alt"), setContent(preview.imageAlt))
    .on(meta("name", "twitter:title"), setContent(preview.title))
    .on(meta("name", "twitter:description"), setContent(preview.description))
    .on(meta("name", "twitter:image"), setContent(preview.image))
    .transform(response);
}

export async function handleEventPage(context) {
  const { request, env } = context;
  if (request.method !== "GET" && request.method !== "HEAD") return context.next();

  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const isPage = url.pathname === "/e/";
  // /e/<id>: the prettier form. Not /e/index.html or /e/index, which Pages
  // already handles (redirects to /e/).
  const isIdPath = segments.length === 2 && segments[0] === "e" && !/^index(\.html)?$/.test(segments[1]);
  if (!isPage && !isIdPath) return context.next();

  // Fallback for every failure below. /e/ keeps Pages' own response, untouched;
  // /e/<id> gets the same bounce page (its script reads the id from the path).
  const fallback = () => (isPage ? context.next() : staticPage(context).then((r) => headOnly(request, r)));

  const id = eventIdFromUrl(url);
  if (!id || !env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return fallback();

  try {
    const [page, event] = await Promise.all([staticPage(context), loadPublicEvent(env, id)]);
    if (!event || !page.ok) return fallback();

    const headers = new Headers(page.headers);
    headers.set("Cache-Control", `public, max-age=${CACHE_SECONDS}`);
    headers.delete("Content-Length");
    headers.delete("ETag");
    const out = rewrite(new Response(page.body, { status: 200, headers }), buildPreview(event, id));
    return headOnly(request, out);
  } catch {
    return fallback(); // timeout, network or Supabase error, bad JSON
  }
}

function headOnly(request, response) {
  if (request.method !== "HEAD") return response;
  return new Response(null, { status: response.status, headers: response.headers });
}

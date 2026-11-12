// cuesic.com/unsubscribe/?token=… : the page the marketing email's footer
// links to. See ../_lib/unsubscribe.js.
//
// GET  shows the page and changes nothing.
// POST forwards "List-Unsubscribe=One-Click" (plus source=page) to the
//      email-unsubscribe edge function and shows the result.
//
// Config (Cloudflare Pages → Settings → Variables): SUPABASE_URL, already set
// for the event previews. Without it the page shows "Something went wrong"
// and asks people to use the app or write in.

import { HEADERS, page, stateForStatus, tokenFrom } from "../_lib/unsubscribe.js";

const TIMEOUT_MS = 8000;

const html = (state, status = 200) => new Response(page(state), { status, headers: HEADERS });

export async function onRequestGet(context) {
  return html(tokenFrom(context.request.url) ? "confirm" : "invalid");
}

export async function onRequestPost(context) {
  const token = tokenFrom(context.request.url);
  if (!token) return html("invalid", 400);
  const base = String(context.env.SUPABASE_URL ?? "").replace(/\/+$/, "");
  if (!base) return html("error", 503);
  try {
    const res = await fetch(`${base}/functions/v1/email-unsubscribe?token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "List-Unsubscribe=One-Click&source=page",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const state = stateForStatus(res.status);
    return html(state, state === "done" ? 200 : state === "invalid" ? 400 : 502);
  } catch {
    return html("error", 502);
  }
}

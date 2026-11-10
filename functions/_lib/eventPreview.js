// Pure helpers for the per-event link preview served at /e/. No Cloudflare or
// network APIs here, so tests/eventPreview.test.mjs can run them under plain Node.

export const FALLBACK_IMAGE = "https://cuesic.com/assets/OG_HomeBase.png";
export const FALLBACK_IMAGE_WIDTH = "1200";
export const FALLBACK_IMAGE_HEIGHT = "630";

// The only columns the preview reads. Everything here is shown to every app
// user on the event page already; nothing about attendees or users.
export const EVENT_COLUMNS = [
  "id",
  "name",
  "venue_name",
  "city",
  "state",
  "event_date",
  "event_end_date",
  "event_datetime",
  "timezone",
  "is_canceled",
  "thumbnail_image_url",
  "is_active",
  "merged_into_event_id",
].join(",");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A valid events id (uuid), lowercased, or null. */
export function normalizeEventId(raw) {
  if (typeof raw !== "string") return null;
  const id = raw.trim();
  return UUID_RE.test(id) ? id.toLowerCase() : null;
}

/**
 * The event id a request asks for: ?id=<id> first (the form the app shares),
 * then /e/<id>. Mirrors the bounce page's own script. Null when there is none
 * or it is not a uuid.
 */
export function eventIdFromUrl(url) {
  const fromQuery = url.searchParams.get("id");
  if (fromQuery) return normalizeEventId(fromQuery);
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length === 2 && segments[0] === "e") {
    let seg = segments[1];
    try {
      seg = decodeURIComponent(seg);
    } catch {
      return null;
    }
    return normalizeEventId(seg);
  }
  return null;
}

/**
 * A value for HTMLRewriter's setAttribute. It escapes `"` itself but writes `&`
 * as is, so a name like "R&amp;B" would reach the card as "R&B"; escaping `&`
 * first makes every value come out exactly as stored.
 */
export function attributeValue(value) {
  return String(value).replace(/&/g, "&amp;");
}

function isValidZone(tz) {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function parseDay(d) {
  if (typeof d !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day, 12));
}

// event_date / event_end_date are calendar dates at the venue, so they are
// formatted as plain dates (UTC, to avoid any shift), the way the app's event
// page shows them: "Sat, October 11, 2026" or "Fri, March 27 – Sun, March 29, 2026".
function formatDay(date, withYear) {
  const opts = { weekday: "short", month: "long", day: "numeric", timeZone: "UTC" };
  if (withYear) opts.year = "numeric";
  return date.toLocaleDateString("en-US", opts);
}

/** "10:30 PM PDT" on the venue's clock; without a valid zone, UTC. */
function formatTime(iso, tz) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const opts = { hour: "numeric", minute: "2-digit", hour12: true, timeZoneName: "short" };
  opts.timeZone = isValidZone(tz) ? tz : "UTC";
  return d.toLocaleTimeString("en-US", opts);
}

/** The date line of the preview, or null when the event has no usable date. */
export function formatEventWhen(event) {
  const start = parseDay(event.event_date);
  if (!start) return null;
  const end = parseDay(event.event_end_date);
  if (end && event.event_end_date !== event.event_date) {
    return `${formatDay(start, false)} – ${formatDay(end, true)}`;
  }
  const day = formatDay(start, true);
  // Only a known zone gives a time worth showing; a UTC guess could be hours off.
  const time = event.event_datetime && isValidZone(event.timezone)
    ? formatTime(event.event_datetime, event.timezone)
    : null;
  return time ? `${day} · ${time}` : day;
}

function clean(value) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

/** "LIV Nightclub at Fontainebleau, Las Vegas, NV" from whatever is present. */
export function formatEventWhere(event) {
  const venue = clean(event.venue_name);
  const city = clean(event.city);
  const state = clean(event.state);
  const parts = [];
  if (venue) parts.push(venue);
  if (city && !venue.toLowerCase().includes(city.toLowerCase())) parts.push(city);
  if (state) parts.push(state);
  return parts.join(", ");
}

function isPublicImageUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const u = new URL(value.trim());
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * The preview fields for one event row. Plain (unescaped) strings; the
 * rewriter sets them as attribute values / text, which escapes them.
 */
export function buildPreview(event, eventId) {
  const name = clean(event.name) || "An event on Cuesic";
  const title = event.is_canceled ? `Canceled: ${name}` : name;
  const when = formatEventWhen(event);
  const where = formatEventWhere(event);
  const facts = [when, where].filter(Boolean).join(" · ");
  const description = facts ? `${facts}. See who's going on Cuesic.` : "See who's going on Cuesic.";
  const hasImage = isPublicImageUrl(event.thumbnail_image_url);
  return {
    title,
    pageTitle: `${title} · Cuesic`,
    description,
    url: `https://cuesic.com/e/?id=${encodeURIComponent(eventId)}`,
    image: hasImage ? event.thumbnail_image_url.trim() : FALLBACK_IMAGE,
    // Event flyers come from many hosts at unknown sizes, so their dimensions
    // are left out rather than guessed; the fallback's are known.
    imageWidth: hasImage ? null : FALLBACK_IMAGE_WIDTH,
    imageHeight: hasImage ? null : FALLBACK_IMAGE_HEIGHT,
    imageAlt: name,
  };
}

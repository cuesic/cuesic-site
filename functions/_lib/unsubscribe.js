// The cuesic.com/unsubscribe page for Cuesic marketing emails. Pure helpers
// (no Cloudflare APIs) so tests/unsubscribe.test.mjs runs them under Node.
//
// The email footer links here with ?token=…. Opening the page changes
// nothing (mail scanners open every link); pressing the button POSTs back
// here, and the Pages Function forwards it to Supabase's email-unsubscribe
// function, which turns off the same "Emails about events and features"
// switch as the app's Settings. Supabase serves HTML from its own domain as
// plain text, which is why the page lives here.
//
// Nothing on the page loads from another site: the token is in the URL, and
// an outside font or image would be sent it in the Referer.

export const TOKEN_RE = /^1\.[0-9a-f-]{36}\.[A-Za-z0-9_-]{43}$/;

export const HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy":
    "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
};

/** The token from a request URL, or null if it isn't one. */
export function tokenFrom(url) {
  const token = new URL(url).searchParams.get("token");
  return token && TOKEN_RE.test(token) ? token : null;
}

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

const MANAGE =
  'You can also turn these emails on or off in the Cuesic app: <strong>Profile → Settings → Emails about events and features</strong>.';

/** Which page to show. state: "confirm" | "done" | "invalid" | "error". */
export function page(state) {
  const parts = {
    confirm: {
      title: "Unsubscribe from Cuesic emails?",
      body: `<p>You'll stop getting the weekly email about your favorite artists playing near you, and other emails about events and features.</p>
<p>Sign-in codes and messages about your account still arrive.</p>
<form method="post"><input type="hidden" name="List-Unsubscribe" value="One-Click"><button type="submit">Unsubscribe</button></form>
<p class="small">${MANAGE}</p>`,
    },
    done: {
      title: "You're unsubscribed",
      body: `<p>You won't get Cuesic emails about events and features any more. An email that was already on its way may still arrive.</p>
<p class="small">Changed your mind? Turn <strong>Emails about events and features</strong> back on in the app: Profile → Settings.</p>`,
    },
    invalid: {
      title: "This link doesn't work",
      body: `<p>It may have been cut short when it was copied. Try the Unsubscribe link in the email again.</p>
<p class="small">${MANAGE} Or write to <a href="mailto:app@cuesic.com">app@cuesic.com</a> and we'll take you off the list.</p>`,
    },
    error: {
      title: "Something went wrong",
      body: `<p>We couldn't unsubscribe you just now. Please try again in a minute.</p>
<form method="post"><input type="hidden" name="List-Unsubscribe" value="One-Click"><button type="submit">Try again</button></form>
<p class="small">${MANAGE} Or write to <a href="mailto:app@cuesic.com">app@cuesic.com</a>.</p>`,
    },
  }[state];
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="referrer" content="no-referrer">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="dark">
<title>${escapeHtml(parts.title)} | Cuesic</title>
<link rel="icon" type="image/png" href="/assets/favicon.png">
<style>
  :root { --bg:#0b0b0f; --card:#131318; --line:rgba(255,255,255,.08); --ink:#f4f4f6; --muted:#a1a1aa;
          --brand:#cb6ce6; --brand-hi:#e3a8f5; --brand-deep:#7343eb; }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:32px 16px;
         background: radial-gradient(60vmax 60vmax at 85% -10%, rgba(203,108,230,.18), transparent 70%),
                     radial-gradient(60vmax 60vmax at -10% 110%, rgba(115,67,235,.18), transparent 70%), var(--bg);
         color:var(--ink); font: 16px/1.6 Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
         -webkit-font-smoothing: antialiased; }
  main { width:100%; max-width:460px; background:var(--card); border:1px solid var(--line); border-radius:24px; padding:32px 28px; }
  .logo { display:block; width:116px; height:48px; margin:0 0 24px; }
  h1 { margin:0 0 12px; font-size:26px; line-height:1.15; letter-spacing:-.02em; font-weight:800; }
  p { margin:0 0 14px; color:var(--muted); }
  strong { color:var(--ink); font-weight:600; }
  .small { font-size:14px; margin-top:20px; }
  a { color:var(--brand-hi); }
  button { width:100%; margin:10px 0 4px; padding:15px 24px; border:0; border-radius:999px; cursor:pointer;
           background:var(--brand-deep); color:#fff; font-family:inherit; font-size:16px; font-weight:700; line-height:1; }
  button:hover { background:#6334d9; }
  button:focus-visible, a:focus-visible { outline:2px solid var(--brand); outline-offset:3px; }
  .bar { height:3px; border-radius:3px; margin:0 0 24px; background:linear-gradient(90deg,var(--brand-hi),var(--brand) 45%,var(--brand-deep)); }
</style>
</head>
<body>
<main>
  <a href="/"><img class="logo" src="/assets/email/cuesic-logo-white.png" width="116" height="48" alt="Cuesic"></a>
  <div class="bar"></div>
  <h1>${escapeHtml(parts.title)}</h1>
  ${parts.body}
</main>
</body>
</html>`;
}

/** Which page follows Supabase's answer to the forwarded unsubscribe. */
export function stateForStatus(status) {
  if (status >= 200 && status < 300) return "done";
  if (status === 400) return "invalid";
  return "error";
}

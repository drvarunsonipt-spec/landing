# Dr. Varun Soni (PT) — Online Physiotherapy · **V4 "Booking-Gated"**

V3's liquid-glass design, rebuilt around one idea: **the only way to reach the
practice is a completed booking form.** The offer up front is a free
consultation, every booking is recorded before the WhatsApp handoff, and the
practice gets an admin panel that turns a request into a real calendar invite
in one click.

The site itself is still plain HTML/CSS/JS — no npm, no framework, no build
step. The data layer is a Google Sheet driven by two Apps Script projects.

## Why V4 exists

An audit of V3 found the funnel, not the design, was the problem:

| Problem in V3 | Fix in V4 |
|---|---|
| `window.open` fired inside a 600 ms cosmetic `setTimeout`, breaking the user-gesture chain that iOS Safari requires — the site's only conversion action was popup-blocker exposed, and "✓ Opening WhatsApp" was shown *before* anyone knew it worked | The timer is gone. The handoff is synchronous inside the submit handler. |
| Nothing was ever captured — a blocked or abandoned handoff left no trace | Every submission is POSTed to a Sheet *before* the handoff, with `keepalive` so it survives the app switch |
| 10 of 12 WhatsApp links sent identical prefilled text, so CTA attribution was impossible | Every CTA carries `data-cta`; the source is recorded on the booking row |
| A 33-chip time picker in a 208 px inner scroller with ~37 px tap targets | A four-column scroll wheel with 44 px targets that cannot produce an invalid time |
| Three unattributed testimonials and an unsourced ★★★★★ on a medical page | Removed. Replaced by a real-numbers band and reviews that only patients you invite can submit, published only after you approve |
| No canonical, relative OG/JSON-LD image URLs, JSON-LD `url` pointing at `wa.me`, no `FAQPage` schema | All fixed |

## What's new

- **Free consultation** is the offer everywhere — hero, header, cards, footer.
- **No direct-DM links.** All 12 static `wa.me` hrefs became `#book` anchors.
  Service cards additionally pre-select the matching concern in the form.
- **Scroll-wheel date/time picker** — Date · Hour · Minute · AM/PM. The hour
  column is rebuilt from the AM/PM choice, and the minute column from the hour,
  which is what enforces the 6:00 AM–11:00 PM window and hides times that have
  already passed today (60-minute lead). At 11 PM only `:00` remains, so the
  last bookable start is exactly 11:00 PM. Keyboard-operable, `role="listbox"`.
  It sits **behind a collapsed disclosure**: a nested scroll container parked in
  the middle of a long page swallows every thumb drag that lands on it, so on a
  phone the page would stop scrolling and the wheel would spin instead. Collapsed,
  it can only be scrolled deliberately; the summary row shows the chosen slot.
  Each detent fires an 8 ms `navigator.vibrate` tick — Android Chrome only, since
  iOS Safari has never shipped the Vibration API.
- **New fields**: age, gender, email (optional — only used to send a calendar
  invite if given), and a required consent checkbox. No phone field: the
  booking arrives as a WhatsApp message from the patient's own number, so the
  practice already has their contact the moment it lands.
- **Admin panel** with Google sign-in, calendar invites and review moderation —
  see [`apps-script/SETUP.md`](apps-script/SETUP.md).
- **`privacy.html`** — age, gender and symptom text are sensitive personal data
  under India's DPDP Act 2023, which V3 collected with no policy and no consent.

## ⚠ Before this goes live

1. **Set the domain.** Replace `https://drvarunsoni.in` throughout `index.html`
   and `privacy.html` (canonical, `og:image`, `twitter:image`, JSON-LD).
2. **Fill in `privacy.html`** — publication date, grievance email, retention
   period. It is a working draft, not legal advice; have it reviewed.
3. **Deploy the backend** and set the `API` constant in `script.js` *and*
   `review.html`. Without it the site still works; bookings just aren't recorded.
4. **Re-encode `assets/og-image.png`** (380 KB) to JPEG/WebP at ~40–60 KB and
   save it as `assets/og-image.jpg` — the meta tags already point at `.jpg`.

## The one number on the page

The Results section shows a single figure: **1600+ patients treated**, supplied
by the practice. It is deliberately the only claim there. Anything added beside
it must be equally substantiable — unverifiable stats on a medical page carry
the same ASCI / Consumer Protection Act exposure that got V3's fabricated
testimonials removed. `initCounters()` animates it; the real value lives in the
HTML so it is still correct with JS off.

## Files

```
index.html          landing page + inline SVG sprite (all icons)
styles.css          design system + motion system
script.js           rAF scroll engine, wheel picker, booking form, reviews
privacy.html        DPDP-facing privacy policy (draft — needs review)
review.html         private review submission, ?t=TOKEN
assets/             photos, favicon, OG image
apps-script/
  SETUP.md          deploy guide — start here
  public/Code.gs    write-only booking endpoint + approved-reviews feed
  admin/Code.gs     panel logic: confirm, calendar invite, moderation
  admin/Admin.html  the panel UI
```

## Run locally

```bash
cd ProjectV4 && python -m http.server 8000
```

## Two things that will bite you if you edit this

**The wheel picker must never use `behavior: "auto"` or CSS `scroll-behavior`.**
A smooth programmatic scroll is cancelled outright by `scroll-snap-type:
mandatory`: the column stays visually stuck on the old value while the state
moves on. `selectIndex()` passes `"instant"` explicitly, and keyboard input
commits an explicit index rather than moving the scroller and reading the
position back. Both are load-bearing, and both are commented in place.

**The booking POST must stay `Content-Type: text/plain;charset=utf-8`.** That
keeps it a CORS "simple request". `application/json` triggers a preflight that
Apps Script cannot answer, and every booking would silently fail to record.

**The wheel must be repositioned when its disclosure opens.** A hidden element
has no layout: `offsetHeight` is 0 and `scrollTo()` does nothing. So while the
panel is collapsed the columns cannot be positioned at all, and `itemH()`
deliberately falls back to 44 rather than dividing by zero and sending every
column to index 0. `setWhenOpen(true)` re-applies each column's scroll position
once the panel is visible — without it, opening the picker would show the right
value in the summary but the wrong rows under the highlight band.

## Inherited from V3

Liquid-glass surfaces, the morphing blob field, the chromatic scroll gradient,
word-by-word hero headline, scroll-reveal variants, photo parallax, the drawn
step connector, hero 3D tilt and magnetic buttons (desktop), the spine
scrollspy, the custom SVG icon family, dark/light theming with a persisted
toggle, and the progressive-enhancement guarantees: content is fully visible
with JS disabled, a 3 s failsafe un-hides everything, and
`prefers-reduced-motion` switches to a static page.

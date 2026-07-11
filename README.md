# Dr. Varun Soni (PT) — Online Physiotherapy · **V3 "Liquid Glass"**

V2's structure and features wearing a liquid-glass skin: frosted translucent surfaces with specular top edges, hover shine sweeps, and a site-wide field of slowly morphing color blobs glowing through every pane. Everything else — scroll-driven animation, custom-crafted iconography,
real photography, and a WhatsApp **appointment booker** — still 100% static
(no build step, no backend, no frameworks).

## What's new vs V2 (`../ProjectV2`)

- **Liquid glass surfaces** — "faux glass": translucent tint + top-light sheen (`--glass-sheen`) + a specular 1px inset highlight + border. **No `backdrop-filter` on rounded cards** — the blob field still glows through the `rgba` transparency, but with none of the Chromium/Edge/Android "sharp corner" artifact or the per-frame blur cost. Real `backdrop-filter` is kept on only 3 fixed, non-rounded surfaces (header, mobile bar, mobile menu) on desktop, and disabled entirely on mobile/touch (`@media (max-width:780px),(hover:none)`).
- **Morphing blob field**: four theme-tinted radial blobs (teal/sapphire/violet/mint) drift and morph behind the glass, site-wide.
- **Shine sweeps**: a light band sweeps across cards on hover.
- **Chromatic scroll gradient**: the scroll-driven background travels ink → sapphire → teal → violet (dark) / porcelain → aqua → lilac → mint (light). `gradientNow` only writes CSS vars when a value actually changes.

### Fix pass (real-device review)
- **Performance**: cut live `backdrop-filter` elements from ~67 → ~1 (desktop) / 0 (mobile); parallax disabled on touch; throttled gradient writes. Fixes scroll/animation lag and the corner-shadow artifact together.
- **Booking**: time slots now **6:00 AM–10:00 PM at 30-min granularity** in a single scrollable list, grouped Morning/Afternoon/Evening, with a **Session Length** selector (30 / 45 / 60 min, default 45). The WhatsApp message shows the computed range, e.g. `Time: 3:00 PM – 3:45 PM (45 min)`. Data model + `initSlots` in `script.js`.
- **Mobile density**: 16px base font, tighter section/card padding, smaller headings on phones — a shorter, less "zoomed" page.
- **Mobile hero**: floating chips shrunk to tidy corner badges; the shield chip + photo caption are hidden and the spine card tucks within the photo, so nothing piles onto the image.
- **How-It-Works**: step badges made opaque so the connector line hides behind them (visible only in the gaps).

## Inherited from V2

| Area | V2 |
|---|---|
| **Animations** | Word-by-word hero headline, aurora background, scroll-reveal variants (fade/slide/zoom/blur/clip), photo parallax, drawing step-line, floating glass chips, hero 3D tilt (desktop), magnetic buttons, credential marquee, scroll-progress bar |
| **Spine scrollspy** | Vertebra-shaped section dots on the right edge (desktop) — the brand motif as navigation |
| **Icons** | Fully redesigned custom SVG family — anatomical spine/knee/ACL/neck diagrams + Olympic-pictogram people (built & iterated in `assets/icon-lab.html`) |
| **Photos** | Real Unsplash photography (license-free): hero home session, home stretching, hands-on knee assessment (`assets/img/`) |
| **Book an Appointment** | Name + date (past dates blocked) + tappable time slots + issue description → opens WhatsApp with the request pre-filled. **Live WhatsApp-style preview bubble** shows the exact message as you type |
| **Quick Enquiry** | Second tab keeps the V1-style enquiry form (also → WhatsApp) |
| **Mobile UX** | Fullscreen radial menu, hide-on-scroll header, sticky WhatsApp + Book bar, safe-area aware |
| **Theming** | **Dark mode by default** with a sun/moon toggle in the header (persisted in `localStorage`, `?theme=light\|dark` URL override, smooth cross-fade). Both themes use a **scroll-dependent gradient backdrop** — the page background interpolates through a 5-stop color journey as you scroll (ink → navy → teal depths → indigo in dark; porcelain → teal wash → periwinkle in light) |

## Files

- `index.html` — markup + inline SVG sprite (all icons)
- `styles.css` — design system + motion system
- `script.js` — rAF scroll engine, spine nav, tilt/parallax/magnetic, carousel, tabs, forms
- `assets/img/` — photos (Unsplash license, free for commercial use)
- `assets/icon-lab.html` — the icon workshop: open it in a browser to view/edit every icon
- `assets/favicon.svg`, `assets/og-image.png`

## Run locally

```bash
cd ProjectV2
python -m http.server 8000
# → http://localhost:8000
```

## Deploy

Static files — drag the folder to Netlify Drop, run `vercel` in it, or upload to
any web host. Nothing to configure.

## Customize

- **WhatsApp number**: replace `919680049176` in `index.html` (12 links) and the
  `WA` constant at the top of `script.js`.
- **Time slots**: edit the `SLOTS` array in `script.js`.
- **Colors/spacing**: design tokens at the top of `styles.css` — constants in `:root`,
  light theme in `:root, [data-theme="light"]`, dark theme in `[data-theme="dark"]`.
- **Scroll gradient**: edit the `GRADIENTS` palettes (5 stops × 3 colors per theme)
  at the top of `script.js`.
- **Icons**: tweak in `assets/icon-lab.html`, then copy the `<symbol>` into the
  sprite at the top of `index.html`.

## Engineering notes

- All animation is **progressive enhancement**: content is fully visible with JS
  disabled (`html.js` gate), a 3s failsafe un-hides everything, and
  `prefers-reduced-motion` switches to a static page.
- Motion is scroll-driven via one rAF loop (no IntersectionObserver — it doesn't
  fire in some embedded/background contexts); a `visibilitychange` hook re-syncs state
  when a background tab becomes visible.
- `?shot=1` in the URL neutralizes viewport-height hero sizing — useful for
  full-page screenshot tools.
- WCAG-minded: AA contrast tokens, labelled fields with `aria-invalid`,
  keyboard-operable tabs/accordion/menu, real radio inputs behind the time chips.

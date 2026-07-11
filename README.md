# Dr. Varun Soni (PT) — Online Physiotherapy Landing Page

A fast, self-contained, single-page marketing website for an online physiotherapy
practice. No build step, no backend, no frameworks — just three files you can host
on any static host.

**Design system:** *Clinical Premium* — deep navy `#16255A` + teal `#2E8B8F` on an
off-white canvas, with red reserved strictly for anatomy highlights. Typeset in
Sora + Inter, with a single Fraunces-italic accent.

---

## Files

| File | Purpose |
|------|---------|
| `index.html` | All page markup + inline SVG icons/illustrations |
| `styles.css` | Full design system, layout, responsive rules, animations |
| `script.js`  | Sticky header, reveal-on-scroll, FAQ accordion, timeline, mobile CTA bar, form → WhatsApp handoff |
| `assets/favicon.svg` | Browser-tab icon (the illuminated-spine logomark) |
| `assets/og-image.svg` | Social-share preview image |

---

## Preview locally

Because the page loads Google Fonts, open it through a local web server (not by
double-clicking the file):

```bash
cd Project
python -m http.server 8000
# then visit http://localhost:8000
```

Any static server works (`npx serve`, VS Code "Live Server", etc.).

---

## Deploy

It's plain static files — drop the whole `Project` folder onto any of:

- **Netlify** — drag-and-drop the folder at app.netlify.com/drop
- **Vercel** — `vercel` in the folder, or import the repo
- **GitHub Pages** — push and enable Pages on the branch/folder
- **Cloudflare Pages / Firebase Hosting / any web host** — upload as-is

No environment variables or build command are needed.

---

## Customize

Everything is plain HTML/CSS/JS — search-and-replace friendly.

**Phone / WhatsApp number** — the number appears in `index.html` (`wa.me/919680049176`
links, the big number in the enquiry section, and the footer) and once in
`script.js` (`WA_NUMBER`). Replace `919680049176` everywhere to change it
(`91` = India country code).

**Colors** — edit the CSS custom properties in the `:root { ... }` block at the top
of `styles.css` (e.g. `--navy`, `--teal`, `--accent-red`).

**Content** — service cards, testimonials, FAQ, and credentials are all literal text
in `index.html`. Edit in place.

**The enquiry form** — by design it needs **no backend**: on submit it validates the
inputs and opens WhatsApp with the details pre-filled, so the enquiry reaches
Dr. Varun instantly. If you later want submissions emailed or stored instead, point
the form at a form service (Formspree, Getform, Netlify Forms) — the handoff logic
lives in `initForm()` in `script.js`.

---

## Notes

- Fully responsive (tested 375 px – 1440 px) with no horizontal scroll.
- Respects `prefers-reduced-motion`.
- Accessible: semantic landmarks, labelled form fields, keyboard-operable FAQ.
- The enquiry form makes **no reply-time promise** beyond "usually within a few hours."

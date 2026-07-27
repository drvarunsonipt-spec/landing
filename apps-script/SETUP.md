# Backend setup — one Sheet, two scripts

About 20 minutes, all free, no card required. Do the steps in order; step 4
depends on the URL you get in step 3.

The design point worth understanding before you start: **there are two separate
Apps Script projects.** A public web app runs anonymously — Google cannot tell
it who the visitor is — so it can never be trusted to guard an admin screen.
The public one therefore only *writes* bookings and *reads* approved reviews.
The admin one is deployed "Only myself", which makes Google itself the login.
Patient data is never reachable from the public website.

---

## 1. Create the Sheet

1. Go to <https://sheets.new> and name it something like `Physio Bookings`.
2. Copy the **Sheet ID** out of the address bar — the long string between
   `/d/` and `/edit`:
   `https://docs.google.com/spreadsheets/d/`**`1AbC...xyz`**`/edit`

You don't need to create tabs or headers. Both scripts create `Bookings` and
`Reviews` with the right columns the first time they run.

---

## 2. Create the PUBLIC script

1. <https://script.new> → rename it `Physio — Public Endpoint`.
2. Delete the placeholder code, paste in all of [`public/Code.gs`](public/Code.gs).
3. Replace `PASTE_YOUR_SHEET_ID_HERE` with your Sheet ID.
4. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**  ← must be "Anyone", not "Anyone with Google account"
5. Authorise when prompted. Google will warn that the app is unverified —
   that's expected for your own script. Choose *Advanced → Go to … (unsafe)*.
6. Copy the **Web app URL**. It looks like
   `https://script.google.com/macros/s/AKfy…/exec`

---

## 3. Wire the site to it

Set the same URL in **two** files:

- `script.js` — the `API` constant near the top (line ~20)
- `review.html` — the `API` constant in its inline script

```js
var API = "https://script.google.com/macros/s/AKfy…/exec";
```

Then bump the cache-buster in `index.html` (`?v=10` → `?v=11` on both
`styles.css` and `script.js`) so returning visitors pick up the change.

Until you do this, the site still works — bookings just go straight to
WhatsApp without being recorded, and the reviews block stays hidden.

---

## 4. Create the ADMIN script

1. <https://script.new> → rename it `Physio — Admin`.
2. Paste [`admin/Code.gs`](admin/Code.gs) into `Code.gs`.
3. **+ → HTML** → name the file exactly `Admin` → paste
   [`admin/Admin.html`](admin/Admin.html).
4. Set `SHEET_ID`, and set `SITE_URL` to your real domain (it builds the
   review links you send out).
5. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Only myself**  ← this is the login. Do not change it.
6. Authorise — it will ask for Calendar access this time, which is what sends
   the invitations.
7. Bookmark the resulting URL. That's your control panel.

---

## Daily use

1. A patient submits the form. The row lands in `Bookings` as `pending`, and
   their WhatsApp message arrives with the same details.
2. Open the admin panel → **Confirm + send invite**. In one click that:
   - creates a Google Calendar event with the patient as a guest, so a real
     invitation lands in their inbox and yours;
   - flips the row to `confirmed`;
   - hands you a prefilled WhatsApp confirmation to press send on;
   - gives you the patient's private review link.
3. After the session, send them that review link. Their submission appears
   under **Reviews** as `pending` and shows on the website only once you hit
   **Approve & publish**.

---

## Things worth knowing

- **Changing the code later:** editing the script is not enough. You must
  **Deploy → Manage deployments → edit (pencil) → Version: New version → Deploy**,
  or the live URL keeps serving the old code. This catches everyone once.
- **The review link is single-use** and tied to a real booking, so a stranger
  cannot post a review. That is deliberate — invited, verifiable reviews are
  what make them safe to publish for a medical practice.
- **Calendar block length** is 45 minutes (`EVENT_MINUTES` in `admin/Code.gs`).
  The booking form only collects a start time, so this is just how much space
  the event reserves in your calendar. Change it freely.
- **Rate limiting** keys on the submitted phone number — Apps Script can't see
  client IPs. It stops a naive replay loop, not a determined attacker. The
  honeypot field catches ordinary form-spam bots.
- **If reviews don't render** on the site, it is almost always a CORS response
  on the `?action=reviews` GET. The page is built to fail silently and keep the
  section hidden, so a broken fetch never leaves an empty shell on the page.
- **Backups:** the Sheet is the database. File → Version history covers you for
  accidents; consider a periodic download if bookings become business-critical.
- **Data protection:** this Sheet now holds names, ages, genders, contact
  details and symptom descriptions — health data under India's DPDP Act 2023.
  Keep the Google account on 2-step verification, don't share the Sheet more
  widely than necessary, and delete rows once you no longer need them (see the
  retention period you set in `privacy.html`).

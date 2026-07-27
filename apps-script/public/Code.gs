/* =========================================================================
   PUBLIC endpoint — Dr. Varun Soni (PT) · V4
   Deploy as:  Execute as = Me     ·     Who has access = Anyone
   ---------------------------------------------------------------------
   This script is reachable by the whole internet, so it is deliberately
   WRITE-ONLY for bookings. It accepts a booking, and it serves approved
   reviews. There is no code path here that returns booking data — that
   lives in the separate admin project, which only you can open.
   ========================================================================= */

var SHEET_ID       = 'PASTE_YOUR_SHEET_ID_HERE';
var TAB_BOOKINGS   = 'Bookings';
var TAB_REVIEWS    = 'Reviews';
var MAX_PER_WINDOW = 5;          // submissions allowed per IP-ish key
var WINDOW_SECONDS = 3600;

var BOOKING_COLS = ['timestamp', 'name', 'age', 'gender', 'email', 'phone',
                    'date', 'time', 'concern', 'issue', 'status', 'source', 'reviewToken'];
var REVIEW_COLS  = ['timestamp', 'token', 'name', 'city', 'rating', 'text', 'status'];

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function sheet_(name, cols) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(cols);
    sh.setFrozenRows(1);
  }
  return sh;
}

function str_(v, max) {
  return String(v == null ? '' : v).trim().slice(0, max || 500);
}

/* ---------- GET: approved reviews only ---------- */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || '';
  if (action !== 'reviews') {
    // Never expose bookings. Anything else gets a flat refusal.
    return json_({ error: 'not_found' });
  }
  try {
    var sh = sheet_(TAB_REVIEWS, REVIEW_COLS);
    var rows = sh.getDataRange().getValues();
    var out = [];
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][6]).toLowerCase() !== 'approved') continue;
      out.push({
        name:   str_(rows[i][2], 80),
        city:   str_(rows[i][3], 80),
        rating: Number(rows[i][4]) || null,
        text:   str_(rows[i][5], 600)
      });
    }
    return json_({ reviews: out });
  } catch (err) {
    return json_({ reviews: [] });
  }
}

/* ---------- POST: record a booking, or accept an invited review ---------- */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    // Honeypot — the form field is hidden off-screen, so only bots fill it.
    if (str_(body.website)) return json_({ ok: true });

    if (body.action === 'review') return submitReview_(body);

    // Crude rate limit. Apps Script cannot see the client IP, so this keys on
    // the submitted phone number: enough to stop a naive replay loop.
    var key = 'rl_' + str_(body.phone, 20);
    var cache = CacheService.getScriptCache();
    var seen = Number(cache.get(key) || 0);
    if (seen >= MAX_PER_WINDOW) return json_({ ok: false, error: 'rate_limited' });
    cache.put(key, String(seen + 1), WINDOW_SECONDS);

    var name  = str_(body.name, 120);
    var phone = str_(body.phone, 20).replace(/\D/g, '');
    var email = str_(body.email, 160);
    if (!name || !/^[6-9]\d{9}$/.test(phone)) return json_({ ok: false, error: 'invalid' });

    var token = Utilities.getUuid().replace(/-/g, '').slice(0, 20);

    sheet_(TAB_BOOKINGS, BOOKING_COLS).appendRow([
      new Date(),
      name,
      str_(body.age, 4),
      str_(body.gender, 40),
      email,
      phone,
      str_(body.date, 20),
      str_(body.time, 20),
      str_(body.concern, 120),
      str_(body.issue, 2000),
      'pending',
      str_(body.source, 40),
      token
    ]);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: 'server' });
  }
}

/* A review is only accepted against a token issued for a real booking, and it
   lands as `pending` — nothing reaches the site until you approve it. */
function submitReview_(body) {
  var token = str_(body.token, 40);
  if (!token) return json_({ ok: false, error: 'no_token' });

  var bk = sheet_(TAB_BOOKINGS, BOOKING_COLS).getDataRange().getValues();
  var matched = null;
  for (var i = 1; i < bk.length; i++) {
    if (String(bk[i][12]) === token) { matched = bk[i]; break; }
  }
  if (!matched) return json_({ ok: false, error: 'bad_token' });

  var rv = sheet_(TAB_REVIEWS, REVIEW_COLS);
  var existing = rv.getDataRange().getValues();
  for (var j = 1; j < existing.length; j++) {
    if (String(existing[j][1]) === token) return json_({ ok: false, error: 'already_used' });
  }

  var rating = parseInt(body.rating, 10);
  if (!(rating >= 1 && rating <= 5)) return json_({ ok: false, error: 'invalid' });
  var text = str_(body.text, 600);
  if (text.length < 10) return json_({ ok: false, error: 'too_short' });

  rv.appendRow([
    new Date(), token,
    str_(body.name, 80) || str_(matched[1], 80),
    str_(body.city, 80),
    rating, text, 'pending'
  ]);
  return json_({ ok: true });
}

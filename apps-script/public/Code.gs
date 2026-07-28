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

/* No phone column: the booking arrives as a WhatsApp message from the
   patient's own number, so the practice already has their contact the moment
   it lands — asking for it again in the form would be redundant. */
var BOOKING_COLS = ['timestamp', 'name', 'age', 'gender', 'email',
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

var TAB_BLOCKED   = 'BlockedSlots';
var BLOCKED_COLS  = ['date', 'time', 'reason'];

/* ---------- GET: approved reviews OR booked/blocked slots availability ---------- */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || '';
  
  if (action === 'availability') {
    try {
      var unavailable = {};
      
      // 1. Fetch booked slots from Bookings tab (excluding cancelled)
      var bkSh = sheet_(TAB_BOOKINGS, BOOKING_COLS);
      var bkRows = bkSh.getDataRange().getValues();
      for (var i = 1; i < bkRows.length; i++) {
        var status = String(bkRows[i][9]).toLowerCase();
        if (status === 'cancelled') continue;
        var bDate = str_(bkRows[i][5], 20);
        var bTime = str_(bkRows[i][6], 20);
        if (bDate && bTime) {
          if (!unavailable[bDate]) unavailable[bDate] = [];
          if (unavailable[bDate].indexOf(bTime) === -1) unavailable[bDate].push(bTime);
        }
      }
      
      // 2. Fetch admin blocked slots from BlockedSlots tab
      var blSh = sheet_(TAB_BLOCKED, BLOCKED_COLS);
      var blRows = blSh.getDataRange().getValues();
      for (var j = 1; j < blRows.length; j++) {
        var lDate = str_(blRows[j][0], 20);
        var lTime = str_(blRows[j][1], 20);
        if (lDate) {
          if (!unavailable[lDate]) unavailable[lDate] = [];
          if (lTime && unavailable[lDate].indexOf(lTime) === -1) {
            unavailable[lDate].push(lTime);
          } else if (!lTime) {
            // Full day blocked marker
            unavailable[lDate].push('FULL_DAY');
          }
        }
      }
      
      return json_({ availability: unavailable });
    } catch (err) {
      return json_({ availability: {} });
    }
  }

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

    var name  = str_(body.name, 120);
    var email = str_(body.email, 160);   // optional — may be blank
    if (!name) return json_({ ok: false, error: 'invalid' });

    // Crude rate limit. Apps Script cannot see the client IP and there's no
    // phone field to key on, so this uses email when given, else name —
    // weaker than a phone key, but the honeypot above catches most bots.
    var key = 'rl_' + str_(email || name, 60).toLowerCase();
    var cache = CacheService.getScriptCache();
    var seen = Number(cache.get(key) || 0);
    if (seen >= MAX_PER_WINDOW) return json_({ ok: false, error: 'rate_limited' });
    cache.put(key, String(seen + 1), WINDOW_SECONDS);

    var token = Utilities.getUuid().replace(/-/g, '').slice(0, 20);

    sheet_(TAB_BOOKINGS, BOOKING_COLS).appendRow([
      new Date(),
      name,
      str_(body.age, 4),
      str_(body.gender, 40),
      email,
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
    if (String(bk[i][11]) === token) { matched = bk[i]; break; }
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

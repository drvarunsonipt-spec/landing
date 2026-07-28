/* =========================================================================
   ADMIN panel — Dr. Varun Soni (PT) · V4
   Deploy as:  Execute as = Me     ·     Who has access = Only myself
   ---------------------------------------------------------------------
   That second setting IS the login. Google authenticates you before this
   script runs at all, so there is no password, session or account system
   to write — and nothing for anyone else to break into.

   Keep this in a SEPARATE Apps Script project from the public endpoint.
   A public web app runs anonymously, so it can never gate an admin UI.
   ========================================================================= */

var SHEET_ID     = 'PASTE_YOUR_SHEET_ID_HERE';
var TAB_BOOKINGS = 'Bookings';
var TAB_REVIEWS  = 'Reviews';

// A calendar entry needs an end time even though the form only collects a
// start. This is the block length reserved — change to suit.
var EVENT_MINUTES = 45;

// Used to build the review link you send after a session.
var SITE_URL = 'https://drvarunsoni.in';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Admin')
    .setTitle('Bookings — Dr. Varun Soni (PT)')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function sh_(name) {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(name);
}

/* ---------- bookings ----------
   Column layout (no phone — see public/Code.gs for why):
   0 timestamp, 1 name, 2 age, 3 gender, 4 email, 5 date, 6 time,
   7 concern, 8 issue, 9 status, 10 source, 11 reviewToken */
function listBookings() {
  var sh = sh_(TAB_BOOKINGS);
  if (!sh) return [];
  var rows = sh.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    out.push({
      row: i + 1,                       // 1-based sheet row
      timestamp: r[0] ? Utilities.formatDate(new Date(r[0]), Session.getScriptTimeZone(), 'd MMM, HH:mm') : '',
      name: r[1], age: r[2], gender: r[3], email: r[4],
      date: r[5], time: r[6], concern: r[7], issue: r[8],
      status: r[9], source: r[10], token: r[11]
    });
  }
  return out.reverse();                 // newest first
}

/* "2026-07-28" + "6:00 PM" -> Date */
function parseWhen_(dateStr, timeStr) {
  var d = String(dateStr).split('-');
  var m = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (d.length !== 3 || !m) throw new Error('Could not read "' + dateStr + ' ' + timeStr + '"');
  var h = parseInt(m[1], 10) % 12;
  if (/PM/i.test(m[3])) h += 12;
  return new Date(+d[0], +d[1] - 1, +d[2], h, parseInt(m[2], 10), 0, 0);
}

/* One click: real Google Calendar invite to the patient and to you, status
   flipped. There is no phone number on file — the patient's booking arrived
   as a WhatsApp message from their own number, so the confirmation reply
   goes in that same existing thread. This hands back the message text to
   paste there rather than a wa.me link (which needs a number we don't have). */
function confirmBooking(row) {
  var sh = sh_(TAB_BOOKINGS);
  var r = sh.getRange(row, 1, 1, 12).getValues()[0];
  var name = r[1], email = r[4];
  var start = parseWhen_(r[5], r[6]);
  var end = new Date(start.getTime() + EVENT_MINUTES * 60000);

  var opts = {
    description: 'Free online physiotherapy consultation.\n\n' +
                 'Patient: ' + name + '\nAge: ' + r[2] + '\nGender: ' + r[3] +
                 '\nConcern: ' + r[7] + '\n\nDescribed issue:\n' + r[8]
  };
  if (email && /@/.test(email)) {
    opts.guests = email;
    opts.sendInvites = true;
  }
  CalendarApp.getDefaultCalendar()
    .createEvent('Free consultation — ' + name, start, end, opts);

  sh.getRange(row, 10).setValue('confirmed');

  var when = Utilities.formatDate(start, Session.getScriptTimeZone(), 'EEE d MMM') + ' at ' + r[6];
  var invited = !!(email && /@/.test(email));
  var msg = 'Hi ' + name + ', your free consultation with Dr. Varun Soni (PT) is confirmed for ' +
            when + ' IST.' + (invited ? ' A calendar invite has been sent to ' + email + '.' : '') +
            ' Please join a few minutes early.';
  return {
    ok: true,
    invited: invited,
    message: msg,                       // paste into the patient's existing WhatsApp chat
    reviewLink: SITE_URL + '/review.html?t=' + r[11]
  };
}

function setBookingStatus(row, status) {
  sh_(TAB_BOOKINGS).getRange(row, 10).setValue(status);
  return { ok: true };
}

function deleteBooking(row) {
  sh_(TAB_BOOKINGS).deleteRow(row);
  return { ok: true };
}

/* ---------- reviews ---------- */
function listReviews() {
  var sh = sh_(TAB_REVIEWS);
  if (!sh) return [];
  var rows = sh.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < rows.length; i++) {
    out.push({
      row: i + 1,
      timestamp: rows[i][0] ? Utilities.formatDate(new Date(rows[i][0]), Session.getScriptTimeZone(), 'd MMM, HH:mm') : '',
      name: rows[i][2], city: rows[i][3], rating: rows[i][4],
      text: rows[i][5], status: rows[i][6]
    });
  }
  return out.reverse();
}

function setReviewStatus(row, status) {
  sh_(TAB_REVIEWS).getRange(row, 7).setValue(status);
  return { ok: true };
}

function deleteReview(row) {
  sh_(TAB_REVIEWS).deleteRow(row);
  return { ok: true };
}

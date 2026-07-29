/* =========================================================================
   Dr. Varun Soni (PT) — Online Physiotherapy · V4
   Scroll-driven motion engine (rAF-based — reliable where IO isn't),
   spine section nav, tilt/parallax/magnetic details, FAQ,
   scroll-wheel date/time picker, and the booking → WhatsApp handoff.

   V4 funnel rule: there are no direct-DM WhatsApp links anywhere. The only
   route to WhatsApp is a completed booking form, so every conversation
   starts with the patient's details already in hand.
   ========================================================================= */
(function () {
  "use strict";

  var WA = "919680049176";

  /* Apps Script public web-app URL — set this once Phase 2 is deployed.
     Left empty the page still works end-to-end: the booking simply goes
     straight to WhatsApp without being recorded first. */
  var API = "";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  // screenshot helper: ?shot=1 disables viewport-height hero sizing for full-page captures
  if (/[?&]shot=/.test(location.search)) document.documentElement.classList.add("shotmode");

  /* ---------- shared rAF scroll/resize dispatcher ---------- */
  var fns = [];
  function onScroll(fn) { fns.push(fn); fn(); }
  function runAll() { for (var i = 0; i < fns.length; i++) fns[i](); }

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initGradient();
    setYear();
    initHeader();
    initMenu();
    initReveals();
    initParallax();
    initSpineNav();
    initProgress();
    initHowLine();
    initTilt();
    initMagnetic();
    initFaq();
    initCtaTracking();
    initGenderSeg();
    initWheel();
    initApptForm();
    initReviews();
    initCounters();

    var ticking = false;
    function tick() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { runAll(); ticking = false; });
    }
    window.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("resize", tick, { passive: true });
    window.addEventListener("load", runAll);
    // rAF doesn't fire in hidden tabs — release the throttle and re-sync
    // whenever visibility changes so state is always correct on return.
    document.addEventListener("visibilitychange", function () { ticking = false; runAll(); });

    // Failsafe: never leave content hidden, whatever happens.
    setTimeout(function () {
      document.querySelectorAll("[data-reveal]").forEach(function (el) { el.classList.add("rv-in"); });
      document.querySelectorAll("[data-step]").forEach(function (el) { el.classList.add("lit"); });
    }, 3000);
  });

  function setYear() {
    var y = document.getElementById("year");
    if (y) y.textContent = String(new Date().getFullYear());
  }

  /* ---------- theme: dark default, toggle + persistence ---------- */
  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  }
  function initTheme() {
    var btn = document.getElementById("themeBtn");
    var meta = document.querySelector('meta[name="theme-color"]');

    function apply(theme, animate) {
      document.documentElement.setAttribute("data-theme", theme);
      try { localStorage.setItem("theme", theme); } catch (e) { }
      if (meta) meta.content = theme === "dark" ? "#070D1F" : "#F5F8FB";
      if (btn) btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
      gradientNow();
      if (animate && !reduced) {
        document.documentElement.classList.add("theme-anim");
        setTimeout(function () { document.documentElement.classList.remove("theme-anim"); }, 450);
      }
    }
    apply(currentTheme(), false); // sync button label/meta with pre-paint theme
    if (btn) btn.addEventListener("click", function () {
      apply(currentTheme() === "dark" ? "light" : "dark", true);
    });
  }

  /* ---------- scroll-dependent gradient backdrop ----------
     The page background is a fixed 3-stop gradient whose colors (and angle)
     interpolate through a per-theme palette as you scroll. */
  var GRADIENTS = {
    dark: [
      ["#050B1E", "#0C1C44", "#03060F"],   // top — deep ink
      ["#06132E", "#134E82", "#07152F"],   // services — sapphire swell
      ["#052430", "#0F5C6E", "#062230"],   // mid — teal depths
      ["#0E1140", "#2C2F8E", "#070A22"],   // stories/faq — violet indigo
      ["#03061A", "#0A1A40", "#010308"]    // book/footer — deepest
    ],
    light: [
      ["#F3F7FE", "#EAF2FB", "#F6F9FD"],   // top — porcelain blue
      ["#EAF6F8", "#DBEEF3", "#EDF6F9"],   // services — aqua wash
      ["#F0F1FE", "#E3E7FB", "#F1F3FD"],   // mid — lilac periwinkle
      ["#EDF8F3", "#DFF0E8", "#F2FAF6"],   // stories/faq — mint
      ["#F5F8FD", "#E9F0F8", "#F3F6FB"]    // book/footer — cool rest
    ]
  };
  function hexLerp(a, b, t) {
    var A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
    var r = Math.round(((A >> 16) & 255) + (((B >> 16) & 255) - ((A >> 16) & 255)) * t);
    var g = Math.round(((A >> 8) & 255) + (((B >> 8) & 255) - ((A >> 8) & 255)) * t);
    var bl = Math.round((A & 255) + ((B & 255) - (A & 255)) * t);
    return "rgb(" + r + "," + g + "," + bl + ")";
  }
  var _g = { g1: "", g2: "", g3: "", ang: "" };  // last-written values (skip redundant per-frame writes)
  function gradientNow() {
    var stops = GRADIENTS[currentTheme()];
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    // Static blend on touch / reduced-motion — a scroll-driven full-screen
    // gradient repaint is a major cost on phones. Desktop keeps the scroll travel.
    if (reduced) p = 0.4;
    var seg = p * (stops.length - 1);
    var i = Math.min(stops.length - 2, Math.floor(seg));
    var t = seg - i;
    var A = stops[i], B = stops[i + 1];
    var g1 = hexLerp(A[0], B[0], t), g2 = hexLerp(A[1], B[1], t), g3 = hexLerp(A[2], B[2], t);
    var ang = (130 + p * 100).toFixed(1) + "deg";
    if (g1 !== _g.g1) { doc.style.setProperty("--g1", g1); _g.g1 = g1; }
    if (g2 !== _g.g2) { doc.style.setProperty("--g2", g2); _g.g2 = g2; }
    if (g3 !== _g.g3) { doc.style.setProperty("--g3", g3); _g.g3 = g3; }
    if (ang !== _g.ang) { doc.style.setProperty("--g-angle", ang); _g.ang = ang; }
  }
  function initGradient() {
    if (!reduced) { onScroll(gradientNow); }  // scroll-interpolated (desktop + touch)
    else { gradientNow(); }                    // set once, static, for reduced-motion
  }

  /* ---------- header: glass + hide on scroll down ---------- */
  function initHeader() {
    var header = document.getElementById("siteHeader");
    if (!header) return;
    onScroll(function () {
      var y = window.scrollY;
      header.classList.toggle("scrolled", y > 30);
    });
  }

  /* ---------- mobile menu ---------- */
  function initMenu() {
    var btn = document.getElementById("menuBtn");
    var menu = document.getElementById("mobileMenu");
    if (!btn || !menu) return;
    var root = document.documentElement;

    function setOpen(open) {
      root.classList.toggle("menu-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menu.setAttribute("aria-hidden", open ? "false" : "true");
    }
    btn.addEventListener("click", function () {
      setOpen(!root.classList.contains("menu-open"));
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && root.classList.contains("menu-open")) setOpen(false);
    });
  }

  /* ---------- reveals (scroll-checked, staggered via CSS --d) ---------- */
  function initReveals() {
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
    if (!items.length) return;
    if (reduced) { items.forEach(function (el) { el.classList.add("rv-in"); }); return; }
    onScroll(function () {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      for (var i = 0; i < items.length; i++) {
        var el = items[i];
        if (el.classList.contains("rv-in")) continue;
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.89 && r.bottom > 0) el.classList.add("rv-in");
      }
    });
  }

  /* ---------- parallax & smooth scroll zoom for image containers & borders ---------- */
  function initParallax() {
    if (reduced) return;
    var containers = Array.prototype.slice.call(document.querySelectorAll(".hero__photo, figure, [data-parallax]"));
    if (!containers.length) return;

    containers.forEach(function (el) {
      el.style.transition = "transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)";
    });

    onScroll(function () {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      containers.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;

        // Calculate normalized distance from center of screen (0 at center, 1 at edge)
        var centerDist = Math.abs((r.top + r.height / 2) - vh / 2);
        var maxDist = vh / 2 + r.height / 2;
        var normDist = Math.min(1, centerDist / maxDist);

        // Smooth container/border zoom: 1.05x at viewport center, scales down to 0.94x at viewport edges
        var scale = 1.05 - (normDist * 0.11);

        var speed = parseFloat(el.getAttribute("data-parallax")) || 0.04;
        var delta = (r.top + r.height / 2) - vh / 2;
        var y = -delta * speed;

        el.style.transform = "translate3d(0," + y.toFixed(1) + "px,0) scale(" + scale.toFixed(3) + ")";
      });
    });
  }

  /* ---------- spine section nav (scrollspy) ---------- */
  function initSpineNav() {
    var nav = document.getElementById("spineNav");
    if (!nav) return;
    var sections = Array.prototype.slice.call(document.querySelectorAll("[data-spy]"));
    if (!sections.length) return;

    var dots = sections.map(function (sec) {
      var b = document.createElement("button");
      b.className = "sn-dot";
      b.type = "button";
      b.setAttribute("data-label", sec.getAttribute("data-spy"));
      b.setAttribute("aria-label", "Go to " + sec.getAttribute("data-spy"));
      b.addEventListener("click", function () {
        sec.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      });
      nav.appendChild(b);
      return b;
    });

    onScroll(function () {
      var mid = (window.innerHeight || 0) * 0.42;
      var active = 0;
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].getBoundingClientRect().top <= mid) active = i;
      }
      dots.forEach(function (d, i) { d.classList.toggle("active", i === active); });
      // sync desktop nav link highlight
      var id = sections[active].id;
      document.querySelectorAll("#primaryNav a").forEach(function (a) {
        a.classList.toggle("active", a.getAttribute("href") === "#" + id);
      });
    });
  }

  /* ---------- top progress bar ---------- */
  function initProgress() {
    var bar = document.getElementById("progressBar");
    if (!bar) return;
    onScroll(function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      var p = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = "scaleX(" + Math.min(1, Math.max(0, p)).toFixed(4) + ")";
    });
  }

  /* ---------- how-it-works: line draws with scroll, steps light up ---------- */
  function initHowLine() {
    var section = document.getElementById("how");
    var path = document.getElementById("howPath");
    if (!section) return;
    var steps = Array.prototype.slice.call(section.querySelectorAll("[data-step]"));
    var len = 0;
    if (path) {
      try { len = path.getTotalLength(); } catch (e) { path = null; }
      if (path) { path.style.setProperty("--len", len); path.style.setProperty("--off", len); }
    }
    if (reduced) {
      if (path) path.style.setProperty("--off", 0);
      steps.forEach(function (s) { s.classList.add("lit"); });
      return;
    }
    onScroll(function () {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var r = section.getBoundingClientRect();
      var p = (vh * 0.9 - r.top) / (r.height * 0.85);
      p = Math.max(0, Math.min(1, p));
      if (path) path.style.setProperty("--off", String(len * (1 - p)));
      steps.forEach(function (s, i) {
        s.classList.toggle("lit", p > 0.22 + i * 0.26);
      });
    });
  }

  /* ---------- hero tilt (desktop only) ---------- */
  function initTilt() {
    if (reduced || !finePointer) return;
    var stack = document.getElementById("heroStack");
    var tilt = document.getElementById("heroTilt");
    if (!stack || !tilt) return;
    var rx = 0, ry = 0, tx = 0, ty = 0, raf = null;

    function loop() {
      rx += (tx - rx) * 0.12;
      ry += (ty - ry) * 0.12;
      tilt.style.transform = "rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg)";
      if (Math.abs(tx - rx) > 0.02 || Math.abs(ty - ry) > 0.02) raf = requestAnimationFrame(loop);
      else raf = null;
    }
    function kick() { if (!raf) raf = requestAnimationFrame(loop); }

    stack.addEventListener("pointermove", function (e) {
      var r = stack.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      tx = py * -5;  // target rotateX (tip away from cursor vertically)
      ty = px * 7;   // target rotateY (turn toward cursor horizontally)
      kick();
    });
    stack.addEventListener("pointerleave", function () { tx = 0; ty = 0; kick(); });
  }

  /* ---------- magnetic buttons (desktop only) ---------- */
  function initMagnetic() {
    if (reduced || !finePointer) return;
    document.querySelectorAll("[data-magnetic]").forEach(function (btn) {
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = ((e.clientX - r.left) / r.width - 0.5) * 10;
        var y = ((e.clientY - r.top) / r.height - 0.5) * 8;
        btn.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
      });
      btn.addEventListener("pointerleave", function () { btn.style.transform = ""; });
    });
  }

  /* ---------- FAQ (single open) ---------- */
  function initFaq() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".faq2-item"));
    function setOpen(item, open) {
      item.setAttribute("data-open", open ? "true" : "false");
      var b = item.querySelector(".faq2-q");
      if (b) b.setAttribute("aria-expanded", open ? "true" : "false");
    }
    items.forEach(function (item) {
      var btn = item.querySelector(".faq2-q");
      if (!btn) return;
      btn.addEventListener("click", function () {
        var open = item.getAttribute("data-open") === "true";
        items.forEach(function (o) { if (o !== item) setOpen(o, false); });
        setOpen(item, !open);
      });
    });
  }

  /* ---------- CTA attribution + concern prefill ----------
     Every CTA carries data-cta, so the WhatsApp message records which part of
     the page produced the booking. In V3 ten of twelve links sent identical
     text, which made attribution impossible. */
  var lastCta = "direct";
  function initCtaTracking() {
    document.querySelectorAll("[data-cta]").forEach(function (el) {
      el.addEventListener("click", function () {
        lastCta = el.getAttribute("data-cta") || "direct";
        var concern = el.getAttribute("data-concern");
        if (!concern) return;
        var sel = document.getElementById("a-concern");
        if (!sel) return;
        for (var i = 0; i < sel.options.length; i++) {
          if (sel.options[i].text === concern) { sel.selectedIndex = i; break; }
        }
        updatePreview();
      });
    });
  }

  /* ---------- gender segmented control ---------- */
  var GENDERS = ["Female", "Male", "Other", "Prefer not to say"];
  function initGenderSeg() {
    var seg = document.getElementById("genderSeg");
    if (!seg) return;
    GENDERS.forEach(function (g) {
      var label = document.createElement("label");
      label.className = "seg-opt";
      var input = document.createElement("input");
      input.type = "radio"; input.name = "gender"; input.value = g;
      input.className = "visually-hidden";
      var span = document.createElement("span");
      span.textContent = g;
      label.appendChild(input); label.appendChild(span);
      input.addEventListener("change", function () {
        seg.querySelectorAll(".seg-opt").forEach(function (o) { o.classList.remove("checked"); });
        label.classList.add("checked");
        updatePreview();
      });
      seg.appendChild(label);
    });
  }

  /* ---------- date + time scroll wheel ----------
     Four snap-scrolling columns. Hour/minute/AM-PM are rebuilt whenever an
     earlier column changes — that rebuild is what enforces the 6:00 AM–11:45 PM
     window and removes times that have already passed today, so an invalid
     combination can never be selected in the first place. */
  var WHEEL_DAYS = 60;
  var OPEN_MIN = 6 * 60;        // 06:00 — first bookable start (6:00 AM)
  var CLOSE_MIN = 23 * 60 + 45; // 23:45 — last bookable start (11:45 PM)
  var LEAD_MIN = 60;        // never offer a slot less than an hour away

  var wheelSel = { date: "", hour: 0, minute: 0, ampm: "AM" };
  var wheelCols = {};

  /* Per-detent haptic tick. Android Chrome only — iOS Safari has never shipped
     the Vibration API, so iPhones get the visual detent and nothing more.
     Needs prior user activation, which opening the disclosure provides. */
  var canVibrate = typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
  function haptic() {
    if (!canVibrate || reduced) return;
    try { navigator.vibrate(8); } catch (e) { }
  }

  function pad2(n) { return String(n).padStart(2, "0"); }
  function isoOf(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
  function to24(h12, ampm) {
    if (ampm === "AM") return h12 === 12 ? 0 : h12;
    return h12 === 12 ? 12 : h12 + 12;
  }
  function from24(h24) {
    var ampm = h24 < 12 ? "AM" : "PM";
    var h12 = h24 === 0 ? 12 : (h24 > 12 ? h24 - 12 : h24);
    return { h12: h12, ampm: ampm };
  }
  function minAllowed(iso) {
    var now = new Date();
    if (iso !== isoOf(now)) return OPEN_MIN;
    return Math.max(OPEN_MIN, now.getHours() * 60 + now.getMinutes() + LEAD_MIN);
  }
  function slotOk(iso, mins) { return mins >= minAllowed(iso) && mins <= CLOSE_MIN; }

  function minuteOptions(iso, h12, ampm) {
    var base = to24(h12, ampm) * 60, out = [];
    for (var m = 0; m < 60; m += 15) {
      if (slotOk(iso, base + m)) out.push({ value: m, label: pad2(m) });
    }
    return out;
  }
  function hourOptions(iso) {
    var out = [];
    for (var h24 = 6; h24 <= 23; h24++) {
      var f = from24(h24);
      if (minuteOptions(iso, f.h12, f.ampm).length > 0) {
        out.push({ value: h24, h12: f.h12, ampm: f.ampm, label: String(f.h12) });
      }
    }
    return out;
  }
  function ampmOptions(iso) {
    var hours = hourOptions(iso);
    var hasAM = hours.some(function (h) { return h.ampm === "AM"; });
    var hasPM = hours.some(function (h) { return h.ampm === "PM"; });
    var out = [];
    if (hasAM) out.push({ value: "AM", label: "AM" });
    if (hasPM) out.push({ value: "PM", label: "PM" });
    return out;
  }
  function dateOptions() {
    var out = [], d = new Date(), today = isoOf(new Date());
    var tmr = new Date(); tmr.setDate(tmr.getDate() + 1); tmr = isoOf(tmr);
    for (var i = 0; i < WHEEL_DAYS; i++) {
      var iso = isoOf(d);
      // Drops today automatically once the last slot has passed.
      if (minAllowed(iso) <= CLOSE_MIN) {
        out.push({
          value: iso,
          label: iso === today ? "Today" : iso === tmr ? "Tomorrow"
            : new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" }).format(d)
        });
      }
      d.setDate(d.getDate() + 1);
    }
    return out;
  }

  function update3DRotation(col) {
    if (!col || !col.children || !col.children.length) return;
    var h = itemH(col);
    var centerLine = col.scrollTop + col.clientHeight / 2;
    var radius = 85; // Cylinder radius in px

    for (var i = 0; i < col.children.length; i++) {
      var child = col.children[i];
      var itemCenter = child.offsetTop + h / 2;
      var dist = itemCenter - centerLine;
      var norm = dist / (h * 2.15);
      norm = Math.max(-1.3, Math.min(1.3, norm));

      var angleDeg = -norm * 66; // rotate up to 66 degrees
      var angleRad = (angleDeg * Math.PI) / 180;

      // Exact 3D Cylinder arc geometry:
      // Items curve backwards along a cylinder surface of radius 85px
      var transZ = radius * (Math.cos(angleRad) - 1);
      var scale = 0.84 + 0.16 * Math.cos(angleRad);
      var opacity = Math.max(0.08, Math.pow(Math.cos(angleRad), 2.2));

      child.style.transform = "rotateX(" + angleDeg.toFixed(2) + "deg) translateZ(" + transZ.toFixed(2) + "px) scale(" + scale.toFixed(3) + ")";
      child.style.opacity = opacity.toFixed(3);
    }
  }

  /* Falls back to 44 when the disclosure is collapsed: a hidden element reports
     offsetHeight 0, and dividing by that would send every column to index 0. */
  function itemH(col) {
    var f = col.firstElementChild;
    return (f && f.offsetHeight) ? f.offsetHeight : 44;
  }
  function indexOfScroll(col) { return Math.round(col.scrollTop / itemH(col)); }

  function markSelected(key, idx) {
    var col = wheelCols[key];
    if (!col) return;
    Array.prototype.forEach.call(col.children, function (c, i) {
      c.classList.toggle("is-sel", i === idx);
      c.setAttribute("aria-selected", i === idx ? "true" : "false");
    });
    if (col.children[idx]) col.setAttribute("aria-activedescendant", col.children[idx].id);
  }
  /* Always "instant". A smooth programmatic scroll is cancelled outright by
     `scroll-snap-type: mandatory`, which left the column visually stuck on the
     old value while the state moved on. The snap animation the browser runs
     for real touch/wheel input is unaffected — that still glides. */
  function selectIndex(key, idx) {
    var col = wheelCols[key], opts = col._options || [];
    if (!opts.length) return;
    idx = Math.max(0, Math.min(opts.length - 1, idx));
    col.scrollTo({ top: idx * itemH(col), behavior: "instant" });
    markSelected(key, idx);
    update3DRotation(col);
  }
  function buildCol(key, options) {
    var col = wheelCols[key];
    col.innerHTML = "";
    options.forEach(function (o, i) {
      var el = document.createElement("div");
      el.className = "wheel__opt";
      el.setAttribute("role", "option");
      el.id = "wh-" + key + "-" + i;
      el.textContent = o.label;
      col.appendChild(el);
    });
    col._options = options;
    update3DRotation(col);
  }
  function sameOpts(a, b) {
    if (!a || a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (String(a[i].value) !== String(b[i].value)) return false;
    return true;
  }
  function applyCol(key, options, want, skipScroll) {
    var col = wheelCols[key];
    if (!col) return;
    if (!sameOpts(col._options, options)) buildCol(key, options);
    var idx = 0;
    for (var i = 0; i < options.length; i++) {
      if (String(options[i].value) === String(want)) { idx = i; break; }
    }
    if (key === "date") {
      wheelSel.date = options.length ? options[idx].value : "";
    } else if (key === "minute") {
      wheelSel.minute = options.length ? options[idx].value : 0;
    }
    if (!skipScroll) {
      selectIndex(key, idx);
    } else {
      markSelected(key, idx);
      update3DRotation(col);
    }
  }
  function syncWheel(activeKey) {
    applyCol("date", dateOptions(), wheelSel.date, activeKey === "date");
    var iso = wheelSel.date;

    var ap = ampmOptions(iso);
    if (ap.length && !ap.some(function (o) { return o.value === wheelSel.ampm; })) {
      wheelSel.ampm = ap[0].value;
    }
    applyCol("ampm", ap, wheelSel.ampm, activeKey === "ampm" || activeKey === "hour");

    var hours = hourOptions(iso);
    var curH24 = to24(wheelSel.hour, wheelSel.ampm);
    var matchedHour = hours.find(function (o) { return o.value === curH24; });

    if (!matchedHour && hours.length) {
      var sameAmPm = hours.filter(function (o) { return o.ampm === wheelSel.ampm; });
      matchedHour = sameAmPm.length ? sameAmPm[0] : hours[0];
      wheelSel.hour = matchedHour.h12;
      wheelSel.ampm = matchedHour.ampm;
      applyCol("ampm", ap, wheelSel.ampm, activeKey === "ampm" || activeKey === "hour");
    }

    var wantH24 = matchedHour ? matchedHour.value : curH24;
    applyCol("hour", hours, wantH24, activeKey === "hour");

    var mins = minuteOptions(iso, wheelSel.hour, wheelSel.ampm);
    applyCol("minute", mins, wheelSel.minute, activeKey === "minute");

    var out = document.getElementById("whenValue");
    if (out) out.textContent = wheelText() || "Tap to choose";
    if (wheelText()) clearInvalid(document.getElementById("whenToggle"));
    updatePreview();
  }
  function wheelText() {
    if (!wheelSel.date || !wheelSel.hour) return "";
    return fmtDate(wheelSel.date) + " at " + wheelSel.hour + ":" + pad2(wheelSel.minute) + " " + wheelSel.ampm + " IST";
  }
  /* Commits an explicit index. Keyboard uses this directly rather than moving
     the scroller and reading the position back — that round-trip is what made
     arrow keys unreliable. */
  function commitIndex(key, idx) {
    var col = wheelCols[key], opts = col._options || [];
    if (!opts.length) return;
    idx = Math.max(0, Math.min(opts.length - 1, idx));
    var selOpt = opts[idx];
    if (!selOpt) return;

    if (key === "date") {
      wheelSel.date = selOpt.value;
    } else if (key === "hour") {
      wheelSel.hour = selOpt.h12;
      wheelSel.ampm = selOpt.ampm;
    } else if (key === "ampm") {
      var newAmPm = selOpt.value;
      var targetH24 = to24(wheelSel.hour, newAmPm);
      var hours = hourOptions(wheelSel.date);
      var match = hours.find(function (o) { return o.value === targetH24; });
      if (!match) {
        var sameAmPm = hours.filter(function (o) { return o.ampm === newAmPm; });
        match = sameAmPm.length ? sameAmPm[0] : (hours.length ? hours[0] : null);
      }
      wheelSel.ampm = newAmPm;
      if (match) {
        wheelSel.hour = match.h12;
      }
    } else if (key === "minute") {
      wheelSel.minute = selOpt.value;
    }

    syncWheel(key);
  }
  /* Touch/wheel path: the snap has already settled, so derive from position. */
  function commit(key) {
    var col = wheelCols[key];
    if (col && col._options && col._options.length) commitIndex(key, indexOfScroll(col));
  }

  function initWheel() {
    var wrap = document.getElementById("wheel");
    if (!wrap) return;
    ["date", "hour", "minute", "ampm"].forEach(function (k) {
      wheelCols[k] = wrap.querySelector('[data-wheel="' + k + '"]');
    });

    // Default to the earliest slot that is actually still bookable.
    var d0 = dateOptions();
    wheelSel.date = d0.length ? d0[0].value : isoOf(new Date());
    var h0 = hourOptions(wheelSel.date);
    if (h0.length) {
      wheelSel.hour = h0[0].h12;
      wheelSel.ampm = h0[0].ampm;
    } else {
      wheelSel.hour = 6;
      wheelSel.ampm = "AM";
    }
    wheelSel.minute = 0;
    syncWheel();

    ["date", "hour", "minute", "ampm"].forEach(function (k) {
      var col = wheelCols[k];
      if (!col) return;
      var t = null;
      col._lastIdx = -1;
      // Debounced rather than `scrollend` — Safari still lacks that event.
      col.addEventListener("scroll", function () {
        update3DRotation(col);
        // Tick the highlight and haptics per detent as it passes the centre,
        // rather than waiting for the debounce — that's what makes it feel
        // like a physical wheel instead of a scrolling list.
        var i = indexOfScroll(col);
        if (i !== col._lastIdx && i >= 0 && i < (col._options || []).length) {
          col._lastIdx = i;
          markSelected(k, i);
          if (k === "hour") {
            var opt = col._options[i];
            if (opt && opt.ampm) {
              var ampmCol = wheelCols["ampm"];
              if (ampmCol && ampmCol._options) {
                for (var ai = 0; ai < ampmCol._options.length; ai++) {
                  if (ampmCol._options[ai].value === opt.ampm) {
                    markSelected("ampm", ai);
                    update3DRotation(ampmCol);
                    break;
                  }
                }
              }
            }
          }
          haptic();
        }
        clearTimeout(t);
        t = setTimeout(function () { commit(k); }, 110);
      }, { passive: true });
      col.addEventListener("keydown", function (e) {
        var opts = col._options || [], cur = indexOfScroll(col), next;
        if (e.key === "ArrowDown") next = cur + 1;
        else if (e.key === "ArrowUp") next = cur - 1;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = opts.length - 1;
        else return;
        e.preventDefault();
        clearTimeout(t);              // don't let the scroll debounce re-derive
        commitIndex(k, next);
      });
    });

    initWhenDisclosure();
  }

  /* ---------- date/time disclosure ----------
     Collapsed by default so a thumb drag down the page can't land inside the
     wheel. Everything below exists because a hidden column has no layout:
     scrollTo() on it is a no-op, so positions have to be re-applied the
     moment the panel becomes visible. */
  var whenOpen = false;
  function setWhenOpen(open) {
    var toggle = document.getElementById("whenToggle");
    var panel = document.getElementById("whenPanel");
    if (!toggle || !panel) return;
    whenOpen = open;
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (!open) return;

    // Now that the panel has layout, put every column back on its selection.
    ["date", "hour", "minute", "ampm"].forEach(function (k) {
      var col = wheelCols[k];
      if (!col || !col._options) return;
      var idx = 0;
      var wantVal = (k === "hour") ? to24(wheelSel.hour, wheelSel.ampm) : wheelSel[k];
      for (var i = 0; i < col._options.length; i++) {
        if (String(col._options[i].value) === String(wantVal)) { idx = i; break; }
      }
      col._lastIdx = idx;
      selectIndex(k, idx);
      update3DRotation(col);
    });
  }

  function initWhenDisclosure() {
    var toggle = document.getElementById("whenToggle");
    var done = document.getElementById("whenDone");
    if (!toggle) return;
    toggle.addEventListener("click", function () { setWhenOpen(!whenOpen); });
    if (done) {
      done.addEventListener("click", function () {
        setWhenOpen(false);
        toggle.focus({ preventScroll: true });
      });
    }
  }

  /* ---------- appointment form + live WhatsApp preview ---------- */
  function fmtDate(v) {
    if (!v) return "";
    try {
      var d = new Date(v + "T00:00:00");
      return new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(d);
    } catch (e) { return v; }
  }
  function fieldVal(form, n) {
    var el = form.elements[n];
    return el && el.value ? String(el.value).trim() : "";
  }
  function apptMessage() {
    var form = document.getElementById("apptForm");
    if (!form) return "";
    var g = form.querySelector('input[name="gender"]:checked');
    var email = fieldVal(form, "email");
    var lines = ["Hi Dr. Varun, I'd like to book a free consultation. 🗓"];

    var details = [];
    var name = fieldVal(form, "name");
    var age = fieldVal(form, "age");
    var concern = fieldVal(form, "concern");
    var preferred = wheelText();
    var issue = fieldVal(form, "issue");

    if (name) details.push("Name: " + name);
    if (age) details.push("Age: " + age);
    if (g) details.push("Gender: " + g.value);
    if (email) details.push("Email: " + email);
    if (concern) details.push("Concern: " + concern);
    if (preferred) details.push("Preferred: " + preferred);
    if (issue) details.push("Issue: " + issue);

    if (details.length > 0) {
      lines.push("");
      lines = lines.concat(details);
    }

    return lines.join("\n");
  }
  function updatePreview() {
    var text = apptMessage();
    var b = document.getElementById("waPreview");
    if (b) b.textContent = text;
  }

  function openWhatsApp(text) {
    var url = "https://wa.me/" + WA + "?text=" + encodeURIComponent(text);
    // Must stay synchronous inside the click handler. V3 wrapped this in a
    // 600ms setTimeout for a spinner, which detached it from the user gesture
    // and let iOS Safari block the site's only conversion action.
    var win = window.open(url, "_blank");
    if (win) { try { win.opener = null; } catch (e) { } return true; }
    window.location.href = url;   // popup blocked / in-app browser
    return true;
  }

  /* Fire-and-forget capture. keepalive lets it finish even as WhatsApp takes
     over the foreground. text/plain keeps it a CORS "simple request" — Apps
     Script cannot answer the preflight that application/json would trigger. */
  function record(payload) {
    if (!API) return;
    try {
      fetch(API, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function () { });
    } catch (e) { /* never block the handoff on telemetry */ }
  }

  function clearInvalid(el) {
    if (el) {
      el.removeAttribute("aria-invalid");
      el.removeAttribute("aria-describedby");
      el.classList.remove("is-invalid");
    }
  }
  function markInvalid(el, statusId) {
    if (el) {
      el.setAttribute("aria-invalid", "true");
      if (statusId) el.setAttribute("aria-describedby", statusId);
      el.classList.add("is-invalid");
    }
  }

  function initApptForm() {
    var form = document.getElementById("apptForm");
    if (!form) return;
    var status = document.getElementById("apptStatus");
    var genderSeg = document.getElementById("genderSeg");
    var whenToggle = document.getElementById("whenToggle");

    ["input", "change"].forEach(function (ev) { form.addEventListener(ev, updatePreview); });
    updatePreview();

    // Clear red error borders in real-time as missing details are filled in
    form.querySelectorAll("input, select, textarea").forEach(function (input) {
      ["input", "change"].forEach(function (ev) {
        input.addEventListener(ev, function () {
          if (input.name === "gender") {
            clearInvalid(genderSeg);
          } else if (input.name === "consent") {
            if (input.checked) clearInvalid(consentEl);
          } else if (input.value && input.value.trim() !== "") {
            clearInvalid(input);
          }
        });
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.dataset.state = "";
      status.textContent = "";

      var nameEl = form.elements["name"],
        ageEl = form.elements["age"],
        emailEl = form.elements["email"],
        concernEl = form.elements["concern"],
        issueEl = form.elements["issue"],
        consentEl = form.elements["consent"];

      var allCheckable = [nameEl, ageEl, emailEl, concernEl, issueEl, consentEl, genderSeg, whenToggle];
      allCheckable.forEach(clearInvalid);

      var name = (nameEl.value || "").trim();
      var email = (emailEl.value || "").trim();
      var age = parseInt(ageEl.value, 10);
      var gender = form.querySelector('input[name="gender"]:checked');
      var concern = concernEl ? concernEl.value : "";
      var issue = (issueEl.value || "").trim();

      var invalidElements = [];
      var firstFailMsg = "";

      if (!name) {
        markInvalid(nameEl, "apptStatus");
        invalidElements.push(nameEl);
        if (!firstFailMsg) firstFailMsg = "Please enter your name.";
      }
      if (!age || age < 1 || age > 120) {
        markInvalid(ageEl, "apptStatus");
        invalidElements.push(ageEl);
        if (!firstFailMsg) firstFailMsg = "Please enter a valid age.";
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        markInvalid(emailEl, "apptStatus");
        invalidElements.push(emailEl);
        if (!firstFailMsg) firstFailMsg = "Please enter a valid email, or leave it blank.";
      }
      if (!gender) {
        markInvalid(genderSeg, "apptStatus");
        invalidElements.push(genderSeg);
        if (!firstFailMsg) firstFailMsg = "Please select your gender.";
      }
      if (!concern) {
        markInvalid(concernEl, "apptStatus");
        invalidElements.push(concernEl);
        if (!firstFailMsg) firstFailMsg = "Please choose your primary concern.";
      }
      if (!wheelText()) {
        markInvalid(whenToggle, "apptStatus");
        invalidElements.push(whenToggle);
        if (!firstFailMsg) firstFailMsg = "Please pick a preferred date and time.";
      }
      if (!issue) {
        markInvalid(issueEl, "apptStatus");
        invalidElements.push(issueEl);
        if (!firstFailMsg) firstFailMsg = "Please describe what's troubling you.";
      }
      if (!consentEl.checked) {
        markInvalid(consentEl, "apptStatus");
        invalidElements.push(consentEl);
        if (!firstFailMsg) firstFailMsg = "Please accept the privacy terms to continue.";
      }

      if (invalidElements.length > 0) {
        status.dataset.state = "error";
        status.textContent = invalidElements.length === 1
          ? firstFailMsg
          : "Please fill in the required details highlighted in red.";

        var firstEl = invalidElements[0];
        if (firstEl === whenToggle && !whenOpen) {
          setWhenOpen(true);
        }
        if (firstEl === genderSeg) {
          var g0 = form.querySelector('input[name="gender"]');
          if (g0) g0.focus();
        } else if (firstEl.focus) {
          firstEl.focus();
        }
        return;
      }

      // Honeypot: humans never see this field. Accept quietly, send nothing.
      if (fieldVal(form, "website")) {
        status.dataset.state = "ok";
        status.textContent = "Thanks — we'll be in touch.";
        return;
      }

      record({
        name: name, age: age, gender: gender.value, email: email,
        date: wheelSel.date,
        time: wheelSel.hour + ":" + pad2(wheelSel.minute) + " " + wheelSel.ampm,
        concern: concern, issue: issue, source: lastCta
      });

      openWhatsApp(apptMessage());
      status.dataset.state = "ok";
      status.textContent = "Opening WhatsApp — press send to confirm. ✓";
    });
  }

  /* ---------- stat count-up ----------
     The real figure is written in the HTML, so it is correct with JS disabled
     and for crawlers; this only animates up to it. Static under reduced
     motion — the number is the point, not the movement. */
  function initCounters() {
    var els = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));
    els.forEach(function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10) || 0;
      var suffix = el.getAttribute("data-suffix") || "";
      if (reduced) { el.textContent = target + suffix; return; }

      var started = false;
      onScroll(function () {
        if (started) return;
        var r = el.getBoundingClientRect();
        if (r.top > window.innerHeight - 60 || r.bottom < 0) return;
        started = true;
        var t0 = null;
        requestAnimationFrame(function step(ts) {
          if (t0 === null) t0 = ts;
          var p = Math.min(1, (ts - t0) / 1400);
          var eased = 1 - Math.pow(1 - p, 3);              // ease-out cubic
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(step);
        });
      });
    });
  }

  /* ---------- approved reviews (Phase 3) ----------
     Renders only what the practice has approved. Stays hidden when the
     endpoint is unset, unreachable, or has nothing to show — an empty
     section is better than a padded one. All text goes in via textContent. */
  function initReviews() {
    var block = document.getElementById("reviewsBlock");
    var grid = document.getElementById("reviewsGrid");
    if (!block || !grid || !API) return;
    fetch(API + "?action=reviews")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        var list = (data && data.reviews) || [];
        if (!list.length) return;
        list.forEach(function (rv) {
          var fig = document.createElement("figure");
          fig.className = "card review";
          var q = document.createElement("blockquote");
          q.textContent = rv.text || "";
          var cap = document.createElement("figcaption");
          cap.textContent = (rv.name || "Patient") + (rv.city ? " · " + rv.city : "");
          fig.appendChild(q);
          fig.appendChild(cap);
          grid.appendChild(fig);
        });
        block.hidden = false;
      })
      .catch(function () { /* leave hidden */ });
  }

  /* ---------- mobile bar ---------- */
  (function initMobileBar() {
    document.addEventListener("DOMContentLoaded", function () {
      var bar = document.getElementById("mobileBar");
      var hero = document.getElementById("home");
      var book = document.getElementById("book");
      if (!bar || !hero) return;
      onScroll(function () {
        var show = hero.getBoundingClientRect().bottom < 120;
        if (book) {
          var bRect = book.getBoundingClientRect();
          // Hide the mobile bar when the booking section enters the viewport
          if (bRect.top < (window.innerHeight || document.documentElement.clientHeight) && bRect.bottom > 0) {
            show = false;
          }
        }
        bar.classList.toggle("show", show);
      });
    });
  })();
})();

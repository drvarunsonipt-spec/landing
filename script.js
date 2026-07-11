/* =========================================================================
   Dr. Varun Soni (PT) — Online Physiotherapy · V2
   Scroll-driven motion engine (rAF-based — reliable where IO isn't),
   spine section nav, tilt/parallax/magnetic details, stories carousel,
   tabs, FAQ, and appointment/enquiry → WhatsApp handoff.
   ========================================================================= */
(function () {
  "use strict";

  var WA = "919680049176";
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
    initStories();
    initFaq();
    initTabs();
    initSlots();
    initApptForm();
    initEnqForm();

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
      try { localStorage.setItem("theme", theme); } catch (e) {}
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
      ["#070E22", "#0A1430", "#05091A"],   // top — deep ink
      ["#081426", "#0D2B4A", "#0A1838"],   // services — sapphire swell
      ["#071A24", "#0D3440", "#0A2036"],   // mid — teal depths
      ["#0B102E", "#1B2152", "#0A0F26"],   // stories/faq — violet indigo
      ["#04081C", "#0A1634", "#03060F"]    // book/footer — deepest
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
    if (reduced || !finePointer) p = 0.4;
    var seg = p * (stops.length - 1);
    var i = Math.min(stops.length - 2, Math.floor(seg));
    var t = seg - i;
    var A = stops[i], B = stops[i + 1];
    var g1 = hexLerp(A[0], B[0], t), g2 = hexLerp(A[1], B[1], t), g3 = hexLerp(A[2], B[2], t);
    var ang = (150 + p * 60).toFixed(1) + "deg";
    if (g1 !== _g.g1) { doc.style.setProperty("--g1", g1); _g.g1 = g1; }
    if (g2 !== _g.g2) { doc.style.setProperty("--g2", g2); _g.g2 = g2; }
    if (g3 !== _g.g3) { doc.style.setProperty("--g3", g3); _g.g3 = g3; }
    if (ang !== _g.ang) { doc.style.setProperty("--g-angle", ang); _g.ang = ang; }
  }
  function initGradient() {
    if (finePointer && !reduced) { onScroll(gradientNow); }  // scroll-interpolated on desktop
    else { gradientNow(); }                                   // set once, static, on touch — no per-scroll repaint
  }

  /* ---------- header: glass + hide on scroll down ---------- */
  function initHeader() {
    var header = document.getElementById("siteHeader");
    if (!header) return;
    var lastY = window.scrollY;
    onScroll(function () {
      var y = window.scrollY;
      header.classList.toggle("scrolled", y > 30);
      if (!document.documentElement.classList.contains("menu-open")) {
        if (y > 160 && y > lastY + 4) header.classList.add("hidden");
        else if (y < lastY - 4 || y <= 160) header.classList.remove("hidden");
      }
      lastY = y;
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

  /* ---------- parallax (images inside clipped cards + aurora) ---------- */
  function initParallax() {
    if (reduced || !finePointer) return;   // off on touch/coarse pointers (perf)
    var els = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
    if (!els.length) return;
    onScroll(function () {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh + 80) return;
        var speed = parseFloat(el.getAttribute("data-parallax")) || 0.1;
        var delta = (r.top + r.height / 2) - vh / 2;
        var isImg = el.tagName === "IMG";
        // never shift past the headroom the 1.14 pre-scale provides
        var limit = isImg ? Math.max(0, (r.height * 0.14) / 2 - 2) : 70;
        var y = Math.max(-limit, Math.min(limit, -delta * speed));
        el.style.transform = "translate3d(0," + y.toFixed(1) + "px,0)" + (isImg ? " scale(1.14)" : "");
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

  /* ---------- stories carousel ---------- */
  function initStories() {
    var track = document.getElementById("storiesTrack");
    var prev = document.getElementById("stPrev");
    var next = document.getElementById("stNext");
    var dotsWrap = document.getElementById("stDots");
    if (!track) return;
    var cards = Array.prototype.slice.call(track.children);
    var timer = null;

    function overflow() { return track.scrollWidth > track.clientWidth + 8; }
    function positions() {
      // distinct snap lefts
      var seen = [], out = [];
      cards.forEach(function (c) {
        var l = Math.min(c.offsetLeft, track.scrollWidth - track.clientWidth);
        l = Math.max(0, l);
        if (seen.indexOf(l) === -1) { seen.push(l); out.push(l); }
      });
      return out;
    }
    function current() {
      var pos = positions(), x = track.scrollLeft, best = 0, bd = 1e9;
      pos.forEach(function (p, i) { var d = Math.abs(p - x); if (d < bd) { bd = d; best = i; } });
      return best;
    }
    function renderDots() {
      dotsWrap.innerHTML = "";
      if (!overflow()) { updateCtl(); return; }
      positions().forEach(function (p, i) {
        var d = document.createElement("button");
        d.className = "dot" + (i === current() ? " active" : "");
        d.type = "button";
        d.setAttribute("aria-label", "Go to story " + (i + 1));
        d.addEventListener("click", function () { go(i); });
        dotsWrap.appendChild(d);
      });
      updateCtl();
    }
    function go(i) {
      var pos = positions();
      if (!pos.length) return;
      i = (i + pos.length) % pos.length;
      track.scrollTo({ left: pos[i], behavior: reduced ? "auto" : "smooth" });
    }
    function updateCtl() {
      var has = overflow();
      if (prev) prev.disabled = !has;
      if (next) next.disabled = !has;
    }
    function sync() {
      var idx = current();
      Array.prototype.forEach.call(dotsWrap.children, function (d, i) {
        d.classList.toggle("active", i === idx);
      });
    }

    if (prev) prev.addEventListener("click", function () { go(current() - 1); });
    if (next) next.addEventListener("click", function () { go(current() + 1); });
    track.addEventListener("scroll", function () { requestAnimationFrame(sync); }, { passive: true });
    window.addEventListener("resize", renderDots);

    // gentle auto-advance when scrollable; pauses on interaction
    function play() {
      if (reduced) return;
      stop();
      timer = setInterval(function () { if (overflow()) go(current() + 1); }, 5500);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    ["pointerenter", "focusin", "touchstart"].forEach(function (ev) { track.addEventListener(ev, stop, { passive: true }); });
    ["pointerleave", "focusout"].forEach(function (ev) { track.addEventListener(ev, play); });

    renderDots();
    play();
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

  /* ---------- tabs ---------- */
  function initTabs() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
    if (!tabs.length) return;
    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
      tab.focus({ preventScroll: true });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(t); });
      t.addEventListener("keydown", function (e) {
        var dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (dir) { e.preventDefault(); select(tabs[(i + dir + tabs.length) % tabs.length]); }
      });
    });
  }

  /* ---------- time slots ---------- */
  var STEP = 30;                              // 30-min granularity
  var DURATIONS = [30, 45, 60];               // session lengths (minutes)
  var DEFAULT_DURATION = 45;
  var PERIODS = [                             // 6:00 AM – 10:00 PM, grouped for orientation
    { label: "Morning",   start: 6 * 60,  end: 11 * 60 + 30 },   // 06:00 – 11:30
    { label: "Afternoon", start: 12 * 60, end: 16 * 60 + 30 },   // 12:00 – 16:30
    { label: "Evening",   start: 17 * 60, end: 22 * 60 }         // 17:00 – 22:00
  ];
  function fmtTime(mins) {                    // 900 -> "3:00 PM"
    var h = Math.floor(mins / 60), m = mins % 60;
    var ap = h < 12 ? "AM" : "PM", h12 = ((h + 11) % 12) + 1;
    return h12 + ":" + String(m).padStart(2, "0") + " " + ap;
  }
  function minutesList(a, b) { var out = []; for (var m = a; m <= b; m += STEP) out.push(m); return out; }
  function selectedDuration() {
    var d = document.querySelector('input[name="duration"]:checked');
    return d ? parseInt(d.value, 10) : DEFAULT_DURATION;
  }

  function initSlots() {
    var seg = document.getElementById("durationSeg");
    var grid = document.getElementById("slotGrid");
    var readout = document.getElementById("slotSelected");
    if (!grid) return;

    // --- Session-length segmented control ---
    if (seg) {
      DURATIONS.forEach(function (v) {
        var label = document.createElement("label");
        label.className = "seg-opt";
        var input = document.createElement("input");
        input.type = "radio"; input.name = "duration"; input.value = String(v);
        input.className = "visually-hidden";
        if (v === DEFAULT_DURATION) { input.checked = true; label.classList.add("checked"); }
        var span = document.createElement("span");
        span.textContent = v + " min";
        label.appendChild(input); label.appendChild(span);
        input.addEventListener("change", function () {
          seg.querySelectorAll(".seg-opt").forEach(function (o) { o.classList.remove("checked"); });
          label.classList.add("checked");
          reflect(); updatePreview();
        });
        seg.appendChild(label);
      });
    }

    // --- Scrollable time list: day-part sub-labels + 30-min chips ---
    PERIODS.forEach(function (p) {
      var head = document.createElement("div");
      head.className = "slot-daylabel";
      head.textContent = p.label;
      grid.appendChild(head);

      var row = document.createElement("div");
      row.className = "slot-row";
      minutesList(p.start, p.end).forEach(function (mins) {
        var label = document.createElement("label");
        label.className = "slot";
        var input = document.createElement("input");
        input.type = "radio"; input.name = "time"; input.value = String(mins);
        input.className = "visually-hidden";
        var span = document.createElement("span");
        span.textContent = fmtTime(mins);
        label.appendChild(input); label.appendChild(span);
        input.addEventListener("change", function () {
          grid.querySelectorAll(".slot.checked").forEach(function (s) { s.classList.remove("checked"); });
          label.classList.add("checked");
          reflect(); updatePreview();
        });
        row.appendChild(label);
      });
      grid.appendChild(row);
    });

    function reflect() {
      if (!readout) return;
      var t = grid.querySelector('input[name="time"]:checked');
      if (!t) { readout.textContent = ""; return; }
      var s = parseInt(t.value, 10), dur = selectedDuration();
      readout.textContent = "Selected: " + fmtTime(s) + " – " + fmtTime(s + dur) + " (" + dur + " min)";
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
  function apptMessage() {
    var form = document.getElementById("apptForm");
    if (!form) return "";
    var name = (form.elements["name"].value || "").trim();
    var date = form.elements["date"].value;
    var timeEl = form.querySelector('input[name="time"]:checked');
    var issue = (form.elements["issue"].value || "").trim();
    var timeStr = "—";
    if (timeEl) {
      var s = parseInt(timeEl.value, 10), dur = selectedDuration();
      timeStr = fmtTime(s) + " – " + fmtTime(s + dur) + " (" + dur + " min)";
    }
    var lines = ["Hi Dr. Varun, I'd like to book an appointment. 🗓"];
    lines.push("");
    lines.push("Name: " + (name || "—"));
    lines.push("Date: " + (date ? fmtDate(date) : "—"));
    lines.push("Time: " + timeStr);
    lines.push("Issue: " + (issue || "—"));
    return lines.join("\n");
  }
  function updatePreview() {
    var bubble = document.getElementById("waPreview");
    if (bubble) bubble.textContent = apptMessage();
  }

  function openWhatsApp(text) {
    var url = "https://wa.me/" + WA + "?text=" + encodeURIComponent(text);
    var win = window.open(url, "_blank");
    if (win) { win.opener = null; } else { window.location.href = url; }
  }

  function clearInvalid(el) {
    if (el) { el.removeAttribute("aria-invalid"); el.removeAttribute("aria-describedby"); }
  }
  function markInvalid(el, statusId) {
    if (el) {
      el.setAttribute("aria-invalid", "true");
      el.setAttribute("aria-describedby", statusId);
      el.focus();
    }
  }

  function initApptForm() {
    var form = document.getElementById("apptForm");
    if (!form) return;
    var status = document.getElementById("apptStatus");
    var submit = document.getElementById("apptSubmit");
    var dateInput = form.elements["date"];

    // no past dates
    var today = new Date();
    var iso = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
    if (dateInput) dateInput.min = iso;

    ["input", "change"].forEach(function (ev) { form.addEventListener(ev, updatePreview); });
    updatePreview();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.dataset.state = "";
      status.textContent = "";
      var nameEl = form.elements["name"], issueEl = form.elements["issue"];
      [nameEl, dateInput, issueEl].forEach(clearInvalid);

      var name = (nameEl.value || "").trim();
      var date = dateInput.value;
      var timeEl = form.querySelector('input[name="time"]:checked');
      var durEl = form.querySelector('input[name="duration"]:checked');
      var issue = (issueEl.value || "").trim();

      if (!name) { fail("Please enter your name.", nameEl); return; }
      if (!date) { fail("Please pick a preferred date.", dateInput); return; }
      if (date < iso) { fail("Please pick today or a future date.", dateInput); return; }
      if (!durEl) { fail("Please choose a session length."); var d0 = form.querySelector('input[name="duration"]'); if (d0) d0.focus(); return; }
      if (!timeEl) { fail("Please choose a preferred time slot."); var f = form.querySelector('input[name="time"]'); if (f) f.focus(); return; }
      if (!issue) { fail("Please describe the issue briefly.", issueEl); return; }

      var original = submit.innerHTML;
      submit.disabled = true;
      submit.innerHTML = '<span class="spinner" aria-hidden="true"></span> Opening WhatsApp…';
      setTimeout(function () {
        submit.disabled = false;
        submit.innerHTML = original;
        status.dataset.state = "ok";
        status.textContent = "Opening WhatsApp — press send to confirm. ✓";
        openWhatsApp(apptMessage());
      }, reduced ? 0 : 600);

      function fail(msg, el) {
        status.dataset.state = "error";
        status.textContent = msg;
        if (el) markInvalid(el, "apptStatus");
      }
    });
  }

  /* ---------- enquiry form ---------- */
  function initEnqForm() {
    var form = document.getElementById("enqForm");
    if (!form) return;
    var status = document.getElementById("enqStatus");
    var submit = document.getElementById("enqSubmit");
    var phone = form.elements["phone"];

    if (phone) {
      phone.addEventListener("input", function () {
        var digits = phone.value.replace(/\D/g, "").slice(0, 10);
        if (phone.value !== digits) phone.value = digits;
        if (/^[6-9]\d{9}$/.test(digits)) clearInvalid(phone);
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.dataset.state = "";
      status.textContent = "";
      var nameEl = form.elements["name"], concernEl = form.elements["concern"], msgEl = form.elements["message"];
      [nameEl, phone, concernEl].forEach(clearInvalid);

      var name = (nameEl.value || "").trim();
      var ph = (phone.value || "").replace(/\D/g, "");
      var concern = concernEl.value;
      var message = (msgEl.value || "").trim();

      if (!name) { fail("Please enter your name.", nameEl); return; }
      if (!/^[6-9]\d{9}$/.test(ph)) { fail("Please enter a valid 10-digit WhatsApp number.", phone); return; }
      if (!concern) { fail("Please choose your primary concern.", concernEl); return; }

      var lines = ["New enquiry from the website", "", "Name: " + name, "WhatsApp: " + ph, "Concern: " + concern];
      if (message) lines.push("Message: " + message);

      var original = submit.innerHTML;
      submit.disabled = true;
      submit.innerHTML = '<span class="spinner" aria-hidden="true"></span> Sending…';
      setTimeout(function () {
        submit.disabled = false;
        submit.innerHTML = original;
        status.dataset.state = "ok";
        status.textContent = "Opening WhatsApp — we'll reply shortly. ✓";
        openWhatsApp(lines.join("\n"));
        form.reset();
      }, reduced ? 0 : 600);

      function fail(msg, el) {
        status.dataset.state = "error";
        status.textContent = msg;
        if (el) markInvalid(el, "enqStatus");
      }
    });
  }

  /* ---------- mobile bar ---------- */
  (function initMobileBar() {
    document.addEventListener("DOMContentLoaded", function () {
      var bar = document.getElementById("mobileBar");
      var hero = document.getElementById("home");
      if (!bar || !hero) return;
      onScroll(function () {
        bar.classList.toggle("show", hero.getBoundingClientRect().bottom < 120);
      });
    });
  })();
})();

/* =========================================================================
   Dr. Varun Soni (PT) — Online Physiotherapy
   Interactions: sticky header, reveal-on-scroll, FAQ accordion,
   how-it-works timeline, mobile CTA bar, form validation + WhatsApp fallback.
   ========================================================================= */
(function () {
  "use strict";

  var WA_NUMBER = "919680049176";
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Shared, rAF-throttled scroll/resize dispatcher. Deliberately NOT built on
  // IntersectionObserver: IO callbacks don't fire in some contexts (background
  // tab loads, certain headless/embedded renderers), which would leave
  // opacity:0 reveal content permanently invisible. getBoundingClientRect on
  // scroll is universally reliable.
  var scrollFns = [];
  function registerScroll(fn) { scrollFns.push(fn); fn(); } // run once immediately
  function runScrollFns() { for (var i = 0; i < scrollFns.length; i++) scrollFns[i](); }

  document.addEventListener("DOMContentLoaded", function () {
    setYear();
    initHeaderScroll();
    initReveal();
    initFaq();
    initSteps();
    initMobileBar();
    initForm();

    var ticking = false;
    function tick() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { runScrollFns(); ticking = false; });
    }
    window.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("resize", tick, { passive: true });
    window.addEventListener("load", runScrollFns);

    // Absolute failsafe: never leave reveal content hidden, whatever happens.
    setTimeout(function () {
      var els = document.querySelectorAll(".reveal");
      for (var i = 0; i < els.length; i++) els[i].classList.add("in");
    }, 3000);
  });

  /* ----- Footer year ----------------------------------------------------- */
  function setYear() {
    var y = document.getElementById("year");
    if (y) y.textContent = String(new Date().getFullYear());
  }

  /* ----- Sticky header shrink ------------------------------------------- */
  function initHeaderScroll() {
    var header = document.getElementById("siteHeader");
    if (!header) return;
    registerScroll(function () {
      header.classList.toggle("scrolled", window.scrollY > 24);
    });
  }

  /* ----- Reveal on scroll ------------------------------------------------ */
  function initReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    if (!items.length) return;

    if (prefersReduced) {
      items.forEach(function (el) { el.classList.add("in"); });
      return;
    }

    registerScroll(function () {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      items.forEach(function (el) {
        if (el.classList.contains("in")) return;
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.88 && r.bottom > 0) {
          // Stagger siblings within the same grid for a gentle cascade.
          var sibs = el.parentElement ? el.parentElement.querySelectorAll(":scope > .reveal") : [el];
          var idx = Array.prototype.indexOf.call(sibs, el);
          setTimeout(function () { el.classList.add("in"); }, Math.min(idx, 5) * 80);
        }
      });
    });
  }

  /* ----- FAQ accordion --------------------------------------------------- */
  function initFaq() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".faq-item"));
    if (!items.length) return;

    // data-open drives the CSS state (aria-expanded belongs only on the button).
    function setOpen(item, open) {
      item.setAttribute("data-open", open ? "true" : "false");
      var btn = item.querySelector(".faq-item__q");
      var panel = item.querySelector(".faq-item__a");
      if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
      if (panel) panel.style.maxHeight = open ? panel.scrollHeight + "px" : "0px";
    }

    function recomputeOpen() {
      items.forEach(function (item) {
        if (item.getAttribute("data-open") === "true") {
          var panel = item.querySelector(".faq-item__a");
          if (panel) panel.style.maxHeight = panel.scrollHeight + "px";
        }
      });
    }

    items.forEach(function (item) {
      var btn = item.querySelector(".faq-item__q");
      // Initialise from markup state (the button carries the source of truth).
      setOpen(item, btn && btn.getAttribute("aria-expanded") === "true");
      if (!btn) return;
      btn.addEventListener("click", function () {
        var isOpen = item.getAttribute("data-open") === "true";
        // Close others (single-open accordion).
        items.forEach(function (other) { if (other !== item) setOpen(other, false); });
        setOpen(item, !isOpen);
      });
    });

    // The default-open panel is measured before webfonts swap in; re-measure
    // once fonts are ready (and on resize) so no answer text gets clipped.
    window.addEventListener("resize", recomputeOpen);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(recomputeOpen);
    window.addEventListener("load", recomputeOpen);
  }

  /* ----- How-it-works timeline ------------------------------------------ */
  function initSteps() {
    var section = document.getElementById("how");
    if (!section) return;
    var steps = Array.prototype.slice.call(section.querySelectorAll("[data-step]"));
    var wave = section.querySelector(".steps__wave");
    var path = wave ? wave.querySelector("path") : null;

    if (path) {
      try {
        var len = path.getTotalLength();
        path.style.setProperty("--len", len);
      } catch (e) { /* getTotalLength unsupported — CSS fallback handles it */ }
    }

    if (prefersReduced) {
      steps.forEach(function (s) { s.classList.add("lit"); });
      if (wave) wave.classList.add("drawn");
      return;
    }

    var triggered = false;
    registerScroll(function () {
      if (triggered) return;
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var r = section.getBoundingClientRect();
      if (r.top < vh * 0.65 && r.bottom > 0) {
        triggered = true;
        if (wave) wave.classList.add("drawn");
        steps.forEach(function (s, i) {
          setTimeout(function () { s.classList.add("lit"); }, 250 + i * 320);
        });
      }
    });
  }

  /* ----- Mobile sticky bar ---------------------------------------------- */
  function initMobileBar() {
    var bar = document.getElementById("mobileBar");
    var hero = document.querySelector(".hero");
    if (!bar || !hero) return;
    registerScroll(function () {
      // Show the bar once the hero has mostly scrolled out of view.
      bar.classList.toggle("show", hero.getBoundingClientRect().bottom < 90);
    });
  }

  /* ----- Enquiry form ---------------------------------------------------- */
  function initForm() {
    var form = document.getElementById("enquiryForm");
    if (!form) return;

    var phoneField = document.getElementById("phoneField");
    // Look controls up via form.elements — `form.name` resolves to the form's
    // own `name` IDL property (a string), NOT the <input name="name">.
    var nameInput = form.elements["name"];
    var phoneInput = form.elements["phone"];
    var concernInput = form.elements["concern"];
    var messageInput = form.elements["message"];
    var status = document.getElementById("formStatus");
    var submitBtn = document.getElementById("submitBtn");

    function clearInvalid(el) {
      if (el) { el.removeAttribute("aria-invalid"); el.removeAttribute("aria-describedby"); }
    }

    // Keep only digits; flag validity once a 10-digit Indian mobile is entered.
    if (phoneInput) {
      phoneInput.addEventListener("input", function () {
        var digits = phoneInput.value.replace(/\D/g, "").slice(0, 10);
        if (phoneInput.value !== digits) phoneInput.value = digits;
        var valid = /^[6-9]\d{9}$/.test(digits);
        if (phoneField) phoneField.classList.toggle("is-valid", valid);
        if (valid) clearInvalid(phoneInput);
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.dataset.state = "";
      status.textContent = "";
      [nameInput, phoneInput, concernInput].forEach(clearInvalid);

      var name = (nameInput.value || "").trim();
      var phone = (phoneInput.value || "").replace(/\D/g, "");
      var concern = concernInput.value;
      var message = (messageInput.value || "").trim();

      if (!name) { return fail("Please enter your name.", nameInput); }
      if (!/^[6-9]\d{9}$/.test(phone)) { return fail("Please enter a valid 10-digit WhatsApp number.", phoneInput); }
      if (!concern) { return fail("Please choose your primary concern.", concernInput); }

      // Show a brief in-place "sending" state, then hand off to WhatsApp so the
      // enquiry reaches Dr. Varun instantly (no backend required to deploy).
      var original = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Sending…';

      var lines = [
        "New enquiry from the website",
        "",
        "Name: " + name,
        "WhatsApp: " + phone,
        "Concern: " + concern
      ];
      if (message) lines.push("Message: " + message);
      var url = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(lines.join("\n"));

      window.setTimeout(function () {
        submitBtn.disabled = false;
        submitBtn.innerHTML = original;
        status.dataset.state = "ok";
        status.textContent = "Opening WhatsApp — we'll reply shortly. ✓";
        // window.open returns null when a popup is blocked; open normally and
        // sever the opener manually, falling back to same-tab navigation.
        var win = window.open(url, "_blank");
        if (win) { win.opener = null; } else { window.location.href = url; }
        form.reset();
        if (phoneField) phoneField.classList.remove("is-valid");
      }, prefersReduced ? 0 : 650);
    });

    function fail(msg, el) {
      status.dataset.state = "error";
      status.textContent = msg;
      if (el) {
        el.setAttribute("aria-invalid", "true");
        el.setAttribute("aria-describedby", "formStatus");
        el.focus();
      }
    }
  }
})();

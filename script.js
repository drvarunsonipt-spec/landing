/* =========================================================================
   Dr. Varun Soni (PT) — Online Physiotherapy
   Interactions: sticky header, reveal-on-scroll, FAQ accordion,
   how-it-works timeline, mobile CTA bar, form validation + WhatsApp fallback.
   ========================================================================= */
(function () {
  "use strict";

  var WA_NUMBER = "919680049176";
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.addEventListener("DOMContentLoaded", function () {
    setYear();
    initHeaderScroll();
    initReveal();
    initFaq();
    initSteps();
    initMobileBar();
    initForm();
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
    var onScroll = function () {
      header.classList.toggle("scrolled", window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ----- Reveal on scroll ------------------------------------------------ */
  function initReveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    if (!items.length) return;

    if (prefersReduced || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        // Stagger siblings within the same grid for a gentle cascade.
        var siblings = el.parentElement ? el.parentElement.querySelectorAll(":scope > .reveal") : [el];
        var idx = Array.prototype.indexOf.call(siblings, el);
        var delay = Math.min(idx, 5) * 80;
        setTimeout(function () { el.classList.add("in"); }, delay);
        io.unobserve(el);
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ----- FAQ accordion --------------------------------------------------- */
  function initFaq() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".faq-item"));
    if (!items.length) return;

    function setOpen(item, open) {
      item.setAttribute("aria-expanded", open ? "true" : "false");
      var btn = item.querySelector(".faq-item__q");
      var panel = item.querySelector(".faq-item__a");
      if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
      if (panel) panel.style.maxHeight = open ? panel.scrollHeight + "px" : "0px";
    }

    items.forEach(function (item) {
      var btn = item.querySelector(".faq-item__q");
      // Initialise from markup state.
      setOpen(item, item.getAttribute("aria-expanded") === "true");
      if (!btn) return;
      btn.addEventListener("click", function () {
        var isOpen = item.getAttribute("aria-expanded") === "true";
        // Close others (single-open accordion).
        items.forEach(function (other) { if (other !== item) setOpen(other, false); });
        setOpen(item, !isOpen);
      });
    });

    // Recompute open panel height on resize (text reflow).
    window.addEventListener("resize", function () {
      items.forEach(function (item) {
        if (item.getAttribute("aria-expanded") === "true") {
          var panel = item.querySelector(".faq-item__a");
          if (panel) panel.style.maxHeight = panel.scrollHeight + "px";
        }
      });
    });
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

    if (prefersReduced || !("IntersectionObserver" in window)) {
      steps.forEach(function (s) { s.classList.add("lit"); });
      if (wave) wave.classList.add("drawn");
      return;
    }

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        if (wave) wave.classList.add("drawn");
        steps.forEach(function (s, i) {
          setTimeout(function () { s.classList.add("lit"); }, 250 + i * 320);
        });
        obs.disconnect();
      });
    }, { threshold: 0.35 });

    io.observe(section);
  }

  /* ----- Mobile sticky bar ---------------------------------------------- */
  function initMobileBar() {
    var bar = document.getElementById("mobileBar");
    var hero = document.querySelector(".hero");
    if (!bar || !hero) return;

    if (!("IntersectionObserver" in window)) { bar.classList.add("show"); return; }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        // Show the bar once the hero has scrolled mostly out of view.
        bar.classList.toggle("show", !entry.isIntersecting);
      });
    }, { threshold: 0, rootMargin: "-70% 0px 0px 0px" });

    io.observe(hero);
  }

  /* ----- Enquiry form ---------------------------------------------------- */
  function initForm() {
    var form = document.getElementById("enquiryForm");
    if (!form) return;

    var phoneField = document.getElementById("phoneField");
    var phoneInput = document.getElementById("f-phone");
    var status = document.getElementById("formStatus");
    var submitBtn = document.getElementById("submitBtn");

    // Keep only digits; flag validity once a 10-digit Indian mobile is entered.
    if (phoneInput) {
      phoneInput.addEventListener("input", function () {
        var digits = phoneInput.value.replace(/\D/g, "").slice(0, 10);
        if (phoneInput.value !== digits) phoneInput.value = digits;
        var valid = /^[6-9]\d{9}$/.test(digits);
        if (phoneField) phoneField.classList.toggle("is-valid", valid);
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.dataset.state = "";
      status.textContent = "";

      var name = form.name.value.trim();
      var phone = (form.phone.value || "").replace(/\D/g, "");
      var concern = form.concern.value;
      var message = form.message.value.trim();

      if (!name) { fail("Please enter your name."); form.name.focus(); return; }
      if (!/^[6-9]\d{9}$/.test(phone)) { fail("Please enter a valid 10-digit WhatsApp number."); if (phoneInput) phoneInput.focus(); return; }
      if (!concern) { fail("Please choose your primary concern."); form.concern.focus(); return; }

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
        var win = window.open(url, "_blank", "noopener");
        // Popup blocked? Navigate the current tab as a fallback.
        if (!win) window.location.href = url;
        form.reset();
        if (phoneField) phoneField.classList.remove("is-valid");
      }, prefersReduced ? 0 : 650);
    });

    function fail(msg) {
      status.dataset.state = "error";
      status.textContent = msg;
    }
  }
})();

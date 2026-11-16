// The letter's few scripts. Everything here is an enhancement: with scripts
// off the cards still unfold (plain <details>, frames at a fixed height), the
// tabs are plain links, and the signature is simply there.
(function () {
  "use strict";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Margin notes: fit each card's frame to its content, and keep it fitted
  // while the card's own tabs and folds change its height.
  function fit(frame) {
    var doc;
    try { doc = frame.contentDocument; } catch (e) { return; }
    // a lazy frame not yet loaded still holds its initial about:blank
    if (!doc || !doc.body || doc.URL === "about:blank") return;
    var size = function () {
      var h = Math.ceil(doc.documentElement.getBoundingClientRect().height);
      if (h > 0) frame.style.height = h + "px";
    };
    doc.documentElement.style.overflow = "hidden";
    doc.documentElement.style.height = "auto";
    size();
    if (frame._fitted === doc) return;
    frame._fitted = doc;
    var win = frame.contentWindow;
    // the frame narrows or widens with the letter: refit on its own resize too
    if (win) win.addEventListener("resize", size);
    if (win && win.ResizeObserver) new win.ResizeObserver(size).observe(doc.body);
  }

  Array.prototype.forEach.call(document.querySelectorAll(".note"), function (note) {
    var frame = note.querySelector("iframe");
    if (!frame) return;
    frame.addEventListener("load", function () { fit(frame); });
    note.addEventListener("toggle", function () {
      if (note.open && frame.contentDocument && frame.contentDocument.readyState === "complete") fit(frame);
    });
  });

  // ---- The signature writes itself in once, when it comes into view.
  var sig = document.querySelector(".signature");
  if (sig && !reduce && "IntersectionObserver" in window) {
    sig.classList.add("is-waiting");
    var seen = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      seen.disconnect();
      sig.classList.remove("is-waiting");
      sig.classList.add("is-writing");
    }, { threshold: 0.6 });
    seen.observe(sig);
  }

  // ---- Index tabs: the tab and the page's hairlines wear the stone of the
  // enclosure in view, and the gold gem marks that tab. A click marks the
  // clicked tab at once and holds it while the page scrolls there. Colours and
  // transforms only, so nothing shifts.
  var nav = document.querySelector(".index-tabs");
  if (!nav || !("IntersectionObserver" in window)) return;
  var links = Array.prototype.slice.call(nav.querySelectorAll("a[href^='#']"));
  var items = links.map(function (a) { return a.parentNode; });
  var sections = [];
  var bySection = new Map();

  function collect() {
    links.forEach(function (a, i) {
      var s = document.getElementById(a.getAttribute("href").slice(1));
      if (s && !bySection.has(s)) { bySection.set(s, i); sections.push(s); }
    });
  }

  var current = -1;
  function show(i) {
    if (i === current) return;
    current = i;
    links.forEach(function (a, k) {
      if (k === i) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
    items.forEach(function (li, k) { li.classList.toggle("is-current", k === i); });
    var stone = i >= 0 ? items[i].getAttribute("data-stone") : null;
    if (stone) document.body.setAttribute("data-stone", stone);
    else document.body.removeAttribute("data-stone");
    // on the phone strip, bring the worn tab into view sideways only
    var ol = nav.querySelector("ol");
    if (i >= 0 && ol.scrollWidth > ol.clientWidth) {
      var a = links[i];
      var left = a.offsetLeft - ol.offsetLeft;
      if (left < ol.scrollLeft || left + a.offsetWidth > ol.scrollLeft + ol.clientWidth) {
        ol.scrollTo({ left: Math.max(0, left - 16), behavior: reduce ? "auto" : "smooth" });
      }
    }
  }

  // the enclosure that crosses a reading line 35% down the viewport is in view
  var inView = new Set();
  var heldUntil = 0;
  function atBottom() {
    return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  }
  function settle() {
    if (Date.now() < heldUntil) return;
    var best = -1;
    inView.forEach(function (s) { best = Math.max(best, bySection.get(s)); });
    // above the first enclosure, the masthead belongs to the letter's tab
    if (best < 0) best = 0;
    // the last enclosures can be too short to reach the reading line
    if (atBottom() && current > best) return;
    show(best);
  }
  links.forEach(function (a, i) {
    a.addEventListener("click", function () {
      show(i);
      heldUntil = Date.now() + (reduce ? 150 : 1200);
    });
  });
  // after a scroll that reached the bottom, the last tab wears the gem
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      if (Date.now() >= heldUntil && atBottom()) show(links.length - 1);
    });
  }, { passive: true });
  var watch = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) inView.add(e.target); else inView.delete(e.target);
    });
    settle();
  }, { rootMargin: "-35% 0px -64% 0px" });

  function start() {
    collect();
    sections.forEach(function (s) { watch.observe(s); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

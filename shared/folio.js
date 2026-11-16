// The shared shell's script: the sun and moon switch, and placeholders for
// drawings that are not there yet. The folio itself is set before the first
// paint by the inline script in each page's <head>; this file only keeps it.
(function () {
  "use strict";

  var KEY = "folio.theme"; // "night" | "day"; absent = follow the OS
  var root = document.documentElement;
  var dark = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function stored() {
    try {
      var t = localStorage.getItem(KEY);
      return t === "night" || t === "day" ? t : null;
    } catch (e) {
      return null;
    }
  }

  function store(t) {
    try { localStorage.setItem(KEY, t); } catch (e) { /* private window: the choice lasts this page only */ }
  }

  function forced() {
    var m = /[?&]theme=(night|day)(?:&|$)/.exec(location.search);
    return m ? m[1] : null;
  }

  function current() {
    return root.dataset.theme === "night" ? "night" : "day";
  }

  function apply(t) {
    root.dataset.theme = t;
    var sw = document.querySelector(".theme-switch");
    if (sw) {
      var other = t === "night" ? "day" : "night";
      var label = other === "day" ? "Switch to day" : "Switch to night";
      sw.setAttribute("aria-label", label);
      sw.title = label;
    }
  }

  // A change after load cross-fades the page and turns the new sun or moon
  // in, as Prelude's switch does. Reduced motion, or a browser without view
  // transitions, flips at once.
  function moves() {
    return !window.matchMedia || window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
  }

  function turn(t) {
    var g = document.querySelector(".theme-switch .drawn--" + (t === "night" ? "moon" : "sun"));
    if (!g || !moves()) return;
    g.classList.remove("motion-turn");
    void g.offsetWidth; // restart the animation on a quick second click
    g.classList.add("motion-turn");
  }

  function change(t) {
    if (t === current()) return;
    var flip = function () { apply(t); };
    if (moves() && document.startViewTransition) document.startViewTransition(flip);
    else flip();
    turn(t);
  }

  // The switch: hidden in the markup, so with scripts off the OS alone decides.
  var sw = document.querySelector(".theme-switch");
  if (sw) {
    sw.hidden = false;
    sw.addEventListener("click", function () {
      var next = current() === "night" ? "day" : "night";
      store(next);
      change(next);
    });
  }
  apply(current());

  // Follow the OS while the reader has not chosen.
  if (dark) {
    var follow = function (e) {
      if (!stored() && !forced()) change(e.matches ? "night" : "day");
    };
    if (dark.addEventListener) dark.addEventListener("change", follow);
    else if (dark.addListener) dark.addListener(follow);
  }

  // Drawings: a missing file hides its <img>; the .drawn box shows a plain
  // shape while every image in it that the current folio would show is gone.
  function settle(box) {
    var imgs = box.querySelectorAll("img");
    var night = current() === "night";
    var shown = 0;
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i];
      var forThis = img.classList.contains("for-night") ? night
        : img.classList.contains("for-day") ? !night : true;
      if (forThis && !img.classList.contains("is-missing")) shown++;
    }
    box.classList.toggle("is-placeholder", shown === 0);
  }

  var boxes = document.querySelectorAll(".drawn");
  Array.prototype.forEach.call(boxes, function (box) {
    Array.prototype.forEach.call(box.querySelectorAll("img"), function (img) {
      var miss = function () { img.classList.add("is-missing"); settle(box); };
      img.addEventListener("error", miss);
      // already failed before this ran (naturalWidth alone misreads a viewBox-only SVG)
      if (img.complete && img.decode) img.decode().catch(miss);
    });
    settle(box);
  });

  new MutationObserver(function () {
    Array.prototype.forEach.call(boxes, settle);
  }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
})();

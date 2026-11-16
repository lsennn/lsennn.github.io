// The enclosures' script. Everything here is an addition: with scripts off
// the radios, the specimen tabs and the links all work, and the count shows
// the default total.
(function () {
  "use strict";
  if (window.__demEnclosures) return; // the partial may be linked twice
  window.__demEnclosures = true;

  var fmt = function (n) { return n.toLocaleString("en-US"); };

  // ---------- Counted: the live token count ----------
  // A row (label with data-tokens) is on when its input is checked and, for a
  // row with data-requires="<group>", that radio group is not on "off". The
  // total is the default total plus what changed. A row that changed and has
  // no figure yet leaves the default total showing.
  var form = document.getElementById("modules-form");
  var count = form && form.querySelector("[data-count]");
  if (form && count) {
    var rows = Array.prototype.slice.call(form.querySelectorAll("[data-tokens]"));
    var nEl = count.querySelector("[data-count-n]");
    var whatEl = count.querySelector("[data-count-what]");
    var base = parseInt(count.getAttribute("data-default-total"), 10);
    var whatDefault = whatEl.textContent;

    var figure = function (row) {
      var t = row.getAttribute("data-tokens");
      return t === "" || t == null || isNaN(+t) ? null : +t;
    };
    var groupOn = function (name, useDefault) {
      var radios = form.querySelectorAll('input[type="radio"][name="' + name + '"]');
      for (var i = 0; i < radios.length; i++) {
        var on = useDefault ? radios[i].defaultChecked : radios[i].checked;
        if (on) return radios[i].value !== "off";
      }
      return false;
    };
    var isOn = function (row, useDefault) {
      var input = row.querySelector("input");
      if (!input) return false;
      var on = useDefault ? input.defaultChecked : input.checked;
      var req = row.getAttribute("data-requires");
      return on && (!req || groupOn(req, useDefault));
    };

    rows.forEach(function (row) {
      var f = figure(row);
      var cost = row.querySelector(".opt__cost");
      if (cost && f) cost.textContent = fmt(f);
    });

    var update = function () {
      var total = base, changed = false, known = true;
      rows.forEach(function (row) {
        var now = isOn(row, false), was = isOn(row, true);
        if (now === was) return;
        changed = true;
        var f = figure(row);
        if (f === null) { known = false; return; }
        total += now ? f : -f;
      });
      var yours = changed && known;
      nEl.textContent = fmt(yours ? total : base);
      whatEl.textContent = yours ? "with your picks" : whatDefault;
      count.setAttribute("data-state", yours ? "yours" : "default");
    };

    form.addEventListener("change", update);
    form.addEventListener("reset", function () { setTimeout(update, 0); });
    update(); // a browser may restore earlier picks on reload
  }

  // ---------- Copy link ----------
  var status = document.querySelector("[data-copy-status]");
  Array.prototype.forEach.call(document.querySelectorAll("[data-copy-link]"), function (a) {
    var label = a.textContent;
    a.addEventListener("click", function (e) {
      if (!navigator.clipboard || !window.isSecureContext) return; // falls back to the plain link
      e.preventDefault();
      var url = location.href.split("#")[0] + a.getAttribute("href");
      navigator.clipboard.writeText(url).then(function () {
        a.textContent = "Link copied";
        a.setAttribute("data-copied", "");
        if (status) status.textContent = "Link copied: " + url;
        setTimeout(function () {
          a.textContent = label;
          a.removeAttribute("data-copied");
        }, 2200);
      }, function () {
        location.hash = a.getAttribute("href");
      });
    });
  });

  // ---------- One mark for "next" ----------
  // After a download, the gem moves from the Installing title to that host's steps.
  var gem = document.querySelector("[data-next-gem]");
  var installFor = { st: "install-st", tavo: "install-tavo", lumiverse: "install-lumiverse" };
  if (gem) {
    Array.prototype.forEach.call(document.querySelectorAll("[data-release-href]"), function (a) {
      var target = installFor[a.getAttribute("data-release-href")];
      if (!target) return;
      a.addEventListener("click", function () {
        var h = document.querySelector("#" + target + " > h3");
        if (!h || gem.parentNode === h) return;
        h.appendChild(gem);
        gem.classList.remove("is-moved");
        void gem.offsetWidth;
        gem.classList.add("is-moved");
      });
    });
  }
})();

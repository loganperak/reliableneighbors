// Opens a new Gmail message with the address (and optional subject/body) already filled in.
function gmailHref(to, subject, body) {
  var url = "https://mail.google.com/mail/?view=cm&fs=1&to=" + encodeURIComponent(to);
  if (subject) url += "&su=" + encodeURIComponent(subject);
  if (body) url += "&body=" + encodeURIComponent(body);
  return url;
}

document.addEventListener("DOMContentLoaded", function () {
  // ---- Email links -> Gmail compose ----
  // The HTML keeps plain mailto: links so email still works if scripts are blocked.
  var mailLinks = document.querySelectorAll('a[href^="mailto:"]');
  for (var ml = 0; ml < mailLinks.length; ml++) {
    var to = mailLinks[ml].getAttribute("href").replace(/^mailto:/, "").split("?")[0];
    mailLinks[ml].setAttribute("href", gmailHref(to));
    mailLinks[ml].setAttribute("target", "_blank");
    mailLinks[ml].setAttribute("rel", "noopener");
  }

  // ---- Mobile menu ----
  var btn = document.querySelector(".menu-btn");
  var nav = document.querySelector("nav.main");
  if (btn && nav) {
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.textContent = open ? "Close" : "Menu";
    });
  }

  // ---- Before/after slider (home page) ----
  // Without JavaScript only the first pair shows, so nothing ever looks broken.
  var slider = document.querySelector(".ba-slider");
  if (slider) {
    var slides = slider.querySelectorAll(".ba-slide");
    var controls = slider.querySelector(".ba-controls");
    var count = slider.querySelector(".ba-count");
    var current = 0;
    var show = function (i) {
      current = (i + slides.length) % slides.length;
      for (var s = 0; s < slides.length; s++) slides[s].hidden = s !== current;
      count.textContent = (current + 1) + " / " + slides.length;
    };
    if (slides.length > 1 && controls) {
      controls.hidden = false;
      slider.querySelector(".ba-prev").addEventListener("click", function () { show(current - 1); });
      slider.querySelector(".ba-next").addEventListener("click", function () { show(current + 1); });
      // Load the other photos once the page is up so arrows switch instantly.
      window.addEventListener("load", function () {
        var imgs = slider.querySelectorAll("img");
        for (var k = 0; k < imgs.length; k++) imgs[k].loading = "eager";
      });
      // Swipe on phones.
      var startX = null;
      slider.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
      slider.addEventListener("touchend", function (e) {
        if (startX === null) return;
        var dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 40) show(current + (dx < 0 ? 1 : -1));
        startX = null;
      });
    }
  }

  // ---- Our Work: project filters ----
  var filterBar = document.querySelector(".filters");
  if (filterBar) {
    var filterBtns = filterBar.querySelectorAll(".filter");
    var projects = document.querySelectorAll(".project");
    var empty = document.querySelector(".filter-empty");
    var applyFilter = function (cat) {
      var shown = 0;
      for (var b = 0; b < filterBtns.length; b++) {
        filterBtns[b].setAttribute("aria-pressed", filterBtns[b].getAttribute("data-filter") === cat ? "true" : "false");
      }
      for (var p = 0; p < projects.length; p++) {
        var on = cat === "all" || projects[p].getAttribute("data-cat") === cat;
        projects[p].hidden = !on;
        if (on) shown++;
      }
      if (empty) empty.hidden = shown > 0;
    };
    filterBar.hidden = false;
    filterBar.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter");
      if (btn) applyFilter(btn.getAttribute("data-filter"));
    });
    var reset = document.querySelector(".filter-reset");
    if (reset) reset.addEventListener("click", function () { applyFilter("all"); });
  }

  // ---- Our Work: full-size photo viewer ----
  // Arrows step through the photos of the project you opened. Esc or the X closes it.
  var lb = document.querySelector(".lightbox");
  if (lb && typeof lb.showModal === "function") {
    var lbImg = lb.querySelector(".lb-stage img");
    var lbTitle = lb.querySelector(".lb-title");
    var lbCount = lb.querySelector(".lb-count");
    var lbAlt = lb.querySelector(".lb-alt");
    var set = [];
    var at = 0;
    var render = function () {
      var src = set[at];
      lbImg.src = src.getAttribute("src");
      lbImg.alt = src.alt;
      lbCount.textContent = (at + 1) + " / " + set.length;
      var badge = src.parentNode.querySelector(".badge");
      lbAlt.textContent = (badge ? badge.textContent + " · " : "") + src.alt;
      var many = set.length > 1;
      lb.querySelector(".lb-prev").hidden = !many;
      lb.querySelector(".lb-next").hidden = !many;
    };
    var step = function (d) { at = (at + d + set.length) % set.length; render(); };
    document.addEventListener("click", function (e) {
      var z = e.target.closest(".zoom");
      if (!z) return;
      e.preventDefault();
      var project = z.closest(".project");
      set = Array.prototype.slice.call(project.querySelectorAll(".zoom img"));
      at = set.indexOf(z.querySelector("img"));
      lbTitle.textContent = project.querySelector("h2").textContent;
      render();
      lb.showModal();
    });
    lb.querySelector(".lb-prev").addEventListener("click", function () { step(-1); });
    lb.querySelector(".lb-next").addEventListener("click", function () { step(1); });
    lb.querySelector(".lb-close").addEventListener("click", function () { lb.close(); });
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lb-stage")) lb.close(); });
    lb.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });
    var touchX = null;
    lb.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40 && set.length > 1) step(dx < 0 ? 1 : -1);
      touchX = null;
    });
  }

  // ---- Quote form ----
  // Sends in the background so a hiccup never drops the customer on an error page.
  // If it fails, their answers stay in the form and they get a call/text/email fallback.
  // Without JavaScript the form still posts normally to FormSubmit, which redirects to thanks.html.
  var form = document.querySelector("form.quote");
  if (!form || !form.getAttribute("data-ajax") || !window.fetch || !window.FormData) return;

  var submit = form.querySelector('button[type="submit"]');
  var status = form.querySelector(".form-status");
  var label = submit.textContent;
  var sending = false;

  function val(name) {
    var el = form.elements[name];
    return el && el.value ? el.value.trim() : "";
  }

  function emailFallbackHref() {
    var body =
      "Name: " + val("name") + "\n" +
      "Phone: " + val("phone") + "\n" +
      "Email: " + val("email") + "\n" +
      "Town: " + val("town") + "\n" +
      "Service: " + val("service") + "\n\n" +
      val("details");
    return gmailHref("rnservices101@gmail.com", "Quote request - " + val("name"), body);
  }

  function showError() {
    status.innerHTML =
      "Sorry, that didn't go through. Your info is still filled in. " +
      'Try again, or reach us directly: call or text <a href="tel:+13123395365">(312) 339-5365</a>, ' +
      'or <a class="mail-fallback" href="#" target="_blank" rel="noopener">email this request</a>.';
    status.querySelector(".mail-fallback").setAttribute("href", emailFallbackHref());
    status.hidden = false;
    status.focus();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (sending) return;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    if (val("_honey")) return; // honeypot filled: quietly ignore

    sending = true;
    submit.disabled = true;
    submit.textContent = "Sending...";
    status.hidden = true;

    // FormSubmit's AJAX endpoint answers with JSON; only {"success":"true"} means it was emailed.
    fetch(form.getAttribute("data-ajax"), {
      method: "POST",
      headers: { "Accept": "application/json" },
      body: new FormData(form)
    })
      .then(function (res) { return res.json(); })
      .then(function (json) {
        if (!json || String(json.success) !== "true") throw new Error((json && json.message) || "Not sent");
        window.location.href = "thanks.html";
      })
      .catch(function () {
        sending = false;
        submit.disabled = false;
        submit.textContent = label;
        showError();
      });
  });
});

document.addEventListener("DOMContentLoaded", function () {
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
    return "mailto:rnservices01@gmail.com?subject=" + encodeURIComponent("Quote request - " + val("name")) +
      "&body=" + encodeURIComponent(body);
  }

  function showError() {
    status.innerHTML =
      "Sorry, that didn't go through. Your info is still filled in. " +
      'Try again, or reach us directly: call or text <a href="tel:+13123395365">(312) 339-5365</a>, ' +
      'or <a class="mail-fallback" href="#">email this request</a>.';
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

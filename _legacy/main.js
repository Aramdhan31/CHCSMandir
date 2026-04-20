(function () {
  var nav = document.getElementById("site-nav");
  var toggle = document.querySelector(".nav-toggle");
  var links = nav ? nav.querySelectorAll("a[href^='#']") : [];

  function setOpen(open) {
    if (!nav || !toggle) return;
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });
  }

  links.forEach(function (a) {
    a.addEventListener("click", function () {
      setOpen(false);
    });
  });

  var form = document.getElementById("contact-form");
  var note = document.getElementById("form-note");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var first = (fd.get("firstName") || "").toString().trim();
      var last = (fd.get("lastName") || "").toString().trim();
      var email = (fd.get("email") || "").toString().trim();
      var subject = (fd.get("subject") || "").toString().trim();
      var body = (fd.get("body") || "").toString().trim();
      if (!first || !last || !email || !subject || !body) {
        return;
      }
      var mailBody =
        body +
        "\n\n—\n" +
        first +
        " " +
        last +
        "\n" +
        email;
      var inbox =
        (window.CHCS_CONTENT &&
          window.CHCS_CONTENT.visit &&
          window.CHCS_CONTENT.visit.email) ||
        "om@chcstemple.org";
      var href =
        "mailto:" +
        inbox +
        "?subject=" +
        encodeURIComponent(subject) +
        "&body=" +
        encodeURIComponent(mailBody);
      window.location.href = href;
      if (note) {
        note.hidden = false;
      }
    });
  }
})();

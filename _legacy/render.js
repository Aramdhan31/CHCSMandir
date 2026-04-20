(function () {
  var C = window.CHCS_CONTENT;
  if (!C) return;

  function text(el, s) {
    if (el) el.textContent = s;
  }

  function appendChildren(parent, nodes) {
    nodes.forEach(function (n) {
      parent.appendChild(n);
    });
  }

  function p(str) {
    var el = document.createElement("p");
    el.textContent = str;
    return el;
  }

  function h3(str) {
    var el = document.createElement("h3");
    el.textContent = str;
    return el;
  }

  function h4(str) {
    var el = document.createElement("h4");
    el.className = "subheading";
    el.textContent = str;
    return el;
  }

  if (C.previewBanner) {
    var bar = document.createElement("div");
    bar.className = "preview-banner";
    bar.setAttribute("role", "status");
    bar.textContent = C.previewBanner;
    document.body.insertBefore(bar, document.body.firstChild);
  }

  if (C.site && C.site.nameShort) {
    var logo = document.querySelector(".logo");
    text(logo, C.site.nameShort);
  }

  document.title = C.site.nameFull + " | Hindu Temple London";

  var meta = document.querySelector('meta[name="description"]');
  if (meta && C.site.tagline) meta.setAttribute("content", C.site.tagline);

  if (C.hero) {
    text(document.getElementById("bind-hero-eyebrow"), C.hero.eyebrow);
    text(document.getElementById("bind-hero-title"), C.hero.title);
    text(document.getElementById("bind-hero-quote"), "“" + C.hero.quote + "”");
    text(document.getElementById("bind-hero-cite"), C.hero.quoteCitation);
    var cta = document.getElementById("bind-hero-cta");
    if (cta) {
      cta.textContent = C.hero.primaryCtaLabel;
      cta.setAttribute("href", C.hero.primaryCtaHref || "#events");
    }
  }

  var tag = document.getElementById("bind-hero-tagline");
  if (tag && C.site.tagline) text(tag, C.site.tagline);

  if (C.events) {
    text(document.getElementById("bind-events-title"), C.events.sectionTitle);
    text(document.getElementById("bind-events-intro"), C.events.intro);
    var list = document.getElementById("bind-event-cards");
    if (list) {
      list.innerHTML = "";
      (C.events.items || []).forEach(function (ev) {
        var li = document.createElement("li");
        li.className = "event-card";
        var a = document.createElement("a");
        a.className = "event-card-link";
        a.href = ev.href || "#";
        if (ev.href && ev.href.indexOf("http") === 0) {
          a.target = "_blank";
          a.rel = "noopener noreferrer";
        }
        var d = document.createElement("span");
        d.className = "event-date";
        d.textContent = ev.dateLabel;
        var t = document.createElement("span");
        t.className = "event-title";
        t.textContent = ev.title;
        var m = document.createElement("span");
        m.className = "event-meta";
        m.textContent = ev.meta || "";
        var c = document.createElement("span");
        c.className = "event-cta";
        c.textContent = ev.cta || "More info";
        a.appendChild(d);
        a.appendChild(t);
        a.appendChild(m);
        a.appendChild(c);
        li.appendChild(a);
        list.appendChild(li);
      });
    }
  }

  if (C.about) {
    text(document.getElementById("bind-about-title"), C.about.sectionTitle);
    var article = document.getElementById("bind-about-prose");
    if (article) {
      article.innerHTML = "";
      (C.about.blocks || []).forEach(function (block) {
        article.appendChild(h3(block.heading));
        (block.paragraphs || []).forEach(function (para) {
          article.appendChild(p(para));
        });
      });
    }
  }

  if (C.people) {
    text(document.getElementById("bind-people-title"), C.people.sectionTitle);
    var wrap = document.getElementById("bind-people-intro");
    if (wrap) {
      wrap.innerHTML = "";
      (C.people.paragraphs || []).forEach(function (para) {
        var el = document.createElement("p");
        el.className = "lede";
        el.textContent = para;
        wrap.appendChild(el);
      });
    }
  }

  if (C.leadership) {
    text(document.getElementById("bind-leadership-title"), C.leadership.sectionTitle);
    text(document.getElementById("bind-leadership-intro"), C.leadership.intro);
    var grid = document.getElementById("bind-leadership-grid");
    if (grid) {
      grid.innerHTML = "";

      var panelEc = document.createElement("div");
      panelEc.className = "panel";
      panelEc.appendChild(h3(C.leadership.executiveTitle));
      var dl = document.createElement("dl");
      dl.className = "role-list";
      (C.leadership.roles || []).forEach(function (r) {
        var div = document.createElement("div");
        var dt = document.createElement("dt");
        dt.textContent = r.role;
        var dd = document.createElement("dd");
        dd.textContent = r.name;
        div.appendChild(dt);
        div.appendChild(dd);
        dl.appendChild(div);
      });
      panelEc.appendChild(dl);
      panelEc.appendChild(h4(C.leadership.committeeHeading));
      var ulc = document.createElement("ul");
      ulc.className = "plain-list";
      (C.leadership.committeeMembers || []).forEach(function (name) {
        var li = document.createElement("li");
        li.textContent = name;
        ulc.appendChild(li);
      });
      panelEc.appendChild(ulc);
      panelEc.appendChild(h4(C.leadership.adminHeading));
      var ula = document.createElement("ul");
      ula.className = "plain-list";
      (C.leadership.adminMembers || []).forEach(function (name) {
        var li = document.createElement("li");
        li.textContent = name;
        ula.appendChild(li);
      });
      panelEc.appendChild(ula);

      var panelPriest = document.createElement("div");
      panelPriest.className = "panel";
      panelPriest.appendChild(h3(C.leadership.priestsTitle));
      var dl2 = document.createElement("dl");
      dl2.className = "role-list";
      (C.leadership.priestsCurrent || []).forEach(function (r) {
        var div = document.createElement("div");
        var dt = document.createElement("dt");
        dt.textContent = r.role;
        var dd = document.createElement("dd");
        dd.textContent = r.name;
        div.appendChild(dt);
        div.appendChild(dd);
        dl2.appendChild(div);
      });
      panelPriest.appendChild(dl2);
      panelPriest.appendChild(h4(C.leadership.pastHeading));
      var ult = document.createElement("ul");
      ult.className = "timeline-list";
      (C.leadership.pastPriests || []).forEach(function (r) {
        var li = document.createElement("li");
        var sp = document.createElement("span");
        sp.className = "timeline-years";
        sp.textContent = r.years;
        var nm = document.createElement("span");
        nm.className = "timeline-name";
        nm.textContent = r.name;
        li.appendChild(sp);
        li.appendChild(nm);
        ult.appendChild(li);
      });
      panelPriest.appendChild(ult);

      grid.appendChild(panelEc);
      grid.appendChild(panelPriest);
    }
  }

  if (C.visit) {
    var V = C.visit;
    text(document.getElementById("bind-visit-title"), V.sectionTitle);
    text(document.getElementById("bind-visit-services-h"), V.servicesHeading);
    text(document.getElementById("bind-address-label"), V.addressLabel);
    var addr = document.getElementById("bind-address-lines");
    if (addr) {
      addr.innerHTML = "";
      (V.addressLines || []).forEach(function (line, i) {
        if (i > 0) addr.appendChild(document.createElement("br"));
        addr.appendChild(document.createTextNode(line));
      });
    }
    text(document.getElementById("bind-phone-label"), V.phoneLabel);
    var phoneA = document.getElementById("bind-phone-link");
    if (phoneA) {
      phoneA.textContent = V.phoneDisplay;
      phoneA.href = V.phoneHref;
    }
    text(document.getElementById("bind-email-label"), V.emailLabel);
    var emailA = document.getElementById("bind-email-link");
    if (emailA) {
      emailA.textContent = V.email;
      emailA.href = "mailto:" + V.email;
    }
    text(document.getElementById("bind-membership-h"), V.membershipHeading);
    var mem = document.getElementById("bind-membership-body");
    if (mem) {
      mem.innerHTML = "";
      mem.appendChild(p(V.membershipParagraphs[0]));
      var p2 = document.createElement("p");
      var rest = V.membershipParagraphs[1] || "";
      var email = V.email;
      var idx = rest.indexOf(email);
      if (idx >= 0) {
        p2.appendChild(document.createTextNode(rest.slice(0, idx)));
        var a = document.createElement("a");
        a.href = "mailto:" + email + "?subject=" + encodeURIComponent("Membership Enquiry");
        a.textContent = email;
        p2.appendChild(a);
        p2.appendChild(document.createTextNode(rest.slice(idx + email.length)));
      } else {
        p2.textContent = rest;
      }
      mem.appendChild(p2);
    }
    text(document.getElementById("bind-contact-form-h"), V.contactFormHeading);
    var L = V.formLabels;
    if (L) {
      text(document.getElementById("bind-lbl-first"), L.firstName);
      text(document.getElementById("bind-lbl-last"), L.lastName);
      text(document.getElementById("bind-lbl-email"), L.email);
      text(document.getElementById("bind-lbl-subject"), L.subject);
      text(document.getElementById("bind-lbl-message"), L.message);
      var ta = document.getElementById("fld-body");
      if (ta) ta.placeholder = L.messagePlaceholder;
      var btn = document.getElementById("contact-submit");
      if (btn) btn.textContent = L.submit;
    }
    text(document.getElementById("form-note"), V.formThankYou);
  }

  if (C.footer) {
    text(document.getElementById("bind-footer-line"), C.footer.line);
    var fb = document.getElementById("bind-footer-facebook");
    if (fb) {
      fb.textContent = C.footer.facebookLabel;
      fb.href = C.footer.facebookUrl;
    }
  }
})();

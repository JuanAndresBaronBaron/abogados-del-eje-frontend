/* ============================================================
   ABOGADOS DEL EJE — shared behaviour (home + service pages)
   Theme switcher · mobile menu · FAQ accordion · fade-ins
   No dependencies: works even if the animation libraries fail.
   ============================================================ */

(function () {
  const root = document.documentElement;
  const THEMES = ["dark", "mid", "light"];
  const THEME_COLORS = { dark: "#0A1628", mid: "#263142", light: "#F7F3EC" };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Theme ---------- */
  function syncThemeUI(theme) {
    document.querySelectorAll("[data-theme-set]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.themeSet === theme));
    });
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", THEME_COLORS[theme]);
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    try { localStorage.setItem("ade-theme", theme); } catch (e) { /* private mode */ }
    syncThemeUI(theme);
    document.dispatchEvent(new CustomEvent("ade:theme", { detail: theme }));
  }

  function setTheme(theme, origin) {
    if (!THEMES.includes(theme) || theme === root.dataset.theme) return;
    if (!document.startViewTransition || reduced) return applyTheme(theme);
    const x = origin ? origin.x : innerWidth / 2;
    const y = origin ? origin.y : 0;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const vt = document.startViewTransition(() => applyTheme(theme));
    vt.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 750, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" }
      );
    }).catch(() => {});
  }

  syncThemeUI(root.dataset.theme || "dark");
  /* another tab changed the theme: follow it */
  window.addEventListener("storage", (e) => {
    if (e.key === "ade-theme" && THEMES.includes(e.newValue) && e.newValue !== root.dataset.theme) {
      root.dataset.theme = e.newValue;
      syncThemeUI(e.newValue);
      document.dispatchEvent(new CustomEvent("ade:theme", { detail: e.newValue }));
    }
  });
  document.querySelectorAll("[data-theme-set]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const r = btn.getBoundingClientRect();
      setTheme(btn.dataset.themeSet, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
    });
  });

  /* ---------- Mobile menu (modal: focus moves in, background is inert) ---------- */
  const burger = document.getElementById("navBurger");
  const overlay = document.getElementById("menuOverlay");
  const nav = document.getElementById("nav") || (burger && burger.closest("header"));
  let inerted = [];
  const FOCUSABLE = 'a[href], button:not([disabled]), summary, input, select, textarea, [tabindex]:not([tabindex="-1"])';

  function setBackgroundInert(on) {
    if (on) {
      inerted = Array.from(document.body.children).filter((el) =>
        el !== overlay && el !== nav && !el.contains(overlay) && !el.contains(burger) &&
        el.tagName !== "SCRIPT" && !el.hasAttribute("inert"));
      inerted.forEach((el) => el.setAttribute("inert", ""));
    } else {
      inerted.forEach((el) => el.removeAttribute("inert"));
      inerted = [];
    }
  }

  function overlayFocusables() {
    return Array.from(overlay.querySelectorAll(FOCUSABLE)).filter((el) => el.getClientRects().length > 0);
  }

  function setMenu(open) {
    if (!burger || !overlay) return;
    const wasOpen = overlay.classList.contains("is-open");
    if (open === wasOpen) return;
    const focusWasInside = overlay.contains(document.activeElement) || document.activeElement === burger;
    overlay.classList.toggle("is-open", open);
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    overlay.toggleAttribute("inert", !open);
    overlay.setAttribute("aria-hidden", String(!open));
    root.classList.toggle("menu-open", open);
    setBackgroundInert(open);
    if (open) {
      const first = overlay.querySelector(".menu-link") || overlayFocusables()[0];
      requestAnimationFrame(() => first && first.focus({ preventScroll: true }));
    } else if (focusWasInside) {
      burger.focus({ preventScroll: true });
    }
    document.dispatchEvent(new CustomEvent("ade:menu", { detail: open }));
  }

  if (burger && overlay) {
    overlay.setAttribute("inert", "");
    overlay.setAttribute("aria-hidden", "true");
    if (!overlay.hasAttribute("role")) overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    if (!overlay.hasAttribute("aria-label") && !overlay.hasAttribute("aria-labelledby")) overlay.setAttribute("aria-label", "Menú");
    burger.addEventListener("click", () => setMenu(!overlay.classList.contains("is-open")));
    overlay.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (e) => {
      if (!overlay.classList.contains("is-open")) return;
      if (e.key === "Escape") { e.preventDefault(); setMenu(false); return; }
      if (e.key !== "Tab") return;
      /* keep Tab cycling between the close button and the menu items */
      const items = [burger, ...overlayFocusables()];
      const i = items.indexOf(document.activeElement);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); items[items.length - 1].focus(); }
      else if (!e.shiftKey && (i === items.length - 1 || i === -1)) { e.preventDefault(); items[0].focus(); }
    });
    /* leaving the mobile breakpoint with the menu open: close it */
    const desktop = window.matchMedia("(min-width: 901px)");
    const onBp = () => { if (desktop.matches) setMenu(false); };
    desktop.addEventListener ? desktop.addEventListener("change", onBp) : desktop.addListener(onBp);
  }
  window.ADE = { setMenu, setTheme };

  /* ---------- FAQ accordion with height animation ---------- */
  document.querySelectorAll(".faq-item").forEach((item) => {
    const summary = item.querySelector("summary");
    const answer = item.querySelector(".faq-answer");
    if (!summary || !answer || reduced) return;
    summary.addEventListener("click", (e) => {
      e.preventDefault();
      if (item.dataset.animating) return;
      item.dataset.animating = "1";
      const opening = !item.open;
      if (opening) item.open = true;
      const h = answer.scrollHeight;
      const anim = answer.animate(
        { height: opening ? ["0px", h + "px"] : [h + "px", "0px"], opacity: opening ? [0, 1] : [1, 0] },
        { duration: 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
      );
      anim.onfinish = () => {
        if (!opening) item.open = false;
        delete item.dataset.animating;
      };
    });
  });

  /* ---------- Fade-ins (service pages) ---------- */
  const fades = document.querySelectorAll("[data-fade]");
  if (fades.length) {
    if (!("IntersectionObserver" in window) || reduced) {
      fades.forEach((el) => el.classList.add("is-in"));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("is-in");
            io.unobserve(en.target);
          }
        });
      }, { rootMargin: "0px 0px -8% 0px" });
      fades.forEach((el, i) => {
        el.style.transitionDelay = (i % 4) * 0.07 + "s";
        io.observe(el);
      });
    }
  }

  /* ---------- Coverage map: legend highlights its zone ---------- */
  const map = document.querySelector(".co-map");
  document.querySelectorAll(".legend-item[data-focus]").forEach((item) => {
    const cls = "focus-" + item.dataset.focus;
    const on = () => { map?.classList.add(cls); item.classList.add("is-active"); };
    const off = () => { map?.classList.remove(cls); item.classList.remove("is-active"); };
    item.addEventListener("mouseenter", on);
    item.addEventListener("mouseleave", off);
    item.addEventListener("focus", on);
    item.addEventListener("blur", off);
  });

  /* ---------- Mobile contact bar (.mobile-cta) ----------
     Built here so every page gets it without duplicating markup.
     WhatsApp link: <body data-wa="..."> (full URL or just the message),
     else the page's first wa.me link, else a generic message.
     Opt out with <body data-no-mobile-cta>. */
  (function mobileCta() {
    const body = document.body;
    if (!body || body.hasAttribute("data-no-mobile-cta")) return;
    const PHONE = "573153725973";
    let bar = document.querySelector(".mobile-cta");
    if (!bar) {
      let wa = body.dataset.wa || "";
      if (wa && !/^https?:/i.test(wa)) {
        // data-wa may arrive already URL-encoded (pages write %2C, %C3%B3…): decode once, then encode.
        let msg = wa;
        try { msg = decodeURIComponent(wa); } catch (e) { /* plain text with a stray % */ }
        wa = "https://wa.me/" + PHONE + "?text=" + encodeURIComponent(msg);
      }
      if (!wa) {
        const link = document.querySelector('a[href*="wa.me/' + PHONE + '?text="]');
        wa = link ? link.getAttribute("href") : "https://wa.me/" + PHONE + "?text=" + encodeURIComponent("Hola, quiero contarles mi caso");
      }
      bar = document.createElement("div");
      bar.className = "mobile-cta";
      bar.setAttribute("role", "group");
      bar.setAttribute("aria-label", "Contacto rápido");
      bar.innerHTML =
        '<a class="mobile-cta-wa" target="_blank" rel="noopener" aria-label="Escríbenos por WhatsApp (se abre en una pestaña nueva)">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5Z"/></svg>' +
          "<span>WhatsApp</span></a>" +
        '<a class="mobile-cta-call" href="tel:+' + PHONE + '" aria-label="Llamar al 315 372 5973">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"/></svg>' +
          "<span>Llamar</span></a>";
      bar.querySelector(".mobile-cta-wa").setAttribute("href", wa);
      body.appendChild(bar);
    }
    root.classList.add("has-mobile-cta");

    /* Hidden near the top (the hero already has the buttons) and while a
       section with its own contact buttons is on screen. */
    let nearTop = true, contactVisible = false, ticking = false;
    const shown = new Set();
    function apply() { root.classList.toggle("mcta-hidden", nearTop || contactVisible); }
    function measure() {
      ticking = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      nearTop = window.scrollY < Math.min(innerHeight * 0.6, max * 0.5);
      apply();
    }
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(measure); } }, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    measure();
    const targets = document.querySelectorAll("#contacto, .cta-band");
    if (targets.length && "IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => (en.isIntersecting ? shown.add(en.target) : shown.delete(en.target)));
        contactVisible = shown.size > 0;
        apply();
      }, { threshold: 0.25 });
      targets.forEach((t) => io.observe(t));
    }
  })();

  /* ---------- Footer year ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();

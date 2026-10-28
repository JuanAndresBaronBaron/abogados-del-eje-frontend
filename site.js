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
  document.querySelectorAll("[data-theme-set]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const r = btn.getBoundingClientRect();
      setTheme(btn.dataset.themeSet, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
    });
  });

  /* ---------- Mobile menu ---------- */
  const burger = document.getElementById("navBurger");
  const overlay = document.getElementById("menuOverlay");
  function setMenu(open) {
    if (!burger || !overlay) return;
    overlay.classList.toggle("is-open", open);
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    overlay.toggleAttribute("inert", !open);
    root.classList.toggle("menu-open", open);
    document.dispatchEvent(new CustomEvent("ade:menu", { detail: open }));
  }
  if (burger && overlay) {
    overlay.setAttribute("inert", "");
    burger.addEventListener("click", () => setMenu(!overlay.classList.contains("is-open")));
    overlay.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) setMenu(false);
    });
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

  /* ---------- Footer year ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();

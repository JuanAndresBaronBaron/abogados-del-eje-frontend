/* ============================================================
   ABOGADOS DEL EJE — interactions & scroll choreography
   GSAP + ScrollTrigger + Lenis
   ============================================================ */

/* Areas carousel hint (shown by CSS only when the cards become a swipe
   carousel: phones, reduced motion, or no animation library). */
(function areasHint() {
  const track = document.getElementById("areasTrack");
  if (!track || document.querySelector(".areas-hint")) return;
  const n = track.querySelectorAll(".area-card:not(.area-card-end)").length;
  const hint = document.createElement("p");
  hint.className = "areas-hint";
  hint.setAttribute("aria-hidden", "true");
  hint.textContent = "Desliza para ver " + (n ? "las " + n + " áreas" : "todas las áreas") + " →";
  const anchor = document.querySelector(".areas-progress") || track;
  anchor.parentNode.insertBefore(hint, anchor.nextSibling === track ? track : anchor.nextSibling);
})();

if (!window.gsap || !window.ScrollTrigger) {
  /* Animation library unavailable: show the static page instead of a stuck loader. */
  document.documentElement.classList.add("no-gsap");
} else {

gsap.registerPlugin(ScrollTrigger);

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

const DESKTOP = "(min-width: 901px)";
const MOBILE = "(max-width: 900px)";
const mm = gsap.matchMedia();
const FOCUSABLE = 'a[href], button, summary, input, select, textarea, [tabindex]';

/* ---------- Smooth scroll (Lenis) — desktop pointers only; native
   touch scrolling is already smooth and cheaper on phones ---------- */
let lenis = null;
if (!prefersReduced && !isTouch && window.Lenis) {
  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* Move keyboard focus to the section we scrolled to (WCAG 2.4.3) */
function focusSection(el) {
  if (!el) return;
  if (!el.matches(FOCUSABLE)) el.setAttribute("tabindex", "-1");
  try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
}

function scrollToTarget(target) {
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (!el) return;
  if (lenis) {
    lenis.scrollTo(el, { offset: 0, duration: 1.4, onComplete: () => focusSection(el) });
  } else {
    el.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
    focusSection(el);
  }
  if (typeof target === "string" && history.pushState) {
    const url = target === "#hero" ? location.pathname + location.search : target;
    if (url !== location.hash) history.pushState(null, "", url);
  }
}

/* Anchor links through Lenis */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id.length > 1 && document.querySelector(id)) {
      e.preventDefault();
      scrollToTarget(id);
      window.ADE?.setMenu(false);
    }
  });
});

/* ============================================================
   PRELOADER
   ============================================================ */
const loader = document.getElementById("loader");
const loaderLetters = loader ? loader.querySelectorAll(".loader-word span") : [];

/* Split the hero headline into animatable words */
const heroWords = [];
document.querySelectorAll(".hero-title .line").forEach((line) => {
  const parts = line.innerHTML.split(/\s+/).filter(Boolean);
  line.innerHTML = parts.map((w) => `<span class="word">${w}</span>`).join(" ");
  heroWords.push(...line.querySelectorAll(".word"));
});

const HERO_BITS = [".hero-eyebrow", "#heroSub", "#heroCta", "#heroScroll"];
function showHeroNow() {
  if (loader) gsap.set(loader, { display: "none" });
  gsap.set(heroWords, { yPercent: 0, rotate: 0 });
  gsap.set(HERO_BITS, { opacity: 1, y: 0 });
}

/* The intro plays once per visit. It is skipped with reduced motion, when
   arriving at a section (/#contacto) and on repeat views in the session. */
let skipIntro = prefersReduced || !loader || location.hash.length > 1;
try {
  if (sessionStorage.getItem("ade-intro-seen")) skipIntro = true;
  sessionStorage.setItem("ade-intro-seen", "1");
} catch (e) { /* storage blocked */ }

if (skipIntro) {
  showHeroNow();
} else {
  /* While the loader covers the page, the content behind it is not reachable */
  const gated = [document.querySelector("main"), document.getElementById("nav")].filter(Boolean);
  gated.forEach((el) => { el.inert = true; });
  const SKIP_EVENTS = ["keydown", "pointerdown", "wheel", "touchstart"];
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    gated.forEach((el) => { el.inert = false; });
    SKIP_EVENTS.forEach((ev) => window.removeEventListener(ev, skip, true));
  };
  /* any key, click, tap or wheel finishes the intro at once */
  const skip = () => { if (!released) intro.progress(1); };

  gsap.set(heroWords, { yPercent: 115, rotate: 3 });
  gsap.set("#heroSub", { y: 20 });

  var intro = gsap.timeline({ defaults: { ease: "power4.out" } });
  intro
    .to(loaderLetters, { y: 0, duration: 0.5, stagger: 0.02 }, 0.05)
    .to("#loaderBar", { scaleX: 1, duration: 0.7, ease: "power2.inOut" }, 0.1)
    .to(loaderLetters, { y: "-120%", duration: 0.4, stagger: 0.012, ease: "power3.in" }, 0.78)
    .to("#loaderBar", { opacity: 0, duration: 0.25 }, "<")
    .to(loader, { yPercent: -100, duration: 0.55, ease: "power4.inOut" }, 1.05)
    .set(loader, { display: "none" })
    .add(release)
    .to(heroWords, { yPercent: 0, rotate: 0, duration: 1.1, stagger: 0.07, ease: "power4.out" }, "-=0.45")
    .to(".hero-eyebrow", { opacity: 1, duration: 0.8 }, "-=0.9")
    .to("#heroSub", { opacity: 1, y: 0, duration: 0.8 }, "-=0.7")
    .to("#heroCta", { opacity: 1, duration: 0.8 }, "-=0.6")
    .to("#heroScroll", { opacity: 1, duration: 0.8 }, "-=0.5");
  SKIP_EVENTS.forEach((ev) => window.addEventListener(ev, skip, { capture: true, passive: true }));
}

/* ============================================================
   NAV — glass on scroll, hide on scroll down
   ============================================================ */
const nav = document.getElementById("nav");
ScrollTrigger.create({
  start: 80,
  onUpdate: (self) => {
    nav.classList.toggle("is-scrolled", self.scroll() > 80);
    if (self.direction === 1 && self.scroll() > 400) nav.classList.add("is-hidden");
    else nav.classList.remove("is-hidden");
  },
});

/* Mobile menu (opened/closed by site.js): freeze smooth scroll while open */
document.addEventListener("ade:menu", (e) => {
  if (lenis) e.detail ? lenis.stop() : lenis.start();
});

/* Scroll progress bar */
gsap.to("#scrollProgress", {
  scaleX: 1,
  ease: "none",
  scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
});
gsap.set("#scrollProgress", { scaleX: 0 });

/* ============================================================
   CUSTOM CURSOR + MAGNETIC ELEMENTS
   ============================================================ */
if (!isTouch && !prefersReduced && document.getElementById("cursor") && document.getElementById("cursorDot")) {
  const cursor = document.getElementById("cursor");
  const dot = document.getElementById("cursorDot");
  document.documentElement.classList.add("has-cursor");
  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const mouse = { x: pos.x, y: pos.y };

  /* Keep the cursor hidden until the pointer actually moves, so it
     doesn't sit parked in the middle of the page on load. */
  let cursorShown = false;
  gsap.set([cursor, dot], { opacity: 0 });

  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    gsap.set(dot, { x: mouse.x, y: mouse.y });
    if (!cursorShown) {
      cursorShown = true;
      pos.x = mouse.x;
      pos.y = mouse.y;
      gsap.to([cursor, dot], { opacity: 1, duration: 0.3 });
    }
  });
  gsap.ticker.add(() => {
    pos.x += (mouse.x - pos.x) * 0.16;
    pos.y += (mouse.y - pos.y) * 0.16;
    gsap.set(cursor, { x: pos.x, y: pos.y });
  });

  document.querySelectorAll("a, button, summary, .area-card, .value-card, .legend-item").forEach((el) => {
    el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
  });

  /* Magnetic pull */
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    const strength = 0.35;
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      gsap.to(el, { x: x * strength, y: y * strength, duration: 0.5, ease: "power3.out" });
    });
    el.addEventListener("mouseleave", () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.4)" });
    });
  });
}

/* ============================================================
   HERO CANVAS — golden constellation
   ============================================================ */
(function heroParticles() {
  const canvas = document.getElementById("heroCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let w, h, dpr, particles = [], running = true;
  const mouse = { x: -9999, y: -9999 };

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(110, Math.floor((w * h) / 16000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.6 + 0.5,
      a: Math.random() * 0.5 + 0.25,
    }));
  }
  resize();
  window.addEventListener("resize", resize);

  canvas.parentElement.addEventListener("mousemove", (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });
  canvas.parentElement.addEventListener("mouseleave", () => {
    mouse.x = -9999; mouse.y = -9999;
  });

  const LINK_DIST = 130;
  function frame() {
    if (running && !prefersReduced) {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        /* gentle repulsion from the cursor */
        const dxm = p.x - mouse.x, dym = p.y - mouse.y;
        const dm = Math.hypot(dxm, dym);
        if (dm < 120) {
          p.x += (dxm / dm) * 0.6;
          p.y += (dym / dm) * 0.6;
        }
        if (p.x < -20) p.x = w + 20; if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20; if (p.y > h + 20) p.y = -20;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201, 150, 98, ${p.a})`;
        ctx.fill();
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK_DIST) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(169, 116, 62, ${0.14 * (1 - d / LINK_DIST)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    }
    requestAnimationFrame(frame);
  }
  frame();

  /* pause when hero leaves the viewport */
  ScrollTrigger.create({
    trigger: "#hero",
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => (running = self.isActive),
  });
})();

/* Hero content drifts away on scroll (Apple-style exit) */
if (!prefersReduced) {
  gsap.to(".hero-content", {
    yPercent: -28,
    opacity: 0,
    scale: 0.96,
    ease: "none",
    scrollTrigger: { trigger: "#hero", start: "top top", end: "85% top", scrub: true },
  });
  gsap.to("#heroScroll", {
    opacity: 0,
    ease: "none",
    scrollTrigger: { trigger: "#hero", start: "top top", end: "25% top", scrub: true },
  });
}

/* ============================================================
   MANIFESTO — pinned, words light up with scroll
   ============================================================ */
(function manifesto() {
  const el = document.getElementById("manifestoText");
  if (!el) return;
  const KEY_WORDS = new Set(["rigor,", "estrategia", "humanidad.", "precisión", "final."]);
  el.innerHTML = el.textContent
    .split(/\s+/)
    .map((w) => `<span class="word${KEY_WORDS.has(w) ? " key" : ""}">${w}</span>`)
    .join(" ");
  const words = el.querySelectorAll(".word");

  if (prefersReduced) {
    words.forEach((w) => w.classList.add("is-lit"));
    return;
  }
  mm.add({ desktop: DESKTOP, mobile: MOBILE }, (ctx) => {
    if (ctx.conditions.desktop) {
      /* pinned: words light up with the scroll */
      ScrollTrigger.create({
        trigger: "#manifesto",
        start: "top top",
        end: "+=160%",
        pin: true,
        scrub: true,
        onUpdate: (self) => {
          const lit = Math.floor(self.progress * 1.15 * words.length);
          words.forEach((w, i) => w.classList.toggle("is-lit", i < lit));
        },
      });
      return;
    }
    /* phones: no pin, the words light up once in a quick cascade */
    ScrollTrigger.create({
      trigger: "#manifesto",
      start: "top 75%",
      once: true,
      onEnter: () => words.forEach((w, i) => {
        w.style.transitionDelay = Math.min(i * 0.035, 1.4) + "s";
        w.classList.add("is-lit");
      }),
    });
    return () => words.forEach((w) => { w.style.transitionDelay = ""; w.classList.remove("is-lit"); });
  });
})();

/* ============================================================
   AREAS — pinned horizontal scroll
   ============================================================ */
(function horizontalAreas() {
  const track = document.getElementById("areasTrack");
  if (!track || prefersReduced) return;

  const getDistance = () => Math.max(0, track.scrollWidth - innerWidth + 64);

  mm.add({ desktop: DESKTOP, mobile: MOBILE }, (ctx) => {
    if (ctx.conditions.mobile) {
      /* phones: native swipe carousel (CSS); the bar follows the swipe */
      const onScroll = () => {
        const max = track.scrollWidth - track.clientWidth;
        gsap.set("#areasProgress", { scaleX: max > 0 ? track.scrollLeft / max : 0 });
      };
      track.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      return () => track.removeEventListener("scroll", onScroll);
    }

    const tween = gsap.to(track, {
      x: () => -getDistance(),
      ease: "none",
      scrollTrigger: {
        trigger: "#areas",
        start: "top top",
        end: () => "+=" + getDistance(),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          gsap.set("#areasProgress", { scaleX: self.progress });
        },
      },
    });
    const st = tween.scrollTrigger;

    /* Keyboard: bring the focused card into view inside the pinned track */
    const onFocus = (e) => {
      const card = e.target.closest(".area-card");
      if (!card || !st) return;
      const dist = getDistance() || 1;
      const ratio = Math.min(1, Math.max(0, (card.offsetLeft - 64) / dist));
      const y = st.start + ratio * (st.end - st.start);
      if (lenis) lenis.scrollTo(y, { immediate: true });
      else window.scrollTo(0, y);
      /* undo any native scroll the browser did inside the clipped wrapper */
      const pin = track.parentElement;
      if (pin && pin.scrollLeft) pin.scrollLeft = 0;
    };
    track.addEventListener("focusin", onFocus);
    return () => track.removeEventListener("focusin", onFocus);
  });

  /* spotlight follows the cursor inside each card, with a subtle 3D tilt */
  document.querySelectorAll(".area-card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", px * 100 + "%");
      card.style.setProperty("--my", py * 100 + "%");
      if (!isTouch) {
        gsap.to(card, { y: -8, rotateY: (px - 0.5) * 8, rotateX: (0.5 - py) * 8, transformPerspective: 900, duration: 0.5, ease: "power2.out" });
      }
    });
    card.addEventListener("mouseleave", () => {
      gsap.to(card, { y: 0, rotateY: 0, rotateX: 0, duration: 0.8, ease: "power3.out" });
    });
  });
})();

/* ============================================================
   BALANZA — canvas line-drawing of the scales, scrubbed
   ============================================================ */
(function balanza() {
  const canvas = document.getElementById("balanzaCanvas");
  const section = document.getElementById("balanza");
  if (!canvas || !section) return;
  const ctx = canvas.getContext("2d");
  let w, h, dpr;
  let progress = prefersReduced ? 1 : 0;
  /* static layout: captions stacked below the drawing instead of over it */
  let staticLayout = false;

  /* The scale, defined as ordered strokes in a 400x400 design space
     centered on (0, 0). Drawn sequentially as progress goes 0 → 1. */
  const SEGS = [
    { t: "line", x1: -90, y1: 170, x2: 90, y2: 170 },               // base
    { t: "line", x1: -45, y1: 170, x2: -14, y2: 148 },              // pedestal left
    { t: "line", x1: 45, y1: 170, x2: 14, y2: 148 },                // pedestal right
    { t: "line", x1: 0, y1: 148, x2: 0, y2: -148 },                 // column
    { t: "arc", cx: 0, cy: -160, r: 11, a0: 0.5 * Math.PI, a1: 2.5 * Math.PI }, // finial
    { t: "line", x1: -140, y1: -130, x2: 140, y2: -130 },           // beam
    { t: "line", x1: -140, y1: -130, x2: -168, y2: -40 },           // chain L outer
    { t: "line", x1: -140, y1: -130, x2: -112, y2: -40 },           // chain L inner
    { t: "arc", cx: -140, cy: -40, r: 28, a0: 0, a1: Math.PI },     // pan L
    { t: "line", x1: 140, y1: -130, x2: 168, y2: -40 },             // chain R outer
    { t: "line", x1: 140, y1: -130, x2: 112, y2: -40 },             // chain R inner
    { t: "arc", cx: 140, cy: -40, r: 28, a0: 0, a1: Math.PI },      // pan R
  ];
  const segLen = (s) =>
    s.t === "line" ? Math.hypot(s.x2 - s.x1, s.y2 - s.y1) : Math.abs(s.a1 - s.a0) * s.r;
  const TOTAL = SEGS.reduce((sum, s) => sum + segLen(s), 0);

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    draw();
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    /* Reserve a band at the bottom for the step captions, then center
       and size the scale within the remaining area so its base never
       overlaps the "Justicia" / "Precisión" text. */
    const reserve = staticLayout ? 0 : Math.min(h * 0.32, 260);
    const avail = h - reserve;
    const scale = Math.min(w, avail) / 480;
    ctx.save();
    ctx.translate(w / 2, avail / 2);
    ctx.scale(scale, scale);

    /* ambient glow grows as the drawing completes */
    if (progress > 0.05) {
      const g = ctx.createRadialGradient(0, 0, 10, 0, 0, 320);
      g.addColorStop(0, `rgba(169, 116, 62, ${0.16 * progress})`);
      g.addColorStop(1, "rgba(169, 116, 62, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(-400, -400, 800, 800);
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#C99662";
    ctx.shadowColor = "rgba(201, 150, 98, 0.55)";
    ctx.shadowBlur = 14 * progress;

    /* Finish drawing the full (balanced) scale by ~60% scroll, so the
       final "Justicia" caption is always shown over a complete graphic. */
    let budget = TOTAL * Math.min(1, progress / 0.6);
    for (const s of SEGS) {
      if (budget <= 0) break;
      const L = segLen(s);
      const f = Math.min(1, budget / L);
      ctx.beginPath();
      if (s.t === "line") {
        ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(s.x1 + (s.x2 - s.x1) * f, s.y1 + (s.y2 - s.y1) * f);
      } else {
        ctx.arc(s.cx, s.cy, s.r, s.a0, s.a0 + (s.a1 - s.a0) * f);
      }
      ctx.stroke();
      budget -= L;
    }
    ctx.restore();
  }

  resize();
  window.addEventListener("resize", resize);

  const steps = document.querySelectorAll(".balanza-step");
  function setStatic(on) {
    staticLayout = on;
    section.classList.toggle("is-static", on);
    resize();
  }
  if (prefersReduced) {
    /* all three captions stay visible, the scale is drawn complete */
    setStatic(true);
    steps.forEach((s) => s.classList.add("is-active"));
    return;
  }
  mm.add({ desktop: DESKTOP, mobile: MOBILE }, (ctx2) => {
    if (ctx2.conditions.mobile) {
      /* phones: no pin; the scale draws itself once when it comes into view */
      setStatic(true);
      progress = 0;
      draw();
      const anim = { p: 0 };
      ScrollTrigger.create({
        trigger: canvas,
        start: "top 80%",
        once: true,
        onEnter: () => gsap.to(anim, {
          p: 1, duration: 1.6, ease: "power2.out",
          onUpdate: () => { progress = anim.p; draw(); },
        }),
      });
      return () => setStatic(false);
    }
    setStatic(false);
    ScrollTrigger.create({
      trigger: "#balanza",
      start: "top top",
      end: "+=250%",
      pin: true,
      scrub: 0.4,
      onUpdate: (self) => {
        progress = self.progress;
        draw();
        const idx = Math.min(2, Math.floor(self.progress * 3));
        steps.forEach((s, i) => s.classList.toggle("is-active", i === idx));
      },
    });
  });
})();

/* ============================================================
   GENERIC REVEALS + COUNTERS
   ============================================================ */
if (!prefersReduced) {
  gsap.utils.toArray("[data-reveal]").forEach((el, i) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1.1,
      ease: "power3.out",
      delay: (i % 3) * 0.08,
      scrollTrigger: { trigger: el, start: "top 86%" },
    });
  });
}

document.querySelectorAll("[data-count]").forEach((el) => {
  const target = +el.dataset.count;
  if (prefersReduced) { el.textContent = target; return; }
  el.textContent = 0;
  ScrollTrigger.create({
    trigger: el,
    start: "top 88%",
    once: true,
    onEnter: () => {
      gsap.to(el, {
        textContent: target,
        duration: 2,
        ease: "power2.out",
        snap: { textContent: 1 },
      });
    },
  });
});

/* ============================================================
   COBERTURA — the map draws itself, then the Eje Cafetero lights up
   ============================================================ */
(function coverageMap() {
  const map = document.querySelector(".co-map");
  if (!map || prefersReduced) return;
  const deps = map.querySelectorAll(".dep");
  const present = map.querySelectorAll(".is-present");
  const arcs = map.querySelectorAll(".map-arc");
  const cities = map.querySelectorAll(".map-city");
  const hq = map.querySelectorAll(".map-hq, .map-hq-label");

  deps.forEach((d) => {
    const len = d.getTotalLength();
    d.style.strokeDasharray = len;
    d.style.strokeDashoffset = len;
  });
  gsap.set(deps, { fillOpacity: 0.15 });
  gsap.set([arcs, cities, hq], { opacity: 0 });
  gsap.set(cities, { scale: 0, transformOrigin: "center", transformBox: "fill-box" });

  const tl = gsap.timeline({
    scrollTrigger: { trigger: map, start: "top 92%", once: true },
    onComplete: () => deps.forEach((d) => { d.style.strokeDasharray = ""; d.style.strokeDashoffset = ""; }),
  });
  tl.to(deps, { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut", stagger: { each: 0.012, from: "random" } })
    .to(map.querySelectorAll(".is-virtual"), { fillOpacity: 1, duration: 0.7, stagger: { each: 0.01, from: "random" } }, "-=0.7")
    .to(present, { fillOpacity: 1, duration: 0.6, ease: "power2.out" }, "-=0.4")
    .fromTo(present, { scale: 1.12, transformOrigin: "center", transformBox: "fill-box" }, { scale: 1, duration: 1, ease: "elastic.out(1, 0.5)" }, "<")
    .to(hq, { opacity: 1, duration: 0.5 }, "-=0.6")
    .to(arcs, { opacity: 0.75, duration: 0.6, stagger: 0.08 }, "-=0.2")
    .to(cities, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.08, ease: "back.out(3)" }, "<");

  /* gentle float */
  gsap.to(map, { y: -10, duration: 4, ease: "sine.inOut", yoyo: true, repeat: -1 });
})();

/* Marquee reacts to scroll velocity */
(function marqueeVelocity() {
  const track = document.getElementById("marqueeTrack");
  if (!track || prefersReduced) return;
  const skew = gsap.quickTo(track, "skewX", { duration: 0.4, ease: "power3.out" });
  ScrollTrigger.create({
    onUpdate: (self) => skew(gsap.utils.clamp(-12, 12, self.getVelocity() / -250)),
  });
})();

/* Section titles get a soft parallax drift */
if (!prefersReduced) {
  gsap.utils.toArray(".contacto-title, .firma-title, .cobertura-title, .faq-title").forEach((el) => {
    gsap.from(el, {
      yPercent: 18,
      ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "top 30%", scrub: true },
    });
  });
}

/* ============================================================
   FOOTER
   ============================================================ */
document.getElementById("toTop")?.addEventListener("click", () => scrollToTarget("#hero"));

/* Recalculate pinned sections once fonts and images have settled; then,
   if we arrived at a section (/#contacto from another page), go there now
   that the pinned spacers have their real height. */
window.addEventListener("load", () => {
  ScrollTrigger.refresh();
  const id = location.hash;
  if (id.length > 1) {
    let el = null;
    try { el = document.querySelector(id); } catch (e) { /* not a valid selector */ }
    if (el) {
      if (lenis) lenis.scrollTo(el, { immediate: true, force: true });
      else el.scrollIntoView();
    }
  }
});
document.fonts?.ready.then(() => ScrollTrigger.refresh());

}

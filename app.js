/* ============================================================
   ABOGADOS DEL EJE — interactions & scroll choreography
   GSAP + ScrollTrigger + Lenis
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

/* ---------- Smooth scroll (Lenis) ---------- */
let lenis = null;
if (!prefersReduced) {
  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function scrollToTarget(target) {
  if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
  else document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
}

/* Anchor links through Lenis */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id.length > 1 && document.querySelector(id)) {
      e.preventDefault();
      scrollToTarget(id);
      menuOverlay.classList.remove("is-open");
      navBurger.classList.remove("is-open");
    }
  });
});

/* ============================================================
   PRELOADER
   ============================================================ */
const loader = document.getElementById("loader");
const loaderLetters = loader.querySelectorAll(".loader-word span");

/* Split the hero headline into animatable words */
const heroWords = [];
document.querySelectorAll(".hero-title .line").forEach((line) => {
  const parts = line.innerHTML.split(/\s+/).filter(Boolean);
  line.innerHTML = parts.map((w) => `<span class="word">${w}</span>`).join(" ");
  heroWords.push(...line.querySelectorAll(".word"));
});

/* Initial states (before the timeline starts) */
gsap.set(heroWords, { yPercent: 115, rotate: 3 });
gsap.set("#heroSub", { y: 20 });

const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
intro
  .to(loaderLetters, { y: 0, duration: 1, stagger: 0.045 }, 0.2)
  .to("#loaderBar", { scaleX: 1, duration: 1.3, ease: "power2.inOut" }, 0.4)
  .to(loaderLetters, { y: "-120%", duration: 0.7, stagger: 0.025, ease: "power3.in" }, "+=0.25")
  .to("#loaderBar", { opacity: 0, duration: 0.3 }, "<")
  .to(loader, { yPercent: -100, duration: 0.9, ease: "power4.inOut" }, "-=0.2")
  .set(loader, { display: "none" })
  .to(heroWords, { yPercent: 0, rotate: 0, duration: 1.3, stagger: 0.09, ease: "power4.out" }, "-=0.55")
  .to(".hero-eyebrow", { opacity: 1, duration: 0.9 }, "-=0.9")
  .to("#heroSub", { opacity: 1, y: 0, duration: 0.9 }, "-=0.7")
  .to("#heroCta", { opacity: 1, duration: 0.9 }, "-=0.6")
  .to("#heroScroll", { opacity: 1, duration: 0.9 }, "-=0.5");

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

/* Mobile menu */
const navBurger = document.getElementById("navBurger");
const menuOverlay = document.getElementById("menuOverlay");
navBurger.addEventListener("click", () => {
  const open = menuOverlay.classList.toggle("is-open");
  navBurger.classList.toggle("is-open", open);
  if (lenis) open ? lenis.stop() : lenis.start();
});
menuOverlay.addEventListener("transitionend", () => {
  if (!menuOverlay.classList.contains("is-open") && lenis) lenis.start();
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
if (!isTouch && !prefersReduced) {
  const cursor = document.getElementById("cursor");
  const dot = document.getElementById("cursorDot");
  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const mouse = { x: pos.x, y: pos.y };

  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    gsap.set(dot, { x: mouse.x, y: mouse.y });
  });
  gsap.ticker.add(() => {
    pos.x += (mouse.x - pos.x) * 0.16;
    pos.y += (mouse.y - pos.y) * 0.16;
    gsap.set(cursor, { x: pos.x, y: pos.y });
  });

  document.querySelectorAll("a, button, .area-card, .value-card").forEach((el) => {
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
})();

/* ============================================================
   AREAS — pinned horizontal scroll
   ============================================================ */
(function horizontalAreas() {
  const track = document.getElementById("areasTrack");
  if (prefersReduced) return;

  const getDistance = () => Math.max(0, track.scrollWidth - innerWidth + 64);

  gsap.to(track, {
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

  /* spotlight follows the cursor inside each card */
  document.querySelectorAll(".area-card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      card.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
    });
  });
})();

/* ============================================================
   BALANZA — canvas line-drawing of the scales, scrubbed
   ============================================================ */
(function balanza() {
  const canvas = document.getElementById("balanzaCanvas");
  const ctx = canvas.getContext("2d");
  let w, h, dpr;
  let progress = prefersReduced ? 1 : 0;

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
    const scale = Math.min(w, h) / 480;
    ctx.save();
    ctx.translate(w / 2, h / 2 + 10 * scale);
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

    let budget = TOTAL * Math.min(1, progress * 1.02);
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
  if (prefersReduced) {
    steps[steps.length - 1].classList.add("is-active");
    return;
  }
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

/* Section titles get a soft parallax drift */
if (!prefersReduced) {
  gsap.utils.toArray(".contacto-title, .firma-title").forEach((el) => {
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
document.getElementById("year").textContent = new Date().getFullYear();
document.getElementById("toTop").addEventListener("click", () => scrollToTarget("#hero"));

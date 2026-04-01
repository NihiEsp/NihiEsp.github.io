/* ============================================================
   animations.js
   Owns: marquee population, hero letter animation,
         magnetic card tilt, GSAP scroll reveals, nav scroll state
   Exports: initAnimations() — called by enter.js
   Depends on: GSAP + ScrollTrigger (global CDN)
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);

/* ── Populate marquee ────────────────────────────────────── */
(function populateMarquee() {
  const track = document.getElementById('marquee-track');
  if (!track) return;

  const MARQUEE_IMAGES = Array.from({ length: 12 }, (_, i) => ({
    src: 'pictures/picture1.png',
    alt: `visual ${i + 1}`
  }));

  const html = MARQUEE_IMAGES.map(img =>
    `<img src="${img.src}" alt="${img.alt}" class="marquee-img" onerror="this.style.display='none'">`
  ).join('');

  track.innerHTML = html + html;
})();


/* ── Nav scroll state ────────────────────────────────────── */
(function initNavScroll() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
})();


/* ── Bento clock ────────────────────────────────────────── */
(function initBentoClock() {
  const el = document.getElementById('bento-clock');
  if (!el) return;
  function tick() {
    const now = new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/Warsaw', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    el.textContent = now;
  }
  tick();
  setInterval(tick, 1000);
})();


/* ── initAnimations — called once by startExperience() ───── */
function initAnimations() {

  /* Hero letters stagger up */
  gsap.fromTo('.hero-letter',
    { y: '120%', opacity: 0 },
    {
      y: '0%', opacity: 1,
      duration: 1.4, stagger: 0.07,
      ease: 'power4.out', delay: 0.1
    }
  );

  /* Hero eyebrow + tag */
  gsap.fromTo('.gs-hero-sub',
    { y: 24, opacity: 0 },
    { y: 0, opacity: 1, duration: 1.2, stagger: 0.15, ease: 'power3.out', delay: 0.5 }
  );

  /* Hero scroll hint */
  gsap.to('#hero-scroll', { opacity: 1, duration: 1.2, ease: 'power2.out', delay: 1.6 });

  /* Nav + misc reveal elements */
  gsap.fromTo('.gs-reveal',
    { y: 16, opacity: 0 },
    { y: 0, opacity: 1, duration: 1, stagger: 0.08, ease: 'power2.out', delay: 0.7 }
  );

  /* Hero background lines fade in */
  gsap.fromTo('.hero-bg-line, .hero-corner',
    { opacity: 0 },
    { opacity: 1, duration: 2, ease: 'power2.out', delay: 0.4 }
  );

  /* Section headers — scroll-triggered */
  gsap.utils.toArray('.gs-fade-up').forEach(elem => {
    gsap.fromTo(elem,
      { y: 40, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 1.2, ease: 'power3.out',
        scrollTrigger: { trigger: elem, start: 'top 88%', toggleActions: 'play none none reverse' }
      }
    );
  });

  /* Currently cards */
  gsap.fromTo('.gs-bento',
    { y: 50, opacity: 0 },
    {
      y: 0, opacity: 1, duration: 1, stagger: 0.12, ease: 'power3.out',
      scrollTrigger: { trigger: '.currently-grid', start: 'top 85%' }
    }
  );

  /* Bento cards */
  gsap.fromTo('.bento .bento-card',
    { y: 50, opacity: 0 },
    {
      y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: '.bento', start: 'top 85%' }
    }
  );

  /* Project cards — staggered slide-up */
  gsap.fromTo('.gs-project',
    { y: 60, opacity: 0 },
    {
      y: 0, opacity: 1, duration: 0.9, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: '.project-grid', start: 'top 85%' }
    }
  );

  /* Marquee parallax */
  gsap.to('.marquee-wrapper', {
    yPercent: 8, ease: 'none',
    scrollTrigger: {
      trigger: '.marquee-wrapper',
      start: 'top bottom', end: 'bottom top', scrub: true
    }
  });

  /* Hero title subtle parallax */
  gsap.to('.hero-title', {
    yPercent: -20, ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top', end: 'bottom top', scrub: true
    }
  });

  /* Magnetic letter hover */
  _initHeroMagnetic();

  /* Card tilt */
  _initCardTilt();
}


/* ── Magnetic hover on hero letters ─────────────────────── */
function _initHeroMagnetic() {
  document.querySelectorAll('.hero-letter').forEach(letter => {
    letter.addEventListener('mousemove', e => {
      const r  = letter.getBoundingClientRect();
      const cx = r.left + r.width  / 2;
      const cy = r.top  + r.height / 2;
      const dx = (e.clientX - cx) / (r.width  / 2) * 28;
      const dy = (e.clientY - cy) / (r.height / 2) * 16;
      gsap.to(letter, { x: dx, y: dy, duration: 0.3, ease: 'power2.out', overwrite: true });
    });
    letter.addEventListener('mouseleave', () => {
      gsap.to(letter, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)', overwrite: true });
    });
  });
}


/* ── 3-D tilt on cards ───────────────────────────────────── */
function _initCardTilt() {
  const TILT_MAX = 8;

  document.querySelectorAll('.bento-card, .project-card, .curr-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const cx = r.left + r.width  / 2;
      const cy = r.top  + r.height / 2;
      const rx = ((e.clientY - cy) / (r.height / 2)) * -TILT_MAX;
      const ry = ((e.clientX - cx) / (r.width  / 2)) *  TILT_MAX;
      gsap.to(card, {
        rotateX: rx, rotateY: ry,
        transformPerspective: 900,
        duration: 0.4, ease: 'power2.out', overwrite: true
      });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'power3.out', overwrite: true });
    });
  });
}

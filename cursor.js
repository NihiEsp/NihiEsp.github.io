/* ============================================================
   cursor.js
   Two-layer custom cursor:
     • .cursor-dot  — 8px filled circle, instant follow
     • .cursor-ring — 36px ring, lerped at 0.12 ease
   Ring scales up on hover over interactive elements.
   Disabled on touch/no-hover devices.
   ============================================================ */

(function initCursor() {
  // Skip entirely on touch devices
  if (window.matchMedia('(hover: none)').matches) return;

  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  let mx = -200, my = -200;  // mouse position
  let rx = -200, ry = -200;  // ring position (lerped)
  let visible = false;
  let ringActive = false;

  // Reveal on first move
  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    if (!visible) {
      visible = true;
      dot.style.opacity  = '1';
      ring.style.opacity = '1';
      rx = mx; ry = my;
    }
  }, { passive: true });

  // Hide when pointer leaves window
  document.addEventListener('mouseleave', () => {
    dot.style.opacity  = '0';
    ring.style.opacity = '0';
    visible = false;
  });

  // Grow ring on interactive elements
  const SELECTOR = 'a, button, .bento-card, .curr-card, .project-card, .project-thumb-link, input, [onclick], .music-trigger, .theme-toggle, .ctrl-btn, .play-btn, .panel-close';

  document.addEventListener('mouseover', e => {
    if (e.target.closest(SELECTOR)) {
      ring.classList.add('cursor-hover');
      ringActive = true;
    }
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(SELECTOR)) {
      ring.classList.remove('cursor-hover');
      ringActive = false;
    }
  });

  // Click feedback
  document.addEventListener('mousedown', () => dot.classList.add('cursor-click'));
  document.addEventListener('mouseup',   () => dot.classList.remove('cursor-click'));

  // RAF loop
  const DOT_OFF  = 4;   // half of dot size (8px)
  const RING_OFF = 18;  // half of ring size (36px) — updated via CSS when hovering
  const LERP     = 0.12;

  function tick() {
    // Lerp ring toward mouse
    rx += (mx - rx) * LERP;
    ry += (my - ry) * LERP;

    const rOff = ringActive ? 26 : RING_OFF; // 52px / 2 when hovered

    dot.style.transform  = `translate(${mx - DOT_OFF}px, ${my - DOT_OFF}px)`;
    ring.style.transform = `translate(${rx - rOff}px, ${ry - rOff}px)`;

    requestAnimationFrame(tick);
  }
  tick();
})();

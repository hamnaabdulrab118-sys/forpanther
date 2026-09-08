// ═══════════════════════════════════════════════════════════════════════
// Animated month-theme backgrounds. Each entry adapts one of the CodePen
// assets the owner picked into a small `{ mount(container) → unmount }`
// scene, rendered into the PERSISTENT #theme-bg div (see index.html) that
// lives outside #root — since app.js replaces #root's innerHTML on nearly
// every action, anything living inside it would restart constantly.
//
// mountMonthScene() is safe to call on every render: it no-ops if the
// requested month is already mounted, so re-renders don't restart scenes.
// ═══════════════════════════════════════════════════════════════════════

const SCENES = {};
let current = null; // { key, unmount }

export function hasScene(key) {
  return !!SCENES[key];
}

export function mountMonthScene(key, container) {
  if (!container) return;
  if (current && current.key === key) return; // already showing this one
  unmountMonthScene();
  const scene = SCENES[key];
  if (!scene) return;
  container.innerHTML = '';
  container.style.background = '';
  try {
    const unmount = scene.mount(container);
    current = { key, unmount: typeof unmount === 'function' ? unmount : null };
  } catch (e) {
    console.error(`❌ Month scene "${key}" failed to mount:`, e);
  }
}

export function unmountMonthScene() {
  if (!current) return;
  try { current.unmount && current.unmount(); } catch (e) { console.error(e); }
  const el = document.getElementById('theme-bg');
  if (el) { el.innerHTML = ''; el.style.background = ''; }
  current = null;
}

function fullCanvas(container) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
  container.appendChild(canvas);
  return canvas;
}
const rand = (min, max) => Math.random() * (max - min) + min;

// ── January: Snow ────────────────────────────────────────────────────────
// Adapted from "a-bit-of-snow-for-the-scene" — simplified falling-snow
// particles; its original Pinterest-hosted background photo is replaced
// with a plain gradient so nothing depends on a third-party image host.
SCENES.january = {
  mount(container) {
    container.style.background = 'linear-gradient(180deg,#020810 0%,#0a1a2e 45%,#13324d 100%)';
    const canvas = fullCanvas(container);
    const ctx = canvas.getContext('2d');
    let width, height, particles;

    function makeParticles() {
      particles = Array.from({ length: 150 }, () => ({
        x: rand(0, width), y: rand(0, height), r: rand(2, 6),
        vy: rand(0.3, 1.1), vx: rand(-0.3, 0.3), a: rand(0.3, 0.9),
      }));
    }
    function resize() {
      width = canvas.width = container.clientWidth || window.innerWidth;
      height = canvas.height = container.clientHeight || window.innerHeight;
      makeParticles();
    }
    resize();
    window.addEventListener('resize', resize);

    let animId;
    (function tick() {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      for (const p of particles) {
        ctx.globalAlpha = p.a;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        p.y += p.vy;
        p.x += p.vx;
        if (p.y - p.r > height) { p.y = -10; p.x = rand(0, width); }
      }
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(tick);
    })();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  },
};

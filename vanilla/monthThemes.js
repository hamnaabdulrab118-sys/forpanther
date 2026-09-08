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

// Loads a pre-built pen's own style.css + scene.html (copied verbatim into
// vanilla/themes/<key>/) inside a Shadow DOM, so its own class names (and
// any `body { ... }` rule it assumes it owns) can never collide with or leak
// into the rest of the app. `entranceClass`, if given, starts on the wrapper
// and is removed after `entranceDelay`ms to trigger a load-in animation that
// the pen gates behind that class (mirroring what its own script.js did to
// `document.body`).
function mountStaticPen(key, wrapperStyle, { entranceClass, entranceDelay = 300 } = {}) {
  return function mount(container) {
    let aborted = false;
    let timeoutId = null;
    const shadow = container.attachShadow({ mode: 'open' });
    Promise.all([
      fetch(`themes/${key}/style.css`).then(r => r.text()),
      fetch(`themes/${key}/scene.html`).then(r => r.text()),
    ]).then(([css, html]) => {
      if (aborted) return;
      const styleEl = document.createElement('style');
      styleEl.textContent = css;
      const wrap = document.createElement('div');
      if (entranceClass) wrap.className = entranceClass;
      wrap.style.cssText = wrapperStyle;
      wrap.innerHTML = html;
      shadow.appendChild(styleEl);
      shadow.appendChild(wrap);
      if (entranceClass) {
        timeoutId = setTimeout(() => { if (!aborted) wrap.classList.remove(entranceClass); }, entranceDelay);
      }
    }).catch(e => console.error(`❌ Month scene "${key}" failed to load:`, e));
    return () => {
      aborted = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  };
}

// ── March: Blossoming flowers at night ──────────────────────────────────
SCENES.march = {
  mount: mountStaticPen(
    'march',
    'display:flex;align-items:flex-end;justify-content:center;width:100%;height:100%;background:#000;overflow:hidden;perspective:1000px;position:absolute;inset:0;',
    { entranceClass: 'not-loaded', entranceDelay: 300 }
  ),
};

// ── September: Dinosaur hatching from an egg ────────────────────────────
SCENES.september = {
  mount: mountStaticPen(
    'september',
    'position:absolute;inset:0;background:linear-gradient(180deg,#1a0d02 0%,#3d2008 45%,#5c3010 100%);overflow:hidden;'
  ),
};

// ── April: Clouds ────────────────────────────────────────────────────────
// Adapted from "cloud-generator" — kept the SVG feTurbulence-filtered cloud
// shape, dropped the drag/resize/weather-slider interactivity (this is an
// ambient background, not a toy) and added a slow drift animation instead.
SCENES.april = {
  mount(container) {
    const shadow = container.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      .wrap { position:absolute; inset:0; overflow:hidden; background:linear-gradient(0deg,#62a0d8 0%,#2178d1 50%,#085cb3 100%); }
      svg.deffilter { width:0; height:0; position:absolute; }
      .cloud-container { position:absolute; inset:0; filter:url(#april-cloud-filter); }
      .cloud { width:680px; height:280px; background:#fff; border-radius:50%; position:absolute; top:45%; left:50%; transform:translate(-50%,-50%); animation:driftA 40s ease-in-out infinite alternate; }
      .cloud2 { width:420px; height:180px; top:65%; left:25%; animation:driftB 55s ease-in-out infinite alternate; opacity:0.85; }
      @keyframes driftA { from { transform:translate(-54%,-50%); } to { transform:translate(-46%,-52%); } }
      @keyframes driftB { from { transform:translate(-50%,-48%); } to { transform:translate(-46%,-52%); } }
    `;
    const wrap = document.createElement('div');
    wrap.className = 'wrap';
    wrap.innerHTML = `
      <svg class="deffilter" xmlns="http://www.w3.org/2000/svg">
        <filter id="april-cloud-filter" x="-50%" y="-50%" width="200%" height="200%" style="color-interpolation-filters:sRGB">
          <feTurbulence type="fractalNoise" seed="462" baseFrequency="0.011" numOctaves="5" result="noise1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="20" />
          <feDisplacementMap in="blur1" scale="100" in2="noise1" result="cloud1" />
          <feFlood flood-color="rgb(215,215,215)" flood-opacity="0.2" />
          <feComposite operator="in" in2="SourceGraphic" />
          <feOffset dx="-10" dy="-3" />
          <feMorphology radius="20" />
          <feGaussianBlur stdDeviation="20" />
          <feDisplacementMap scale="100" in2="noise1" result="cloud2" />
          <feMerge>
            <feMergeNode in="cloud1" />
            <feMergeNode in="cloud2" />
          </feMerge>
        </filter>
      </svg>
      <div class="cloud-container">
        <div class="cloud"></div>
        <div class="cloud cloud2"></div>
      </div>
    `;
    shadow.appendChild(style);
    shadow.appendChild(wrap);
    return () => {};
  },
};

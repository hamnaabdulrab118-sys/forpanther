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

// ── August: Jellyfish in the ocean ──────────────────────────────────────
// Adapted from "jellyfish-in-the-ocean-animation" — self-contained inline
// SVG jellyfish (GSAP swim timeline) over a Canvas2D bubble field.
SCENES.august = {
  mount(container) {
    let aborted = false;
    let animId = null;
    let tl = null;
    let resizeHandler = null;
    const shadow = container.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      .wrap { position:absolute; inset:0; overflow:hidden; background:linear-gradient(#17a2b8, #072324); }
      .container { width:100%; height:100%; position:relative; }
      svg.jellyfish { width:100%; height:100%; max-width:200px; max-height:200px; position:absolute; bottom:10vh; left:50%; transform:translateX(-50%); overflow:visible; }
      canvas#bubbles-canvas { position:absolute; width:100%; height:100%; top:0; left:0; pointer-events:none; }
    `;
    const wrap = document.createElement('div');
    wrap.className = 'wrap';
    shadow.appendChild(style);
    shadow.appendChild(wrap);

    fetch('themes/august/scene.html').then(r => r.text()).then(html => {
      if (aborted) return;
      wrap.innerHTML = html;
      const canvas = wrap.querySelector('#bubbles-canvas');
      const ctx = canvas.getContext('2d');

      // Bubbles (adapted from the pen's Bubble()/InitBubbles())
      const fillArray = ['rgba(138, 204, 197, ', 'rgba(62, 173, 178, ', 'rgba(0, 79, 88, ', 'rgba(0, 107, 118, '];
      const rnd2 = (min, max) => min + Math.random() * (max - min);
      const makeBubble = (h) => {
        const b = {
          x: rnd2(0, canvas.offsetWidth), y: rnd2(0, h), alpha: rnd2(0, 1),
          fill: fillArray[Math.floor(Math.random() * fillArray.length)],
          radius: rnd2(0.3, 7), angle: rnd2(-1, 1), density: rnd2(0, 1000), speed: 0, wind: 0,
        };
        return b;
      };
      let bubbles = [];
      function resize() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        bubbles = Array.from({ length: 100 }, () => makeBubble(container.clientHeight || window.innerHeight));
      }
      resizeHandler = resize;
      resize();
      window.addEventListener('resize', resizeHandler);

      function tick() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const b of bubbles) {
          b.angle += 0.02;
          if (b.y < 0) {
            b.y = canvas.height;
            b.x = rnd2(0, canvas.width);
          } else {
            b.y -= b.speed;
            b.x += b.wind;
            b.speed = 0.02 * (Math.cos(b.angle + b.density) + 1 + b.radius * 3);
            b.wind = 0.1 * (Math.sin(b.angle) * 2);
          }
          ctx.beginPath();
          ctx.strokeStyle = b.fill + '1)';
          ctx.lineWidth = 1;
          ctx.arc(b.x, b.y, b.radius, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.fillStyle = b.fill + b.alpha + ')';
          ctx.fill();
          ctx.closePath();
        }
        animId = requestAnimationFrame(tick);
      }
      tick();

      // Jellyfish swim (GSAP timeline, ported from the pen's script.js)
      if (window.gsap) {
        const jellyFish = wrap.querySelector('.jellyfish');
        const leftLeg = jellyFish.querySelector('#left-leg');
        const rightLeg = jellyFish.querySelector('#right-leg');
        const head = jellyFish.querySelector('#head');
        tl = window.gsap.timeline({ repeat: -1, repeatDelay: 2 })
          .to(jellyFish, { duration: 2, transformOrigin: '0% 0%', xPercent: '-=10', yPercent: '-=20', ease: 'Power2.easeOut', rotation: -3 }, 0.5)
          .to(jellyFish, { duration: 4, yPercent: 0, xPercent: 0, ease: 'Power1.easeInOut', rotation: 0 })
          .to(head, { duration: 1.5, transformOrigin: '50% 50%', scaleY: 1.2, scaleX: 0.9, yoyo: true, repeat: 1, yoyoEase: 'Power1.easeInOut', ease: 'Power2.easeOut' }, 0)
          .to(leftLeg, { transformOrigin: '100% 0', duration: 2, rotation: -25, yoyo: true, repeat: 1, ease: 'Power3.easeOut' }, 0.5)
          .to(rightLeg, { transformOrigin: '0 0', duration: 2, rotation: 25, yoyo: true, repeat: 1, ease: 'Power3.easeOut' }, 1);
      }
    }).catch(e => console.error('❌ August scene failed to load:', e));

    return () => {
      aborted = true;
      if (animId) cancelAnimationFrame(animId);
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      if (tl) tl.kill();
    };
  },
};

// ── June: Tides — cinematic ocean ───────────────────────────────────────
// Adapted from "tidesa-cinematic-canvas-ocean" — the full sky/sun/ocean-swell
// canvas render is kept close to the original (it's excellent as-is); the
// manual time-of-day slider and mouse-follow sun are dropped (not right for
// a passive background) and replaced with the day slowly drifting on its own.
SCENES.june = {
  mount(container) {
    const canvas = fullCanvas(container);
    const ctx = canvas.getContext('2d');
    let W, H, DPR, horizonY, oceanH;
    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = container.clientWidth || window.innerWidth;
      H = container.clientHeight || window.innerHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      horizonY = H * 0.42;
      oceanH = H - horizonY;
    }
    window.addEventListener('resize', resize);
    resize();

    const KEYS = [
      { t: 0.0, skyTop: [38, 44, 86], skyHor: [247, 176, 128], sun: [255, 238, 206], glow: [255, 178, 120], wFar: [176, 150, 150], wNear: [34, 62, 84], foam: [255, 244, 234], sunH: 0.1, glit: 0.7, star: 0 },
      { t: 0.28, skyTop: [64, 134, 206], skyHor: [188, 222, 236], sun: [255, 255, 246], glow: [255, 250, 224], wFar: [120, 186, 196], wNear: [20, 92, 114], foam: [255, 255, 255], sunH: 0.55, glit: 0.5, star: 0 },
      { t: 0.5, skyTop: [58, 142, 214], skyHor: [176, 216, 230], sun: [255, 255, 248], glow: [255, 252, 232], wFar: [96, 178, 188], wNear: [16, 96, 120], foam: [255, 255, 255], sunH: 0.92, glit: 0.45, star: 0 },
      { t: 0.68, skyTop: [74, 92, 156], skyHor: [255, 202, 120], sun: [255, 236, 194], glow: [255, 168, 92], wFar: [206, 164, 118], wNear: [34, 78, 98], foam: [255, 244, 228], sunH: 0.3, glit: 0.95, star: 0 },
      { t: 0.84, skyTop: [48, 38, 86], skyHor: [255, 108, 68], sun: [255, 206, 148], glow: [255, 92, 58], wFar: [188, 98, 84], wNear: [30, 42, 72], foam: [255, 222, 200], sunH: 0.06, glit: 1.0, star: 0.15 },
      { t: 1.0, skyTop: [8, 12, 30], skyHor: [34, 44, 82], sun: [228, 234, 255], glow: [140, 164, 216], wFar: [28, 42, 76], wNear: [6, 16, 32], foam: [196, 208, 234], sunH: 0.55, glit: 0.55, star: 1 },
    ];
    const lerp = (a, b, t) => a + (b - a) * t;
    const lerpRGB = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
    const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
    function getPalette(t) {
      let i = 0;
      while (i < KEYS.length - 1 && t > KEYS[i + 1].t) i++;
      const a = KEYS[i], b = KEYS[Math.min(i + 1, KEYS.length - 1)];
      const span = b.t - a.t || 1;
      const k = Math.max(0, Math.min(1, (t - a.t) / span));
      return {
        skyTop: lerpRGB(a.skyTop, b.skyTop, k), skyHor: lerpRGB(a.skyHor, b.skyHor, k),
        sun: lerpRGB(a.sun, b.sun, k), glow: lerpRGB(a.glow, b.glow, k),
        wFar: lerpRGB(a.wFar, b.wFar, k), wNear: lerpRGB(a.wNear, b.wNear, k),
        foam: lerpRGB(a.foam, b.foam, k), sunH: lerp(a.sunH, b.sunH, k),
        glit: lerp(a.glit, b.glit, k), star: lerp(a.star, b.star, k),
      };
    }

    const stars = Array.from({ length: 140 }, () => ({ x: Math.random(), y: Math.random() * 0.4, r: Math.random() * 1.2 + 0.3, tw: Math.random() * Math.PI * 2 }));
    const clouds = Array.from({ length: 5 }, () => ({ x: Math.random(), y: 0.08 + Math.random() * 0.18, w: 0.18 + Math.random() * 0.22, speed: 0.000015 + Math.random() * 0.00002 }));
    const birds = Array.from({ length: 4 }, () => ({ x: Math.random(), y: 0.15 + Math.random() * 0.18, speed: 0.00004 + Math.random() * 0.00004, size: 8 + Math.random() * 6, flap: Math.random() * Math.PI * 2 }));

    let timeOfDay = 0.6; // starts at Golden Hour, drifts slowly on its own
    let T = 0;
    let animId;

    function draw() {
      T += 0.016;
      timeOfDay = (timeOfDay + 0.00004) % 1; // one full day/night cycle every ~7 minutes
      const P = getPalette(timeOfDay);
      const sunX = W * 0.5;
      const sunY = horizonY - P.sunH * horizonY * 0.82;

      const sky = ctx.createLinearGradient(0, 0, 0, horizonY + oceanH * 0.1);
      sky.addColorStop(0, rgb(P.skyTop));
      sky.addColorStop(0.7, rgb(lerpRGB(P.skyTop, P.skyHor, 0.55)));
      sky.addColorStop(1, rgb(P.skyHor));
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, horizonY + 2);

      if (P.star > 0.01) {
        stars.forEach((s) => {
          const tw = 0.5 + 0.5 * Math.sin(T * 2 + s.tw);
          ctx.fillStyle = rgb([255, 255, 255], P.star * tw * 0.9);
          ctx.beginPath();
          ctx.arc(s.x * W, s.y * horizonY, s.r, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      const glowR = Math.min(W, H) * 0.5;
      const g = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, glowR);
      g.addColorStop(0, rgb(P.glow, 0.55));
      g.addColorStop(0.25, rgb(P.glow, 0.22));
      g.addColorStop(1, rgb(P.glow, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, horizonY + oceanH * 0.4);

      const sunR = Math.min(W, H) * 0.045;
      const sd = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR);
      sd.addColorStop(0, rgb(P.sun, 1));
      sd.addColorStop(0.7, rgb(P.sun, 0.95));
      sd.addColorStop(1, rgb(P.sun, 0.2));
      ctx.fillStyle = sd;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
      ctx.fill();

      clouds.forEach((c) => {
        c.x += c.speed;
        if (c.x > 1.3) c.x = -0.3;
        const cx = c.x * W, cy = c.y * horizonY, cw = c.w * W;
        ctx.fillStyle = rgb(lerpRGB(P.skyHor, [255, 255, 255], 0.25), 0.16);
        for (let j = 0; j < 4; j++) {
          ctx.beginPath();
          ctx.ellipse(cx + j * cw * 0.22, cy + Math.sin(j) * 6, cw * (0.3 - j * 0.04), cw * 0.06, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      birds.forEach((b) => {
        b.x += b.speed;
        b.flap += 0.15;
        if (b.x > 1.2) { b.x = -0.2; b.y = 0.15 + Math.random() * 0.18; }
        const bx = b.x * W, by = b.y * horizonY;
        const wing = Math.sin(b.flap) * b.size * 0.5;
        ctx.strokeStyle = rgb(lerpRGB(P.skyTop, [0, 0, 0], 0.3), 0.5);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bx - b.size, by + wing);
        ctx.quadraticCurveTo(bx, by - b.size * 0.3, bx, by);
        ctx.quadraticCurveTo(bx, by - b.size * 0.3, bx + b.size, by + wing);
        ctx.stroke();
      });

      const haze = ctx.createLinearGradient(0, horizonY - 40, 0, horizonY + 40);
      haze.addColorStop(0, rgb(P.skyHor, 0));
      haze.addColorStop(0.5, rgb(P.skyHor, 0.45));
      haze.addColorStop(1, rgb(P.wFar, 0));
      ctx.fillStyle = haze;
      ctx.fillRect(0, horizonY - 40, W, 80);

      const NUM = 26;
      for (let i = 0; i < NUM; i++) {
        const depth = i / (NUM - 1);
        const yTop = horizonY + Math.pow(depth, 1.9) * oceanH;
        const amp = lerp(0.6, 30, depth);
        const wlen = lerp(46, 340, depth);
        const speed = lerp(0.25, 0.9, depth);
        const phase = T * speed + i * 0.9;
        const col = lerpRGB(P.wFar, P.wNear, depth);

        ctx.beginPath();
        ctx.moveTo(0, H);
        ctx.lineTo(0, yTop + Math.sin(phase) * amp);
        for (let x = 0; x <= W; x += 6) {
          const y = yTop + Math.sin(x / wlen + phase) * amp + Math.sin(x / (wlen * 0.4) + phase * 1.6) * amp * 0.3;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fillStyle = rgb(col);
        ctx.fill();

        ctx.lineWidth = lerp(0.6, 2.2, depth);
        ctx.beginPath();
        let started = false;
        for (let x = 0; x <= W; x += 6) {
          const y = yTop + Math.sin(x / wlen + phase) * amp + Math.sin(x / (wlen * 0.4) + phase * 1.6) * amp * 0.3;
          started ? ctx.lineTo(x, y) : (ctx.moveTo(x, y), (started = true));
        }
        const sunCloseness = 1 - Math.min(1, Math.abs(sunX - W * 0.5) / (W * 0.5));
        ctx.strokeStyle = rgb(lerpRGB(col, P.sun, 0.55), lerp(0.05, 0.3, depth));
        ctx.stroke();

        if (depth > 0.62) {
          const foamA = (depth - 0.62) / 0.38;
          for (let x = 0; x <= W; x += 9) {
            const y = yTop + Math.sin(x / wlen + phase) * amp + Math.sin(x / (wlen * 0.4) + phase * 1.6) * amp * 0.3;
            const crest = Math.sin(x / wlen + phase);
            if (crest > 0.55 && Math.random() > 0.45) {
              ctx.fillStyle = rgb(P.foam, foamA * (0.18 + Math.random() * 0.35));
              ctx.fillRect(x + (Math.random() - 0.5) * 6, y - Math.random() * 3, 1.5 + Math.random() * 3, 1.5 + Math.random() * 2);
            }
          }
        }
      }

      const glitterCount = 220;
      for (let i = 0; i < glitterCount; i++) {
        const dy = Math.random();
        const y = horizonY + Math.pow(dy, 1.5) * oceanH;
        const spread = lerp(6, W * 0.3, dy);
        const x = sunX + (Math.random() - 0.5) * 2 * spread;
        const distFade = 1 - Math.min(1, Math.abs(x - sunX) / (spread + 1));
        const flick = 0.25 + Math.random() * 0.75;
        const a = distFade * distFade * flick * P.glit * (1 - dy * 0.25);
        if (a < 0.02) continue;
        ctx.fillStyle = rgb(P.sun, a * 0.85);
        const len = 1 + Math.random() * (2 + dy * 4);
        ctx.fillRect(x, y, len, 1 + dy);
      }

      const vig = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.25, W / 2, H * 0.55, H * 0.9);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,8,0.34)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  },
};

// ── July: Fireflies in the night sky ────────────────────────────────────
// Adapted from "fireflies-in-the-night-sky" (jQuery .animate() driven).
// Not put in a Shadow DOM like the other transplanted pens — jQuery's
// selector engine can't reach into shadow roots — so everything here is
// namespaced under #july-sky / .july-* to stay safely out of the rest of
// the app's styles instead.
SCENES.july = {
  mount(container) {
    let aborted = false;
    const $ = window.jQuery;
    if (!$) { console.error('❌ July scene: jQuery not loaded'); return () => {}; }

    const style = document.createElement('style');
    style.textContent = `
      #july-sky { position:absolute; inset:0; overflow:hidden; background:linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,2,50,1) 100%); }
      #july-sky .july-star { position:absolute; height:2px; width:2px; border-radius:50%; filter:blur(1px); }
      #july-sky .july-fly-template { display:none; }
      #july-sky .july-fly { background-color:rgb(30,30,30); position:absolute; height:15px; width:6.5px; border-radius:30%; transform:rotateZ(-40deg); z-index:300; }
      #july-sky .july-fly.flip { transform:rotateZ(30deg) rotateY(180deg); }
      #july-sky .july-eye { width:4px; height:2px; position:absolute; top:-4px; left:0; border-radius:50%; background:darkslategray; transform:rotateZ(10deg); }
      #july-sky .july-fly::after { width:7px; height:5px; content:""; position:absolute; top:-4px; left:-3px; border-radius:50%; background-color:inherit; transform-origin:bottom center; transform:rotateZ(30deg); }
      #july-sky .july-fly::before { width:6px; height:12px; content:""; position:absolute; top:10px; left:1.5px; border-radius:50%; background-color:inherit; transform-origin:top center; transform:rotateZ(20deg); }
      #july-sky .july-leg { width:6px; height:1px; position:absolute; top:6px; left:-6px; border-radius:1px; background:inherit; transform-origin:right; transform:rotateZ(-20deg); }
      #july-sky .july-leg:nth-child(2) { margin-top:-3px; }
      #july-sky .july-leg:nth-child(4) { margin-top:3px; }
      #july-sky .july-wing { width:8px; height:24px; position:absolute; top:0; left:1px; border-radius:50%; background:inherit; opacity:.5; transform-origin:top center; transform:rotateZ(-20deg); box-sizing:border-box; border:solid 1px aliceblue; animation:july-flap .1s linear infinite; }
      #july-sky .july-light { position:absolute; border-radius:50%; height:10px; width:10px; top:14px; left:-3px; filter:blur(5px); background-color:lawngreen; z-index:10000; animation:july-blinky 10s ease-in-out infinite; }
      @keyframes july-flap { 0%{transform:rotateZ(-30deg) rotateX(10deg) rotateY(40deg);} 50%{transform:rotateZ(-50deg) rotateX(30deg) rotateY(80deg);} 100%{transform:rotateZ(-10deg) rotateX(0) rotateY(0);} }
      @keyframes july-blinky { 21%,39%,45%,47%,53%{opacity:.1;} 26%,38%,40%,44%,46%,48%{opacity:1;} }
      @keyframes july-fade { 0%{opacity:.1;} 10%{opacity:.4;} 20%{opacity:.8;} 30%{opacity:1;} 70%{opacity:.8;} 80%{opacity:.4;} 90%{opacity:.1;} 100%{opacity:0;} }
    `;
    container.appendChild(style);
    const sky = document.createElement('div');
    sky.id = 'july-sky';
    sky.innerHTML = `
      <div class="july-fly-template">
        <div class="july-eye"></div>
        <div class="july-leg"></div><div class="july-leg"></div><div class="july-leg"></div><div class="july-leg"></div>
        <div class="july-wing"></div>
        <div class="july-light"></div>
      </div>
    `;
    container.appendChild(sky);

    let w, h;
    function resize() {
      w = container.clientWidth || window.innerWidth;
      h = container.clientHeight || window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function spawnStar() {
      if (aborted) return;
      const x = Math.max(Math.floor(Math.random() * w), 10);
      const y = Math.max(Math.floor(Math.random() * h), 10);
      const r = Math.max(Math.floor(Math.random() * 255), 200);
      const g = Math.max(Math.floor(Math.random() * 255), 200);
      const b = Math.max(Math.floor(Math.random() * 255), 200);
      const star = document.createElement('div');
      star.className = 'july-star';
      star.style.left = x + 'px';
      star.style.top = y + 'px';
      star.style.backgroundColor = `rgb(${r},${g},${b})`;
      sky.appendChild(star);
      if (Math.random() > 0.75) {
        const delay = Math.max(Math.round(Math.random() * 4000), 500);
        setTimeout(() => { if (!aborted) star.style.animation = 'july-fade 20s linear infinite'; }, delay);
      }
    }

    function moveFly($fly) {
      if (aborted) { $fly.stop(true); return; }
      const left = $fly.position().left;
      const top = $fly.position().top;
      const size = $fly.outerWidth() + 10;
      let dirH = parseInt($fly.attr('dirH'));
      let dirV = parseInt($fly.attr('dirV'));
      if (left >= w - size - 10 || left <= 10) dirH = -dirH;
      if (top >= h - size - 10 || top <= 10) dirV = -dirV;
      $fly.toggleClass('flip', dirH > 0);
      $fly.animate({ left: left + dirH, top: top + dirV }, 'fast', 'linear', function () {
        if (!aborted) setTimeout(() => moveFly($fly), 1);
      }).attr('dirH', dirH).attr('dirV', dirV);
    }

    function spawnFly() {
      if (aborted) return null;
      const multiple = Math.random() * 15;
      const dirH = Math.random() > 0.5 ? -multiple : multiple;
      const dirV = Math.random() > 0.5 ? -multiple : multiple;
      let r = Math.max(Math.floor(Math.random() * 255), 100);
      let g = Math.max(Math.floor(Math.random() * 255), 100);
      let b = Math.max(Math.floor(Math.random() * 255), 100);
      if (r === g) b = 0; else if (r === b) g = 0; else if (b === g) r = 0;
      const x = Math.max(Math.floor(Math.random() * w), 10);
      const y = Math.max(Math.floor(Math.random() * h), 10);

      const template = sky.querySelector('.july-fly-template');
      const flyEl = template.cloneNode(true);
      flyEl.classList.remove('july-fly-template');
      flyEl.classList.add('july-fly');
      flyEl.style.left = x + 'px';
      flyEl.style.top = y + 'px';
      flyEl.setAttribute('dirH', dirH);
      flyEl.setAttribute('dirV', dirV);
      const light = flyEl.querySelector('.july-light');
      light.style.backgroundColor = `rgb(${r},${g},${b})`;
      light.style.boxShadow = `inset 0 0 20px rgb(${r},${g},${b}), 0 0 10px rgb(${r},${g},${b})`;
      sky.appendChild(flyEl);
      $(flyEl).fadeIn();

      const delay = Math.max(Math.round(Math.random() * 1000), 500);
      setTimeout(() => {
        if (aborted) return;
        $(flyEl).fadeOut('slow', 'linear', () => flyEl.remove());
        moveFly($(spawnFly()));
      }, delay * 10);

      return flyEl;
    }

    for (let i = 0; i < 300; i++) spawnStar();
    for (let i = 0; i < 10; i++) {
      const delay = Math.max(Math.round(Math.random() * 1000), 500);
      setTimeout(() => { if (!aborted) moveFly($(spawnFly())); }, delay * 2);
    }

    return () => {
      aborted = true;
      window.removeEventListener('resize', resize);
    };
  },
};

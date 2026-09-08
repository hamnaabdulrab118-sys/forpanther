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

// ── October: Autumn forestation ─────────────────────────────────────────
// Adapted from "autumn-forestation" (Sameer Borate's algorithmic tree
// generator, GPL). The original grows one more tree per keypress; here a
// slow interval does that instead, since a background can't wait on input.
SCENES.october = {
  mount(container) {
    let aborted = false;
    const canvas = fullCanvas(container);
    container.style.background = 'burlywood';
    const ctx = canvas.getContext('2d');
    const AUTUMN_COLORS = ['#996655', '#cc6633', '#cc8844', '#cc8866', '#ff8833', '#ffbb55'];
    const treeNumbers = 10;
    let width, height;

    function branch(depth, treeHeight, spread, leaveType, leavesColor) {
      if (depth < 12) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -height / treeHeight);
        ctx.strokeStyle = '#3F3F3F';
        ctx.stroke();
        ctx.translate(0, -height / treeHeight);
        ctx.rotate(-(Math.random() * 0.1) + 0.1);
        if (Math.random() < spread) {
          const rotateLeft = (Math.random() * (4 - 3 + 1) + 3) * 0.1;
          const rotateRight = (Math.random() * (7 - 6 + 1) + 6) * 0.1;
          ctx.rotate(-rotateLeft);
          ctx.scale(0.7, 0.7);
          ctx.save();
          branch(depth + 1, treeHeight, spread, leaveType, leavesColor);
          ctx.restore();
          ctx.rotate(rotateRight);
          ctx.save();
          branch(depth + 1, treeHeight, spread, leaveType, leavesColor);
          ctx.restore();
        } else {
          branch(depth, treeHeight, spread, leaveType, leavesColor);
        }
      } else {
        ctx.fillStyle = leavesColor;
        ctx.fillRect(0, 0, leaveType, 200);
        ctx.stroke();
      }
    }
    function drawTree(index, treeHeight) {
      const leavesColor = AUTUMN_COLORS[Math.floor(Math.random() * AUTUMN_COLORS.length)];
      const spread = Math.max(0.3, Math.min(1, Math.random() * 10 || 0.6));
      ctx.save();
      ctx.translate(index * width / treeNumbers - (Math.random() * 100 - Math.random() * 100), height);
      ctx.lineWidth = 1 + Math.random() * 10;
      ctx.lineJoin = 'round';
      branch(0, treeHeight, spread, 200, leavesColor);
      ctx.restore();
    }

    function resize() {
      width = canvas.width = container.clientWidth || window.innerWidth;
      height = canvas.height = container.clientHeight || window.innerHeight;
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < treeNumbers; i++) drawTree(i, 10);
    }
    resize();
    window.addEventListener('resize', resize);

    const growInterval = setInterval(() => {
      if (aborted) return;
      drawTree(Math.round(Math.random() * (treeNumbers + 1)), Math.round(Math.random() * (15 - 5 + 1) + 5));
    }, 4000);

    return () => {
      aborted = true;
      clearInterval(growInterval);
      window.removeEventListener('resize', resize);
    };
  },
};

// ── November: Dracula ───────────────────────────────────────────────────
// "invisible-draculas" is a scroll-triggered story (bats fly away as you
// scroll past them, revealing a vampire) built around specific copyrighted
// character images (Count Chocula, Sesame Street's Count, etc.) on a
// personal image host — none of that fits a fixed, looping ambient
// background. This is an original gothic bats-and-lightning scene instead,
// using emoji like the rest of the app rather than any character art.
const NOVEMBER_BATS = Array.from({ length: 10 }, () => ({
  y: rand(5, 70), delay: rand(0, 20), dur: rand(14, 24), size: rand(18, 34), reverse: Math.random() > 0.5,
}));
SCENES.november = {
  mount(container) {
    const shadow = container.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      .wrap { position:absolute; inset:0; overflow:hidden; background:radial-gradient(ellipse at 50% 20%,#2a0f1e 0%,#160812 55%,#0a0308 100%); }
      .moon { position:absolute; top:8%; right:12%; width:90px; height:90px; border-radius:50%; background:radial-gradient(circle at 35% 35%,#e8dcc8,#8a7a6a); box-shadow:0 0 50px rgba(200,180,150,0.35); }
      .bat { position:absolute; font-size:24px; animation-name:batFly; animation-timing-function:linear; animation-iteration-count:infinite; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.6)); }
      @keyframes batFly { 0% { transform:translateX(-10vw) translateY(0) scaleX(1); } 48% { transform:translateX(55vw) translateY(-30px) scaleX(1); } 50% { transform:translateX(58vw) translateY(-30px) scaleX(-1); } 100% { transform:translateX(110vw) translateY(10px) scaleX(-1); } }
      .bat.rev { animation-direction:reverse; }
      .flash { position:absolute; inset:0; background:rgba(220,210,255,0.5); opacity:0; animation:novFlash 9s ease-in-out infinite; }
      @keyframes novFlash { 0%,93%,100% { opacity:0; } 94%,96% { opacity:0.6; } 95% { opacity:0.1; } }
    `;
    const wrap = document.createElement('div');
    wrap.className = 'wrap';
    wrap.innerHTML = `<div class="moon"></div>${NOVEMBER_BATS.map(b =>
      `<span class="bat${b.reverse ? ' rev' : ''}" style="top:${b.y}%;font-size:${b.size}px;animation-duration:${b.dur}s;animation-delay:${b.delay}s;">🦇</span>`
    ).join('')}<div class="flash"></div>`;
    shadow.appendChild(style);
    shadow.appendChild(wrap);
    return () => {};
  },
};

// ── May: Rain & thunder ─────────────────────────────────────────────────
// Adapted from "threejs-rain-thunder" — kept the 3D rain/cloud/lightning
// scene as-is; its cloud texture (originally hotlinked from a stock-photo
// CDN — a licensing and reliability risk) is generated procedurally instead.
function makeCloudPuffTexture() {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  for (let i = 0; i < 7; i++) {
    const x = size / 2 + (Math.random() - 0.5) * size * 0.5;
    const y = size / 2 + (Math.random() - 0.5) * size * 0.5;
    const r = size * 0.22 + Math.random() * size * 0.16;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.5)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const g0 = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g0.addColorStop(0, 'rgba(255,255,255,0.85)');
  g0.addColorStop(0.5, 'rgba(255,255,255,0.4)');
  g0.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fillStyle = g0;
  ctx.fillRect(0, 0, size, size);
  return c;
}
SCENES.may = {
  mount(container) {
    if (typeof window.THREE === 'undefined') return () => {};
    const THREE = window.THREE;
    const canvas = fullCanvas(container);
    let animId, resizeHandler;

    const scene = new THREE.Scene();
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 1000);
    camera.position.z = 1;
    camera.rotation.set(1.16, -0.12, 0.27);

    scene.add(new THREE.AmbientLight(0x555555));
    const directionalLight = new THREE.DirectionalLight(0xffeedd);
    directionalLight.position.set(0, 0, 1);
    scene.add(directionalLight);
    const flash = new THREE.PointLight(0x062d89, 30, 500, 1.7);
    flash.position.set(200, 300, 100);
    scene.add(flash);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    scene.fog = new THREE.FogExp2(0x11111f, 0.002);
    renderer.setClearColor(scene.fog.color);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);

    const rainCount = 15000;
    const positions = [];
    for (let i = 0; i < rainCount; i++) {
      positions.push(Math.random() * 400 - 200, Math.random() * 500 - 250, Math.random() * 400 - 200);
    }
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    const rainMaterial = new THREE.PointsMaterial({ color: 0xaaaaaa, size: 0.4, transparent: true });
    const rain = new THREE.Points(rainGeo, rainMaterial);
    scene.add(rain);

    const cloudParticles = [];
    const cloudTex = new THREE.CanvasTexture(makeCloudPuffTexture());
    const CloudGeoCtor = THREE.PlaneBufferGeometry || THREE.PlaneGeometry;
    const cloudGeo = new CloudGeoCtor(500, 500);
    const cloudMaterial = new THREE.MeshLambertMaterial({ map: cloudTex, transparent: true, opacity: 0.6 });
    for (let p = 0; p < 25; p++) {
      const cloud = new THREE.Mesh(cloudGeo, cloudMaterial);
      cloud.position.set(Math.random() * 800 - 400, 500, Math.random() * 500 - 450);
      cloud.rotation.set(1.16, -0.12, Math.random() * 360);
      cloudParticles.push(cloud);
      scene.add(cloud);
    }

    function resize() {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    resizeHandler = resize;
    window.addEventListener('resize', resizeHandler);

    function tick() {
      cloudParticles.forEach((p) => { p.rotation.z -= 0.002; });
      rain.position.z -= 0.222;
      if (rain.position.z < -200) rain.position.z = 0;
      if (Math.random() > 0.93 || flash.power > 100) {
        if (flash.power < 100) flash.position.set(Math.random() * 400, 300 + Math.random() * 200, 100);
        flash.power = 50 + Math.random() * 500;
      }
      renderer.render(scene, camera);
      animId = requestAnimationFrame(tick);
    }
    tick();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeHandler);
      renderer.dispose();
      rainGeo.dispose();
      cloudGeo.dispose();
      cloudMaterial.dispose();
      cloudTex.dispose();
      rainMaterial.dispose();
    };
  },
};

// ── February: With Love ─────────────────────────────────────────────────
// Adapted from "with-love" — the floating heart-confetti and falling
// heart-snow particle shaders are kept close to the original math. The
// external GLB heart model, its matcap texture, the heart sprite PNG and
// the ukulele.mp3 track (all hosted on assets.codepen.io, built around a
// one-time "play music" button) don't fit a fixed, looping ambient
// background — replaced with a procedural heart mesh and a canvas-drawn
// heart sprite, no audio or manual controls.
function makeHeartSpriteTexture() {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  const top = size * 0.3;
  ctx.moveTo(size / 2, top);
  ctx.bezierCurveTo(size / 2, top - size * 0.3, size * 0.1, top - size * 0.05, size * 0.1, top + size * 0.05);
  ctx.bezierCurveTo(size * 0.1, size * 0.55, size * 0.35, size * 0.75, size / 2, size * 0.92);
  ctx.bezierCurveTo(size * 0.65, size * 0.75, size * 0.9, size * 0.55, size * 0.9, top + size * 0.05);
  ctx.bezierCurveTo(size * 0.9, top - size * 0.05, size / 2, top - size * 0.3, size / 2, top);
  ctx.closePath();
  ctx.fill();
  return c;
}
function heartShape2D(THREE) {
  const s = new THREE.Shape();
  s.moveTo(0.25, 0.25);
  s.bezierCurveTo(0.25, 0.25, 0.2, 0, 0, 0);
  s.bezierCurveTo(-0.3, 0, -0.3, 0.35, -0.3, 0.35);
  s.bezierCurveTo(-0.3, 0.55, -0.1, 0.77, 0.25, 0.95);
  s.bezierCurveTo(0.6, 0.77, 0.8, 0.55, 0.8, 0.35);
  s.bezierCurveTo(0.8, 0.35, 0.8, 0, 0.5, 0);
  s.bezierCurveTo(0.35, 0, 0.25, 0.25, 0.25, 0.25);
  return s;
}
const FEB_VERT_CONFETTI = `
  #define M_PI 3.1415926535897932384626433832795
  uniform float uTime;
  uniform float uSize;
  attribute float aScale;
  attribute vec3 aColor;
  attribute float random;
  attribute float random1;
  attribute float aSpeed;
  varying vec3 vColor;
  varying vec2 vUv;
  void main() {
    float sign = 2.0 * (step(random, 0.5) - .5);
    float t = sign * mod(-uTime * aSpeed * 0.005 + 10.0 * aSpeed * aSpeed, M_PI);
    float a = pow(t, 2.0) * pow((t - sign * M_PI), 2.0);
    float radius = 0.14;
    vec3 myOffset = vec3(radius * 16.0 * pow(sin(t), 2.0) * sin(t), radius * (13.0 * cos(t) - 5.0 * cos(2.0 * t) - 2.0 * cos(3.0 * t) - cos(4.0 * t)), .15 * (a * (random1 - .5)) * sin(abs(10.0 * (sin(.2 * uTime + .2 * random))) * t));
    vec4 modelPosition = modelMatrix * vec4(myOffset, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    viewPosition.xyz += position * aScale * uSize * pow(a, .5) * .5;
    gl_Position = projectionMatrix * viewPosition;
    vColor = aColor;
    vUv = uv;
  }
`;
const FEB_FRAG_CONFETTI = `
  varying vec3 vColor;
  varying vec2 vUv;
  void main() {
    vec2 uv = vUv;
    vec3 color = vColor;
    float strength = distance(uv, vec2(0.5));
    strength *= 2.0;
    strength = 1.0 - strength;
    gl_FragColor = vec4(strength * color, 1.0);
  }
`;
const FEB_VERT_SNOW = `
  #define M_PI 3.1415926535897932384626433832795
  uniform float uTime;
  uniform float uSize;
  attribute float aScale;
  attribute vec3 aColor;
  attribute float phi;
  attribute float random;
  attribute float random1;
  varying vec3 vColor;
  varying vec2 vUv;
  void main() {
    float angle = phi;
    float t = mod((-uTime + 100.0) * 0.06 * random1 + random * 2.0 * M_PI, 2.0 * M_PI);
    vec3 myOffset = vec3(5.85 * cos(angle * t), 2.0 * (t - M_PI), 3.0 * sin(angle * t / t));
    vec4 modelPosition = modelMatrix * vec4(myOffset, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    viewPosition.xyz += position * aScale * uSize;
    gl_Position = projectionMatrix * viewPosition;
    vColor = aColor;
    vUv = uv;
  }
`;
const FEB_FRAG_SNOW = `
  uniform sampler2D uTex;
  varying vec3 vColor;
  varying vec2 vUv;
  void main() {
    vec2 uv = vUv;
    vec3 color = vColor;
    float strength = distance(uv, vec2(0.5, .65));
    strength *= 2.0;
    strength = 1.0 - strength;
    vec3 tex = texture2D(uTex, uv).rgb;
    gl_FragColor = vec4(tex * color * (strength + .3), 1.0);
  }
`;
function makeInstancedSquares(THREE, count) {
  const square = new THREE.PlaneGeometry(1, 1);
  const geo = new THREE.InstancedBufferGeometry();
  Object.keys(square.attributes).forEach((attr) => { geo.attributes[attr] = square.attributes[attr]; });
  geo.index = square.index;
  geo.instanceCount = count;
  return geo;
}
SCENES.february = {
  mount(container) {
    if (typeof window.THREE === 'undefined') return () => {};
    const THREE = window.THREE;
    const canvas = fullCanvas(container);
    let animId, resizeHandler;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x16000a);
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.5);
    scene.add(camera);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffb6c1, 0.8);
    dirLight.position.set(1, 1, 2);
    scene.add(dirLight);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);

    const shape = heartShape2D(THREE);
    const extrudeSettings = { depth: 0.25, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 4, curveSegments: 24 };
    const heartGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    heartGeo.center();
    heartGeo.rotateZ(Math.PI);
    heartGeo.scale(0.9, 0.9, 0.9);
    const heartMat = new THREE.MeshStandardMaterial({ color: 0xff89ac, roughness: 0.35, metalness: 0.15 });
    const heartMesh = new THREE.Mesh(heartGeo, heartMat);
    scene.add(heartMesh);

    const confettiCount = 500;
    const colorChoices = [0xffffff, 0xff0000, 0xffc0cb, 0xdc143c, 0xff69b4, 0x2e8b57];
    const cScales = new Float32Array(confettiCount);
    const cColors = new Float32Array(confettiCount * 3);
    const cSpeeds = new Float32Array(confettiCount);
    const cRandom = new Float32Array(confettiCount);
    const cRandom1 = new Float32Array(confettiCount);
    for (let i = 0; i < confettiCount; i++) {
      cRandom[i] = Math.random();
      cRandom1[i] = Math.random();
      cScales[i] = Math.random() * 0.35;
      const col = new THREE.Color(colorChoices[Math.floor(Math.random() * colorChoices.length)]);
      cColors[i * 3] = col.r; cColors[i * 3 + 1] = col.g; cColors[i * 3 + 2] = col.b;
      cSpeeds[i] = Math.random() * 12.5 * Math.PI;
    }
    const confettiGeo = makeInstancedSquares(THREE, confettiCount);
    confettiGeo.setAttribute('random', new THREE.InstancedBufferAttribute(cRandom, 1));
    confettiGeo.setAttribute('random1', new THREE.InstancedBufferAttribute(cRandom1, 1));
    confettiGeo.setAttribute('aScale', new THREE.InstancedBufferAttribute(cScales, 1));
    confettiGeo.setAttribute('aSpeed', new THREE.InstancedBufferAttribute(cSpeeds, 1));
    confettiGeo.setAttribute('aColor', new THREE.InstancedBufferAttribute(cColors, 3));
    const confettiMat = new THREE.ShaderMaterial({
      vertexShader: FEB_VERT_CONFETTI, fragmentShader: FEB_FRAG_CONFETTI,
      uniforms: { uTime: { value: 0 }, uSize: { value: 0.2 } },
      depthWrite: false, blending: THREE.AdditiveBlending, transparent: true,
    });
    const confetti = new THREE.Mesh(confettiGeo, confettiMat);
    scene.add(confetti);

    const snowCount = 300;
    const snowColorChoices = [0xff0000, 0xffc0cb, 0xff69b4, 0x2e8b57];
    const sScales = new Float32Array(snowCount);
    const sColors = new Float32Array(snowCount * 3);
    const sPhi = new Float32Array(snowCount);
    const sRandom = new Float32Array(snowCount);
    const sRandom1 = new Float32Array(snowCount);
    for (let i = 0; i < snowCount; i++) {
      sPhi[i] = (Math.random() - 0.5) * 10;
      sRandom[i] = Math.random();
      sRandom1[i] = Math.random();
      sScales[i] = Math.random() * 0.35;
      const col = new THREE.Color(snowColorChoices[Math.floor(Math.random() * snowColorChoices.length)]);
      sColors[i * 3] = col.r; sColors[i * 3 + 1] = col.g; sColors[i * 3 + 2] = col.b;
    }
    const snowGeo = makeInstancedSquares(THREE, snowCount);
    snowGeo.setAttribute('phi', new THREE.InstancedBufferAttribute(sPhi, 1));
    snowGeo.setAttribute('random', new THREE.InstancedBufferAttribute(sRandom, 1));
    snowGeo.setAttribute('random1', new THREE.InstancedBufferAttribute(sRandom1, 1));
    snowGeo.setAttribute('aScale', new THREE.InstancedBufferAttribute(sScales, 1));
    snowGeo.setAttribute('aColor', new THREE.InstancedBufferAttribute(sColors, 3));
    const snowTex = new THREE.CanvasTexture(makeHeartSpriteTexture());
    const snowMat = new THREE.ShaderMaterial({
      vertexShader: FEB_VERT_SNOW, fragmentShader: FEB_FRAG_SNOW,
      uniforms: { uTime: { value: 0 }, uSize: { value: 0.3 }, uTex: { value: snowTex } },
      depthWrite: false, blending: THREE.AdditiveBlending, transparent: true,
    });
    const snow = new THREE.Mesh(snowGeo, snowMat);
    scene.add(snow);

    function resize() {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    resizeHandler = resize;
    window.addEventListener('resize', resizeHandler);

    const clock = new THREE.Clock();
    function tick() {
      const elapsed = clock.getElapsedTime();
      confettiMat.uniforms.uTime.value = elapsed * 1000 * 0.0005;
      snowMat.uniforms.uTime.value = elapsed * 1000 * 0.0004;
      heartMesh.rotation.y += 0.004;
      camera.position.x = Math.sin(elapsed * 0.15) * 0.6;
      camera.position.y = Math.sin(elapsed * 0.1) * 0.2;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
      animId = requestAnimationFrame(tick);
    }
    tick();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeHandler);
      renderer.dispose();
      heartGeo.dispose();
      heartMat.dispose();
      confettiGeo.dispose();
      confettiMat.dispose();
      snowGeo.dispose();
      snowMat.dispose();
      snowTex.dispose();
    };
  },
};

// ── December: Christmas ─────────────────────────────────────────────────
// Adapted from "musical-christmas-lights" — same spiral-cone light-point
// technique for the trees and the additive-blended sprite-point look for
// the ground sparkle and falling snow. Dropped its audio-reactive core
// (a FreeMusicArchive track list + file-upload button that drove point
// size from live FFT data) and its EffectComposer/UnrealBloomPass pipeline
// (a three.js addon module this app doesn't load) — trees pulse on a
// simple time wave instead, and the additive blending on tightly-packed
// glow sprites gives a comparable bloom look without the extra pass.
// Every point sprite is generated on canvas instead of the external
// assets.codepen.io PNGs.
function makeGlowSpriteTexture() {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.8)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}
function makeDecTreeGeometry(THREE, totalPoints) {
  const TAU = Math.PI * 2;
  const positions = [];
  const colors = [];
  const phases = [];
  const color = new THREE.Color();
  for (let i = 0; i < totalPoints; i++) {
    const t = Math.random();
    const y = -8 + t * 18;
    const ang = t * 6 * TAU + Math.PI * (i % 2);
    const r = 5 * (1 - t);
    const modifier = 1 - t;
    const z = r * Math.cos(ang);
    const x = r * Math.sin(ang);
    positions.push(
      x + rand(-0.3 * modifier, 0.3 * modifier),
      y + rand(-0.3 * modifier, 0.3 * modifier),
      z + rand(-0.3 * modifier, 0.3 * modifier)
    );
    color.setHSL(1 - i / totalPoints, 1.0, 0.5);
    colors.push(color.r, color.g, color.b);
    phases.push(rand(0, 1000));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setAttribute('phase', new THREE.Float32BufferAttribute(phases, 1));
  return geo;
}
const DEC_TREE_VERT = `
  attribute float phase;
  varying vec3 vColor;
  varying float vOpacity;
  uniform float uTime;
  void main() {
    vColor = color;
    vec3 p = position;
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    float pulse = 0.6 + 0.4 * sin(uTime * 1.5 + phase);
    float sizeMapped = mix(2.0, 9.0, pulse);
    vOpacity = clamp((mvPosition.z + 200.0) / 215.0, 0.0, 1.0);
    gl_PointSize = sizeMapped * (100.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;
const DEC_FRAG = `
  uniform sampler2D pointTexture;
  varying vec3 vColor;
  varying float vOpacity;
  void main() {
    gl_FragColor = vec4(vColor, vOpacity) * texture2D(pointTexture, gl_PointCoord);
  }
`;
const DEC_SNOW_VERT = `
  attribute float size;
  attribute float phase;
  attribute float phaseSecondary;
  varying vec3 vColor;
  varying float vOpacity;
  uniform float uTime;
  void main() {
    vColor = color;
    vec3 p = position;
    float t = uTime * 0.6;
    p.y = mod(phase - t, 33.0) - 8.0;
    p.x += sin(t * 0.3 + phase);
    p.z += sin(t * 0.3 + phaseSecondary);
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    vOpacity = clamp((mvPosition.z + 150.0) / 165.0, 0.0, 1.0);
    gl_PointSize = size * (100.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;
SCENES.december = {
  mount(container) {
    if (typeof window.THREE === 'undefined') return () => {};
    const THREE = window.THREE;
    const canvas = fullCanvas(container);
    let animId, resizeHandler;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x02040c);
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 1000);
    camera.position.set(0, -1, 18);
    camera.rotation.set(0.08, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);

    const glowTex = new THREE.CanvasTexture(makeGlowSpriteTexture());
    const uTimeUniform = { value: 0 };

    const planeCount = 800;
    const planePositions = [];
    const planeColors = [];
    const planeColorChoices = ['#93abd3', '#f2f4c0', '#9ddfd3'];
    const pc = new THREE.Color();
    for (let i = 0; i < planeCount; i++) {
      planePositions.push(rand(-25, 25), 0, rand(-90, 15));
      pc.set(planeColorChoices[Math.floor(Math.random() * planeColorChoices.length)]);
      planeColors.push(pc.r, pc.g, pc.b);
    }
    const planeGeo = new THREE.BufferGeometry();
    planeGeo.setAttribute('position', new THREE.Float32BufferAttribute(planePositions, 3));
    planeGeo.setAttribute('color', new THREE.Float32BufferAttribute(planeColors, 3));
    const planeMat = new THREE.PointsMaterial({ size: 1, map: glowTex, vertexColors: true, blending: THREE.AdditiveBlending, depthTest: false, transparent: true });
    const plane = new THREE.Points(planeGeo, planeMat);
    plane.position.y = -8;
    scene.add(plane);

    const treeGeos = [];
    const treeMat = new THREE.ShaderMaterial({
      uniforms: { uTime: uTimeUniform, pointTexture: { value: glowTex } },
      vertexShader: DEC_TREE_VERT, fragmentShader: DEC_FRAG,
      blending: THREE.AdditiveBlending, depthTest: false, transparent: true, vertexColors: true,
    });
    const treePairs = 5;
    for (let i = 0; i < treePairs; i++) {
      [20, -20].forEach((xOff) => {
        const geo = makeDecTreeGeometry(THREE, 900);
        treeGeos.push(geo);
        const tree = new THREE.Points(geo, treeMat);
        tree.position.set(xOff, 0, -18 * i);
        scene.add(tree);
      });
    }

    const snowGeos = [];
    const snowMat = new THREE.ShaderMaterial({
      uniforms: { uTime: uTimeUniform, pointTexture: { value: glowTex } },
      vertexShader: DEC_SNOW_VERT, fragmentShader: DEC_FRAG,
      blending: THREE.AdditiveBlending, depthTest: false, transparent: true, vertexColors: true,
    });
    const snowColorChoices = ['#f1d4d4', '#f1f6f9', '#eeeeee', '#f1f1e8'];
    for (let s = 0; s < 3; s++) {
      const total = 250;
      const positions = [];
      const colors = [];
      const sizes = [];
      const phases = [];
      const phase2 = [];
      const sc = new THREE.Color();
      for (let i = 0; i < total; i++) {
        positions.push(rand(-25, 25), rand(-8, 25), rand(-90, 15));
        sc.set(snowColorChoices[Math.floor(Math.random() * snowColorChoices.length)]);
        colors.push(sc.r, sc.g, sc.b);
        sizes.push(rand(2, 4));
        phases.push(rand(0, 33));
        phase2.push(rand(0, 1000));
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geo.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
      geo.setAttribute('phase', new THREE.Float32BufferAttribute(phases, 1));
      geo.setAttribute('phaseSecondary', new THREE.Float32BufferAttribute(phase2, 1));
      snowGeos.push(geo);
      scene.add(new THREE.Points(geo, snowMat));
    }

    function resize() {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    resizeHandler = resize;
    window.addEventListener('resize', resizeHandler);

    const clock = new THREE.Clock();
    function tick() {
      uTimeUniform.value = clock.getElapsedTime();
      camera.position.x = Math.sin(uTimeUniform.value * 0.05) * 2;
      renderer.render(scene, camera);
      animId = requestAnimationFrame(tick);
    }
    tick();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeHandler);
      renderer.dispose();
      glowTex.dispose();
      planeGeo.dispose();
      planeMat.dispose();
      treeGeos.forEach((g) => g.dispose());
      treeMat.dispose();
      snowGeos.forEach((g) => g.dispose());
      snowMat.dispose();
    };
  },
};

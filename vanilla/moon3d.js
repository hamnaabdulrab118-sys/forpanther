// ═══════════════════════════════════════════════════════════════════════
// Real WebGL 3D rendering for the Moon Chat screen — the moon badge (a
// textured, phase-lit rotating sphere) and the starfield/planets background.
// Uses the global THREE (loaded via a classic <script> tag in index.html),
// not an npm/module import.
//
// Each mount function tears down any previous scene first, since app.js
// fully replaces its HTML on every re-render (adding a message, picking a
// new day, etc.) — the old <canvas> node is destroyed each time, so its
// WebGL context and render loop must be disposed to avoid leaking contexts.
// ═══════════════════════════════════════════════════════════════════════

let iconState = null; // { renderer, ref }
let skyState = null;  // { renderer, ref }
let sharedMoonTexture = null;

function makeMoonTextureCanvas() {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#c9b98a';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = `rgba(90,80,60,${0.12 + Math.random() * 0.15})`;
    ctx.beginPath();
    ctx.ellipse(Math.random() * size, Math.random() * size, 30 + Math.random() * 70, 20 + Math.random() * 45, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * size, y = Math.random() * size, r = 3 + Math.random() * 14;
    const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    grad.addColorStop(0, 'rgba(255,255,255,0.3)');
    grad.addColorStop(0.5, 'rgba(110,95,68,0.35)');
    grad.addColorStop(1, 'rgba(80,70,50,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  return c;
}
function getMoonTexture() {
  if (!sharedMoonTexture) sharedMoonTexture = new window.THREE.CanvasTexture(makeMoonTextureCanvas());
  return sharedMoonTexture;
}

export function unmountMoonIcon() {
  if (!iconState) return;
  cancelAnimationFrame(iconState.ref.animId);
  iconState.renderer.dispose();
  iconState = null;
}

// A small rotating sphere with a directional light positioned to match the
// lunar phase day (1-30) — the same physical trick real moon phases use:
// the light's angle around the sphere, relative to the camera, determines
// how much of the near face is lit.
export function mountMoonIcon(canvas, day) {
  unmountMoonIcon();
  if (typeof window.THREE === 'undefined' || !canvas) return;
  const THREE = window.THREE;
  const size = canvas.clientWidth || 72;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(size, size, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  camera.position.set(0, 0, 4);

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(1, 40, 40),
    new THREE.MeshStandardMaterial({ map: getMoonTexture(), roughness: 0.95, metalness: 0 })
  );
  scene.add(moon);

  const angle = (2 * Math.PI * day) / 30;
  const light = new THREE.DirectionalLight(0xfff3d6, 1.6);
  light.position.set(Math.sin(angle) * 5, 1.2, Math.cos(angle) * 5);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0x1c2540, 0.65));

  const ref = { animId: 0 };
  (function tick() {
    moon.rotation.y += 0.002;
    renderer.render(scene, camera);
    ref.animId = requestAnimationFrame(tick);
  })();
  iconState = { renderer, ref };
}

export function unmountMoonSky() {
  if (!skyState) return;
  cancelAnimationFrame(skyState.ref.animId);
  skyState.renderer.dispose();
  skyState = null;
}

const SKY_STAR_COUNTS = { none: 0, sparse: 80, few: 200, normal: 500, many: 1100, quiet: 50, cluster: 260 };

// A full-screen 3D starfield (real depth via a PerspectiveCamera, not flat
// dots) plus, for the "planets"/"rings" star moods, actual 3D spheres —
// Saturn's ring in particular only looks right in real 3D (part of the ring
// naturally passes behind the planet via depth testing, which a flat CSS
// ellipse can only fake).
export function mountMoonSky(canvas, { density, extra }) {
  unmountMoonSky();
  if (typeof window.THREE === 'undefined' || !canvas) return;
  const THREE = window.THREE;
  const width = canvas.clientWidth || window.innerWidth;
  const height = canvas.clientHeight || window.innerHeight;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, width / Math.max(height, 1), 0.1, 100);
  camera.position.set(0, 0, 1);

  const count = SKY_STAR_COUNTS[density] ?? 200;
  if (count > 0) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 20 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      positions[i * 3 + 2] = -Math.abs(r * Math.cos(phi)) - 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.18, sizeAttenuation: true, transparent: true, opacity: 0.9 });
    scene.add(new THREE.Points(geo, mat));
  }

  if (extra === 'planets') {
    const light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(2, 2, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x223344, 0.5));
    const mars = new THREE.Mesh(new THREE.SphereGeometry(1.1, 24, 24), new THREE.MeshStandardMaterial({ color: 0xb5502e, roughness: 0.8 }));
    mars.position.set(-4, 2, -8);
    scene.add(mars);
    const jupiter = new THREE.Mesh(new THREE.SphereGeometry(1.6, 24, 24), new THREE.MeshStandardMaterial({ color: 0xc9a97a, roughness: 0.7 }));
    jupiter.position.set(3, 3, -12);
    scene.add(jupiter);
  } else if (extra === 'rings') {
    const light = new THREE.DirectionalLight(0xffffff, 1.3);
    light.position.set(-3, 2, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x223344, 0.5));
    const saturn = new THREE.Mesh(new THREE.SphereGeometry(1.4, 30, 30), new THREE.MeshStandardMaterial({ color: 0xd8c48a, roughness: 0.7 }));
    saturn.position.set(2.5, -1, -9);
    scene.add(saturn);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(2, 3.2, 64),
      new THREE.MeshBasicMaterial({ color: 0xe9d1a0, side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
    );
    ring.position.copy(saturn.position);
    ring.rotation.x = Math.PI / 2 + 0.4;
    scene.add(ring);
  }

  const ref = { animId: 0 };
  (function tick() {
    scene.rotation.y += 0.0004;
    renderer.render(scene, camera);
    ref.animId = requestAnimationFrame(tick);
  })();
  skyState = { renderer, ref };
}

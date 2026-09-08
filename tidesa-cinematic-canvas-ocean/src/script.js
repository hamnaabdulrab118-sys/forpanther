const canvas = document.getElementById("ocean");
const ctx = canvas.getContext("2d");

let W, H, DPR, horizonY, oceanH;

function resize() {
	DPR = Math.min(window.devicePixelRatio || 1, 2);
	W = window.innerWidth;
	H = window.innerHeight;
	canvas.width = W * DPR;
	canvas.height = H * DPR;
	canvas.style.width = W + "px";
	canvas.style.height = H + "px";
	ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
	horizonY = H * 0.42;
	oceanH = H - horizonY;
}
window.addEventListener("resize", resize);
resize();

/* ════════════════════════════════════════
   PALETTE KEYFRAMES  (r,g,b arrays)
   sunH = height of sun above horizon (0 = on horizon, 1 = high)
═══════════════════════════════════════ */
const KEYS = [
	{
		t: 0.0,
		name: "DAWN",
		skyTop: [38, 44, 86],
		skyHor: [247, 176, 128],
		sun: [255, 238, 206],
		glow: [255, 178, 120],
		wFar: [176, 150, 150],
		wNear: [34, 62, 84],
		foam: [255, 244, 234],
		sunH: 0.1,
		glit: 0.7,
		star: 0
	},
	{
		t: 0.28,
		name: "MORNING",
		skyTop: [64, 134, 206],
		skyHor: [188, 222, 236],
		sun: [255, 255, 246],
		glow: [255, 250, 224],
		wFar: [120, 186, 196],
		wNear: [20, 92, 114],
		foam: [255, 255, 255],
		sunH: 0.55,
		glit: 0.5,
		star: 0
	},
	{
		t: 0.5,
		name: "MIDDAY",
		skyTop: [58, 142, 214],
		skyHor: [176, 216, 230],
		sun: [255, 255, 248],
		glow: [255, 252, 232],
		wFar: [96, 178, 188],
		wNear: [16, 96, 120],
		foam: [255, 255, 255],
		sunH: 0.92,
		glit: 0.45,
		star: 0
	},
	{
		t: 0.68,
		name: "GOLDEN HOUR",
		skyTop: [74, 92, 156],
		skyHor: [255, 202, 120],
		sun: [255, 236, 194],
		glow: [255, 168, 92],
		wFar: [206, 164, 118],
		wNear: [34, 78, 98],
		foam: [255, 244, 228],
		sunH: 0.3,
		glit: 0.95,
		star: 0
	},
	{
		t: 0.84,
		name: "SUNSET",
		skyTop: [48, 38, 86],
		skyHor: [255, 108, 68],
		sun: [255, 206, 148],
		glow: [255, 92, 58],
		wFar: [188, 98, 84],
		wNear: [30, 42, 72],
		foam: [255, 222, 200],
		sunH: 0.06,
		glit: 1.0,
		star: 0.15
	},
	{
		t: 1.0,
		name: "MOONLIT",
		skyTop: [8, 12, 30],
		skyHor: [34, 44, 82],
		sun: [228, 234, 255],
		glow: [140, 164, 216],
		wFar: [28, 42, 76],
		wNear: [6, 16, 32],
		foam: [196, 208, 234],
		sunH: 0.55,
		glit: 0.55,
		star: 1
	}
];

function lerp(a, b, t) {
	return a + (b - a) * t;
}
function lerpRGB(a, b, t) {
	return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}
function rgb(c, a = 1) {
	return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
}

function getPalette(t) {
	let i = 0;
	while (i < KEYS.length - 1 && t > KEYS[i + 1].t) i++;
	const a = KEYS[i],
		b = KEYS[Math.min(i + 1, KEYS.length - 1)];
	const span = b.t - a.t || 1;
	const k = Math.max(0, Math.min(1, (t - a.t) / span));
	return {
		name: k < 0.5 ? a.name : b.name,
		skyTop: lerpRGB(a.skyTop, b.skyTop, k),
		skyHor: lerpRGB(a.skyHor, b.skyHor, k),
		sun: lerpRGB(a.sun, b.sun, k),
		glow: lerpRGB(a.glow, b.glow, k),
		wFar: lerpRGB(a.wFar, b.wFar, k),
		wNear: lerpRGB(a.wNear, b.wNear, k),
		foam: lerpRGB(a.foam, b.foam, k),
		sunH: lerp(a.sunH, b.sunH, k),
		glit: lerp(a.glit, b.glit, k),
		star: lerp(a.star, b.star, k)
	};
}

/* ════════════════════════════════════════
   STATIC ELEMENTS
═══════════════════════════════════════ */
const stars = Array.from({ length: 140 }, () => ({
	x: Math.random(),
	y: Math.random() * 0.4,
	r: Math.random() * 1.2 + 0.3,
	tw: Math.random() * Math.PI * 2
}));

const clouds = Array.from({ length: 5 }, (_, i) => ({
	x: Math.random(),
	y: 0.08 + Math.random() * 0.18,
	w: 0.18 + Math.random() * 0.22,
	speed: 0.000015 + Math.random() * 0.00002
}));

const birds = Array.from({ length: 4 }, () => ({
	x: Math.random(),
	y: 0.15 + Math.random() * 0.18,
	speed: 0.00004 + Math.random() * 0.00004,
	size: 8 + Math.random() * 6,
	flap: Math.random() * Math.PI * 2
}));

/* ════════════════════════════════════════
   INPUT
═══════════════════════════════════════ */
let timeOfDay = 0.6;
let mouseX = 0.5;

const slider = document.getElementById("time");
slider.addEventListener("input", () => {
	timeOfDay = slider.value / 1000;
});
window.addEventListener("mousemove", (e) => {
	mouseX = e.clientX / W;
});
window.addEventListener(
	"touchmove",
	(e) => {
		mouseX = e.touches[0].clientX / W;
	},
	{ passive: true }
);

const moodName = document.getElementById("mood-name");
const moodTime = document.getElementById("mood-time");

/* ════════════════════════════════════════
   RENDER
═══════════════════════════════════════ */
let T = 0;

function draw() {
	T += 0.016;
	const P = getPalette(timeOfDay);

	/* sun position */
	const sunX = W * (0.5 + (mouseX - 0.5) * 0.25);
	const sunY = horizonY - P.sunH * horizonY * 0.82;

	/* ── SKY ── */
	const sky = ctx.createLinearGradient(0, 0, 0, horizonY + oceanH * 0.1);
	sky.addColorStop(0, rgb(P.skyTop));
	sky.addColorStop(0.7, rgb(lerpRGB(P.skyTop, P.skyHor, 0.55)));
	sky.addColorStop(1, rgb(P.skyHor));
	ctx.fillStyle = sky;
	ctx.fillRect(0, 0, W, horizonY + 2);

	/* ── STARS ── */
	if (P.star > 0.01) {
		stars.forEach((s) => {
			const tw = 0.5 + 0.5 * Math.sin(T * 2 + s.tw);
			ctx.fillStyle = rgb([255, 255, 255], P.star * tw * 0.9);
			ctx.beginPath();
			ctx.arc(s.x * W, s.y * horizonY, s.r, 0, Math.PI * 2);
			ctx.fill();
		});
	}

	/* ── SUN GLOW ── */
	const glowR = Math.min(W, H) * 0.5;
	const g = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, glowR);
	g.addColorStop(0, rgb(P.glow, 0.55));
	g.addColorStop(0.25, rgb(P.glow, 0.22));
	g.addColorStop(1, rgb(P.glow, 0));
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, W, horizonY + oceanH * 0.4);

	/* ── SUN DISC ── */
	const sunR = Math.min(W, H) * 0.045;
	const sd = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR);
	sd.addColorStop(0, rgb(P.sun, 1));
	sd.addColorStop(0.7, rgb(P.sun, 0.95));
	sd.addColorStop(1, rgb(P.sun, 0.2));
	ctx.fillStyle = sd;
	ctx.beginPath();
	ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
	ctx.fill();

	/* ── CLOUDS ── */
	clouds.forEach((c) => {
		c.x += c.speed;
		if (c.x > 1.3) c.x = -0.3;
		const cx = c.x * W,
			cy = c.y * horizonY,
			cw = c.w * W;
		ctx.fillStyle = rgb(lerpRGB(P.skyHor, [255, 255, 255], 0.25), 0.16);
		for (let j = 0; j < 4; j++) {
			ctx.beginPath();
			ctx.ellipse(
				cx + j * cw * 0.22,
				cy + Math.sin(j) * 6,
				cw * (0.3 - j * 0.04),
				cw * 0.06,
				0,
				0,
				Math.PI * 2
			);
			ctx.fill();
		}
	});

	/* ── BIRDS ── */
	birds.forEach((b) => {
		b.x += b.speed;
		b.flap += 0.15;
		if (b.x > 1.2) {
			b.x = -0.2;
			b.y = 0.15 + Math.random() * 0.18;
		}
		const bx = b.x * W,
			by = b.y * horizonY;
		const wing = Math.sin(b.flap) * b.size * 0.5;
		ctx.strokeStyle = rgb(lerpRGB(P.skyTop, [0, 0, 0], 0.3), 0.5);
		ctx.lineWidth = 1.5;
		ctx.beginPath();
		ctx.moveTo(bx - b.size, by + wing);
		ctx.quadraticCurveTo(bx, by - b.size * 0.3, bx, by);
		ctx.quadraticCurveTo(bx, by - b.size * 0.3, bx + b.size, by + wing);
		ctx.stroke();
	});

	/* ── ATMOSPHERIC HAZE AT HORIZON ── */
	const haze = ctx.createLinearGradient(0, horizonY - 40, 0, horizonY + 40);
	haze.addColorStop(0, rgb(P.skyHor, 0));
	haze.addColorStop(0.5, rgb(P.skyHor, 0.45));
	haze.addColorStop(1, rgb(P.wFar, 0));
	ctx.fillStyle = haze;
	ctx.fillRect(0, horizonY - 40, W, 80);

	/* ── OCEAN SWELLS (back → front) ── */
	const NUM = 26;
	for (let i = 0; i < NUM; i++) {
		const depth = i / (NUM - 1); // 0 horizon → 1 viewer
		const yTop = horizonY + Math.pow(depth, 1.9) * oceanH;
		const amp = lerp(0.6, 30, depth);
		const wlen = lerp(46, 340, depth);
		const speed = lerp(0.25, 0.9, depth);
		const phase = T * speed + i * 0.9;
		const col = lerpRGB(P.wFar, P.wNear, depth);

		/* band fill */
		ctx.beginPath();
		ctx.moveTo(0, H);
		ctx.lineTo(0, yTop + Math.sin(phase) * amp);
		for (let x = 0; x <= W; x += 6) {
			const y =
				yTop +
				Math.sin(x / wlen + phase) * amp +
				Math.sin(x / (wlen * 0.4) + phase * 1.6) * amp * 0.3;
			ctx.lineTo(x, y);
		}
		ctx.lineTo(W, H);
		ctx.closePath();
		ctx.fillStyle = rgb(col);
		ctx.fill();

		/* crest highlight — brighter near the sun column */
		ctx.lineWidth = lerp(0.6, 2.2, depth);
		ctx.beginPath();
		let started = false;
		for (let x = 0; x <= W; x += 6) {
			const y =
				yTop +
				Math.sin(x / wlen + phase) * amp +
				Math.sin(x / (wlen * 0.4) + phase * 1.6) * amp * 0.3;
			started ? ctx.lineTo(x, y) : (ctx.moveTo(x, y), (started = true));
		}
		const sunCloseness = 1 - Math.min(1, Math.abs(sunX - W * 0.5) / (W * 0.5));
		ctx.strokeStyle = rgb(lerpRGB(col, P.sun, 0.55), lerp(0.05, 0.3, depth));
		ctx.stroke();

		/* foam on the front swells */
		if (depth > 0.62) {
			const foamA = (depth - 0.62) / 0.38;
			for (let x = 0; x <= W; x += 9) {
				const y =
					yTop +
					Math.sin(x / wlen + phase) * amp +
					Math.sin(x / (wlen * 0.4) + phase * 1.6) * amp * 0.3;
				const crest = Math.sin(x / wlen + phase);
				if (crest > 0.55 && Math.random() > 0.45) {
					ctx.fillStyle = rgb(P.foam, foamA * (0.18 + Math.random() * 0.35));
					ctx.fillRect(
						x + (Math.random() - 0.5) * 6,
						y - Math.random() * 3,
						1.5 + Math.random() * 3,
						1.5 + Math.random() * 2
					);
				}
			}
		}
	}

	/* ── SUN GLITTER PATH ── */
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

	/* ── VIGNETTE ── */
	const vig = ctx.createRadialGradient(
		W / 2,
		H * 0.55,
		H * 0.25,
		W / 2,
		H * 0.55,
		H * 0.9
	);
	vig.addColorStop(0, "rgba(0,0,0,0)");
	vig.addColorStop(1, "rgba(0,0,8,0.34)");
	ctx.fillStyle = vig;
	ctx.fillRect(0, 0, W, H);

	/* ── UI TEXT ── */
	moodName.textContent = P.name;
	const hours = 5 + timeOfDay * 18; // 05:00 → 23:00
	const hh = Math.floor(hours) % 24;
	const mm = Math.floor((hours % 1) * 60);
	moodTime.textContent = `${String(hh).padStart(2, "0")}:${String(mm).padStart(
		2,
		"0"
	)}`;

	requestAnimationFrame(draw);
}
draw();

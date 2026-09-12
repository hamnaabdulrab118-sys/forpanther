// ═══════════════════════════════════════════════════════════════════════
// FOR PANTHER — Between Two Skies (vanilla HTML/CSS/JS build)
// Same Firebase/Firestore backend and sharing rule as the React version:
//   Owner saves → Firestore doc "forpanther/main"
//   Share URL   → yoursite.com/?gift=main
//   Panther opens URL → app reads "main" from Firestore → shows letters
// ═══════════════════════════════════════════════════════════════════════
import { loadData, saveData, signInOwner, uploadMusicFile, uploadMixtapeSong, uploadMemoryFile, uploadGalleryPhoto, uploadVoiceNotePhoto, uploadVoiceNoteAudio } from './db.js';
import { mountMoonIcon, unmountMoonIcon, mountMoonSky, unmountMoonSky } from './moon3d.js';
import { hasScene, mountMonthScene, unmountMonthScene } from './monthThemes.js';

// ── Constants ────────────────────────────────────────────────────────────
const OWNER_PIN = '5425';
const OWNER_COORDS = { lat: 32.4945, lng: 74.5229 }; // Sialkot, Pakistan

const DEFAULT_DATA = {
  letters: [], gallery: [],
  fromCity: 'Sialkot', toCity: 'Ormara',
  distanceKm: 730, distanceMiles: 454,
  isPublished: false,
  moonMessages: [],
  hiddenTabs: { letters: false, gallery: false, moon: false, bouquet: false, mixtape: false, memorymap: false, voicenotes: false, collection: false },
  bouquet: { flowers: [], wrapping: 'gold', note: '', background: { type: 'preset', value: 'night' } },
  mixtape: { color: 'sage', label: 'Songs for you', songs: [], note: '' },
  memoryMap: { pins: [] },
  voiceNotes: [],
  theme: 'classic',
  recipientPin: '1122', // separate from OWNER_PIN — this is the code Dino shares with Panther
  moonPhaseDay: 15, // 1-30, moon shape only (1=new moon, 15=full moon)
  skyEffectId: 1,   // 1-30, star/sky-effect mood — independent of the moon shape
  skyColorId: 1,    // 1-30, sky background color — independent of both above
};

const LABELS = [
  "Open when you miss me", "Open when you can't sleep",
  "Open when you land safely", "Open when you're stressed",
  "Open when you need gym motivation", "Open when you want coffee but I'm not there",
  "Open when you're overthinking", "Open when you're proud of yourself",
  "Open when you feel homesick", "Open when you need a laugh",
  "Open when it's our anniversary", "Open when you just want to hear from me",
  "Open when you doubt yourself", "Open when you want ice cream",
  "Open when you need to feel loved", "Open when it's a hard day",
  "Open when you want to smile", "Open when you're bored",
];

const STICKERS = ['🐱','🐾','✈️','🌙','⭐','💫','🦖','🐆','☕','🍦','💚','🖤','💌','🌿','🪐','🔭','📖','💪','🎵','🌸','🏋️','🍕','🌊','🎯','🐉','🌺','💎','🌠','🐈','🌃','🎖️','🧡'];

const ENVELOPE_COLORS = [
  { id: 'gold', label: 'Gold', color: '#e9c349' },
  { id: 'rose', label: 'Rose', color: '#fda4af' },
  { id: 'sky', label: 'Sky', color: '#7dd3fc' },
  { id: 'sage', label: 'Sage', color: '#86efac' },
  { id: 'lavender', label: 'Lavender', color: '#c4b5fd' },
];

const ENVELOPE_CARD_COLORS = {
  gold:     { envelope: '#1a1200', border: '#e9c349', wax: '#e9c349', badge: 'rgba(233,195,73,0.12)', badgeText: '#e9c349' },
  rose:     { envelope: '#1a0008', border: '#fda4af', wax: '#fb7185', badge: 'rgba(253,164,175,0.12)', badgeText: '#fda4af' },
  sky:      { envelope: '#00101a', border: '#7dd3fc', wax: '#38bdf8', badge: 'rgba(125,211,252,0.12)', badgeText: '#7dd3fc' },
  sage:     { envelope: '#001400', border: '#86efac', wax: '#4ade80', badge: 'rgba(134,239,172,0.12)', badgeText: '#86efac' },
  lavender: { envelope: '#0d0020', border: '#c4b5fd', wax: '#a78bfa', badge: 'rgba(196,181,253,0.12)', badgeText: '#c4b5fd' },
};

const MAX_FLOWERS = 12;

// Each flower is drawn as a small parametric SVG (layered petals around a
// center) rather than emoji, for a softer illustrated look.
const FLOWER_OPTIONS = [
  { id: 'rose', label: 'Rose', petals: 8, petalColor: '#e8768f', centerColor: '#c94f6d' },
  { id: 'tulip', label: 'Tulip', petals: 5, petalColor: '#f0879a', centerColor: '#d65d76' },
  { id: 'sunflower', label: 'Sunflower', petals: 10, petalColor: '#f5c542', centerColor: '#6b4423' },
  { id: 'daisy', label: 'Daisy', petals: 8, petalColor: '#fdfdf5', centerColor: '#f5c542' },
  { id: 'hibiscus', label: 'Hibiscus', petals: 5, petalColor: '#e85d75', centerColor: '#f5c542' },
  { id: 'blossom', label: 'Blossom', petals: 5, petalColor: '#fbd0dd', centerColor: '#f0879a' },
  { id: 'hyacinth', label: 'Hyacinth', petals: 6, petalColor: '#b39ddb', centerColor: '#7e57c2' },
  { id: 'lotus', label: 'Lotus', petals: 8, petalColor: '#f8c8dc', centerColor: '#e85d75' },
  { id: 'rosette', label: 'Rosette', petals: 12, petalColor: '#e8a87c', centerColor: '#c9784f' },
  { id: 'mixed', label: 'Mixed', petals: 6, petalColor: '#a8d5ba', centerColor: '#e85d75' },
  { id: 'lily', label: 'Lily', petals: 6, petalColor: '#f5a428', centerColor: '#c9781f' },
  { id: 'amaryllis', label: 'Amaryllis', petals: 6, petalColor: '#c81e3a', centerColor: '#fdf6ea' },
];

// Ready-made starting points — apply one, then tweak flowers/wrapping freely.
const BOUQUET_TEMPLATES = [
  { id: 'warm-lily-mix', label: 'Warm Lily Mix', flowers: ['lily', 'lily', 'lily', 'lily', 'lily'], wrapping: 'kraft' },
  { id: 'pink-variety', label: 'Pink Variety', flowers: ['rosette', 'lotus', 'daisy', 'rosette', 'lotus', 'daisy'], wrapping: 'sage' },
  { id: 'pink-rose-acacia', label: 'Pink Rose + Acacia', flowers: ['rose', 'rose', 'rose', 'rose', 'rose', 'blossom'], wrapping: 'sage' },
  { id: 'amaryllis-trio', label: 'Amaryllis Trio', flowers: ['amaryllis', 'amaryllis', 'amaryllis', 'blossom', 'blossom'], wrapping: 'kraft' },
  { id: 'apple-blossom', label: 'Apple Blossom', flowers: ['blossom', 'blossom', 'blossom', 'blossom', 'blossom', 'blossom'], wrapping: 'sage' },
  { id: 'wild-garden', label: 'Wild Garden', flowers: ['rose', 'tulip', 'sunflower', 'daisy', 'hibiscus', 'lotus'], wrapping: 'kraft' },
];

// Ribbon color, tied around a fixed kraft-paper cone — see wrappingSVG().
const WRAPPING_OPTIONS = [
  { id: 'gold', label: 'Gold', color: '#e9c349' },
  { id: 'rose', label: 'Rose', color: '#fda4af' },
  { id: 'sky', label: 'Sky', color: '#7dd3fc' },
  { id: 'sage', label: 'Sage', color: '#86efac' },
  { id: 'lavender', label: 'Lavender', color: '#c4b5fd' },
  { id: 'kraft', label: 'Kraft', color: '#c9a876' },
  { id: 'white', label: 'White', color: '#f5f5f0' },
];

const BACKGROUND_PRESETS = [
  { id: 'night', label: 'Night Sky', css: 'linear-gradient(180deg,#000005 0%,#000814 40%,#000d20 100%)' },
  { id: 'sunset', label: 'Sunset', css: 'linear-gradient(180deg,#2d1b4e 0%,#7c3f5c 50%,#e08a5f 100%)' },
  { id: 'dawn', label: 'Dawn', css: 'linear-gradient(180deg,#1e3a5f 0%,#4a6fa5 50%,#f4a988 100%)' },
  { id: 'garden', label: 'Garden', css: 'linear-gradient(180deg,#0d2818 0%,#1a4d2e 60%,#2d6a3e 100%)' },
];

// ── App-wide month themes ───────────────────────────────────────────────
// Each recolors the accent (gold buttons/borders/highlights everywhere) and
// the page background via CSS variables, plus adds a signature corner icon
// and a field of falling/floating seasonal particles. "classic" (the
// original gold/navy look) stays the default so nothing changes unless the
// owner picks one in Settings.
const THEMES = [
  { id: 'classic', label: 'Classic', month: null, accent: '#e9c349', accentRgb: '233,195,73', pageBg: 'linear-gradient(180deg,#000005 0%,#000814 30%,#000d20 70%,#001a3d 100%)', icon: '', particle: '', motion: 'fall' },
  { id: 'january', label: 'January — Frost', month: 1, accent: '#a5d8ff', accentRgb: '165,216,255', pageBg: 'linear-gradient(180deg,#020810 0%,#0a1a2e 45%,#13324d 100%)', icon: '❄️', particle: '❄️', motion: 'fall' },
  { id: 'february', label: 'February — Sweetheart', month: 2, accent: '#fb7185', accentRgb: '251,113,133', pageBg: 'linear-gradient(180deg,#1a0510 0%,#3d0f24 45%,#5c1a35 100%)', icon: '💌', particle: '💗', motion: 'float' },
  { id: 'march', label: 'March — Bloom', month: 3, accent: '#f0879a', accentRgb: '240,135,154', pageBg: 'linear-gradient(180deg,#0d1f14 0%,#1f3d28 45%,#3d5c3a 100%)', icon: '🌸', particle: '🌸', motion: 'fall' },
  { id: 'april', label: 'April — Showers', month: 4, accent: '#7dd3fc', accentRgb: '125,211,252', pageBg: 'linear-gradient(180deg,#04101c 0%,#0d2438 45%,#1a3d52 100%)', icon: '🌦️', particle: '💧', motion: 'fall' },
  { id: 'may', label: 'May — Garden', month: 5, accent: '#86efac', accentRgb: '134,239,172', pageBg: 'linear-gradient(180deg,#071a0d 0%,#123d1f 45%,#1f5c30 100%)', icon: '🦋', particle: '🌼', motion: 'float' },
  { id: 'june', label: 'June — Sunbeam', month: 6, accent: '#fbbf24', accentRgb: '251,191,36', pageBg: 'linear-gradient(180deg,#1a1002 0%,#3d2408 45%,#5c3a10 100%)', icon: '☀️', particle: '✨', motion: 'float' },
  { id: 'july', label: 'July — Tide', month: 7, accent: '#38bdf8', accentRgb: '56,189,248', pageBg: 'linear-gradient(180deg,#01141a 0%,#053040 45%,#0a4d5c 100%)', icon: '🌊', particle: '🫧', motion: 'float' },
  { id: 'august', label: 'August — Harvest Gold', month: 8, accent: '#d97706', accentRgb: '217,119,6', pageBg: 'linear-gradient(180deg,#1a1002 0%,#3d2a08 45%,#5c4210 100%)', icon: '🌾', particle: '✨', motion: 'float' },
  { id: 'september', label: 'September — Amber Leaves', month: 9, accent: '#f97316', accentRgb: '249,115,22', pageBg: 'linear-gradient(180deg,#1a0d02 0%,#3d2008 45%,#5c3010 100%)', icon: '🍂', particle: '🍂', motion: 'fall' },
  { id: 'october', label: 'October — Maple', month: 10, accent: '#ea580c', accentRgb: '234,88,12', pageBg: 'linear-gradient(180deg,#170502 0%,#3d1208 45%,#5c1c0f 100%)', icon: '🍁', particle: '🍁', motion: 'fall' },
  { id: 'november', label: 'November — Cozy Amber', month: 11, accent: '#c9784f', accentRgb: '201,120,79', pageBg: 'linear-gradient(180deg,#120a05 0%,#2e1b0f 45%,#452a18 100%)', icon: '🕯️', particle: '🍂', motion: 'fall' },
  { id: 'december', label: 'December — Snowfall', month: 12, accent: '#cfe8ff', accentRgb: '207,232,255', pageBg: 'linear-gradient(180deg,#000005 0%,#000814 40%,#000d20 100%)', icon: '⛄', particle: '❄️', motion: 'fall' },
];

// ── Themed cursor + trail ────────────────────────────────────────────────
// Each month theme swaps the mouse pointer for a small matching shape (a
// heart for February, a bat for November...) and leaves a brief trail of a
// matching emoji as the mouse moves. Shapes match the actual animated month
// scene in monthThemes.js (e.g. "wave" for June's tide-sea scene), not the
// older THEMES labels above, which predate that work and drifted out of sync.
const CURSOR_SHAPE_BUILDERS = {
  snowflake: (c) => {
    let s = '';
    for (let i = 0; i < 6; i++) {
      s += `<g transform="rotate(${i * 60} 16 16)"><line x1="16" y1="16" x2="16" y2="3" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/><line x1="16" y1="8" x2="12" y2="6" stroke="${c}" stroke-width="2" stroke-linecap="round"/><line x1="16" y1="8" x2="20" y2="6" stroke="${c}" stroke-width="2" stroke-linecap="round"/></g>`;
    }
    return s + `<circle cx="16" cy="16" r="2.2" fill="${c}"/>`;
  },
  heart: (c) => `<path d="M16 27 C6 19 2 13 2 8.5 C2 4 5.5 1 9.5 1 C12.5 1 15 3 16 5.5 C17 3 19.5 1 22.5 1 C26.5 1 30 4 30 8.5 C30 13 26 19 16 27 Z" fill="${c}" stroke="#ffffff" stroke-width="1.4"/>`,
  blossom: (c) => {
    let s = '';
    for (let i = 0; i < 5; i++) {
      s += `<ellipse cx="16" cy="9" rx="4.4" ry="7" fill="${c}" stroke="#ffffff" stroke-width="1" transform="rotate(${i * 72} 16 16)"/>`;
    }
    return s + `<circle cx="16" cy="16" r="3" fill="#ffd94a"/>`;
  },
  cloud: (c) => `<path d="M8 22 C4 22 2 19 2 16.5 C2 14 4 12 6.5 12 C7 8.5 10 6 13.5 6 C17 6 19.5 8.5 20.3 11.8 C23.5 12 26 14.5 26 17.5 C26 20.5 23.5 22 21 22 Z" fill="${c}" stroke="#ffffff" stroke-width="1.2"/>`,
  droplet: (c) => `<path d="M16 3 C22 13 26 18 26 22.5 C26 27.5 21.5 31 16 31 C10.5 31 6 27.5 6 22.5 C6 18 10 13 16 3 Z" fill="${c}" stroke="#ffffff" stroke-width="1.2"/>`,
  wave: (c) => `<path d="M2 22 C5 15 9 15 12 20 C15 25 19 25 22 20 C24 16.5 27 16 30 17.5 L30 27 L2 27 Z" fill="${c}" stroke="#ffffff" stroke-width="1"/>`,
  spark: (c) => `<path d="M16 2 L19 13 L30 16 L19 19 L16 30 L13 19 L2 16 L13 13 Z" fill="${c}" stroke="#ffffff" stroke-width="1"/>`,
  jellyfish: (c) => `<path d="M8 14 C8 7 12 3 16 3 C20 3 24 7 24 14 C24 17 21.5 18.5 16 18.5 C10.5 18.5 8 17 8 14 Z" fill="${c}" stroke="#ffffff" stroke-width="1.2"/>
    <path d="M11 19 C10 22 12 24 11 27" stroke="${c}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M16 19 C15 23 17 25 16 29" stroke="${c}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M21 19 C22 22 20 24 21 27" stroke="${c}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  pawprint: (c) => `<ellipse cx="16" cy="21" rx="7" ry="6" fill="${c}"/>
    <ellipse cx="7" cy="12" rx="3.2" ry="4.4" fill="${c}" transform="rotate(-18 7 12)"/>
    <ellipse cx="15" cy="8" rx="3.2" ry="4.6" fill="${c}"/>
    <ellipse cx="24" cy="12" rx="3.2" ry="4.4" fill="${c}" transform="rotate(18 24 12)"/>`,
  leaf: (c) => `<path d="M16 3 C26 8 27 18 22 25 C20 28 16 30 16 30 C16 30 12 28 10 25 C5 18 6 8 16 3 Z" fill="${c}" stroke="#ffffff" stroke-width="1.2"/>
    <line x1="16" y1="7" x2="16" y2="29" stroke="#ffffff" stroke-width="1" opacity="0.6"/>`,
  bat: (c) => `<path d="M16 12 C13 6 6 4 2 8 C6 10 8 13 9 16 C4 15 1 18 2 22 C6 20 9 20 11 22 C13 24 15 24 16 20 C17 24 19 24 21 22 C23 20 26 20 30 22 C31 18 28 15 23 16 C24 13 26 10 30 8 C26 4 19 6 16 12 Z" fill="${c}" stroke="#ffffff" stroke-width="1"/>
    <circle cx="14" cy="14" r="1" fill="#ffffff"/><circle cx="18" cy="14" r="1" fill="#ffffff"/>`,
  ornament: (c) => `<circle cx="16" cy="19" r="10" fill="${c}" stroke="#ffffff" stroke-width="1.4"/>
    <rect x="13" y="4" width="6" height="6" rx="1.5" fill="#c9a13a"/>
    <path d="M16 4 L16 1" stroke="#c9a13a" stroke-width="2" stroke-linecap="round"/>
    <ellipse cx="12" cy="15" rx="3" ry="4" fill="#ffffff" opacity="0.35"/>`,
};
const CURSOR_THEMES = {
  january:   { shape: 'snowflake', color: '#bfe3ff', trailEmoji: '❄️' },
  february:  { shape: 'heart',     color: '#ff5c86', trailEmoji: '💗' },
  march:     { shape: 'blossom',   color: '#ff9ecb', trailEmoji: '🌸' },
  april:     { shape: 'cloud',     color: '#bfe0fb', trailEmoji: '💧' },
  may:       { shape: 'droplet',   color: '#5ec8f2', trailEmoji: '🌧️' },
  june:      { shape: 'wave',      color: '#3fc6d6', trailEmoji: '🌊' },
  july:      { shape: 'spark',     color: '#fde68a', trailEmoji: '✨' },
  august:    { shape: 'jellyfish', color: '#c9b6f7', trailEmoji: '🪼' },
  september: { shape: 'pawprint',  color: '#f6a25c', trailEmoji: '🦖' },
  october:   { shape: 'leaf',      color: '#f0894a', trailEmoji: '🍁' },
  november:  { shape: 'bat',       color: '#a888d9', trailEmoji: '🦇' },
  december:  { shape: 'ornament',  color: '#e0524f', trailEmoji: '✨' },
};
function cursorDataUri(shape, color) {
  const svg = CURSOR_SHAPE_BUILDERS[shape](color);
  const full = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">${svg}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(full)}`;
}
let lastCursorKey = null;
let activeCursorTheme = null;
function applyCursorForView(view, themeId) {
  const cfg = (view === 'moon' || view === 'mixtape' || view === 'memorymap') ? null : CURSOR_THEMES[themeId] || null;
  const key = cfg ? `${cfg.shape}:${cfg.color}` : 'none';
  if (key !== lastCursorKey) {
    lastCursorKey = key;
    document.body.style.cursor = cfg ? `url("${cursorDataUri(cfg.shape, cfg.color)}") 16 16, auto` : '';
  }
  activeCursorTheme = cfg;
}
let lastCursorTrailAt = 0;
function spawnCursorTrail(x, y) {
  if (!activeCursorTheme) return;
  const now = performance.now();
  if (now - lastCursorTrailAt < 70) return;
  lastCursorTrailAt = now;
  const el = document.createElement('span');
  el.className = 'cursor-trail-particle';
  el.textContent = activeCursorTheme.trailEmoji;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}
document.addEventListener('mousemove', (e) => spawnCursorTrail(e.clientX, e.clientY));

// Hand-tuned offsets (relative to the top of the wrapping) for up to 12 flowers,
// growing outward in a fan so the cluster still looks intentional at any count.
const BOUQUET_POSITIONS = [
  { x: 0, y: 0, r: 0 }, { x: -24, y: 4, r: -12 }, { x: 24, y: 4, r: 12 },
  { x: -14, y: -16, r: -6 }, { x: 14, y: -16, r: 6 }, { x: -42, y: 16, r: -22 },
  { x: 42, y: 16, r: 22 }, { x: 0, y: -30, r: 0 }, { x: -32, y: -8, r: -16 },
  { x: 32, y: -8, r: 16 }, { x: -58, y: 30, r: -30 }, { x: 58, y: 30, r: 30 },
];

const MOON_REPLIES = [
  "I can feel your love travelling across every mile to him tonight 🌙",
  "He looks up at me every night. I think he's thinking of you right now ✨",
  "I carry your love from Sialkot to Ormara every single night. He feels it 🌠",
  "A brave heart loves from far away. You're braver than you know 🐾",
  "Distance is just space. Love has no coordinates ✈️",
  "He's safe tonight. He's thinking of you too. The sky connects you both 🌙",
  "Your love is written in the stars between you. I read it every night ⭐",
  "Next time he has coffee, I'll send him your warmth with the steam ☕",
  "A little dino and a little panther, worlds apart but hearts together 🦖🐾",
  "Tell me about him. I love hearing about the ones I watch over 💌",
  "The night you're both under is the same night. Remember that when it feels far 🌍",
  "He's strong. And so are you. That's why this works 💚",
  "Every shooting star you wish on, I make sure reaches him 🌠",
  "Navy pilots always find their way home. He'll find his way back to you ✈️",
  "Even cats know when someone loves them from far. He knows 🐈",
  "Your heart is louder than any distance. He hears it 🖤",
];
let moonReplyIdx = 0;
const getMoonReply = () => MOON_REPLIES[moonReplyIdx++ % MOON_REPLIES.length];

const OWNER_TABS = [
  { id: 'home', icon: '🏠', label: 'Home' },
  { id: 'letters', icon: '✉️', label: 'Letters' },
  { id: 'gallery', icon: '🖼️', label: 'Gallery' },
  { id: 'voicenotes', icon: '🎙️', label: 'Voice' },
  { id: 'bouquet', icon: '💐', label: 'Bouquet' },
  { id: 'mixtape', icon: '📻', label: 'Mixtape' },
  { id: 'memorymap', icon: '🗺️', label: 'Map' },
  { id: 'collection', icon: '📚', label: 'Collection' },
  { id: 'moon', icon: '🌙', label: 'Moon' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];

const PAGE_STYLE = "min-height:100vh;background:var(--page-bg);position:relative;";
const INNER_STYLE = "position:relative;z-index:10;max-width:680px;margin:0 auto;padding:0 16px 100px;";
const OWNER_INPUT_STYLE = "width:100%;background:rgba(0,13,32,0.75);border:1px solid rgba(178,200,237,0.14);border-radius:14px;padding:12px 16px;color:#eef4ff;font-size:14px;outline:none;font-family:inherit;";
const EDITOR_INPUT_STYLE = "width:100%;background:rgba(0,13,32,0.7);border:1px solid rgba(178,200,237,0.15);border-radius:14px;padding:12px 16px;color:#eef4ff;font-size:14px;outline:none;font-family:inherit;transition:border-color 0.2s;";

// ── Helpers ─────────────────────────────────────────────────────────────
function esc(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
// Dropped into every uploaded <img>: a broken Storage URL (most often
// wrong/missing security rules) would otherwise just show the browser's
// bare broken-image icon with no clue why. This dims it and explains.
const IMG_ERROR_ATTR = `onerror="this.onerror=null;this.style.opacity='0.35';this.style.filter='grayscale(1)';this.title='Couldn\\'t load this image — check Firebase Storage rules allow public read.';"`;
function todayLabel() {
  return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
function freshLetter() {
  return {
    id: `letter-${Date.now()}`,
    label: '', title: '',
    greeting: 'My Dearest Panther,',
    content: '',
    signOff: 'Forever yours,\nDino 🖤',
    date: todayLabel(),
    envelopeColor: 'gold',
    hasPhoto: false, photoUrl: '', photoCaption: '',
    hasAudio: false, audioTitle: '',
    hasVideo: false, videoUrl: '', videoTitle: '',
    hasMusic: false, musicUrl: '', musicTitle: '',
    stickers: [],
    isPublished: true,
    createdAt: new Date().toISOString(),
  };
}
function normalizeData(d) {
  return {
    ...DEFAULT_DATA, ...d,
    letters: d.letters || [], gallery: d.gallery || [], moonMessages: d.moonMessages || [],
    hiddenTabs: { ...DEFAULT_DATA.hiddenTabs, ...(d.hiddenTabs || {}) },
    bouquet: { ...DEFAULT_DATA.bouquet, ...(d.bouquet || {}), flowers: (d.bouquet && d.bouquet.flowers) || [] },
    mixtape: { ...DEFAULT_DATA.mixtape, ...(d.mixtape || {}), songs: (d.mixtape && d.mixtape.songs) || [] },
    memoryMap: { ...DEFAULT_DATA.memoryMap, ...(d.memoryMap || {}), pins: (d.memoryMap && d.memoryMap.pins) || [] },
    voiceNotes: d.voiceNotes || [],
  };
}
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function reverseGeocodeCity(lat, lon) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`);
    const data = await res.json();
    const a = data.address || {};
    return a.city || a.town || a.village || a.county || a.state || null;
  } catch (e) {
    console.error('❌ Reverse geocode error:', e);
    return null;
  }
}

// Asks the recipient to share their live location, computes distance from the
// owner's fixed coordinates, and reverse-geocodes a city name. Falls back to
// the stored static distance/city (state.recipient.live stays 'idle'/'denied').
function requestLiveLocation() {
  if (!navigator.geolocation) {
    state.recipient.live = { status: 'unavailable' };
    return;
  }
  state.recipient.live = { status: 'requesting' };
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      const distanceKm = haversineKm(OWNER_COORDS.lat, OWNER_COORDS.lng, latitude, longitude);
      state.recipient.live = { status: 'ready', distanceKm, cityName: null };
      render();
      const city = await reverseGeocodeCity(latitude, longitude);
      if (state.recipient.live.status === 'ready') {
        state.recipient.live.cityName = city;
        render();
      }
    },
    () => {
      state.recipient.live = { status: 'denied' };
      render();
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
  );
}

// The guided sequence Panther steps through — Collection is deliberately
// excluded here: it's always reachable separately as the "see everything"
// escape hatch, not one more stop to click past.
function visibleRecipientTabs(data) {
  return ['letters', 'gallery', 'voicenotes', 'bouquet', 'mixtape', 'memorymap', 'moon'].filter(t => !data.hiddenTabs[t]);
}
function firstVisibleRecipientTab(data) {
  return visibleRecipientTabs(data)[0] || 'letters';
}
function stepRecipientTab(data, current, dir) {
  const order = visibleRecipientTabs(data);
  const idx = order.indexOf(current);
  if (idx === -1) return order[0] || null;
  const next = idx + dir;
  if (next < 0 || next >= order.length) return null;
  return order[next];
}
// Persistent bottom nav shown only to the recipient — steps through the
// curated sequence one piece at a time instead of a free-roam tab bar, with
// Collection always one tap away as the "see everything" escape hatch.
function recipientNavHTML(data, currentTab) {
  const order = visibleRecipientTabs(data);
  const idx = order.indexOf(currentTab);
  const isFirst = idx <= 0;
  const isLast = idx === order.length - 1;
  return `<div style="position:fixed;bottom:0;left:0;width:100%;z-index:60;background:rgba(10,8,6,0.85);backdrop-filter:blur(16px);border-top:1px solid rgba(255,255,255,0.08);padding:12px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;">
    <button data-action="recipient-prev" ${isFirst ? 'disabled' : ''} class="font-mono" style="padding:10px 16px;border-radius:14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:${isFirst ? 'rgba(255,255,255,0.2)' : '#f0dfb8'};cursor:${isFirst ? 'not-allowed' : 'pointer'};font-size:12px;flex-shrink:0;">‹ Back</button>
    <div style="display:flex;gap:6px;align-items:center;">
      ${order.map((t, i) => `<div style="width:${i === idx ? 18 : 6}px;height:6px;border-radius:3px;background:${i === idx ? '#e9c349' : 'rgba(255,255,255,0.2)'};transition:all 0.2s;"></div>`).join('')}
    </div>
    <button data-action="recipient-next" class="font-mono" style="padding:10px 16px;border-radius:14px;background:#e9c349;border:none;color:#000d20;cursor:pointer;font-size:12px;font-weight:700;flex-shrink:0;white-space:nowrap;">${isLast ? 'See Everything 📚' : 'Next ›'}</button>
  </div>`;
}
function shareUrl() {
  return `${window.location.origin}${window.location.pathname}?gift=main`;
}
function emptyStateHTML(msg, emoji) {
  return `<div style="text-align:center;padding:80px 0;"><div style="font-size:56px;margin-bottom:16px;">${emoji}</div><p class="font-mono" style="color:rgba(178,200,237,0.35);font-size:14px;">${esc(msg)}</p></div>`;
}

// ── Shooting-star background (site-wide default, stable across renders) ───
const rnd = Math.random;
// [tailLength(em), topOffset(vh), fallDuration(s), fallDelay(s)] — hand-tuned
// values from the "Shooting Star" CodePen (alphardex), kept verbatim.
const SHOOTING_STAR_DATA = [
  [7.02,35.89,10.057,0.018],[6.71,9.71,10.509,0.483],[6.12,84.35,9.098,5.232],[6.12,74.48,9.343,9.942],
  [6.82,92.25,8.439,0.152],[6.03,66.03,9.147,1.491],[7.08,23.28,6.553,7.178],[5.27,35.72,7.969,6.256],
  [7.23,38.08,11.884,9.286],[5,91.8,8.923,5.079],[6.21,97,10.307,8.606],[5.16,50.91,9.377,0.889],
  [7.32,76.73,7.725,0.657],[5.22,75.39,10.783,4.359],[7.2,14.59,9.865,3.224],[5.44,84.95,8.572,0.601],
  [5.54,44.86,7.921,1.542],[5.72,41.88,7.326,3.13],[6.61,92.41,6.741,8.985],[7.07,97.49,10.135,9.468],
  [5.16,62.53,11.79,9.069],[5.57,58.86,10.388,6.736],[6.66,70.01,7.583,1.495],[6.41,40.62,8.185,4.553],
  [6.43,20.12,8.568,3.683],[6.81,12.18,10.264,5.49],[6.75,50.11,7.73,7.199],[5.33,45.66,8.764,3.558],
  [5.69,72.54,6.689,1.599],[7,87.17,7.358,5.061],[5.15,57.09,6.506,1.416],[5.12,97.36,9.355,9.791],
  [6.27,6.95,9.321,5.083],[5.06,90.01,10.469,7.925],[5.26,0.48,10.121,2.85],[5.25,80.04,10.184,7.085],
  [7.12,13.88,7.689,0.07],[6.29,66.9,11.999,7.911],[5.43,1.59,11.958,5.085],[5.04,63.63,9.484,7.908],
  [5.41,64.06,6.29,5.286],[7.03,84.38,10.566,2.129],[5.39,59.43,8.484,7.551],[6.26,24.68,9.633,1.431],
  [5.95,75.79,11.684,6.407],[5.24,50.42,7.988,7.555],[7.49,63.84,9.711,2.579],[6.23,55.32,6.868,8.953],
  [5.28,33.53,6.389,6.785],[6.84,51.55,7.825,3.472],
];
function starsHTML(opacity) {
  const stars = SHOOTING_STAR_DATA.map(([tail, top, dur, delay]) =>
    `<div class="star" style="--star-tail-length:${tail}em;--top-offset:${top}vh;--fall-duration:${dur}s;--fall-delay:${delay}s;"><div class="star-head"></div></div>`
  ).join('');
  const opacityStyle = opacity != null ? ` style="opacity:${opacity};"` : '';
  return `<div class="shooting-stars-bg"${opacityStyle}>${stars}</div>`;
}

// ── App-wide month theme ─────────────────────────────────────────────────
function getTheme(id) {
  return THEMES.find(t => t.id === id) || THEMES[0];
}
function applyTheme(id) {
  const t = getTheme(id);
  const el = document.documentElement.style;
  el.setProperty('--accent', t.accent);
  el.setProperty('--accent-rgb', t.accentRgb);
  // If this month has a real animated scene, let it show through the
  // persistent #theme-bg layer instead of painting an opaque gradient.
  el.setProperty('--page-bg', hasScene(id) ? 'transparent' : t.pageBg);
}
const PARTICLE_SEED = Array.from({ length: 22 }, () => ({
  x: rnd() * 100, delay: rnd() * 10, dur: 6 + rnd() * 6, size: 14 + rnd() * 10, top: rnd() * 60,
}));
// Falling/floating seasonal particles plus a small signature corner icon.
// Layered alongside the starfield, not replacing it — the stars are the
// app's core "same sky" motif regardless of theme.
function themeExtrasHTML(themeId) {
  const t = getTheme(themeId);
  if (!t.particle) return '';
  const particles = PARTICLE_SEED.map(p => {
    const posStyle = t.motion === 'fall' ? `left:${p.x}%;` : `left:${p.x}%;top:${p.top}%;`;
    return `<span class="particle ${t.motion}" style="${posStyle}font-size:${p.size}px;animation-duration:${p.dur}s;animation-delay:${p.delay}s;">${t.particle}</span>`;
  }).join('');
  return `<div class="particles-bg">${particles}</div>${t.icon ? `<div class="theme-icon-badge">${t.icon}</div>` : ''}`;
}
// Stars + seasonal particles, OR nothing when the month has a real animated
// scene (it renders into the persistent #theme-bg layer instead — see
// monthThemes.js / afterRender()).
function skyBackdropHTML(themeId) {
  if (hasScene(themeId)) return '';
  return starsHTML() + (themeId ? themeExtrasHTML(themeId) : '');
}

// ── State ────────────────────────────────────────────────────────────────
const state = {
  isRecipient: false,
  giftParam: null,
  recipient: {
    loading: false, error: false, data: null, tab: 'letters', live: { status: 'idle' },
    pinOk: false, pin: { digits: ['', '', '', ''], error: false, shaking: false }, pinFocusIndex: null,
  },
  pinOk: false,
  pin: { digits: ['', '', '', ''], error: false, shaking: false },
  pinFocusIndex: null,
  owner: {
    tab: 'home',
    data: { ...DEFAULT_DATA },
    saving: false, pubOk: false, copied: false,
    cityForm: { fromCity: 'Sialkot', toCity: 'Ormara' },
  },
  editingLetter: undefined, // undefined = closed, null = new, object = editing
  editor: { step: 1, draft: null, musicUploading: false },
  openLetterId: null,
  newPhoto: { url: '', caption: '', location: '' },
  lightbox: null, // { idx }
  moonEditor: { dinoDraft: '', moonDraft: '', editingId: null, editingText: '', openPicker: null },
  bouquetForm: { note: '', bgUrl: '' },
  mixtapeStep: 1,
  mixtapeForm: { label: '', note: '', songTitle: '', songArtist: '' },
  mixtapeUploading: false,
  memoryMapDraft: null, // { x, y, title, date, note, photoUrl, voiceUrl }
  memoryMapViewingId: null,
  memoryMapUploading: false,
  recipientPinForm: { pin: '' },
  galleryUploading: false,
  voiceNoteDraft: { title: '', photos: [], audioUrl: '' },
  voiceNotePhotoUploading: false,
  voiceNoteAudioUploading: false,
  voiceNoteViewingId: null,
  voiceNotePlayer: { playing: false, photoIndex: 0 },
};

const root = document.getElementById('root');

// ── View resolution ──────────────────────────────────────────────────────
function computeView() {
  if (state.isRecipient && state.recipient.loading) return 'recipient-loading';
  if (state.isRecipient && state.recipient.error) return 'recipient-error';
  if (state.isRecipient && state.recipient.data && !state.recipient.pinOk) return 'recipient-pin';
  if (state.isRecipient && state.recipient.data) {
    if (state.recipient.tab === 'moon') return 'moon';
    if (state.recipient.tab === 'bouquet') return 'bouquet';
    if (state.recipient.tab === 'mixtape') return 'mixtape';
    if (state.recipient.tab === 'memorymap') return 'memorymap';
    if (state.recipient.tab === 'voicenotes') return 'voicenotes';
    if (state.recipient.tab === 'collection') return 'collection';
    return 'recipient';
  }
  if (!state.pinOk) return 'pin';
  if (state.owner.tab === 'moon') return 'moon';
  if (state.owner.tab === 'bouquet') return 'bouquet';
  if (state.owner.tab === 'mixtape') return 'mixtape';
  if (state.owner.tab === 'memorymap') return 'memorymap';
  if (state.owner.tab === 'voicenotes') return 'voicenotes';
  if (state.owner.tab === 'collection') return 'collection';
  if (state.editingLetter !== undefined) return 'editor';
  return 'owner';
}

function render() {
  const view = computeView();
  let html = '';
  switch (view) {
    case 'recipient-loading': html = recipientLoadingHTML(); break;
    case 'recipient-error': html = recipientErrorHTML(); break;
    case 'recipient-pin': html = recipientPinScreenHTML(); break;
    case 'recipient': html = recipientViewHTML(); break;
    case 'pin': html = pinScreenHTML(); break;
    case 'moon': html = (state.isRecipient && state.recipient.data) ? moonScriptViewHTML() : moonScriptEditorHTML(); break;
    case 'bouquet': html = (state.isRecipient && state.recipient.data) ? bouquetViewHTML() : bouquetBuilderHTML(); break;
    case 'mixtape': html = (state.isRecipient && state.recipient.data) ? mixtapeViewHTML() : mixtapeBuilderHTML(); break;
    case 'memorymap': html = (state.isRecipient && state.recipient.data) ? memoryMapViewHTML() : memoryMapBuilderHTML(); break;
    case 'voicenotes': html = (state.isRecipient && state.recipient.data) ? voiceNoteListViewHTML() : voiceNoteBuilderHTML(); break;
    case 'collection': html = collectionHTML(); break;
    case 'editor': html = letterEditorHTML(); break;
    case 'owner': html = ownerStudioHTML(); break;
  }
  root.innerHTML = html;
  afterRender(view);
}

function afterRender(view) {
  if (view === 'pin' && state.pinFocusIndex !== null) {
    const el = root.querySelector(`[data-role="pin-digit"][data-index="${state.pinFocusIndex}"]`);
    if (el) el.focus();
    state.pinFocusIndex = null;
  }
  if (view === 'recipient-pin' && state.recipient.pinFocusIndex !== null) {
    const el = root.querySelector(`[data-role="recipient-pin-digit"][data-index="${state.recipient.pinFocusIndex}"]`);
    if (el) el.focus();
    state.recipient.pinFocusIndex = null;
  }
  if (view === 'moon') {
    const box = root.querySelector('#moon-messages');
    if (box) box.scrollTop = box.scrollHeight;
    const data = (state.isRecipient && state.recipient.data) ? state.recipient.data : state.owner.data;
    const effect = skyEffect(data.skyEffectId);
    const iconCanvas = root.querySelector('#moon-3d-icon');
    if (iconCanvas) mountMoonIcon(iconCanvas, data.moonPhaseDay);
    const skyCanvas = root.querySelector('#moon-3d-sky');
    if (skyCanvas) mountMoonSky(skyCanvas, { density: effect.dots, extra: effect.extra });
  } else {
    unmountMoonIcon();
    unmountMoonSky();
  }
  if (view === 'voicenotes' && state.voiceNoteViewingId) {
    const data = (state.isRecipient && state.recipient.data) ? state.recipient.data : state.owner.data;
    const note = (data.voiceNotes || []).find(n => n.id === state.voiceNoteViewingId);
    if (note && note.photos && note.photos.length > 1) {
      if (voiceNoteSlideshowNoteId !== note.id) {
        stopVoiceNoteSlideshow();
        voiceNoteSlideshowNoteId = note.id;
        voiceNoteSlideshowTimer = setInterval(() => {
          state.voiceNotePlayer.photoIndex = (state.voiceNotePlayer.photoIndex + 1) % note.photos.length;
          render();
        }, 3500);
      }
    } else {
      stopVoiceNoteSlideshow();
    }
  } else {
    stopVoiceNoteSlideshow();
  }
  // Month-theme animated background — app-wide, but not on Moon Chat (it has
  // its own independent sky system). Safe to call every render: it no-ops
  // unless the active theme actually changed.
  const themeId = (state.isRecipient && state.recipient.data) ? state.recipient.data.theme : state.owner.data.theme;
  if (view !== 'moon' && view !== 'mixtape' && view !== 'memorymap' && hasScene(themeId)) {
    mountMonthScene(themeId, document.getElementById('theme-bg'));
  } else {
    unmountMonthScene();
  }
  applyCursorForView(view, themeId);
  const musicEl = root.querySelector('#letter-music-player');
  if (musicEl) musicEl.play().catch(() => {}); // autoplay can be blocked; controls stay visible either way
}

// A cat courier in an army uniform delivering the gift, replacing the old
// 🦖💌🐾 emoji on the recipient's loading screen.
function catSoldierSVG() {
  return `<svg width="150" height="164" viewBox="0 0 220 240" style="overflow:visible;display:block;">
    <ellipse cx="110" cy="228" rx="70" ry="10" fill="rgba(0,0,0,0.25)"/>
    <path d="M170 190 C205 180 210 140 190 115" stroke="#d9b98a" stroke-width="14" fill="none" stroke-linecap="round"/>
    <path d="M170 190 C205 180 210 140 190 115" stroke="#c9a876" stroke-width="14" fill="none" stroke-linecap="round" opacity="0.4" stroke-dasharray="1 16"/>
    <rect x="78" y="190" width="20" height="30" rx="6" fill="#3f4a34"/>
    <rect x="122" y="190" width="20" height="30" rx="6" fill="#3f4a34"/>
    <ellipse cx="88" cy="222" rx="14" ry="8" fill="#2b3324"/>
    <ellipse cx="132" cy="222" rx="14" ry="8" fill="#2b3324"/>
    <path d="M60 130 C60 100 82 88 110 88 C138 88 160 100 160 130 L156 196 C156 205 145 210 110 210 C75 210 64 205 64 196 Z" fill="#5b6b47"/>
    <path d="M60 130 C60 100 82 88 110 88 C138 88 160 100 160 130 L156 196 C156 205 145 210 110 210 C75 210 64 205 64 196 Z" fill="none" stroke="#3f4a34" stroke-width="2"/>
    <path d="M110 92 L110 208" stroke="#3f4a34" stroke-width="1.5" opacity="0.5"/>
    <circle cx="110" cy="118" r="2.6" fill="#e8dcb8"/>
    <circle cx="110" cy="132" r="2.6" fill="#e8dcb8"/>
    <circle cx="110" cy="146" r="2.6" fill="#e8dcb8"/>
    <rect x="70" y="112" width="20" height="16" rx="2" fill="#4d5a3d" stroke="#3f4a34" stroke-width="1.5"/>
    <path d="M56 108 C48 118 46 140 54 156" stroke="#4d5a3d" stroke-width="16" fill="none" stroke-linecap="round"/>
    <path d="M164 108 C172 118 174 140 166 156" stroke="#4d5a3d" stroke-width="16" fill="none" stroke-linecap="round"/>
    <path d="M64 104 L84 96 L86 104 Z" fill="#e8dcb8"/>
    <path d="M156 104 L136 96 L134 104 Z" fill="#e8dcb8"/>
    <path d="M72 58 L60 24 L92 46 Z" fill="#e8d4b0" stroke="#c9a876" stroke-width="1.5"/>
    <path d="M148 58 L160 24 L128 46 Z" fill="#e8d4b0" stroke="#c9a876" stroke-width="1.5"/>
    <path d="M74 52 L67 32 L86 46 Z" fill="#f3c7c7"/>
    <path d="M146 52 L153 32 L134 46 Z" fill="#f3c7c7"/>
    <circle cx="110" cy="72" r="44" fill="#e8d4b0" stroke="#c9a876" stroke-width="1.5"/>
    <path d="M64 56 C64 30 84 16 110 16 C136 16 156 30 156 56 C140 44 80 44 64 56 Z" fill="#4d5a3d" stroke="#3f4a34" stroke-width="1.5"/>
    <path d="M64 56 C80 46 140 46 156 56 C156 62 150 65 110 65 C70 65 64 62 64 56 Z" fill="#3f4a34"/>
    <circle cx="110" cy="30" r="4" fill="#e8dcb8" stroke="#3f4a34" stroke-width="1"/>
    <circle cx="92" cy="76" r="4.4" fill="#3a2c1c"/>
    <circle cx="128" cy="76" r="4.4" fill="#3a2c1c"/>
    <circle cx="93.5" cy="74.5" r="1.3" fill="#fff"/>
    <circle cx="129.5" cy="74.5" r="1.3" fill="#fff"/>
    <path d="M106 86 L114 86 L110 91 Z" fill="#e8a0a0"/>
    <path d="M110 91 Q104 93 101 89" stroke="#8a6a4a" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <path d="M110 91 Q116 93 119 89" stroke="#8a6a4a" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <path d="M78 84 L52 80 M78 90 L50 92 M142 84 L168 80 M142 90 L170 92" stroke="#c9a876" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M100 128 L96 142 L104 148 L112 142 L108 128" fill="#c9c2a8" stroke="#9a9378" stroke-width="1"/>
    <path d="M96 108 Q110 100 124 108" stroke="#9a9378" stroke-width="2" fill="none"/>
    <g transform="translate(64 150)">
      <rect x="0" y="0" width="92" height="58" rx="4" fill="#c9a876" stroke="#8a6a45" stroke-width="2"/>
      <rect x="0" y="0" width="92" height="16" fill="#b8996b" opacity="0.6"/>
      <path d="M46 0 L46 58 M0 29 L92 29" stroke="#8a6a45" stroke-width="2.5"/>
      <rect x="20" y="17" width="52" height="24" rx="2" fill="#f3e8d0" stroke="#8a6a45" stroke-width="1.2" transform="rotate(-4 46 29)"/>
      <text x="46" y="33" text-anchor="middle" font-family="Georgia,serif" font-size="10" font-weight="700" fill="#5b4a2f" transform="rotate(-4 46 29)">PANTHER</text>
    </g>
  </svg>`;
}

// ── PIN screen ───────────────────────────────────────────────────────────
function pinScreenHTML() {
  const { digits, error, shaking } = state.pin;
  return `
  <div style="min-height:100vh;background:var(--page-bg);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;">
    ${skyBackdropHTML(state.owner.data.theme)}
    <div style="position:relative;z-index:10;width:100%;max-width:380px;padding:0 24px;display:flex;flex-direction:column;align-items:center;gap:32px;">
      <div style="text-align:center;animation:slideUp 0.5s ease-out forwards;">
        <h1 class="font-serif gold-glow" style="font-size:42px;font-weight:700;color:#ffddb0;margin-bottom:6px;">For Panther</h1>
        <p class="font-serif" style="color:#b2c8ed;font-size:14px;font-style:italic;">From your Dino, with love ✈️</p>
        <div class="glass-gold font-mono" style="margin-top:14px;display:inline-flex;align-items:center;gap:8px;padding:8px 18px;border-radius:999px;font-size:12px;color:#b2c8ed;">
          <span style="color:var(--accent);">📍</span> Sialkot
          <span style="color:var(--accent);">✈️</span> Ormara
          <span style="color:var(--accent);font-weight:700;">· 730 km</span>
        </div>
      </div>

      <div class="glass-gold" style="width:100%;border-radius:28px;padding:36px;box-shadow:0 24px 60px rgba(0,0,0,0.5);animation:slideUp 0.5s 0.1s ease-out forwards;opacity:0;">
        <div style="text-align:center;margin-bottom:28px;">
          <p class="font-stencil" style="font-size:16px;color:var(--accent);letter-spacing:0.15em;text-transform:uppercase;">Enter Access Code</p>
        </div>

        <div class="${shaking ? 'do-shake' : ''}" style="display:flex;justify-content:center;gap:14px;margin-bottom:16px;">
          ${[0, 1, 2, 3].map(i => {
            const d = digits[i];
            const borderColor = error ? '#f87171' : d ? 'var(--accent)' : 'rgba(178,200,237,0.2)';
            const boxShadow = d ? '0 0 14px rgba(var(--accent-rgb),0.3)' : 'none';
            return `<input type="password" inputmode="numeric" maxlength="1" value="${esc(d)}" data-role="pin-digit" data-index="${i}" class="font-mono"
              style="width:58px;height:68px;text-align:center;font-size:30px;font-weight:700;background:rgba(0,13,32,0.85);border:2px solid ${borderColor};border-radius:16px;color:#ffddb0;outline:none;box-shadow:${boxShadow};transition:all 0.2s;" />`;
          }).join('')}
        </div>

        ${error ? `<p class="font-mono" style="text-align:center;color:#f87171;font-size:12px;margin-bottom:12px;animation:fadeIn 0.2s ease-out;">Incorrect code. Try again 💫</p>` : ''}

        <button data-action="pin-submit" class="btn-gold" style="width:100%;padding:16px 0;border-radius:18px;font-size:14px;border:none;cursor:pointer;letter-spacing:0.05em;">
          Unlock Letters ✨
        </button>
      </div>

      <p class="font-mono" style="color:rgba(178,200,237,0.2);font-size:11px;">Awaiting clearance...</p>
    </div>
  </div>`;
}

// ── Recipient screens ────────────────────────────────────────────────────
function recipientLoadingHTML() {
  return `
  <div style="${PAGE_STYLE}display:flex;align-items:center;justify-content:center;">
    ${starsHTML()}
    <div class="glass-gold" style="position:relative;z-index:10;border-radius:28px;padding:40px 32px;max-width:380px;width:100%;margin:0 16px;text-align:center;">
      <div style="display:flex;justify-content:center;margin-bottom:8px;animation:float 3.5s ease-in-out infinite;">${catSoldierSVG()}</div>
      <p class="font-stencil" style="font-size:22px;color:var(--accent);letter-spacing:0.06em;margin-bottom:10px;text-shadow:0 2px 8px rgba(0,0,0,0.5);">YOU'VE GOT A PARCEL</p>
      <p class="font-mono" style="font-size:13px;color:#b2c8ed;margin-bottom:24px;">Special delivery, incoming from Sialkot to Ormara</p>
      <div style="display:flex;justify-content:center;gap:8px;">
        ${[0, 1, 2].map(i => `<div style="width:10px;height:10px;border-radius:50%;background:var(--accent);animation:bounceDot 1s ease-in-out ${i * 0.15}s infinite;"></div>`).join('')}
      </div>
    </div>
  </div>`;
}

function recipientPinScreenHTML() {
  const { digits, error, shaking } = state.recipient.pin;
  return `
  <div style="min-height:100vh;background:var(--page-bg);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;">
    ${starsHTML()}
    <div style="position:relative;z-index:10;width:100%;max-width:380px;padding:0 24px;display:flex;flex-direction:column;align-items:center;gap:28px;">
      <div style="text-align:center;animation:slideUp 0.5s ease-out forwards;">
        <div style="display:flex;justify-content:center;margin-bottom:4px;transform:scale(0.75);animation:float 5s ease-in-out infinite;">${catSoldierSVG()}</div>
        <h1 class="font-serif gold-glow" style="font-size:28px;font-weight:700;color:#ffddb0;margin-bottom:6px;">Sign for the parcel</h1>
        <p class="font-serif" style="color:#b2c8ed;font-size:14px;font-style:italic;">Dino left you a code to open it 🐾</p>
      </div>

      <div class="glass-gold" style="width:100%;border-radius:28px;padding:32px;box-shadow:0 24px 60px rgba(0,0,0,0.5);animation:slideUp 0.5s 0.1s ease-out forwards;opacity:0;">
        <p class="font-stencil" style="text-align:center;font-size:14px;color:var(--accent);letter-spacing:0.15em;text-transform:uppercase;margin-bottom:22px;">Enter The Code</p>
        <div class="${shaking ? 'do-shake' : ''}" style="display:flex;justify-content:center;gap:14px;margin-bottom:16px;">
          ${[0, 1, 2, 3].map(i => {
            const d = digits[i];
            const borderColor = error ? '#f87171' : d ? 'var(--accent)' : 'rgba(178,200,237,0.2)';
            const boxShadow = d ? '0 0 14px rgba(var(--accent-rgb),0.3)' : 'none';
            return `<input type="password" inputmode="numeric" maxlength="1" value="${esc(d)}" data-role="recipient-pin-digit" data-index="${i}" class="font-mono"
              style="width:58px;height:68px;text-align:center;font-size:30px;font-weight:700;background:rgba(0,13,32,0.85);border:2px solid ${borderColor};border-radius:16px;color:#ffddb0;outline:none;box-shadow:${boxShadow};transition:all 0.2s;" />`;
          }).join('')}
        </div>
        ${error ? `<p class="font-mono" style="text-align:center;color:#f87171;font-size:12px;margin-bottom:12px;animation:fadeIn 0.2s ease-out;">That's not it — try again 💫</p>` : ''}
        <button data-action="recipient-pin-submit" class="btn-gold" style="width:100%;padding:16px 0;border-radius:18px;font-size:14px;border:none;cursor:pointer;letter-spacing:0.05em;">
          Open Your Gift ✨
        </button>
      </div>
    </div>
  </div>`;
}

function recipientErrorHTML() {
  return `
  <div style="${PAGE_STYLE}display:flex;align-items:center;justify-content:center;">
    ${starsHTML()}
    <div class="glass-gold" style="position:relative;z-index:10;border-radius:28px;padding:48px 40px;max-width:360px;width:100%;margin:0 16px;text-align:center;">
      <div style="font-size:56px;margin-bottom:16px;">💌</div>
      <h2 class="font-serif" style="font-size:22px;font-weight:700;color:#ffddb0;margin-bottom:10px;">Not published yet</h2>
      <p class="font-mono" style="font-size:13px;color:#b2c8ed;margin-bottom:24px;">Dino is still writing your letters. Check back soon, Panther! 🐾</p>
      <button data-action="recipient-retry" class="btn-gold font-mono" style="padding:12px 28px;border-radius:16px;border:none;cursor:pointer;font-size:13px;">Try again ↺</button>
    </div>
  </div>`;
}

function recipientViewHTML() {
  const d = state.recipient.data;
  const tab = state.recipient.tab;
  const live = state.recipient.live || { status: 'idle' };
  const isLive = live.status === 'ready';
  const toLabel = isLive && live.cityName ? live.cityName : d.toCity;
  const kmLabel = isLive ? Math.round(live.distanceKm).toLocaleString() : Number(d.distanceKm).toLocaleString();
  return `
  <div style="${PAGE_STYLE}">
    ${skyBackdropHTML(d.theme)}
    <div style="${INNER_STYLE}">
      <div style="padding-top:48px;padding-bottom:32px;text-align:center;animation:slideUp 0.5s ease-out;">
        <div style="font-size:64px;margin-bottom:14px;display:inline-block;animation:float 6s ease-in-out infinite;">🦖🐾</div>
        <h1 class="font-serif gold-glow" style="font-size:44px;font-weight:700;color:#ffddb0;margin-bottom:8px;">For Panther</h1>
        <p class="font-serif" style="color:#b2c8ed;font-size:15px;font-style:italic;margin-bottom:20px;">From your Dino, written under the same sky ✈️</p>
        <div class="glass-gold font-mono" style="display:inline-flex;align-items:center;gap:8px;padding:10px 22px;border-radius:999px;font-size:13px;color:#b2c8ed;">
          <span style="color:var(--accent);">📍</span>${esc(d.fromCity)}
          <span style="color:var(--accent);">✈️</span>${esc(toLabel)}
          <span style="color:rgba(178,200,237,0.35);">·</span>
          <span style="color:var(--accent);font-weight:700;">${kmLabel} km</span>
          <span style="color:rgba(178,200,237,0.35);">·</span>
          <span style="font-style:italic;opacity:0.6;">same sky 🌙</span>
        </div>
        ${isLive ? `<p class="font-mono" style="margin-top:8px;font-size:10px;color:rgba(74,222,128,0.7);">📡 live distance from your current location</p>` : ''}
      </div>

      ${tab === 'letters' ? envelopeGridHTML(d.letters, false) : ''}
      ${tab === 'gallery' ? galleryGridHTML(d.gallery, false) : ''}
    </div>
    ${recipientNavHTML(d, tab)}
  </div>` + (tab === 'letters' ? letterModalOverlayHTML(d.letters) : (tab === 'gallery' ? lightboxOverlayHTML(d.gallery) : ''));
}

// ── Envelope grid / letter modal ────────────────────────────────────────
function envelopeCardHTML(letter, isOwner) {
  const c = ENVELOPE_CARD_COLORS[letter.envelopeColor] || ENVELOPE_CARD_COLORS.gold;
  return `
  <div style="position:relative;">
    <button data-action="open-letter" data-id="${esc(letter.id)}" class="envelope-card" style="width:100%;text-align:left;cursor:pointer;border:none;padding:0;border-radius:24px;overflow:hidden;background:${c.envelope};outline:1px solid ${c.border}33;box-shadow:0 4px 20px rgba(0,0,0,0.4);">
      <div style="position:relative;padding-top:58%;">
        <svg style="position:absolute;inset:0;width:100%;height:100%;" viewBox="0 0 300 174" preserveAspectRatio="none">
          <rect x="0" y="0" width="300" height="174" fill="${c.envelope}" />
          <polygon points="0,0 0,174 140,87" fill="${c.border}12" />
          <polygon points="300,0 300,174 160,87" fill="${c.border}12" />
          <polygon points="0,0 300,0 150,95" fill="${c.border}18" stroke="${c.border}40" stroke-width="1" />
          <circle cx="150" cy="97" r="26" fill="${c.wax}" opacity="0.92" />
          <text x="150" y="105" text-anchor="middle" font-size="20" fill="white" opacity="0.95">🐾</text>
        </svg>
        <div class="envelope-shimmer" style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%, ${c.border}14 0%, transparent 65%);opacity:0;transition:opacity .3s;pointer-events:none;"></div>
      </div>
      <div style="padding:14px 18px 18px;">
        <div style="display:inline-block;padding:3px 10px;border-radius:999px;background:${c.badge};margin-bottom:8px;">
          <span class="font-mono" style="font-size:10px;color:${c.badgeText};letter-spacing:0.12em;text-transform:uppercase;font-weight:600;">Open When...</span>
        </div>
        <h3 class="font-serif" style="color:${c.border};font-size:15px;font-weight:700;line-height:1.3;margin-bottom:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
          ${esc(letter.label || 'Untitled Letter')}
        </h3>
        <p class="font-mono" style="font-size:10px;color:rgba(178,200,237,0.35);">${esc(letter.date)}</p>
        <div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:10px;">
          ${letter.hasPhoto ? `<span class="font-mono" style="font-size:10px;padding:2px 8px;border-radius:999px;background:rgba(125,211,252,0.1);color:#7dd3fc;">📷 photo</span>` : ''}
          ${letter.hasAudio ? `<span class="font-mono" style="font-size:10px;padding:2px 8px;border-radius:999px;background:rgba(251,113,133,0.1);color:#fb7185;">🎙️ audio</span>` : ''}
          ${letter.hasVideo ? `<span class="font-mono" style="font-size:10px;padding:2px 8px;border-radius:999px;background:rgba(167,139,250,0.1);color:#a78bfa;">🎬 video</span>` : ''}
          ${letter.hasMusic ? `<span class="font-mono" style="font-size:10px;padding:2px 8px;border-radius:999px;background:rgba(74,222,128,0.1);color:#4ade80;">🎵 music</span>` : ''}
          ${letter.stickers.length > 0 ? `<span style="font-size:13px;">${letter.stickers.slice(0, 4).join('')}</span>` : ''}
        </div>
      </div>
    </button>
    ${isOwner && !letter.isPublished ? `<div class="font-mono" style="position:absolute;bottom:58px;left:14px;font-size:10px;padding:2px 8px;border-radius:999px;background:rgba(251,191,36,0.15);color:#fbbf24;border:1px solid rgba(251,191,36,0.25);">draft</div>` : ''}
    ${isOwner ? `
      <div style="position:absolute;top:10px;right:10px;display:flex;gap:5px;">
        <button data-action="edit-letter" data-id="${esc(letter.id)}" style="width:28px;height:28px;border-radius:50%;background:var(--accent);border:none;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;color:#000d20;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.4);">✎</button>
        <button data-action="delete-letter" data-id="${esc(letter.id)}" style="width:28px;height:28px;border-radius:50%;background:rgba(239,68,68,0.8);border:none;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;color:white;box-shadow:0 2px 8px rgba(0,0,0,0.4);">×</button>
      </div>` : ''}
  </div>`;
}

function envelopeGridHTML(letters, isOwner) {
  const visible = isOwner ? letters : letters.filter(l => l.isPublished);
  if (visible.length === 0) return emptyStateHTML(isOwner ? 'No letters yet — write your first one!' : 'Letters are on their way...', '💌');
  return `<div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:16px;">${visible.map(l => envelopeCardHTML(l, isOwner)).join('')}</div>`;
}

function letterModalOverlayHTML(letters) {
  if (!state.openLetterId) return '';
  const letter = letters.find(l => l.id === state.openLetterId);
  if (!letter) return '';
  return `
  <div data-action="close-letter-modal" style="position:fixed;inset:0;z-index:100;background:rgba(0,0,0,0.85);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn 0.25s ease-out;">
    <div data-action="stop" class="letter-paper" style="width:100%;max-width:520px;max-height:92vh;overflow-y:auto;border-radius:28px;padding:36px 32px;box-shadow:0 32px 80px rgba(0,0,0,0.7);position:relative;animation:slideUp 0.3s ease-out;">
      <button data-action="close-letter-modal" style="position:absolute;top:16px;right:16px;width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,0.08);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#2c1d11;">✕</button>
      <div style="margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid rgba(44,29,17,0.1);">
        <p class="font-mono" style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;opacity:0.4;margin-bottom:6px;">💌 Open When</p>
        <h2 class="font-serif" style="font-size:26px;font-weight:700;line-height:1.2;margin-bottom:6px;">${esc(letter.label)}</h2>
        <p class="font-mono" style="font-size:11px;opacity:0.35;">${esc(letter.date)}</p>
      </div>
      ${letter.stickers.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;">${letter.stickers.map(s => `<span style="font-size:24px;">${s}</span>`).join('')}</div>` : ''}
      <div class="font-serif" style="line-height:1.9;font-size:16px;">
        ${letter.greeting ? `<p style="font-weight:700;font-size:18px;margin-bottom:16px;">${esc(letter.greeting)}</p>` : ''}
        <p style="white-space:pre-line;">${esc(letter.content)}</p>
        ${letter.signOff ? `<p style="font-weight:700;font-style:italic;margin-top:24px;text-align:right;">${esc(letter.signOff)}</p>` : ''}
      </div>
      ${letter.hasPhoto && letter.photoUrl ? `
        <div style="display:flex;justify-content:center;margin-top:28px;">
          <div style="background:white;padding:10px 10px 30px;box-shadow:0 8px 24px rgba(0,0,0,0.18);transform:rotate(1.5deg);max-width:260px;width:100%;">
            <img src="${esc(letter.photoUrl)}" alt="" ${IMG_ERROR_ATTR} style="width:100%;aspect-ratio:1/1;object-fit:cover;display:block;" />
            ${letter.photoCaption ? `<p class="font-serif" style="text-align:center;font-size:12px;color:#78716c;margin-top:10px;font-style:italic;">"${esc(letter.photoCaption)}"</p>` : ''}
          </div>
        </div>` : ''}
      ${letter.hasAudio && letter.audioTitle ? `
        <div style="margin-top:20px;padding:14px 18px;background:rgba(251,113,133,0.08);border-radius:16px;border:1px solid rgba(251,113,133,0.15);display:flex;align-items:center;gap:12px;">
          <span style="font-size:22px;">🎙️</span>
          <div>
            <p class="font-mono" style="font-size:10px;color:#fb7185;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:2px;">Voice Note</p>
            <p class="font-serif" style="font-weight:600;font-size:14px;">${esc(letter.audioTitle)}</p>
          </div>
        </div>` : ''}
      ${letter.hasVideo && letter.videoUrl ? `
        <div style="margin-top:20px;border-radius:16px;overflow:hidden;">
          <video src="${esc(letter.videoUrl)}" controls style="width:100%;display:block;"></video>
          ${letter.videoTitle ? `<p class="font-mono" style="text-align:center;font-size:11px;margin-top:8px;opacity:0.5;">${esc(letter.videoTitle)}</p>` : ''}
        </div>` : ''}
      ${letter.hasMusic && letter.musicUrl ? `
        <div style="margin-top:20px;padding:14px 18px;background:rgba(74,222,128,0.08);border-radius:16px;border:1px solid rgba(74,222,128,0.15);">
          <p class="font-mono" style="font-size:10px;color:#4ade80;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:8px;">🎵 ${esc(letter.musicTitle || 'Background Music')}</p>
          <audio id="letter-music-player" src="${esc(letter.musicUrl)}" controls loop autoplay style="width:100%;height:36px;"></audio>
        </div>` : ''}
      <div style="margin-top:28px;padding-top:16px;border-top:1px solid rgba(44,29,17,0.08);display:flex;justify-content:space-between;">
        <span class="font-mono" style="font-size:11px;opacity:0.3;">🦖 From Dino</span>
        <span class="font-mono" style="font-size:11px;opacity:0.3;">Sialkot → Ormara</span>
      </div>
    </div>
  </div>`;
}

// ── Gallery / lightbox ───────────────────────────────────────────────────
function galleryGridHTML(photos, isOwner) {
  if (photos.length === 0) return emptyStateHTML(isOwner ? 'No photos yet — add your first memory!' : 'Gallery coming soon...', '📷');
  return `<div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:12px;">
    ${photos.map((p, i) => `
      <div class="gallery-tile" data-action="open-lightbox" data-idx="${i}">
        <img src="${esc(p.url)}" alt="${esc(p.caption)}" ${IMG_ERROR_ATTR} />
        <div class="gallery-caption">
          <div style="position:absolute;bottom:0;left:0;right:0;padding:12px;">
            <p class="font-serif" style="color:white;font-size:12px;font-style:italic;margin-bottom:2px;">"${esc(p.caption)}"</p>
            <p class="font-mono" style="color:var(--accent);font-size:10px;">📍 ${esc(p.location)}</p>
          </div>
        </div>
        ${isOwner ? `<button data-action="delete-photo" data-id="${esc(p.id)}" style="position:absolute;top:8px;right:8px;width:30px;height:30px;border-radius:50%;background:rgba(239,68,68,0.8);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:white;opacity:0.85;">🗑</button>` : ''}
      </div>`).join('')}
  </div>`;
}

function lightboxOverlayHTML(photos) {
  if (!state.lightbox) return '';
  const p = photos[state.lightbox.idx];
  if (!p) return '';
  return `
  <div data-action="close-lightbox" style="position:fixed;inset:0;z-index:100;background:rgba(0,0,0,0.92);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn 0.2s ease-out;">
    <div data-action="stop" style="position:relative;max-width:520px;width:100%;">
      <img src="${esc(p.url)}" alt="" ${IMG_ERROR_ATTR} style="width:100%;border-radius:24px;box-shadow:0 32px 80px rgba(0,0,0,0.8);display:block;" />
      <div style="margin-top:16px;text-align:center;">
        <p class="font-serif" style="color:white;font-size:16px;font-style:italic;">"${esc(p.caption)}"</p>
        <p class="font-mono" style="color:var(--accent);font-size:12px;margin-top:6px;">📍 ${esc(p.location)} · ${esc(p.date)}</p>
      </div>
      <button data-action="close-lightbox" style="position:absolute;top:12px;right:12px;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.1);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:white;">✕</button>
      ${photos.length > 1 ? `
        <button data-action="lightbox-prev" style="position:absolute;left:12px;top:40%;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.1);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:white;font-size:20px;">‹</button>
        <button data-action="lightbox-next" style="position:absolute;right:12px;top:40%;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.1);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:white;font-size:20px;">›</button>` : ''}
    </div>
  </div>`;
}

// ── 30-day moon phase (drives the Moon Chat sky) ────────────────────────────
const MOON_PHASE_DAYS = Array.from({ length: 30 }, (_, i) => i + 1);
function moonPhaseInfo(day) {
  const angle = (2 * Math.PI * day) / 30; // 0 = new, π = full, 2π = new again
  const illum = (1 - Math.cos(angle)) / 2; // 0..1
  const waxing = day <= 15;
  let label;
  if (illum < 0.05) label = 'New Moon';
  else if (illum < 0.45) label = waxing ? 'Waxing Crescent' : 'Waning Crescent';
  else if (illum < 0.55) label = waxing ? 'First Quarter' : 'Last Quarter';
  else if (illum < 0.95) label = waxing ? 'Waxing Gibbous' : 'Waning Gibbous';
  else label = 'Full Moon';
  return { illum, waxing, label };
}
// Two overlapping circles clipped to a shared boundary — a common lightweight
// approximation for a moon phase silhouette (not astronomically exact, but
// smoothly and correctly progresses crescent → full → crescent over 30 days).
// Radial gradients + a few clipped crater dots + a drop-shadow give it a
// spherical, lit-from-one-side look instead of a flat two-tone disc.
function moonPhaseSVG(day, size, uid) {
  const { illum, waxing } = moonPhaseInfo(day);
  const r = size / 2 - 1;
  const cx = size / 2, cy = size / 2;
  const dx = (waxing ? 1 : -1) * 2 * r * (1 - illum);
  const clipId = `moonclip-${uid}`;
  const litId = `moonlit-${uid}`;
  const darkId = `moondark-${uid}`;
  const craters = [
    { x: cx - r * 0.32, y: cy - r * 0.28, r: r * 0.14 },
    { x: cx + r * 0.12, y: cy + r * 0.38, r: r * 0.09 },
    { x: cx - r * 0.05, y: cy + r * 0.08, r: r * 0.07 },
  ].map(c => `<circle cx="${c.x}" cy="${c.y}" r="${c.r}" fill="rgba(150,130,85,0.28)" clip-path="url(#${clipId})" />`).join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="overflow:visible;display:block;filter:drop-shadow(0 2px 5px rgba(0,0,0,0.55));">
    <defs>
      <clipPath id="${clipId}"><circle cx="${cx}" cy="${cy}" r="${r}" /></clipPath>
      <radialGradient id="${litId}" cx="35%" cy="32%" r="75%">
        <stop offset="0%" stop-color="#fffef2" /><stop offset="55%" stop-color="#fbeead" /><stop offset="100%" stop-color="#d8b96a" />
      </radialGradient>
      <radialGradient id="${darkId}" cx="65%" cy="68%" r="80%">
        <stop offset="0%" stop-color="#2c3a5c" /><stop offset="100%" stop-color="#0e1524" />
      </radialGradient>
    </defs>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${darkId})" />
    <circle cx="${cx + dx}" cy="${cy}" r="${r}" fill="url(#${litId})" clip-path="url(#${clipId})" />
    ${craters}
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="0.5" />
  </svg>`;
}

// ── Independent star-behavior and sky-color pickers (30 each) ──────────────
// Decoupled from the moon phase above — the owner can mix any moon shape
// with any star mood with any sky color, three separate rows.
const SKY_EFFECTS = [
  { icon: '✨', label: 'Shiny Night',    dots: 'many',    shooting: 'none',    extra: null },
  { icon: '🌠', label: 'Shooting Stars', dots: 'few',     shooting: 'many',    extra: null },
  { icon: '🌌', label: 'Mixed Sky',      dots: 'normal',  shooting: 'normal',  extra: null },
  { icon: '⭐', label: 'Quiet Sky',      dots: 'sparse',  shooting: 'none',    extra: null },
  { icon: '🔴', label: 'Mars & Jupiter', dots: 'none',    shooting: 'none',    extra: 'planets' },
  { icon: '🛰️', label: 'Satellite Pass', dots: 'normal',  shooting: 'none',    extra: 'satellite' },
  { icon: '🟢', label: 'Northern Lights',dots: 'few',     shooting: 'none',    extra: 'aurora' },
  { icon: '☄️', label: 'Meteor Shower',  dots: 'few',     shooting: 'radiant', extra: null },
  { icon: '🟣', label: 'Nebula Glow',    dots: 'normal',  shooting: 'none',    extra: 'nebula' },
  { icon: '🌌', label: 'Milky Way',      dots: 'many',    shooting: 'none',    extra: 'milkyway' },
  { icon: '☁️', label: 'Cloudy Sky',     dots: 'sparse',  shooting: 'none',    extra: 'clouds' },
  { icon: '☄️', label: 'Passing Comet',  dots: 'normal',  shooting: 'none',    extra: 'comet' },
  { icon: '💫', label: 'Star Clusters',  dots: 'cluster', shooting: 'none',    extra: null },
  { icon: '🌟', label: 'Calm Sparkle',   dots: 'sparse',  shooting: 'none',    extra: null },
  { icon: '🌕', label: 'Full Brightness',dots: 'many',    shooting: 'none',    extra: null },
  { icon: '🔵', label: 'Cool Glow',      dots: 'normal',  shooting: 'none',    extra: null },
  { icon: '🌀', label: 'Distant Galaxy', dots: 'normal',  shooting: 'none',    extra: 'galaxy' },
  { icon: '🕯️', label: 'Fireflies',      dots: 'few',     shooting: 'none',    extra: 'fireflies' },
  { icon: '❄️', label: 'Starry Snow',    dots: 'normal',  shooting: 'none',    extra: 'snow' },
  { icon: '💞', label: 'Binary Stars',   dots: 'normal',  shooting: 'none',    extra: 'doublestar' },
  { icon: '✴️', label: 'Zodiac Lines',   dots: 'few',     shooting: 'none',    extra: 'zodiac' },
  { icon: '⛈️', label: 'Distant Storm',  dots: 'sparse',  shooting: 'none',    extra: 'lightning' },
  { icon: '🌈', label: 'Rainbow Aurora', dots: 'few',     shooting: 'none',    extra: 'rainbow' },
  { icon: '💥', label: 'Starburst',      dots: 'normal',  shooting: 'none',    extra: 'starburst' },
  { icon: '🎇', label: 'Twin Shooters',  dots: 'few',     shooting: 'paired',  extra: null },
  { icon: '🌁', label: 'Foggy Sky',      dots: 'sparse',  shooting: 'none',    extra: 'fog' },
  { icon: '🪐', label: "Saturn's Rings", dots: 'normal',  shooting: 'none',    extra: 'rings' },
  { icon: '☄️', label: 'Perseids',       dots: 'few',     shooting: 'radiant', extra: null },
  { icon: '🌙', label: 'Calm Night',     dots: 'quiet',   shooting: 'none',    extra: null },
  { icon: '🌟', label: 'Full Sparkle',   dots: 'many',    shooting: 'none',    extra: null },
];

const SKY_COLORS = [
  { label: 'Midnight',       css: 'linear-gradient(180deg,#000005 0%,#000814 45%,#000d20 100%)' },
  { label: 'Deep Space',     css: 'linear-gradient(180deg,#00030a 0%,#000c1c 45%,#001028 100%)' },
  { label: 'Twilight Violet',css: 'linear-gradient(180deg,#02020a 0%,#0a0a1e 45%,#12102c 100%)' },
  { label: 'Void Black',     css: 'linear-gradient(180deg,#000000 0%,#020208 50%,#04040c 100%)' },
  { label: 'Dusk Indigo',    css: 'linear-gradient(180deg,#01040c 0%,#080c1e 45%,#151022 100%)' },
  { label: 'Teal Night',     css: 'linear-gradient(180deg,#000509 0%,#001620 45%,#00232c 100%)' },
  { label: 'Aurora Green',   css: 'linear-gradient(180deg,#000905 0%,#001d14 45%,#003322 100%)' },
  { label: 'Ember Dusk',     css: 'linear-gradient(180deg,#050208 0%,#0e0a18 50%,#1c0f14 100%)' },
  { label: 'Nebula Purple',  css: 'linear-gradient(180deg,#050212 0%,#140a2e 45%,#231246 100%)' },
  { label: 'Cosmic Indigo',  css: 'linear-gradient(180deg,#020210 0%,#0a0a2e 45%,#141048 100%)' },
  { label: 'Overcast Grey',  css: 'linear-gradient(180deg,#0a0e14 0%,#1a222e 50%,#2a3442 100%)' },
  { label: 'Icy Blue',       css: 'linear-gradient(180deg,#00040c 0%,#001426 45%,#002038 100%)' },
  { label: 'Amethyst',       css: 'linear-gradient(180deg,#03020c 0%,#0e0a24 45%,#1a1238 100%)' },
  { label: 'Rosewood Dusk',  css: 'linear-gradient(180deg,#0a0002 0%,#220408 45%,#380810 100%)' },
  { label: 'Silver Sky',     css: 'linear-gradient(180deg,#020614 0%,#0d1c34 45%,#1c3252 100%)' },
  { label: 'Cyan Frost',     css: 'linear-gradient(180deg,#00060c 0%,#00202c 45%,#00323e 100%)' },
  { label: 'Magenta Haze',   css: 'linear-gradient(180deg,#04020e 0%,#160a30 45%,#280f4a 100%)' },
  { label: 'Amber Glow',     css: 'linear-gradient(180deg,#050400 0%,#161006 50%,#241a0a 100%)' },
  { label: 'Glacier',        css: 'linear-gradient(180deg,#02060c 0%,#0c1c2c 45%,#182e42 100%)' },
  { label: 'Deep Violet',    css: 'linear-gradient(180deg,#03010a 0%,#0f0824 45%,#1c1040 100%)' },
  { label: 'Star Blue',      css: 'linear-gradient(180deg,#02020c 0%,#0a0a22 45%,#141238 100%)' },
  { label: 'Storm Grey',     css: 'linear-gradient(180deg,#04060a 0%,#0e141c 50%,#1a222c 100%)' },
  { label: 'Prism Navy',     css: 'linear-gradient(180deg,#020208 0%,#0a0a18 45%,#12142a 100%)' },
  { label: 'Plum Flash',     css: 'linear-gradient(180deg,#040204 0%,#100810 45%,#1c0e1c 100%)' },
  { label: 'Teal Streak',    css: 'linear-gradient(180deg,#000509 0%,#001a24 45%,#00293a 100%)' },
  { label: 'Foggy Grey',     css: 'linear-gradient(180deg,#0a0a0c 0%,#181a1e 50%,#282c32 100%)' },
  { label: 'Golden Dusk',    css: 'linear-gradient(180deg,#04030a 0%,#140f1e 45%,#241c2e 100%)' },
  { label: 'Perseid Blue',   css: 'linear-gradient(180deg,#020208 0%,#0a0c1c 45%,#141830 100%)' },
  { label: 'Calm Navy',      css: 'linear-gradient(180deg,#000208 0%,#020816 45%,#041028 100%)' },
  { label: 'Classic Night',  css: 'linear-gradient(180deg,#000005 0%,#000814 45%,#000d20 100%)' },
];

// Stable random seeds for the sky primitives (generated once, reused across renders)
const FIREFLY_SEED = Array.from({ length: 14 }, () => ({ x: rnd() * 100, y: 20 + rnd() * 60, dur: 3 + rnd() * 3, delay: rnd() * 4 }));
const SNOW_SEED = Array.from({ length: 24 }, () => ({ x: rnd() * 100, dur: 6 + rnd() * 6, delay: rnd() * 8, size: 2 + rnd() * 2 }));
const STARBURST_SEED = { x: 20 + rnd() * 60, y: 15 + rnd() * 40 };

function skyShootingHTML(mode) {
  let subset;
  if (mode === 'few') subset = SHOOTING_STAR_DATA.slice(0, 8);
  else if (mode === 'normal') subset = SHOOTING_STAR_DATA.slice(0, 20);
  else if (mode === 'many') subset = SHOOTING_STAR_DATA;
  else if (mode === 'paired') subset = [...SHOOTING_STAR_DATA.slice(0, 2).map(s => [s[0], s[1], 4, 0]), ...SHOOTING_STAR_DATA.slice(2, 4).map(s => [s[0], s[1], 4, 0.15])];
  else if (mode === 'radiant') subset = SHOOTING_STAR_DATA.slice(0, 16).map(([tail, , dur], i) => [tail, 10 + (i % 8) * 8, dur * 0.5, i * 0.3]);
  else subset = [];
  const stars = subset.map(([tail, top, dur, delay]) =>
    `<div class="star" style="--star-tail-length:${tail}em;--top-offset:${top}vh;--fall-duration:${dur}s;--fall-delay:${delay}s;"><div class="star-head"></div></div>`
  ).join('');
  return `<div class="shooting-stars-bg">${stars}</div>`;
}
function satelliteHTML() {
  return `<div style="position:absolute;width:3px;height:3px;border-radius:50%;background:white;box-shadow:0 0 6px 2px white;animation:satelliteMove 14s linear infinite;"></div>`;
}
function auroraHTML(rainbow) {
  const colors = rainbow
    ? ['rgba(134,239,172,0.35)', 'rgba(125,211,252,0.3)', 'rgba(196,181,253,0.3)', 'rgba(253,164,175,0.28)']
    : ['rgba(74,222,128,0.35)', 'rgba(52,211,153,0.3)', 'rgba(110,231,183,0.28)'];
  return colors.map((c, i) => `<div style="position:absolute;left:${-10 + i * 8}%;top:0;width:60%;height:55%;background:linear-gradient(180deg,${c},transparent);filter:blur(6px);animation:auroraWave ${6 + i}s ease-in-out ${i * 0.6}s infinite;"></div>`).join('');
}
function nebulaHTML() {
  return `<div style="position:absolute;left:20%;top:15%;width:220px;height:160px;background:radial-gradient(ellipse,rgba(196,120,253,0.28),transparent 70%);filter:blur(10px);"></div>
    <div style="position:absolute;left:55%;top:30%;width:180px;height:140px;background:radial-gradient(ellipse,rgba(125,180,252,0.22),transparent 70%);filter:blur(10px);"></div>`;
}
function milkywayHTML() {
  return `<div style="position:absolute;left:-20%;top:10%;width:140%;height:120px;background:linear-gradient(100deg,transparent,rgba(200,200,255,0.12) 40%,rgba(220,210,255,0.18) 50%,rgba(200,200,255,0.12) 60%,transparent);filter:blur(4px);transform:rotate(-18deg);"></div>`;
}
function cloudsHTML() {
  return [0, 1, 2].map(i => `<div style="position:absolute;left:${-20 + i * 35}%;top:${15 + i * 18}%;width:260px;height:60px;background:rgba(200,210,225,0.15);border-radius:50%;filter:blur(14px);animation:fogDrift ${20 + i * 6}s ease-in-out ${i * 3}s infinite alternate;"></div>`).join('');
}
function cometHTML() {
  return `<div style="position:absolute;width:5px;height:5px;border-radius:50%;background:#eef4ff;box-shadow:0 0 8px 3px #eef4ff, -40px -20px 30px 4px rgba(238,244,255,0.4);animation:cometMove 10s linear infinite;"></div>`;
}
function galaxyHTML() {
  return `<div style="position:absolute;right:8%;top:12%;width:90px;height:90px;border-radius:50%;background:conic-gradient(from 0deg,rgba(160,120,255,0.3),rgba(255,200,220,0.15),transparent,rgba(160,120,255,0.3));filter:blur(3px);animation:galaxySpin 40s linear infinite;"></div>`;
}
function firefliesHTML() {
  return FIREFLY_SEED.map(f => `<div style="position:absolute;left:${f.x}%;top:${f.y}%;width:3px;height:3px;border-radius:50%;background:#fde68a;box-shadow:0 0 6px 2px rgba(253,230,138,0.8);animation:particleFloat ${f.dur}s ease-in-out ${f.delay}s infinite;"></div>`).join('');
}
function snowHTML() {
  return SNOW_SEED.map(s => `<span class="particle fall" style="left:${s.x}%;font-size:${s.size * 4}px;animation-duration:${s.dur}s;animation-delay:${s.delay}s;">❄️</span>`).join('');
}
function doublestarHTML() {
  return `<div style="position:absolute;left:44%;top:25%;width:8px;height:8px;border-radius:50%;background:#fef9c3;box-shadow:0 0 16px 4px rgba(254,249,195,0.8);animation:moonDotTwinkle 3s ease-in-out infinite;"></div>
    <div style="position:absolute;left:47%;top:27%;width:6px;height:6px;border-radius:50%;background:#bfdbfe;box-shadow:0 0 12px 3px rgba(191,219,254,0.7);animation:moonDotTwinkle 3.5s ease-in-out 0.5s infinite;"></div>`;
}
function zodiacHTML() {
  const pts = [[20, 20], [28, 15], [36, 22], [44, 18], [40, 30]];
  const lines = pts.slice(1).map((p, i) => `<line x1="${pts[i][0]}" y1="${pts[i][1]}" x2="${p[0]}" y2="${p[1]}" stroke="rgba(178,200,237,0.35)" stroke-width="0.3" />`).join('');
  const dots = pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="0.6" fill="#eef4ff" />`).join('');
  return `<svg viewBox="0 0 100 100" style="position:absolute;inset:0;width:100%;height:100%;">${lines}${dots}</svg>`;
}
function lightningHTML() {
  return `<div style="position:absolute;inset:0;background:rgba(200,210,255,0.5);animation:lightningFlash 7s ease-in-out infinite;"></div>`;
}
function starburstHTML() {
  return `<div style="position:absolute;left:${STARBURST_SEED.x}%;top:${STARBURST_SEED.y}%;width:40px;height:40px;border-radius:50%;background:radial-gradient(circle,white,transparent 70%);animation:starburstPop 6s ease-out infinite;"></div>`;
}
function fogHTML() {
  return `<div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent,rgba(150,160,180,0.18) 60%,rgba(150,160,180,0.3));animation:fogDrift 18s ease-in-out infinite alternate;"></div>`;
}
function moonExtraHTML(extra) {
  switch (extra) {
    case 'satellite': return satelliteHTML();
    case 'aurora': return auroraHTML(false);
    case 'rainbow': return auroraHTML(true);
    case 'nebula': return nebulaHTML();
    case 'milkyway': return milkywayHTML();
    case 'clouds': return cloudsHTML();
    case 'comet': return cometHTML();
    case 'galaxy': return galaxyHTML();
    case 'fireflies': return firefliesHTML();
    case 'snow': return snowHTML();
    case 'doublestar': return doublestarHTML();
    case 'zodiac': return zodiacHTML();
    case 'lightning': return lightningHTML();
    case 'starburst': return starburstHTML();
    case 'fog': return fogHTML();
    default: return '';
  }
}
function skyEffect(id) {
  return SKY_EFFECTS[id - 1] || SKY_EFFECTS[0];
}
function skyColor(id) {
  return SKY_COLORS[id - 1] || SKY_COLORS[0];
}
function moonSkyHTML(effectId) {
  const t = skyEffect(effectId);
  // Star dots + "planets"/"rings" are real 3D now (see moon3d.js) — the flat
  // dots/planets/rings 2D fallbacks are skipped; the other atmospheric extras
  // (aurora, nebula, comet, fog, etc.) stay CSS/SVG overlays on top.
  const is3dExtra = t.extra === 'planets' || t.extra === 'rings';
  return `<div style="position:absolute;inset:0;z-index:0;">${starsHTML(0.7)}</div>
    ${skyShootingHTML(t.shooting)}<canvas id="moon-3d-sky" style="position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;"></canvas>
    <div style="position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:1;">${is3dExtra ? '' : moonExtraHTML(t.extra)}</div>`;
}

// ── Moon chat (owner-scripted; Panther just reads it) ──────────────────────
function moonBubbleHTML(m, ownerControls) {
  if (ownerControls && state.moonEditor.editingId === m.id) {
    return `
    <div style="display:flex;justify-content:${m.from === 'dino' ? 'flex-end' : 'flex-start'};">
      <div style="max-width:320px;width:100%;">
        <textarea data-scope="moonEditor" data-field="editingText" rows="3" class="font-serif"
          style="${EDITOR_INPUT_STYLE}font-size:14px;">${esc(state.moonEditor.editingText)}</textarea>
        <div style="display:flex;gap:8px;margin-top:6px;justify-content:flex-end;">
          <button data-action="moon-edit-cancel" class="font-mono" style="padding:6px 12px;border-radius:10px;background:rgba(178,200,237,0.08);border:none;color:#b2c8ed;font-size:11px;cursor:pointer;">Cancel</button>
          <button data-action="moon-edit-save" data-id="${esc(m.id)}" class="font-mono" style="padding:6px 12px;border-radius:10px;background:#e9c349;border:none;color:#000d20;font-size:11px;font-weight:700;cursor:pointer;">Save</button>
        </div>
      </div>
    </div>`;
  }
  return `
  <div style="display:flex;justify-content:${m.from === 'dino' ? 'flex-end' : 'flex-start'};gap:6px;animation:fadeIn 0.3s ease-out;">
    ${m.from === 'moon' ? `<div style="width:34px;height:34px;border-radius:50%;background:rgba(251,191,36,0.15);border:1px solid rgba(251,191,36,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:4px;font-size:16px;">🌙</div>` : ''}
    <div style="max-width:280px;">
      <div class="${m.from === 'dino' ? '' : 'font-serif'}" style="padding:12px 18px;border-radius:22px;font-size:14px;line-height:1.6;
        background:${m.from === 'dino' ? '#e9c349' : 'rgba(3,28,57,0.8)'};color:${m.from === 'dino' ? '#000d20' : '#eef4ff'};font-weight:${m.from === 'dino' ? 500 : 400};
        border-bottom-right-radius:${m.from === 'dino' ? '6px' : '22px'};border-bottom-left-radius:${m.from === 'moon' ? '6px' : '22px'};
        border:${m.from === 'moon' ? '1px solid rgba(251,191,36,0.15)' : 'none'};">
        ${esc(m.text)}
      </div>
      <p class="font-mono" style="font-size:10px;color:rgba(178,200,237,0.3);margin-top:4px;text-align:${m.from === 'dino' ? 'right' : 'left'};">
        ${m.from === 'dino' ? 'Dino 🦖' : 'Moon 🌙'}
      </p>
    </div>
    ${m.from === 'dino' ? `<div style="width:34px;height:34px;border-radius:50%;background:rgba(74,222,128,0.12);border:1px solid rgba(74,222,128,0.25);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:4px;font-size:16px;">🦖</div>` : ''}
    ${ownerControls ? `
      <div style="display:flex;flex-direction:column;gap:4px;justify-content:center;">
        <button data-action="moon-edit-start" data-id="${esc(m.id)}" style="width:22px;height:22px;border-radius:50%;background:rgba(233,195,73,0.15);border:none;cursor:pointer;font-size:10px;color:#e9c349;">✎</button>
        <button data-action="moon-delete" data-id="${esc(m.id)}" style="width:22px;height:22px;border-radius:50%;background:rgba(239,68,68,0.15);border:none;cursor:pointer;font-size:10px;color:#f87171;">×</button>
      </div>` : ''}
  </div>`;
}

function moonHeaderHTML(title, subtitle, moonDay, effectId) {
  const { illum, label } = moonPhaseInfo(moonDay);
  const effect = skyEffect(effectId);
  const glowSize = 30 + illum * 30;
  return `
    ${moonSkyHTML(effectId)}
    <div class="glass" style="position:relative;z-index:10;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.08);">
      <div style="min-width:0;flex:1;">
        <h2 class="font-serif" style="font-size:22px;font-weight:700;color:#ffddb0;">${esc(title)}</h2>
        <p class="font-mono" style="font-size:10px;color:rgba(254,249,195,0.6);margin-top:1px;">${label} · ${esc(effect.label)}</p>
        <p class="font-mono" style="font-size:11px;color:rgba(178,200,237,0.45);margin-top:2px;">${esc(subtitle)}</p>
      </div>
      <!-- A normal flex item now, not absolutely positioned over the header —
           it used to sit *behind* this panel's opaque/blurred glass background
           (painted after it, at a higher z-index) which hid it completely.
           Living inside the row like the title and close button guarantees
           it's always visible and never overlaps them, at any screen width.
           The always-visible 2D SVG fallback sits underneath the 3D canvas —
           if Three.js fails to load or WebGL isn't available, the moon still
           shows instead of a blank spot. -->
      <div style="position:relative;width:56px;height:56px;flex-shrink:0;filter:drop-shadow(0 0 ${glowSize}px rgba(254,249,195,${0.3 + illum * 0.35}));">
        <div style="position:absolute;inset:0;">${moonPhaseSVG(moonDay, 56, 'headericon')}</div>
        <canvas id="moon-3d-icon" width="56" height="56" style="position:absolute;inset:0;width:56px;height:56px;display:block;"></canvas>
      </div>
      <button data-action="moon-close" style="width:36px;height:36px;border-radius:50%;background:rgba(178,200,237,0.08);border:1px solid rgba(178,200,237,0.12);cursor:pointer;display:flex;align-items:center;justify-content:center;color:#b2c8ed;flex-shrink:0;">✕</button>
    </div>`;
}

function pickerDropdownHTML(pickerKey, label, previewHTML, currentLabel, isOpen, optionsHTML) {
  return `
    <div>
      <button data-action="moon-toggle-picker" data-picker="${pickerKey}" class="font-mono"
        style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 10px;border-radius:10px;
        background:rgba(178,200,237,0.06);border:1px solid ${isOpen ? 'rgba(233,195,73,0.35)' : 'rgba(178,200,237,0.12)'};cursor:pointer;">
        <span style="display:flex;align-items:center;gap:8px;min-width:0;">
          <span style="font-size:9px;color:rgba(178,200,237,0.45);text-transform:uppercase;letter-spacing:0.08em;flex-shrink:0;">${esc(label)}</span>
          <span style="width:20px;height:20px;flex-shrink:0;display:flex;align-items:center;justify-content:center;">${previewHTML}</span>
          <span style="font-size:11px;color:#eef4ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(currentLabel)}</span>
        </span>
        <span style="font-size:9px;color:rgba(178,200,237,0.4);flex-shrink:0;transform:rotate(${isOpen ? '180deg' : '0deg'});transition:transform 0.15s;">▼</span>
      </button>
      ${isOpen ? `<div style="display:flex;gap:6px;overflow-x:auto;padding:8px 2px 4px;">${optionsHTML}</div>` : ''}
    </div>`;
}

function moonScriptEditorHTML() {
  const messages = state.owner.data.moonMessages;
  const moonDay = state.owner.data.moonPhaseDay;
  const effectId = state.owner.data.skyEffectId;
  const colorId = state.owner.data.skyColorId;
  const sky = skyColor(colorId).css;
  const openPicker = state.moonEditor.openPicker;
  const effect = skyEffect(effectId);
  const color = skyColor(colorId);
  return `
  <div style="min-height:100vh;display:flex;flex-direction:column;position:relative;overflow:hidden;background:${sky};">
    ${moonHeaderHTML('Talk to the Moon — Script Editor', 'Write both sides — Panther just reads it ✨', moonDay, effectId)}
    <div class="glass" style="position:relative;z-index:10;padding:10px 16px;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;flex-direction:column;gap:8px;">
      ${pickerDropdownHTML('phase', 'Moon phase', moonPhaseSVG(moonDay, 20, 'dd-phase'), moonPhaseInfo(moonDay).label, openPicker === 'phase',
        MOON_PHASE_DAYS.map(d => `
          <button data-action="pick-moon-day" data-day="${d}" title="Day ${d} — ${moonPhaseInfo(d).label}"
            style="flex-shrink:0;width:28px;height:28px;border-radius:50%;border:${d === moonDay ? '2px solid #e9c349' : '2px solid transparent'};cursor:pointer;background:#0a1220;padding:0;display:flex;align-items:center;justify-content:center;">
            ${moonPhaseSVG(d, 22, `pick-${d}`)}
          </button>`).join(''))}
      ${pickerDropdownHTML('effect', 'Star mood', `<span style="font-size:13px;">${effect.icon}</span>`, effect.label, openPicker === 'effect',
        SKY_EFFECTS.map((e, i) => `
          <button data-action="pick-sky-effect" data-effect="${i + 1}" title="${esc(e.label)}"
            style="flex-shrink:0;width:28px;height:28px;border-radius:50%;border:${i + 1 === effectId ? '2px solid #e9c349' : '2px solid transparent'};cursor:pointer;background:#0a1220;font-size:13px;display:flex;align-items:center;justify-content:center;">
            ${e.icon}
          </button>`).join(''))}
      ${pickerDropdownHTML('color', 'Sky color', `<span style="width:14px;height:14px;border-radius:50%;background:${color.css};display:block;"></span>`, color.label, openPicker === 'color',
        SKY_COLORS.map((c, i) => `
          <button data-action="pick-sky-color" data-color="${i + 1}" title="${esc(c.label)}"
            style="flex-shrink:0;width:28px;height:28px;border-radius:50%;border:${i + 1 === colorId ? '2px solid #e9c349' : '2px solid transparent'};cursor:pointer;background:${c.css};padding:0;"></button>`).join(''))}
    </div>
    <div id="moon-messages" style="flex:1;overflow-y:auto;padding:20px 16px;display:flex;flex-direction:column;gap:16px;position:relative;z-index:10;">
      ${messages.length === 0 ? `<p class="font-mono" style="text-align:center;color:rgba(178,200,237,0.3);font-size:13px;margin-top:40px;">No lines yet — add the first one below</p>` : ''}
      ${messages.map(m => moonBubbleHTML(m, true)).join('')}
    </div>
    <div class="glass" style="position:relative;z-index:10;padding:14px 16px 20px;border-top:1px solid rgba(255,255,255,0.07);display:flex;flex-direction:column;gap:10px;">
      <div style="display:flex;gap:8px;align-items:center;">
        <span style="font-size:16px;flex-shrink:0;">🦖</span>
        <input type="text" value="${esc(state.moonEditor.dinoDraft)}" data-scope="moonEditor" data-field="dinoDraft" data-role="moon-dino-input" placeholder="Add a line as Dino..." class="font-serif"
          style="flex:1;background:rgba(0,13,32,0.8);border:1px solid rgba(233,195,73,0.18);border-radius:20px;padding:11px 16px;color:#eef4ff;font-size:13px;outline:none;" />
        <button data-action="moon-add-dino" ${!state.moonEditor.dinoDraft.trim() ? 'disabled' : ''} class="font-mono" style="padding:10px 16px;border-radius:14px;border:none;cursor:pointer;font-size:12px;font-weight:700;flex-shrink:0;background:#e9c349;color:#000d20;">Add</button>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <span style="font-size:16px;flex-shrink:0;">🌙</span>
        <input type="text" value="${esc(state.moonEditor.moonDraft)}" data-scope="moonEditor" data-field="moonDraft" data-role="moon-moon-input" placeholder="Add a line as Moon..." class="font-serif"
          style="flex:1;background:rgba(0,13,32,0.8);border:1px solid rgba(251,191,36,0.18);border-radius:20px;padding:11px 16px;color:#eef4ff;font-size:13px;outline:none;" />
        <button data-action="moon-suggest" class="font-mono" title="Suggest a line" style="padding:10px 12px;border-radius:14px;border:1px solid rgba(251,191,36,0.25);background:rgba(251,191,36,0.08);color:#fbbf24;cursor:pointer;font-size:12px;flex-shrink:0;">✨</button>
        <button data-action="moon-add-moon" ${!state.moonEditor.moonDraft.trim() ? 'disabled' : ''} class="font-mono" style="padding:10px 16px;border-radius:14px;border:1px solid rgba(251,191,36,0.3);background:rgba(251,191,36,0.15);color:#fde68a;font-weight:700;cursor:pointer;font-size:12px;flex-shrink:0;">Add</button>
      </div>
    </div>
  </div>`;
}

function moonScriptViewHTML() {
  const messages = state.recipient.data.moonMessages;
  const moonDay = state.recipient.data.moonPhaseDay;
  const effectId = state.recipient.data.skyEffectId;
  const sky = skyColor(state.recipient.data.skyColorId).css;
  return `
  <div style="min-height:100vh;display:flex;flex-direction:column;position:relative;overflow:hidden;background:${sky};">
    ${moonHeaderHTML('Talk to the Moon', 'Whisper across the miles ✈️', moonDay, effectId)}
    <div id="moon-messages" style="flex:1;overflow-y:auto;padding:20px 16px 90px;display:flex;flex-direction:column;gap:16px;position:relative;z-index:10;">
      ${messages.length === 0 ? `<p class="font-mono" style="text-align:center;color:rgba(178,200,237,0.3);font-size:13px;margin-top:40px;">Nothing written yet...</p>` : ''}
      ${messages.map(m => moonBubbleHTML(m, false)).join('')}
    </div>
    ${recipientNavHTML(state.recipient.data, 'moon')}
  </div>`;
}

// ── Bouquet builder / view ──────────────────────────────────────────────────
function bouquetBackgroundStyle(bg) {
  if (bg && bg.type === 'custom' && bg.value) {
    return `background-image:url('${esc(bg.value)}');background-size:cover;background-position:center;`;
  }
  const preset = BACKGROUND_PRESETS.find(p => p.id === (bg && bg.value)) || BACKGROUND_PRESETS[0];
  return `background:${preset.css};`;
}

function shadeColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  let r = (num >> 16) + percent, g = ((num >> 8) & 0x00FF) + percent, b = (num & 0x0000FF) + percent;
  r = Math.max(Math.min(255, r), 0); g = Math.max(Math.min(255, g), 0); b = Math.max(Math.min(255, b), 0);
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
}

// ── Painterly flower illustrations ──────────────────────────────────────
// Each flower is built from teardrop petal paths (rounded or pointed)
// arranged in one or more rings around a center, radially shaded with a
// per-instance gradient, so every type gets a distinct, soft, layered
// silhouette instead of a flat ring of ellipses.
let svgUid = 0;

function roundPetalPath(cx, cy, len, width) {
  const tipY = (cy - len).toFixed(1);
  const ctrlY = (cy - len * 0.55).toFixed(1);
  const baseY = (cy - len * 0.15).toFixed(1);
  return `M ${cx} ${cy} C ${(cx - width).toFixed(1)} ${baseY}, ${(cx - width * 0.9).toFixed(1)} ${ctrlY}, ${cx} ${tipY} C ${(cx + width * 0.9).toFixed(1)} ${ctrlY}, ${(cx + width).toFixed(1)} ${baseY}, ${cx} ${cy} Z`;
}
function pointedPetalPath(cx, cy, len, width) {
  const tipY = (cy - len).toFixed(1);
  const ctrlY = (cy - len * 0.6).toFixed(1);
  const baseY = (cy - len * 0.1).toFixed(1);
  return `M ${cx} ${cy} C ${(cx - width).toFixed(1)} ${baseY}, ${(cx - width * 0.5).toFixed(1)} ${ctrlY}, ${cx} ${tipY} C ${(cx + width * 0.5).toFixed(1)} ${ctrlY}, ${(cx + width).toFixed(1)} ${baseY}, ${cx} ${cy} Z`;
}
function petalRing(cx, cy, count, len, width, startAngle, fill, opacity, pointed) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const angle = startAngle + (360 / count) * i;
    const d = pointed ? pointedPetalPath(cx, cy, len, width) : roundPetalPath(cx, cy, len, width);
    out += `<path d="${d}" fill="${fill}" opacity="${opacity}" transform="rotate(${angle} ${cx} ${cy})" />`;
  }
  return out;
}

function flowerSVG(f, size) {
  svgUid += 1;
  const cx = size / 2, cy = size / 2;
  const gradId = `petGrad${svgUid}`;
  const light = shadeColor(f.petalColor, 35);
  const dark = shadeColor(f.petalColor, -35);
  const grad = `url(#${gradId})`;
  let body = '';
  switch (f.id) {
    case 'rose':
      body += petalRing(cx, cy, 6, size * 0.4, size * 0.19, 8, grad, 0.95, false);
      body += petalRing(cx, cy, 5, size * 0.28, size * 0.15, 30, shadeColor(f.petalColor, 15), 0.97, false);
      body += petalRing(cx, cy, 4, size * 0.16, size * 0.1, 10, shadeColor(f.petalColor, 30), 1, false);
      body += `<circle cx="${cx}" cy="${cy}" r="${size * 0.06}" fill="${shadeColor(f.centerColor, 20)}" />`;
      break;
    case 'tulip':
      [-55, -25, 0, 25, 55].forEach((a, i) => {
        const fill = i === 2 ? grad : shadeColor(f.petalColor, i % 2 ? 10 : -10);
        body += `<path d="${roundPetalPath(cx, cy, size * 0.4, size * 0.16)}" fill="${fill}" opacity="0.95" transform="rotate(${a} ${cx} ${cy})" />`;
      });
      break;
    case 'lily':
    case 'amaryllis':
      body += petalRing(cx, cy, f.petals, size * 0.38, size * 0.17, 0, grad, 0.96, true);
      for (let i = 0; i < 5; i++) {
        const a = Math.random() * 360, r = size * 0.08 + Math.random() * size * 0.12;
        const sx = (cx + Math.cos(a * Math.PI / 180) * r).toFixed(1);
        const sy = (cy + Math.sin(a * Math.PI / 180) * r).toFixed(1);
        body += `<circle cx="${sx}" cy="${sy}" r="${(size * 0.012).toFixed(1)}" fill="${shadeColor(f.centerColor, -40)}" opacity="0.8" />`;
      }
      for (let i = 0; i < 6; i++) {
        const rad = (60 * i) * Math.PI / 180;
        const ex = (cx + Math.cos(rad) * size * 0.16).toFixed(1);
        const ey = (cy + Math.sin(rad) * size * 0.16).toFixed(1);
        body += `<line x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" stroke="${f.centerColor}" stroke-width="1" opacity="0.7" /><circle cx="${ex}" cy="${ey}" r="${(size * 0.02).toFixed(1)}" fill="${f.centerColor}" />`;
      }
      break;
    case 'sunflower':
      body += petalRing(cx, cy, f.petals, size * 0.42, size * 0.11, 0, grad, 0.96, true);
      body += `<circle cx="${cx}" cy="${cy}" r="${size * 0.22}" fill="${f.centerColor}" />`;
      for (let ring = 1; ring <= 3; ring++) {
        const rr = size * 0.22 * (ring / 3.4);
        const cnt = ring * 5;
        for (let i = 0; i < cnt; i++) {
          const rad = ((360 / cnt) * i + ring * 12) * Math.PI / 180;
          const dx = (cx + Math.cos(rad) * rr).toFixed(1);
          const dy = (cy + Math.sin(rad) * rr).toFixed(1);
          body += `<circle cx="${dx}" cy="${dy}" r="${(size * 0.012).toFixed(1)}" fill="${shadeColor(f.centerColor, -15)}" opacity="0.7" />`;
        }
      }
      break;
    case 'daisy':
      body += petalRing(cx, cy, f.petals, size * 0.38, size * 0.08, 0, grad, 0.95, true);
      body += `<circle cx="${cx}" cy="${cy}" r="${size * 0.15}" fill="${f.centerColor}" />`;
      break;
    case 'hibiscus':
      body += petalRing(cx, cy, f.petals, size * 0.42, size * 0.17, 10, grad, 0.95, false);
      for (let i = 0; i < 3; i++) {
        const a = -22 + i * 22;
        const rad = a * Math.PI / 180;
        const ex = (cx + Math.sin(rad) * size * 0.05).toFixed(1);
        const ey = (cy - size * 0.32).toFixed(1);
        const c1x = (cx + Math.sin(rad) * size * 0.1).toFixed(1);
        const c1y = (cy - size * 0.18).toFixed(1);
        body += `<path d="M ${cx} ${cy} Q ${c1x} ${c1y} ${ex} ${ey}" stroke="${f.centerColor}" stroke-width="1.4" fill="none" opacity="0.85" /><circle cx="${ex}" cy="${ey}" r="${(size * 0.025).toFixed(1)}" fill="${shadeColor(f.centerColor, -20)}" />`;
      }
      body += `<circle cx="${cx}" cy="${cy}" r="${size * 0.08}" fill="${f.centerColor}" />`;
      break;
    case 'blossom':
      body += petalRing(cx, cy, f.petals, size * 0.3, size * 0.14, 0, grad, 0.96, false);
      body += `<circle cx="${cx}" cy="${cy}" r="${size * 0.07}" fill="${f.centerColor}" />`;
      break;
    case 'hyacinth':
      for (let i = 0; i < 6; i++) {
        const t = i / 5;
        const fy = cy - size * 0.36 + t * size * 0.62;
        const fx = cx + Math.sin(t * 8) * size * 0.08;
        const fsize = size * (0.34 - t * 0.08);
        body += petalRing(fx, fy, 5, fsize * 0.22, fsize * 0.09, i * 30, grad, 0.9, false);
        body += `<circle cx="${fx.toFixed(1)}" cy="${fy.toFixed(1)}" r="${(fsize * 0.05).toFixed(1)}" fill="${f.centerColor}" />`;
      }
      break;
    case 'lotus':
      body += petalRing(cx, cy, f.petals, size * 0.4, size * 0.2, 0, grad, 0.92, false);
      body += petalRing(cx, cy, f.petals - 2, size * 0.24, size * 0.15, 22, shadeColor(f.petalColor, 18), 0.97, false);
      body += `<circle cx="${cx}" cy="${cy}" r="${size * 0.08}" fill="${f.centerColor}" />`;
      break;
    case 'rosette':
      body += petalRing(cx, cy, f.petals, size * 0.4, size * 0.09, 0, grad, 0.9, false);
      body += petalRing(cx, cy, f.petals - 3, size * 0.28, size * 0.08, 12, shadeColor(f.petalColor, 12), 0.94, false);
      body += petalRing(cx, cy, Math.max(4, f.petals - 7), size * 0.16, size * 0.07, 6, shadeColor(f.petalColor, 25), 1, false);
      break;
    default:
      for (let i = 0; i < f.petals; i++) {
        const angle = (360 / f.petals) * i;
        const fill = i % 2 === 0 ? grad : f.centerColor;
        body += `<path d="${roundPetalPath(cx, cy, size * 0.34, size * 0.15)}" fill="${fill}" opacity="0.94" transform="rotate(${angle} ${cx} ${cy})" />`;
      }
      body += `<circle cx="${cx}" cy="${cy}" r="${size * 0.1}" fill="${f.centerColor}" />`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="overflow:visible;display:block;">
    <defs><radialGradient id="${gradId}" cx="50%" cy="72%" r="75%">
      <stop offset="0%" stop-color="${light}" /><stop offset="60%" stop-color="${f.petalColor}" /><stop offset="100%" stop-color="${dark}" />
    </radialGradient></defs>
    ${body}
  </svg>`;
}

// Small green leaf, used behind the flower cluster for filler.
function leafSVG(size, color) {
  const w = size, h = size * 1.8;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="overflow:visible;display:block;">
    <path d="M ${w / 2} ${h} C ${w * 0.1} ${h * 0.7} ${w * 0.15} ${h * 0.15} ${w / 2} 0 C ${w * 0.85} ${h * 0.15} ${w * 0.9} ${h * 0.7} ${w / 2} ${h} Z" fill="${color}" opacity="0.92" />
    <path d="M ${w / 2} ${h} L ${w / 2} 6" stroke="${shadeColor(color, -20)}" stroke-width="1" opacity="0.4" />
  </svg>`;
}
// A tiny sprig of dot-flowers (baby's-breath style filler).
function fillerSprigSVG(size, color) {
  let dots = '';
  const n = 5;
  for (let i = 0; i < n; i++) {
    const a = (360 / n) * i + 18;
    const x = (size / 2 + Math.cos(a * Math.PI / 180) * size * 0.32).toFixed(1);
    const y = (size / 2 + Math.sin(a * Math.PI / 180) * size * 0.32).toFixed(1);
    dots += `<circle cx="${x}" cy="${y}" r="${(size * 0.09).toFixed(1)}" fill="${color}" opacity="0.9" />`;
  }
  dots += `<circle cx="${size / 2}" cy="${size / 2}" r="${(size * 0.09).toFixed(1)}" fill="${color}" opacity="0.9" />`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="overflow:visible;display:block;">${dots}</svg>`;
}
const GREENERY_POSITIONS = [
  { x: -70, y: 30, r: -25, size: 30 }, { x: 70, y: 30, r: 25, size: 30 },
  { x: -50, y: -10, r: -15, size: 26 }, { x: 50, y: -10, r: 15, size: 26 },
  { x: 0, y: -40, r: 0, size: 24 },
];
const FILLER_POSITIONS = [
  { x: -30, y: 20, size: 22 }, { x: 30, y: 20, size: 22 },
  { x: -55, y: -20, size: 18 }, { x: 55, y: -20, size: 18 },
  { x: 0, y: 40, size: 20 },
];

// No paper wrap at all — real visible stems gathered into a bundle with a
// sheer ribbon tied around them in a bow, the way editorial bouquet
// photography actually looks (the previous kraft-paper cone read as a
// cheap triangle, not a bouquet).
function leafShape(x, y, rot) {
  return `<path d="M0 0 C-14 -4 -18 -16 -8 -24 C2 -14 2 -4 0 0 Z" fill="#5a7a4a" opacity="0.88" transform="translate(${x} ${y}) rotate(${rot})" />`;
}
function wrappingSVG(wrapC) {
  const stemColor = '#5a7a4a';
  const stemDark = '#3f5a35';
  const ribbon = wrapC.color;
  const ribbonLight = shadeColor(ribbon, 45);
  const ribbonDark = shadeColor(ribbon, -25);
  const uid = wrapC.id;
  const topXs = [55, 72, 89, 106, 123, 140, 157, 174];
  const gatherX = 110, gatherY = 92;
  const stems = topXs.map(x => {
    const midX = (x + gatherX * 3) / 4;
    return `<path d="M${x} 0 Q${midX} 20 ${gatherX} ${gatherY}" stroke="${stemColor}" stroke-width="2" fill="none" opacity="0.85" />`;
  }).join('');
  const leaves = leafShape(70, 55, -30) + leafShape(150, 60, 40) + leafShape(90, 40, -8);
  const bundle = `<path d="M110 ${gatherY} C104 130 116 160 108 190" stroke="${stemDark}" stroke-width="7" fill="none" stroke-linecap="round" />
    <path d="M110 ${gatherY} C104 130 116 160 108 190" stroke="${stemColor}" stroke-width="4" fill="none" stroke-linecap="round" />`;
  const strayStems = `<path d="M96 ${gatherY} C90 135 82 165 76 188" stroke="${stemColor}" stroke-width="2" fill="none" opacity="0.8" />
    <path d="M124 ${gatherY} C130 135 138 165 144 188" stroke="${stemColor}" stroke-width="2" fill="none" opacity="0.8" />`;
  return `<svg width="100%" height="100%" viewBox="0 0 220 196" style="overflow:visible;display:block;">
    <defs>
      <linearGradient id="ribbonSheen-${uid}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${ribbonLight}" stop-opacity="0.9" />
        <stop offset="50%" stop-color="${ribbon}" stop-opacity="0.55" />
        <stop offset="100%" stop-color="${ribbonDark}" stop-opacity="0.75" />
      </linearGradient>
    </defs>

    ${stems}
    ${leaves}
    ${bundle}
    ${strayStems}

    <path d="M74 ${gatherY - 14} Q110 ${gatherY - 24} 146 ${gatherY - 14} L146 ${gatherY + 16} Q110 ${gatherY + 26} 74 ${gatherY + 16} Z"
      fill="url(#ribbonSheen-${uid})" stroke="${ribbonDark}" stroke-width="1" opacity="0.95" />

    <path d="M96 ${gatherY + 10} C88 ${gatherY + 50} 78 ${gatherY + 70} 84 ${gatherY + 100}" stroke="${ribbon}" stroke-width="9" fill="none" opacity="0.55" stroke-linecap="round" />
    <path d="M124 ${gatherY + 10} C132 ${gatherY + 50} 142 ${gatherY + 70} 136 ${gatherY + 100}" stroke="${ribbon}" stroke-width="9" fill="none" opacity="0.55" stroke-linecap="round" />

    <path d="M110 ${gatherY - 6} C92 ${gatherY - 26} 66 ${gatherY - 24} 60 ${gatherY - 4} C64 ${gatherY + 14} 92 ${gatherY + 10} 110 ${gatherY - 2} Z"
      fill="${ribbon}" opacity="0.7" stroke="${ribbonDark}" stroke-width="1" />
    <path d="M110 ${gatherY - 6} C128 ${gatherY - 26} 154 ${gatherY - 24} 160 ${gatherY - 4} C156 ${gatherY + 14} 128 ${gatherY + 10} 110 ${gatherY - 2} Z"
      fill="${ribbon}" opacity="0.7" stroke="${ribbonDark}" stroke-width="1" />
    <ellipse cx="110" cy="${gatherY - 3}" rx="8" ry="10" fill="${ribbonDark}" opacity="0.85" />
    <ellipse cx="110" cy="${gatherY - 3}" rx="5" ry="7" fill="${ribbon}" opacity="0.85" />
  </svg>`;
}

function flowerClusterHTML(bouquet, editable) {
  const wrapC = WRAPPING_OPTIONS.find(w => w.id === bouquet.wrapping) || WRAPPING_OPTIONS[0];
  const greeneryHTML = bouquet.flowers.length ? GREENERY_POSITIONS.map(g => `
    <div style="position:absolute;left:calc(50% + ${g.x}px);bottom:${145 + g.y}px;transform:translateX(-50%) rotate(${g.r}deg);z-index:1;">${leafSVG(g.size, '#6a8f5a')}</div>`).join('')
    + FILLER_POSITIONS.map(fp => `
    <div style="position:absolute;left:calc(50% + ${fp.x}px);bottom:${145 + fp.y}px;transform:translateX(-50%);z-index:1;">${fillerSprigSVG(fp.size, '#fbfaf5')}</div>`).join('') : '';
  const flowerHTML = bouquet.flowers.map((fid, i) => {
    const f = FLOWER_OPTIONS.find(x => x.id === fid) || FLOWER_OPTIONS[0];
    const pos = BOUQUET_POSITIONS[i] || { x: 0, y: 0, r: 0 };
    const delay = (i % 6) * 0.35;
    return `<div ${editable ? `data-action="bouquet-remove-flower" data-index="${i}" title="Tap to remove"` : ''}
      style="position:absolute;left:calc(50% + ${pos.x}px);bottom:${160 - pos.y}px;transform:translateX(-50%) rotate(${pos.r}deg);z-index:2;${editable ? 'cursor:pointer;' : ''}">
      <div style="animation:bloomIn 0.45s ease-out, flowerSway ${3.5 + (i % 3) * 0.4}s ease-in-out ${delay}s infinite;">
        ${flowerSVG(f, 52)}
      </div>
    </div>`;
  }).join('');
  return `
  <div style="position:relative;width:280px;height:320px;margin:0 auto;">
    ${greeneryHTML}
    ${flowerHTML}
    <div style="position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:190px;height:170px;z-index:3;filter:drop-shadow(0 14px 24px rgba(0,0,0,0.4));">${wrappingSVG(wrapC)}</div>
    ${bouquet.note ? `
      <div style="position:absolute;right:2px;bottom:78px;z-index:4;background:white;padding:8px 12px;border-radius:4px;transform:rotate(6deg);box-shadow:0 6px 16px rgba(0,0,0,0.3);max-width:130px;">
        <p class="font-serif" style="font-size:11px;color:#2c1d11;font-style:italic;">"${esc(bouquet.note)}"</p>
      </div>` : ''}
  </div>`;
}

// Small non-interactive preview used by the quick-start template gallery.
function templatePreviewHTML(t) {
  const wrapC = WRAPPING_OPTIONS.find(w => w.id === t.wrapping) || WRAPPING_OPTIONS[0];
  const flowerHTML = t.flowers.map((fid, i) => {
    const f = FLOWER_OPTIONS.find(x => x.id === fid) || FLOWER_OPTIONS[0];
    const pos = BOUQUET_POSITIONS[i] || { x: 0, y: 0, r: 0 };
    return `<div style="position:absolute;left:calc(50% + ${(pos.x * 0.4).toFixed(1)}px);bottom:${(65 - pos.y * 0.4).toFixed(1)}px;transform:translateX(-50%) rotate(${pos.r}deg);z-index:2;">${flowerSVG(f, 22)}</div>`;
  }).join('');
  return `<div style="position:relative;width:110px;height:130px;margin:0 auto;">
    ${flowerHTML}
    <div style="position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:78px;height:70px;z-index:1;filter:drop-shadow(0 6px 10px rgba(0,0,0,0.35));">${wrappingSVG(wrapC)}</div>
  </div>`;
}

function bouquetBuilderHTML() {
  const bq = state.owner.data.bouquet;
  const full = bq.flowers.length >= MAX_FLOWERS;
  return `
  <div style="min-height:100vh;position:relative;overflow:hidden;${bouquetBackgroundStyle(bq.background)}">
    <div style="position:relative;z-index:10;display:flex;align-items:center;justify-content:space-between;padding:16px 20px;">
      <div>
        <h2 class="font-serif" style="font-size:22px;font-weight:700;color:#ffddb0;text-shadow:0 2px 8px rgba(0,0,0,0.6);">Build a Bouquet 💐</h2>
        <p class="font-mono" style="font-size:11px;color:rgba(255,255,255,0.65);margin-top:2px;">${bq.flowers.length}/${MAX_FLOWERS} flowers</p>
      </div>
      <button data-action="bouquet-close" style="width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.2);cursor:pointer;display:flex;align-items:center;justify-content:center;color:white;">✕</button>
    </div>

    <div style="position:relative;z-index:10;padding:20px 0 30px;">
      ${flowerClusterHTML(bq, true)}
      <p class="font-mono" style="text-align:center;color:rgba(255,255,255,0.55);font-size:11px;margin-top:8px;">${bq.flowers.length ? 'Tap a flower to remove it' : 'Add flowers below'}</p>
    </div>

    <div style="position:relative;z-index:10;max-width:600px;margin:0 auto;padding:0 16px 110px;display:flex;flex-direction:column;gap:16px;">
      <div class="glass-gold" style="border-radius:24px;padding:20px;">
        <p class="font-mono" style="font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:0.15em;margin-bottom:2px;">Choose bouquet</p>
        <p class="font-mono" style="font-size:10px;color:rgba(178,200,237,0.4);margin-bottom:12px;">Saved bouquets</p>
        <div style="display:flex;gap:12px;overflow-x:auto;padding-bottom:6px;">
          ${BOUQUET_TEMPLATES.map(t => {
            const active = bq.wrapping === t.wrapping && bq.flowers.length === t.flowers.length && bq.flowers.every((fid, i) => fid === t.flowers[i]);
            return `<button data-action="bouquet-apply-template" data-template="${t.id}" class="font-mono"
              style="flex:0 0 auto;width:130px;padding:14px 10px 12px;border-radius:20px;cursor:pointer;
              background:linear-gradient(180deg,#1c3a28,#122619);border:1.5px solid ${active ? 'var(--accent)' : 'rgba(255,255,255,0.08)'};
              display:flex;flex-direction:column;align-items:center;gap:8px;">
              ${templatePreviewHTML(t)}
              <span style="font-size:11px;color:#e8f0e6;text-align:center;line-height:1.3;">${esc(t.label)}</span>
              <span style="font-size:10px;color:rgba(232,240,230,0.5);">${t.flowers.length} blooms</span>
            </button>`;
          }).join('')}
        </div>
        <p class="font-mono" style="font-size:10px;color:rgba(178,200,237,0.4);margin-top:12px;">
          ${(() => {
            const picked = BOUQUET_TEMPLATES.find(t => bq.wrapping === t.wrapping && bq.flowers.length === t.flowers.length && bq.flowers.every((fid, i) => fid === t.flowers[i]));
            return picked ? `Picked: ${esc(picked.label)} · ${picked.flowers.length} blooms` : 'Pick a bouquet above, or build your own below';
          })()}
        </p>
      </div>

      <div class="glass-gold" style="border-radius:24px;padding:20px;">
        <p class="font-mono" style="font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:0.15em;margin-bottom:12px;">Flowers</p>
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;">
          ${FLOWER_OPTIONS.map(f => `
            <button data-action="bouquet-add-flower" data-flower="${f.id}" ${full ? 'disabled' : ''} title="${f.label}"
              style="display:flex;align-items:center;justify-content:center;padding:8px 0;border-radius:14px;border:none;cursor:${full ? 'not-allowed' : 'pointer'};background:rgba(178,200,237,0.08);opacity:${full ? 0.4 : 1};">${flowerSVG(f, 30)}</button>`).join('')}
        </div>
      </div>

      <div class="glass-gold" style="border-radius:24px;padding:20px;">
        <p class="font-mono" style="font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:0.15em;margin-bottom:12px;">Ribbon Color</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          ${WRAPPING_OPTIONS.map(w => `
            <button data-action="bouquet-pick-wrapping" data-wrap="${w.id}" title="${w.label}"
              style="width:40px;height:40px;border-radius:50%;background:${w.color};border:none;cursor:pointer;
              outline:${bq.wrapping === w.id ? '3px solid white' : '3px solid transparent'};outline-offset:3px;
              transform:${bq.wrapping === w.id ? 'scale(1.2)' : 'scale(1)'};transition:all 0.2s;"></button>`).join('')}
        </div>
      </div>

      <div class="glass-gold" style="border-radius:24px;padding:20px;">
        <p class="font-mono" style="font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:0.15em;margin-bottom:12px;">Mini Note</p>
        <input type="text" value="${esc(state.bouquetForm.note)}" data-scope="bouquetForm" data-field="note" placeholder="A little note to tuck in..." class="font-serif" style="${OWNER_INPUT_STYLE}margin-bottom:10px;" />
        <button data-action="bouquet-save-note" class="btn-gold font-mono" style="width:100%;padding:10px 0;border-radius:14px;border:none;cursor:pointer;font-size:12px;">Save Note</button>
      </div>

      <div class="glass-gold" style="border-radius:24px;padding:20px;">
        <p class="font-mono" style="font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:0.15em;margin-bottom:12px;">Background</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
          ${BACKGROUND_PRESETS.map(p => `
            <button data-action="bouquet-pick-bg-preset" data-bg="${p.id}" title="${p.label}"
              style="width:52px;height:36px;border-radius:10px;background:${p.css};border:none;cursor:pointer;
              outline:${bq.background.type === 'preset' && bq.background.value === p.id ? '3px solid white' : '3px solid transparent'};outline-offset:2px;"></button>`).join('')}
        </div>
        <p class="font-mono" style="font-size:11px;color:rgba(178,200,237,0.45);margin-bottom:8px;">Or paste your own background image URL:</p>
        <div style="display:flex;gap:10px;">
          <input type="text" value="${esc(state.bouquetForm.bgUrl)}" data-scope="bouquetForm" data-field="bgUrl" placeholder="https://..." class="font-mono" style="${OWNER_INPUT_STYLE}flex:1;font-size:12px;" />
          <button data-action="bouquet-set-bg-custom" class="font-mono" style="padding:10px 16px;border-radius:14px;border:1px solid rgba(var(--accent-rgb),0.25);background:rgba(var(--accent-rgb),0.1);color:var(--accent);cursor:pointer;font-size:12px;white-space:nowrap;">Use this</button>
        </div>
      </div>
    </div>
  </div>`;
}

function bouquetViewHTML() {
  const bq = state.recipient.data.bouquet;
  return `
  <div style="min-height:100vh;position:relative;overflow:hidden;display:flex;flex-direction:column;${bouquetBackgroundStyle(bq.background)}">
    <div style="position:relative;z-index:10;display:flex;align-items:center;justify-content:space-between;padding:16px 20px;">
      <div>
        <h2 class="font-serif" style="font-size:22px;font-weight:700;color:#ffddb0;text-shadow:0 2px 8px rgba(0,0,0,0.6);">A Bouquet For You 💐</h2>
        <p class="font-mono" style="font-size:11px;color:rgba(255,255,255,0.65);margin-top:2px;">From your Dino 🦖</p>
      </div>
      <button data-action="bouquet-close" style="width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.2);cursor:pointer;display:flex;align-items:center;justify-content:center;color:white;">✕</button>
    </div>
    <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:20px 0 90px;position:relative;z-index:10;">
      ${bq.flowers.length ? flowerClusterHTML(bq, false) : `<p class="font-mono" style="color:rgba(255,255,255,0.55);font-size:13px;">No bouquet yet...</p>`}
    </div>
    ${recipientNavHTML(state.recipient.data, 'bouquet')}
  </div>`;
}

// ── Mixtape builder / view ────────────────────────────────────────────────
// A deliberately light, warm, cream-and-pastel surface — isolated from the
// app-wide dark theme the same way Moon Chat is, since it's meant to feel
// like a little handmade cassette rather than the rest of the gift.
const MIXTAPE_STEPS = ['Color', 'Decorate', 'Songs', 'Note'];
const MIXTAPE_COLORS = [
  { id: 'sage', label: 'Sage garden', shell: '#9caf88', shellDark: '#7d9169', labelBg: '#dce8d5', accent: '#4a6339' },
  { id: 'golden', label: 'Golden hour', shell: '#d9a441', shellDark: '#b3822c', labelBg: '#f5e2b8', accent: '#7a4f1a' },
  { id: 'berry', label: 'Berry blush', shell: '#c97b83', shellDark: '#a85961', labelBg: '#f3d3d6', accent: '#7a2e38' },
  { id: 'powder', label: 'Powder blue', shell: '#a9b7d1', shellDark: '#8493b3', labelBg: '#e4e9f5', accent: '#3d4d73' },
];

function reelSVG(cx, cy, color) {
  let teeth = '';
  for (let i = 0; i < 8; i++) {
    const a = (360 / 8) * i;
    teeth += `<rect x="${cx - 2}" y="${cy - 24}" width="4" height="7" rx="1" fill="#f2ead8" transform="rotate(${a} ${cx} ${cy})" />`;
  }
  return `<circle cx="${cx}" cy="${cy}" r="20" fill="#f2ead8" stroke="#c9bfa0" stroke-width="1" />
    ${teeth}
    <circle cx="${cx}" cy="${cy}" r="7" fill="${color}" opacity="0.7" />
    <circle cx="${cx}" cy="${cy}" r="2.5" fill="#f2ead8" />`;
}

// An illustrated cassette tape — floral label window, two spoked reels with
// a tape strip between them, corner screws, and a lower deck with a couple
// of accent buttons. Recolored per MIXTAPE_COLORS entry.
function cassetteSVG(colorDef, labelText) {
  const { shell, shellDark, labelBg, accent } = colorDef;
  const leafId = `cassetteLeaf-${colorDef.id}`;
  return `<svg width="100%" height="100%" viewBox="0 0 380 260" style="overflow:visible;display:block;">
    <defs>
      <pattern id="${leafId}" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(10)">
        <path d="M20 2 C27 12 27 24 20 34 C13 24 13 12 20 2 Z" fill="${accent}" opacity="0.3" />
        <line x1="20" y1="16" x2="20" y2="34" stroke="${accent}" stroke-width="1" opacity="0.3" />
        <circle cx="4" cy="20" r="2.4" fill="${accent}" opacity="0.22" />
      </pattern>
    </defs>

    <rect x="4" y="8" width="372" height="246" rx="22" fill="${shellDark}" opacity="0.4" />
    <rect x="0" y="0" width="372" height="246" rx="22" fill="${shell}" stroke="${shellDark}" stroke-width="1.5" />

    <circle cx="26" cy="24" r="8" fill="${shellDark}" /><line x1="21" y1="24" x2="31" y2="24" stroke="${shell}" stroke-width="1.5" /><line x1="26" y1="19" x2="26" y2="29" stroke="${shell}" stroke-width="1.5" />
    <circle cx="346" cy="24" r="8" fill="${shellDark}" /><line x1="341" y1="24" x2="351" y2="24" stroke="${shell}" stroke-width="1.5" /><line x1="346" y1="19" x2="346" y2="29" stroke="${shell}" stroke-width="1.5" />
    <circle cx="26" cy="222" r="8" fill="${shellDark}" /><line x1="21" y1="222" x2="31" y2="222" stroke="${shell}" stroke-width="1.5" /><line x1="26" y1="217" x2="26" y2="227" stroke="${shell}" stroke-width="1.5" />
    <circle cx="346" cy="222" r="8" fill="${shellDark}" /><line x1="341" y1="222" x2="351" y2="222" stroke="${shell}" stroke-width="1.5" /><line x1="346" y1="217" x2="346" y2="227" stroke="${shell}" stroke-width="1.5" />

    <rect x="46" y="40" width="280" height="150" rx="14" fill="${labelBg}" stroke="${shellDark}" stroke-width="1" />
    <rect x="46" y="40" width="280" height="150" rx="14" fill="url(#${leafId})" />

    <rect x="140" y="48" width="92" height="22" rx="11" fill="#fbf8ee" stroke="${shellDark}" stroke-width="1" />
    <text x="186" y="63" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="12" fill="${accent}">${esc(labelText || 'Songs for you')}</text>

    <rect x="60" y="86" width="252" height="70" rx="8" fill="rgba(20,14,8,0.15)" />
    <ellipse cx="122" cy="121" rx="34" ry="34" fill="rgba(30,20,12,0.25)" />
    <ellipse cx="250" cy="121" rx="34" ry="34" fill="rgba(30,20,12,0.25)" />
    <path d="M132 108 C160 96 194 96 222 108" stroke="#241a12" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.85" />

    ${reelSVG(122, 121, accent)}
    ${reelSVG(250, 121, accent)}

    <rect x="46" y="198" width="280" height="30" rx="8" fill="${shellDark}" opacity="0.35" />
    <circle cx="100" cy="213" r="6" fill="#7a5aa8" />
    <circle cx="130" cy="213" r="5" fill="${shellDark}" />
    <circle cx="242" cy="213" r="5" fill="${shellDark}" />
    <circle cx="272" cy="213" r="6" fill="#7a5aa8" />
  </svg>`;
}

function mixtapeCloseBtnHTML() {
  return `<button data-action="mixtape-close" style="position:absolute;top:20px;right:20px;z-index:10;width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,0.08);border:1px solid rgba(0,0,0,0.1);cursor:pointer;display:flex;align-items:center;justify-content:center;color:#2c2c22;">✕</button>`;
}

function mixtapeStepIndicatorHTML(step) {
  return `<div style="display:flex;align-items:flex-start;justify-content:center;margin:28px 0 8px;flex-wrap:wrap;">
    ${MIXTAPE_STEPS.map((s, i) => `
      ${i > 0 ? `<div style="width:44px;height:0;border-top:2px dotted #cfc8b4;margin:21px 6px 0;"></div>` : ''}
      <button data-action="mixtape-step" data-step="${i + 1}" class="font-mono" style="display:flex;flex-direction:column;align-items:center;gap:6px;background:none;border:none;cursor:pointer;">
        <span style="width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;
          background:${step === i + 1 ? '#2c4a3e' : '#faf6ec'};color:${step === i + 1 ? '#faf6ec' : '#8a8a78'};
          border:2px solid ${step >= i + 1 ? '#2c4a3e' : '#d8d2c0'};">${i + 1}</span>
        <span style="font-size:12px;color:${step === i + 1 ? '#2c4a3e' : '#8a8a78'};font-weight:${step === i + 1 ? 700 : 400};">${s}</span>
      </button>
    `).join('')}
  </div>`;
}

function mixtapeStepContentHTML(mt, step) {
  if (step === 1) {
    return `<p class="font-mono" style="font-size:11px;color:#8a8a78;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:14px;">Pick a color</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        ${MIXTAPE_COLORS.map(c => `
          <button data-action="mixtape-pick-color" data-color="${c.id}" class="font-mono"
            style="display:flex;align-items:center;gap:8px;padding:8px 16px 8px 8px;border-radius:999px;cursor:pointer;
            background:${mt.color === c.id ? '#faf3e2' : '#fff'};border:1.5px solid ${mt.color === c.id ? '#2c4a3e' : '#e4ddc8'};">
            <span style="width:26px;height:18px;border-radius:4px;background:${c.shell};display:block;border:1px solid ${c.shellDark};"></span>
            <span style="font-size:13px;color:#3a3a2e;">${esc(c.label)}</span>
          </button>`).join('')}
      </div>`;
  }
  if (step === 2) {
    return `<p class="font-mono" style="font-size:11px;color:#8a8a78;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:14px;">Label text</p>
      <input type="text" value="${esc(state.mixtapeForm.label)}" data-scope="mixtapeForm" data-field="label" placeholder="Songs for you" class="font-serif"
        style="width:100%;background:#fff;border:1px solid #e4ddc8;border-radius:14px;padding:12px 16px;color:#2c2c22;font-size:15px;outline:none;margin-bottom:12px;" />
      <button data-action="mixtape-save-label" class="font-mono" style="padding:10px 20px;border-radius:14px;background:#2c4a3e;border:none;color:#faf6ec;cursor:pointer;font-size:13px;font-weight:700;">Save Label</button>`;
  }
  if (step === 3) {
    return `<p class="font-mono" style="font-size:11px;color:#8a8a78;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:14px;">Songs (${mt.songs.length})</p>
      ${mt.songs.map((song, i) => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #efe9d8;">
          <div style="flex:1;min-width:0;">
            <p class="font-serif" style="font-size:13px;color:#2c2c22;font-weight:600;">${esc(song.title || 'Untitled')}</p>
            ${song.artist ? `<p class="font-mono" style="font-size:11px;color:#8a8a78;">${esc(song.artist)}</p>` : ''}
            <audio controls src="${esc(song.url)}" style="width:100%;height:32px;margin-top:6px;"></audio>
          </div>
          <button data-action="mixtape-remove-song" data-index="${i}" style="width:28px;height:28px;border-radius:50%;background:rgba(220,60,60,0.08);border:1px solid rgba(220,60,60,0.2);color:#c0392b;cursor:pointer;flex-shrink:0;">✕</button>
        </div>`).join('')}
      <div style="margin-top:16px;padding-top:16px;${mt.songs.length ? 'border-top:1px solid #efe9d8;' : ''}">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
          <input type="text" value="${esc(state.mixtapeForm.songTitle)}" data-scope="mixtapeForm" data-field="songTitle" placeholder="Song title" class="font-mono"
            style="background:#fff;border:1px solid #e4ddc8;border-radius:12px;padding:10px 14px;color:#2c2c22;font-size:13px;outline:none;" />
          <input type="text" value="${esc(state.mixtapeForm.songArtist)}" data-scope="mixtapeForm" data-field="songArtist" placeholder="Artist (optional)" class="font-mono"
            style="background:#fff;border:1px solid #e4ddc8;border-radius:12px;padding:10px 14px;color:#2c2c22;font-size:13px;outline:none;" />
        </div>
        <label class="font-mono" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 0;border-radius:14px;border:1px dashed #c9c0a4;color:${state.mixtapeUploading ? '#b8b096' : '#2c4a3e'};font-size:13px;cursor:${state.mixtapeUploading ? 'default' : 'pointer'};">
          ${state.mixtapeUploading ? '⏳ Uploading...' : '📁 Upload a song (mp3)'}
          <input type="file" accept="audio/*" style="display:none;" data-action="mixtape-song-file" ${state.mixtapeUploading ? 'disabled' : ''} />
        </label>
      </div>`;
  }
  return `<p class="font-mono" style="font-size:11px;color:#8a8a78;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:14px;">A little note</p>
    <textarea data-scope="mixtapeForm" data-field="note" placeholder="What this mixtape means..." rows="4" class="font-serif"
      style="width:100%;background:#fff;border:1px solid #e4ddc8;border-radius:14px;padding:12px 16px;color:#2c2c22;font-size:14px;outline:none;resize:vertical;margin-bottom:12px;">${esc(state.mixtapeForm.note)}</textarea>
    <button data-action="mixtape-save-note" class="font-mono" style="padding:10px 20px;border-radius:14px;background:#2c4a3e;border:none;color:#faf6ec;cursor:pointer;font-size:13px;font-weight:700;">Save Note</button>`;
}

function mixtapeBuilderHTML() {
  const mt = state.owner.data.mixtape;
  const colorDef = MIXTAPE_COLORS.find(c => c.id === mt.color) || MIXTAPE_COLORS[0];
  const step = state.mixtapeStep;
  return `
  <div style="min-height:100vh;position:relative;background:linear-gradient(180deg, #faf6ec 0%, #faf6ec 340px, ${colorDef.labelBg} 340px, ${colorDef.labelBg} 100%);">
    ${mixtapeCloseBtnHTML()}
    <div style="max-width:640px;margin:0 auto;padding:44px 20px 110px;position:relative;">
      <div style="text-align:center;">
        <p class="font-mono" style="letter-spacing:0.18em;text-transform:uppercase;font-size:11px;color:#8a8a78;font-weight:700;">A little soundtrack, made by you</p>
        <h1 class="font-serif" style="font-size:34px;color:#2c2c22;margin-top:8px;">Build your mixtape</h1>
        <p class="font-mono" style="color:#6b6b5c;font-size:13px;max-width:440px;margin:12px auto 0;">One removable gift surface — toggle it off in Settings anytime without touching the rest of the gift.</p>
      </div>

      ${mixtapeStepIndicatorHTML(step)}

      <div style="max-width:380px;margin:32px auto;filter:drop-shadow(0 18px 36px rgba(0,0,0,0.18));">${cassetteSVG(colorDef, mt.label)}</div>

      <div style="background:#fff;border-radius:24px;padding:24px;box-shadow:0 10px 30px rgba(0,0,0,0.06);">
        ${mixtapeStepContentHTML(mt, step)}
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:20px;">
        <button data-action="mixtape-back" class="font-mono" style="padding:12px 20px;border-radius:16px;background:rgba(0,0,0,0.04);border:1px solid rgba(0,0,0,0.08);color:#5a5a4c;font-size:13px;cursor:pointer;">‹ ${step > 1 ? 'Back' : 'Close'}</button>
        ${step < MIXTAPE_STEPS.length
          ? `<button data-action="mixtape-next" class="font-mono" style="padding:12px 22px;border-radius:16px;background:#2c4a3e;border:none;color:#faf6ec;font-size:13px;font-weight:700;cursor:pointer;">Next ›</button>`
          : `<button data-action="mixtape-close" class="font-mono" style="padding:12px 22px;border-radius:16px;background:#2c4a3e;border:none;color:#faf6ec;font-size:13px;font-weight:700;cursor:pointer;">✓ Done</button>`}
      </div>
    </div>
  </div>`;
}

function mixtapeViewHTML() {
  const mt = state.recipient.data.mixtape;
  const colorDef = MIXTAPE_COLORS.find(c => c.id === mt.color) || MIXTAPE_COLORS[0];
  return `
  <div style="min-height:100vh;position:relative;background:linear-gradient(180deg, #faf6ec 0%, #faf6ec 300px, ${colorDef.labelBg} 300px, ${colorDef.labelBg} 100%);">
    ${mixtapeCloseBtnHTML()}
    <div style="max-width:520px;margin:0 auto;padding:52px 20px 110px;text-align:center;">
      <p class="font-mono" style="letter-spacing:0.18em;text-transform:uppercase;font-size:11px;color:#8a8a78;font-weight:700;">A little soundtrack, made for you</p>
      <h1 class="font-serif" style="font-size:32px;color:#2c2c22;margin-top:8px;">A Mixtape For You 📻</h1>
      <p class="font-mono" style="color:#6b6b5c;font-size:13px;margin-top:8px;">From your Dino 🦖</p>

      <div style="max-width:380px;margin:28px auto;filter:drop-shadow(0 18px 36px rgba(0,0,0,0.18));">${cassetteSVG(colorDef, mt.label)}</div>

      ${mt.songs.length ? `
        <div style="background:#fff;border-radius:24px;padding:20px;box-shadow:0 10px 30px rgba(0,0,0,0.06);text-align:left;margin-bottom:16px;">
          ${mt.songs.map(song => `
            <div style="padding:10px 0;border-bottom:1px solid #efe9d8;">
              <p class="font-serif" style="font-size:14px;color:#2c2c22;font-weight:600;">${esc(song.title || 'Untitled')}</p>
              ${song.artist ? `<p class="font-mono" style="font-size:11px;color:#8a8a78;">${esc(song.artist)}</p>` : ''}
              <audio controls src="${esc(song.url)}" style="width:100%;height:32px;margin-top:6px;"></audio>
            </div>`).join('')}
        </div>` : `<p class="font-mono" style="color:#8a8a78;font-size:13px;margin-bottom:16px;">No songs added yet...</p>`}

      ${mt.note ? `
        <div style="background:#fff;border-radius:18px;padding:18px 20px;box-shadow:0 6px 18px rgba(0,0,0,0.05);text-align:left;">
          <p class="font-serif" style="font-size:13px;color:#3a3a2e;font-style:italic;">"${esc(mt.note)}"</p>
        </div>` : ''}
    </div>
    ${recipientNavHTML(state.recipient.data, 'mixtape')}
  </div>`;
}

// ── Memory Map ───────────────────────────────────────────────────────────
// A stylized (not geographically real) illustrated treasure-map, isolated
// from the app-wide theme like Moon Chat/Mixtape. The two home cities
// (fromCity/toCity, already tracked for the distance feature) sit as fixed
// flag markers with a dotted "journey" line between them; the owner drops
// heart-pin markers anywhere on the map, each holding a title, date, note,
// optional photo and optional voice note.
const MAP_SPECKLES = Array.from({ length: 60 }, () => ({
  x: Math.random() * 800, y: Math.random() * 460, r: 0.6 + Math.random() * 1,
}));
function treeIcon(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <rect x="-1.5" y="6" width="3" height="6" fill="#6b4a2f"/>
    <path d="M0 -8 L7 6 L-7 6 Z" fill="#5c7a4a"/>
    <path d="M0 -3 L5 6 L-5 6 Z" fill="#6b8a57"/>
  </g>`;
}
function compassRose(cx, cy, r) {
  return `<g>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#8a6a3f" stroke-width="1.5" opacity="0.7"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.6}" fill="none" stroke="#8a6a3f" stroke-width="1" opacity="0.5"/>
    <path d="M${cx} ${cy - r} L${cx + r * 0.18} ${cy} L${cx} ${cy + r} L${cx - r * 0.18} ${cy} Z" fill="#8a6a3f" opacity="0.8"/>
    <path d="M${cx - r} ${cy} L${cx} ${cy - r * 0.18} L${cx + r} ${cy} L${cx} ${cy + r * 0.18} Z" fill="#8a6a3f" opacity="0.5"/>
    <text x="${cx}" y="${cy - r - 6}" text-anchor="middle" font-size="11" fill="#8a6a3f" font-family="Georgia,serif">N</text>
  </g>`;
}
function cornerFlourish(x, y, rot) {
  return `<g transform="translate(${x} ${y}) rotate(${rot})">
    <path d="M0 0 Q22 0 22 22 Q22 34 34 34" fill="none" stroke="#8a6a3f" stroke-width="2" opacity="0.5"/>
    <circle cx="34" cy="34" r="3" fill="#8a6a3f" opacity="0.5"/>
  </g>`;
}
function waveSquiggle(x, y) {
  return `<path d="M${x} ${y} Q${x + 10} ${y - 5} ${x + 20} ${y} Q${x + 30} ${y + 5} ${x + 40} ${y}" stroke="#8a6a3f" stroke-width="1.5" fill="none" opacity="0.4"/>`;
}
function mapSVG() {
  const speckles = MAP_SPECKLES.map(s => `<circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="${s.r.toFixed(1)}" fill="#8a6a3f" opacity="0.12"/>`).join('');
  return `<svg width="100%" height="100%" viewBox="0 0 800 460" preserveAspectRatio="xMidYMid slice" style="display:block;">
    <defs>
      <linearGradient id="parchmentGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#f6ecd2"/>
        <stop offset="100%" stop-color="#e3cd9c"/>
      </linearGradient>
      <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
        <stop offset="55%" stop-color="#000000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#5a4322" stop-opacity="0.4"/>
      </radialGradient>
    </defs>
    <rect x="0" y="0" width="800" height="460" fill="url(#parchmentGrad)"/>
    ${speckles}
    <path d="M60 340 C40 300 70 250 130 240 C190 230 230 270 220 320 C210 370 150 400 100 390 C70 384 75 360 60 340 Z" fill="#a9c39a" stroke="#7f9a6e" stroke-width="2" opacity="0.9"/>
    <path d="M600 120 C560 90 580 40 640 30 C700 20 750 50 745 100 C740 150 690 170 650 160 C620 153 630 140 600 120 Z" fill="#a9c39a" stroke="#7f9a6e" stroke-width="2" opacity="0.9"/>
    <path d="M420 380 C400 360 410 330 445 320 C480 310 510 330 505 360 C500 390 460 405 435 398 C425 395 428 388 420 380 Z" fill="#b8cca8" stroke="#7f9a6e" stroke-width="2" opacity="0.85"/>
    ${treeIcon(110, 300, 1.3)}${treeIcon(150, 320, 1)}${treeIcon(660, 80, 1.2)}${treeIcon(455, 355, 0.9)}
    ${waveSquiggle(20, 260)}${waveSquiggle(200, 380)}${waveSquiggle(590, 150)}${waveSquiggle(390, 400)}
    <path d="M140 230 Q400 120 660 230" fill="none" stroke="#8a6a3f" stroke-width="2" stroke-dasharray="2 8" stroke-linecap="round" opacity="0.6"/>
    ${compassRose(735, 70, 32)}
    <rect x="10" y="10" width="780" height="440" fill="none" stroke="#8a6a3f" stroke-width="3" opacity="0.5"/>
    <rect x="16" y="16" width="768" height="428" fill="none" stroke="#8a6a3f" stroke-width="1" opacity="0.4"/>
    ${cornerFlourish(16, 16, 0)}${cornerFlourish(784, 16, 90)}${cornerFlourish(784, 444, 180)}${cornerFlourish(16, 444, 270)}
    <rect x="0" y="0" width="800" height="460" fill="url(#vignette)"/>
  </svg>`;
}
function homeFlagSVG(color) {
  return `<svg width="26" height="42" viewBox="0 0 26 42" style="overflow:visible;display:block;">
    <ellipse cx="6" cy="40" rx="6" ry="2" fill="rgba(0,0,0,0.18)"/>
    <line x1="6" y1="4" x2="6" y2="40" stroke="#6b4a2f" stroke-width="2"/>
    <path d="M6 4 L23 10 L6 16 Z" fill="${color}" stroke="#6b4a2f" stroke-width="1"/>
  </svg>`;
}
function pinMarkerSVG(color) {
  return `<svg width="28" height="34" viewBox="0 0 28 32" style="overflow:visible;display:block;">
    <ellipse cx="14" cy="30" rx="5" ry="1.6" fill="rgba(0,0,0,0.2)"/>
    <path d="M14 2 C21 2 26 7.5 26 14 C26 21 14 30 14 30 C14 30 2 21 2 14 C2 7.5 7 2 14 2 Z" fill="${color}" stroke="#ffffff" stroke-width="1.4"/>
    <path d="M14 17.5 C10.5 14.3 8.6 12 8.6 9.8 C8.6 8 10 6.6 11.7 6.6 C12.8 6.6 13.7 7.2 14 8.2 C14.3 7.2 15.2 6.6 16.3 6.6 C18 6.6 19.4 8 19.4 9.8 C19.4 12 17.5 14.3 14 17.5 Z" fill="#ffffff"/>
  </svg>`;
}
function memoryMapPinsHTML(pins, fromCity, toCity) {
  return `
    <div style="position:absolute;left:17.5%;top:50%;transform:translate(-50%,-100%);">${homeFlagSVG('#e9c349')}</div>
    <div style="position:absolute;left:17.5%;top:50%;transform:translate(-50%,6px);font-family:Georgia,serif;font-size:12px;color:#5a4322;font-weight:700;text-align:center;white-space:nowrap;text-shadow:0 1px 2px rgba(255,255,255,0.5);">${esc(fromCity)}</div>
    <div style="position:absolute;left:82.5%;top:50%;transform:translate(-50%,-100%);">${homeFlagSVG('#fb7185')}</div>
    <div style="position:absolute;left:82.5%;top:50%;transform:translate(-50%,6px);font-family:Georgia,serif;font-size:12px;color:#5a4322;font-weight:700;text-align:center;white-space:nowrap;text-shadow:0 1px 2px rgba(255,255,255,0.5);">${esc(toCity)}</div>
    ${pins.map(p => `
      <button data-action="memorymap-view-pin" data-id="${p.id}" title="${esc(p.title)}"
        style="position:absolute;left:${p.x}%;top:${p.y}%;transform:translate(-50%,-100%);background:none;border:none;cursor:pointer;padding:0;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
        ${pinMarkerSVG('#e9c349')}
      </button>`).join('')}
  `;
}
function memoryPinFormHTML() {
  const d = state.memoryMapDraft;
  return `
  <div data-action="memorymap-cancel-pin" style="position:fixed;inset:0;z-index:60;background:rgba(20,14,8,0.55);display:flex;align-items:center;justify-content:center;padding:20px;">
    <div data-action="stop" style="background:#f6ecd2;border-radius:24px;padding:24px;max-width:420px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.4);">
      <p class="font-mono" style="font-size:11px;color:#8a6a3f;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:4px;">New memory</p>
      <h3 class="font-serif" style="font-size:22px;color:#2c2c22;margin-bottom:16px;">Pin this moment 📍</h3>
      <input type="text" value="${esc(d.title)}" data-scope="memoryMapDraft" data-field="title" placeholder="What happened here?" class="font-serif"
        style="width:100%;background:#fff;border:1px solid #ddc9a0;border-radius:14px;padding:12px 16px;color:#2c2c22;font-size:15px;outline:none;margin-bottom:10px;" />
      <input type="text" value="${esc(d.date)}" data-scope="memoryMapDraft" data-field="date" placeholder="Date" class="font-mono"
        style="width:100%;background:#fff;border:1px solid #ddc9a0;border-radius:14px;padding:10px 16px;color:#2c2c22;font-size:13px;outline:none;margin-bottom:10px;" />
      <textarea data-scope="memoryMapDraft" data-field="note" placeholder="A little note about this memory..." rows="3" class="font-serif"
        style="width:100%;background:#fff;border:1px solid #ddc9a0;border-radius:14px;padding:12px 16px;color:#2c2c22;font-size:14px;outline:none;resize:vertical;margin-bottom:10px;">${esc(d.note)}</textarea>
      ${d.photoUrl ? `<img src="${esc(d.photoUrl)}" ${IMG_ERROR_ATTR} style="width:100%;border-radius:14px;margin-bottom:10px;display:block;" />` : ''}
      <label class="font-mono" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:10px 0;border-radius:14px;border:1px dashed #c9b183;color:${state.memoryMapUploading ? '#b8a67c' : '#8a6a3f'};font-size:12px;cursor:${state.memoryMapUploading ? 'default' : 'pointer'};margin-bottom:10px;">
        ${state.memoryMapUploading ? '⏳ Uploading...' : (d.photoUrl ? '📷 Change photo' : '📷 Add a photo (optional)')}
        <input type="file" accept="image/*" style="display:none;" data-action="memorymap-photo-file" ${state.memoryMapUploading ? 'disabled' : ''} />
      </label>
      ${d.voiceUrl ? `<audio controls src="${esc(d.voiceUrl)}" style="width:100%;height:32px;margin-bottom:10px;"></audio>` : ''}
      <label class="font-mono" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:10px 0;border-radius:14px;border:1px dashed #c9b183;color:${state.memoryMapUploading ? '#b8a67c' : '#8a6a3f'};font-size:12px;cursor:${state.memoryMapUploading ? 'default' : 'pointer'};margin-bottom:16px;">
        ${state.memoryMapUploading ? '⏳ Uploading...' : (d.voiceUrl ? '🎙️ Change voice note' : '🎙️ Add a voice note (optional)')}
        <input type="file" accept="audio/*" style="display:none;" data-action="memorymap-voice-file" ${state.memoryMapUploading ? 'disabled' : ''} />
      </label>
      <div style="display:flex;gap:10px;">
        <button data-action="memorymap-cancel-pin" class="font-mono" style="flex:1;padding:12px 0;border-radius:14px;background:rgba(0,0,0,0.05);border:1px solid rgba(0,0,0,0.1);color:#5a5a4c;cursor:pointer;font-size:13px;">Cancel</button>
        <button data-action="memorymap-save-pin" class="font-mono" style="flex:1;padding:12px 0;border-radius:14px;background:#8a6a3f;border:none;color:#f6ecd2;cursor:pointer;font-size:13px;font-weight:700;">📍 Drop Pin</button>
      </div>
    </div>
  </div>`;
}
function memoryPinDetailHTML(pin, editable) {
  return `
  <div data-action="memorymap-close-detail" style="position:fixed;inset:0;z-index:60;background:rgba(20,14,8,0.55);display:flex;align-items:center;justify-content:center;padding:20px;">
    <div data-action="stop" style="background:#f6ecd2;border-radius:24px;padding:24px;max-width:420px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.4);">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:4px;">
        <p class="font-mono" style="font-size:11px;color:#8a6a3f;text-transform:uppercase;letter-spacing:0.15em;">${esc(pin.date)}</p>
        <button data-action="memorymap-close-detail" style="width:28px;height:28px;border-radius:50%;background:rgba(0,0,0,0.06);border:none;cursor:pointer;color:#5a5a4c;">✕</button>
      </div>
      <h3 class="font-serif" style="font-size:22px;color:#2c2c22;margin-bottom:14px;">${esc(pin.title)}</h3>
      ${pin.photoUrl ? `<img src="${esc(pin.photoUrl)}" ${IMG_ERROR_ATTR} style="width:100%;border-radius:14px;margin-bottom:14px;display:block;" />` : ''}
      ${pin.note ? `<p class="font-serif" style="font-size:14px;color:#3a3a2e;line-height:1.6;margin-bottom:14px;">${esc(pin.note)}</p>` : ''}
      ${pin.voiceUrl ? `<audio controls src="${esc(pin.voiceUrl)}" style="width:100%;height:32px;margin-bottom:14px;"></audio>` : ''}
      ${editable ? `<button data-action="memorymap-delete-pin" data-id="${pin.id}" class="font-mono" style="width:100%;padding:10px 0;border-radius:14px;background:rgba(220,60,60,0.08);border:1px solid rgba(220,60,60,0.2);color:#c0392b;cursor:pointer;font-size:12px;">🗑 Delete this memory</button>` : ''}
    </div>
  </div>`;
}
function memoryMapBuilderHTML() {
  const data = state.owner.data;
  const mm = data.memoryMap;
  const showOverlay = !!(state.memoryMapDraft || state.memoryMapViewingId);
  const viewingPin = state.memoryMapViewingId ? mm.pins.find(p => p.id === state.memoryMapViewingId) : null;
  return `
  <div style="min-height:100vh;position:relative;background:linear-gradient(180deg,#2b2115 0%,#161009 100%);">
    <div style="position:relative;z-index:5;display:flex;align-items:center;justify-content:space-between;padding:16px 20px;">
      <div>
        <h2 class="font-serif" style="font-size:22px;font-weight:700;color:#f0dfb8;">Memory Map 🗺️</h2>
        <p class="font-mono" style="font-size:11px;color:rgba(240,223,184,0.55);margin-top:2px;">${mm.pins.length} memor${mm.pins.length === 1 ? 'y' : 'ies'} pinned</p>
      </div>
      <button data-action="memorymap-close" style="width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.15);cursor:pointer;display:flex;align-items:center;justify-content:center;color:#f0dfb8;">✕</button>
    </div>
    <div style="max-width:900px;margin:0 auto;padding:0 16px 50px;position:relative;z-index:5;">
      <div ${showOverlay ? '' : 'data-action="memorymap-place"'} style="position:relative;width:100%;aspect-ratio:800/460;border-radius:24px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.5);cursor:${showOverlay ? 'default' : 'crosshair'};">
        ${mapSVG()}
        ${memoryMapPinsHTML(mm.pins, data.fromCity, data.toCity)}
      </div>
      <p class="font-mono" style="text-align:center;color:rgba(240,223,184,0.45);font-size:11px;margin-top:12px;">Tap anywhere on the map to drop a memory pin</p>
    </div>
    ${state.memoryMapDraft ? memoryPinFormHTML() : ''}
    ${viewingPin ? memoryPinDetailHTML(viewingPin, true) : ''}
  </div>`;
}
function memoryMapViewHTML() {
  const data = state.recipient.data;
  const mm = data.memoryMap;
  const viewingPin = state.memoryMapViewingId ? mm.pins.find(p => p.id === state.memoryMapViewingId) : null;
  return `
  <div style="min-height:100vh;position:relative;background:linear-gradient(180deg,#2b2115 0%,#161009 100%);">
    <div style="position:relative;z-index:5;display:flex;align-items:center;justify-content:space-between;padding:16px 20px;">
      <div>
        <h2 class="font-serif" style="font-size:22px;font-weight:700;color:#f0dfb8;">Our Memory Map 🗺️</h2>
        <p class="font-mono" style="font-size:11px;color:rgba(240,223,184,0.55);margin-top:2px;">From your Dino 🦖</p>
      </div>
      <button data-action="memorymap-close" style="width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.15);cursor:pointer;display:flex;align-items:center;justify-content:center;color:#f0dfb8;">✕</button>
    </div>
    <div style="max-width:900px;margin:0 auto;padding:0 16px 90px;position:relative;z-index:5;">
      <div style="position:relative;width:100%;aspect-ratio:800/460;border-radius:24px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.5);">
        ${mapSVG()}
        ${memoryMapPinsHTML(mm.pins, data.fromCity, data.toCity)}
      </div>
      <p class="font-mono" style="text-align:center;color:rgba(240,223,184,0.45);font-size:11px;margin-top:12px;">${mm.pins.length ? 'Tap a pin to relive the memory' : 'No memories pinned yet...'}</p>
    </div>
    ${viewingPin ? memoryPinDetailHTML(viewingPin, false) : ''}
    ${recipientNavHTML(data, 'memorymap')}
  </div>`;
}

// ── Voice Notes (photo slideshow + a recorded voice note, like a little
// audio postcard) ───────────────────────────────────────────────────────
// Deterministic "waveform" bar heights derived from the note's id, so the
// same note always draws the same shape instead of jittering on re-render.
function seededWaveHeights(seed, count) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const heights = [];
  for (let i = 0; i < count; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    heights.push(16 + (h % 1000) / 1000 * 26);
  }
  return heights;
}
function waveformHTML(id) {
  const heights = seededWaveHeights(id, 42);
  return `<div style="flex:1;display:flex;align-items:center;gap:2px;height:38px;min-width:0;">
    ${heights.map((h, i) => `<div class="wave-bar" data-action="voicenote-seek" data-idx="${i}"
      style="flex:1;height:${h.toFixed(1)}px;min-width:2px;border-radius:2px;background:rgba(178,200,237,0.25);cursor:pointer;"></div>`).join('')}
  </div>`;
}
// Shared by the owner's preview and Panther's real view — a card with the
// photo (or slideshow, if more than one) up top and a playable waveform
// below it. The photo auto-advances via a timer set up in afterRender();
// the audio element itself lives outside #root (see getVoiceNoteAudio())
// so playback survives that timer's re-renders instead of restarting.
function voiceNotePostcardHTML(note, editable) {
  const photos = note.photos || [];
  const idx = photos.length ? state.voiceNotePlayer.photoIndex % photos.length : 0;
  const playing = state.voiceNotePlayer.playing;
  return `
  <div data-action="voicenote-close-detail" style="position:fixed;inset:0;z-index:60;background:rgba(0,8,20,0.75);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;">
    <div data-action="stop" class="glass-gold" style="border-radius:28px;padding:18px;max-width:420px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 24px 60px rgba(0,0,0,0.55);">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;gap:10px;">
        <div style="min-width:0;">
          <p class="font-mono" style="font-size:10px;color:var(--accent);text-transform:uppercase;letter-spacing:0.15em;">${esc(formatEntryDate(note.createdAt))}</p>
          <h3 class="font-serif" style="font-size:20px;color:#ffddb0;margin-top:2px;">${esc(note.title || 'A voice note')}</h3>
        </div>
        <button data-action="voicenote-close-detail" style="width:30px;height:30px;border-radius:50%;background:rgba(178,200,237,0.08);border:1px solid rgba(178,200,237,0.15);cursor:pointer;color:#b2c8ed;flex-shrink:0;">✕</button>
      </div>
      ${photos.length ? `
        <div style="position:relative;width:100%;aspect-ratio:4/3;border-radius:20px;overflow:hidden;background:#000;margin-bottom:10px;">
          <img src="${esc(photos[idx])}" ${IMG_ERROR_ATTR} style="width:100%;height:100%;object-fit:cover;display:block;animation:fadeIn 0.5s ease-out;" />
        </div>
        ${photos.length > 1 ? `<div style="display:flex;justify-content:center;gap:5px;margin-bottom:14px;">
          ${photos.map((_, i) => `<div style="width:${i === idx ? 16 : 6}px;height:6px;border-radius:3px;background:${i === idx ? 'var(--accent)' : 'rgba(178,200,237,0.25)'};transition:all 0.2s;"></div>`).join('')}
        </div>` : `<div style="margin-bottom:14px;"></div>`}
      ` : ''}
      <div style="display:flex;align-items:center;gap:10px;background:rgba(0,13,32,0.5);border-radius:16px;padding:10px 14px;margin-bottom:${editable ? '14px' : '0'};">
        <button data-action="voicenote-toggle-play" style="width:38px;height:38px;border-radius:50%;background:var(--accent);border:none;cursor:pointer;color:#000d20;font-size:15px;flex-shrink:0;display:flex;align-items:center;justify-content:center;">${playing ? '⏸' : '▶'}</button>
        ${waveformHTML(note.id)}
      </div>
      ${editable ? `<button data-action="voicenote-delete" data-id="${esc(note.id)}" class="font-mono" style="width:100%;padding:10px 0;border-radius:14px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);color:#f87171;cursor:pointer;font-size:12px;">🗑 Delete this voice note</button>` : ''}
    </div>
  </div>`;
}
function voiceNoteCardThumbHTML(note, editable) {
  const cover = note.photos && note.photos[0];
  return `
    <div style="position:relative;border-radius:20px;overflow:hidden;aspect-ratio:1/1;">
      <button data-action="voicenote-open" data-id="${esc(note.id)}" class="font-mono" style="text-align:left;border:none;cursor:pointer;padding:0;display:block;width:100%;height:100%;background:rgba(0,13,32,0.5);position:relative;">
        ${cover ? `<img src="${esc(cover)}" ${IMG_ERROR_ATTR} style="width:100%;height:100%;object-fit:cover;display:block;" />` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:32px;">🎙️</div>`}
        <div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 50%,rgba(0,8,20,0.85) 100%);"></div>
        <div style="position:absolute;left:10px;right:${editable ? '34' : '10'}px;bottom:8px;">
          <p style="font-size:12px;color:white;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(note.title || 'A voice note')}</p>
          ${note.photos && note.photos.length > 1 ? `<p style="font-size:9px;color:rgba(255,255,255,0.6);margin-top:1px;">${note.photos.length} photos</p>` : ''}
        </div>
      </button>
      ${editable ? `<button data-action="voicenote-delete" data-id="${esc(note.id)}" title="Delete this voice note" style="position:absolute;top:6px;right:6px;width:24px;height:24px;border-radius:50%;background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);color:#f87171;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;">🗑</button>` : ''}
    </div>`;
}
function voiceNoteBuilderHTML() {
  const data = state.owner.data;
  const notes = data.voiceNotes || [];
  const d = state.voiceNoteDraft;
  const viewing = state.voiceNoteViewingId ? notes.find(n => n.id === state.voiceNoteViewingId) : null;
  const canSave = d.photos.length > 0 && !!d.audioUrl;
  return `
  <div style="${PAGE_STYLE}">
    ${skyBackdropHTML(data.theme)}
    <div style="${INNER_STYLE}">
      <div style="padding-top:24px;padding-bottom:20px;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <p class="font-mono" style="font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:0.18em;margin-bottom:4px;">A little audio postcard</p>
          <h1 class="font-serif" style="font-size:26px;font-weight:700;color:white;">Voice Notes 🎙️</h1>
          <p class="font-mono" style="font-size:11px;color:rgba(178,200,237,0.45);margin-top:2px;">${notes.length} saved</p>
        </div>
        <button data-action="voicenotes-close" style="width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.2);cursor:pointer;display:flex;align-items:center;justify-content:center;color:white;">✕</button>
      </div>

      <div class="glass-gold" style="border-radius:24px;padding:22px;margin-bottom:20px;">
        <p class="font-mono" style="font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:0.15em;margin-bottom:14px;">New voice note</p>
        <input type="text" value="${esc(d.title)}" data-scope="voiceNoteDraft" data-field="title" placeholder="Give it a title..." class="font-serif" style="${OWNER_INPUT_STYLE}margin-bottom:12px;" />

        ${d.photos.length ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
          ${d.photos.map((url, i) => `
            <div style="position:relative;width:64px;height:64px;border-radius:12px;overflow:hidden;">
              <img src="${esc(url)}" ${IMG_ERROR_ATTR} style="width:100%;height:100%;object-fit:cover;display:block;" />
              <button data-action="voicenote-remove-photo" data-idx="${i}" style="position:absolute;top:2px;right:2px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,0.6);border:none;color:white;font-size:10px;cursor:pointer;line-height:1;">✕</button>
            </div>`).join('')}
        </div>` : ''}
        <label class="font-mono" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:14px 0;border-radius:14px;border:1px dashed rgba(var(--accent-rgb),0.35);color:${state.voiceNotePhotoUploading ? 'rgba(var(--accent-rgb),0.5)' : 'var(--accent)'};font-size:13px;cursor:${state.voiceNotePhotoUploading ? 'default' : 'pointer'};margin-bottom:12px;">
          ${state.voiceNotePhotoUploading ? '⏳ Uploading...' : '📷 Add photo(s) — pick several for a slideshow'}
          <input type="file" accept="image/*" multiple style="display:none;" data-action="voicenote-photo-file" ${state.voiceNotePhotoUploading ? 'disabled' : ''} />
        </label>

        ${d.audioUrl ? `<audio controls src="${esc(d.audioUrl)}" style="width:100%;height:32px;margin-bottom:10px;"></audio>` : ''}
        <label class="font-mono" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:14px 0;border-radius:14px;border:1px dashed rgba(var(--accent-rgb),0.35);color:${state.voiceNoteAudioUploading ? 'rgba(var(--accent-rgb),0.5)' : 'var(--accent)'};font-size:13px;cursor:${state.voiceNoteAudioUploading ? 'default' : 'pointer'};margin-bottom:14px;">
          ${state.voiceNoteAudioUploading ? '⏳ Uploading...' : (d.audioUrl ? '🎙️ Change voice recording' : '🎙️ Add a voice recording')}
          <input type="file" accept="audio/*" style="display:none;" data-action="voicenote-audio-file" ${state.voiceNoteAudioUploading ? 'disabled' : ''} />
        </label>
        <button data-action="voicenote-save" ${canSave ? '' : 'disabled'} class="btn-gold font-mono" style="width:100%;padding:12px 0;border-radius:16px;border:none;cursor:${canSave ? 'pointer' : 'not-allowed'};font-size:13px;opacity:${canSave ? 1 : 0.5};">Save Voice Note</button>
      </div>

      ${notes.length ? `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
        ${notes.slice().reverse().map(n => voiceNoteCardThumbHTML(n, true)).join('')}
      </div>` : emptyStateHTML('No voice notes yet — add photos and a recording above', '🎙️')}
    </div>
  </div>${viewing ? voiceNotePostcardHTML(viewing, true) : ''}`;
}
function voiceNoteListViewHTML() {
  const data = state.recipient.data;
  const notes = data.voiceNotes || [];
  const viewing = state.voiceNoteViewingId ? notes.find(n => n.id === state.voiceNoteViewingId) : null;
  return `
  <div style="${PAGE_STYLE}">
    ${skyBackdropHTML(data.theme)}
    <div style="${INNER_STYLE}">
      <div style="padding-top:24px;padding-bottom:20px;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <p class="font-mono" style="font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:0.18em;margin-bottom:4px;">A little audio postcard</p>
          <h1 class="font-serif" style="font-size:26px;font-weight:700;color:white;">Voice Notes 🎙️</h1>
          <p class="font-mono" style="font-size:11px;color:rgba(178,200,237,0.45);margin-top:2px;">From your Dino 🦖</p>
        </div>
        <button data-action="voicenotes-close" style="width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.2);cursor:pointer;display:flex;align-items:center;justify-content:center;color:white;">✕</button>
      </div>
      ${notes.length ? `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding-bottom:90px;">
        ${notes.slice().reverse().map(n => voiceNoteCardThumbHTML(n, false)).join('')}
      </div>` : emptyStateHTML('No voice notes yet...', '🎙️')}
    </div>
    ${viewing ? voiceNotePostcardHTML(viewing, false) : ''}
    ${recipientNavHTML(data, 'voicenotes')}
  </div>`;
}

// ── Collection ───────────────────────────────────────────────────────────
// A read-only, chronological feed pulling together everything that's been
// sent — letters, photos, moon-chat lines, mixtape songs, memory-map pins,
// and the bouquet — each dated, newest first, so nothing sent ever gets
// lost in a specific tab. Same screen for owner and recipient.
function formatEntryDate(iso, fallback) {
  if (!iso) return fallback || '';
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); }
  catch (e) { return fallback || ''; }
}
function buildCollectionEntries(data) {
  const entries = [];
  (data.letters || []).forEach(l => {
    const extras = [];
    if (l.hasPhoto) extras.push('📷 photo');
    if (l.hasVideo) extras.push('🎬 video');
    if (l.hasMusic) extras.push('🎵 music');
    if (l.hasAudio) extras.push('🎙️ voice');
    const media = [];
    if (l.hasPhoto && l.photoUrl) media.push({ type: 'image', url: l.photoUrl });
    if (l.hasMusic && l.musicUrl) media.push({ type: 'audio', url: l.musicUrl });
    entries.push({
      kind: 'letter', id: l.id,
      icon: '✉️', title: l.title || l.label || 'A letter',
      sub: extras.join(' · ') || null, media,
      date: l.date || formatEntryDate(l.createdAt), ts: l.createdAt || 0,
    });
  });
  (data.gallery || []).forEach(p => entries.push({
    kind: 'photo', id: p.id,
    icon: '📷', title: p.caption || 'A photo', sub: p.location || null,
    media: [{ type: 'image', url: p.url }],
    date: p.date || formatEntryDate(p.createdAt), ts: p.createdAt || 0,
  }));
  (data.moonMessages || []).forEach(m => entries.push({
    kind: 'moon', id: m.id,
    icon: '🌙', title: m.text.length > 70 ? m.text.slice(0, 70) + '…' : m.text,
    sub: m.from === 'dino' ? 'You, to Panther' : "Moon's reply", media: [],
    date: formatEntryDate(m.createdAt), ts: m.createdAt || 0,
  }));
  ((data.mixtape && data.mixtape.songs) || []).forEach(s => entries.push({
    kind: 'song', id: s.id,
    icon: '🎵', title: s.title || 'Untitled song', sub: s.artist || null,
    media: [{ type: 'audio', url: s.url }],
    date: formatEntryDate(s.addedAt), ts: s.addedAt || 0,
  }));
  ((data.memoryMap && data.memoryMap.pins) || []).forEach(pn => {
    const media = [];
    if (pn.photoUrl) media.push({ type: 'image', url: pn.photoUrl });
    if (pn.voiceUrl) media.push({ type: 'audio', url: pn.voiceUrl });
    entries.push({
      kind: 'pin', id: pn.id,
      icon: '📍', title: pn.title || 'A memory',
      sub: pn.note ? (pn.note.length > 60 ? pn.note.slice(0, 60) + '…' : pn.note) : null, media,
      date: pn.date || formatEntryDate(pn.createdAt), ts: pn.createdAt || 0,
    });
  });
  (data.voiceNotes || []).forEach(vn => {
    const media = [...(vn.photos || []).map(u => ({ type: 'image', url: u }))];
    if (vn.audioUrl) media.push({ type: 'audio', url: vn.audioUrl });
    entries.push({
      kind: 'voicenote', id: vn.id,
      icon: '🎙️', title: vn.title || 'A voice note',
      sub: vn.photos && vn.photos.length ? `${vn.photos.length} photo${vn.photos.length === 1 ? '' : 's'}` : null,
      media,
      date: formatEntryDate(vn.createdAt), ts: vn.createdAt || 0,
    });
  });
  if (data.bouquet && data.bouquet.flowers && data.bouquet.flowers.length) {
    entries.push({
      kind: 'bouquet', id: 'bouquet',
      icon: '💐', title: `Bouquet · ${data.bouquet.flowers.length} blooms`, sub: data.bouquet.note || null, media: [],
      date: formatEntryDate(data.bouquet.updatedAt), ts: data.bouquet.updatedAt || 0,
    });
  }
  entries.sort((a, b) => new Date(b.ts || 0) - new Date(a.ts || 0));
  return entries;
}
function collectionMediaHTML(media) {
  if (!media || !media.length) return '';
  return media.map(m => m.type === 'image'
    ? `<img src="${esc(m.url)}" alt="" ${IMG_ERROR_ATTR} style="width:100%;max-height:220px;object-fit:cover;border-radius:12px;margin-top:10px;display:block;" />`
    : `<audio controls src="${esc(m.url)}" style="width:100%;height:32px;margin-top:10px;display:block;"></audio>`
  ).join('');
}
async function deleteCollectionEntry(kind, id) {
  if (kind === 'letter') return deleteLetter(id);
  if (kind === 'photo') return deletePhoto(id);
  if (kind === 'moon') return moonDelete(id);
  if (kind === 'song') return removeMixtapeSong(state.owner.data.mixtape.songs.findIndex(s => s.id === id));
  if (kind === 'pin') return deleteMemoryPin(id);
  if (kind === 'voicenote') return deleteVoiceNote(id);
  if (kind === 'bouquet') return persist({ ...state.owner.data, bouquet: { ...state.owner.data.bouquet, flowers: [], note: '', updatedAt: new Date().toISOString() } });
}
function collectionHTML() {
  const isOwnerView = !(state.isRecipient && state.recipient.data);
  const data = isOwnerView ? state.owner.data : state.recipient.data;
  const entries = buildCollectionEntries(data);
  return `
  <div style="${PAGE_STYLE}">
    ${skyBackdropHTML(data.theme)}
    <div style="${INNER_STYLE}">
      <div style="padding-top:24px;padding-bottom:20px;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <p class="font-mono" style="font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:0.18em;margin-bottom:4px;">Everything, together</p>
          <h1 class="font-serif" style="font-size:26px;font-weight:700;color:white;">The Collection 📚</h1>
          <p class="font-mono" style="font-size:11px;color:rgba(178,200,237,0.45);margin-top:2px;">${entries.length} thing${entries.length === 1 ? '' : 's'} sent, in order</p>
        </div>
        <button data-action="collection-close" style="width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.2);cursor:pointer;display:flex;align-items:center;justify-content:center;color:white;">✕</button>
      </div>
      ${entries.length ? `
        <div style="display:flex;flex-direction:column;">
          ${entries.map((e, i) => `
            <div class="glass-gold" style="border-radius:18px;padding:16px 18px;margin-bottom:10px;animation:slideUp 0.3s ${Math.min(i * 0.03, 0.6)}s ease-out both;">
              <div style="display:flex;align-items:flex-start;gap:14px;">
                <div style="font-size:24px;flex-shrink:0;line-height:1;">${e.icon}</div>
                <div style="flex:1;min-width:0;">
                  <p class="font-serif" style="font-size:15px;color:#eef4ff;font-weight:600;">${esc(e.title)}</p>
                  ${e.sub ? `<p class="font-mono" style="font-size:11px;color:rgba(178,200,237,0.55);margin-top:3px;">${esc(e.sub)}</p>` : ''}
                </div>
                ${e.date ? `<p class="font-mono" style="font-size:10px;color:var(--accent);white-space:nowrap;flex-shrink:0;">${esc(e.date)}</p>` : ''}
                ${isOwnerView ? `<button data-action="collection-delete-entry" data-kind="${e.kind}" data-id="${esc(e.id)}" title="Delete" style="width:26px;height:26px;border-radius:50%;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.25);color:#f87171;cursor:pointer;flex-shrink:0;font-size:12px;display:flex;align-items:center;justify-content:center;">🗑</button>` : ''}
              </div>
              ${collectionMediaHTML(e.media)}
            </div>`).join('')}
        </div>` : emptyStateHTML('Nothing sent yet — start with a letter, a photo, or a song.', '📚')}
    </div>
  </div>`;
}

// ── Letter editor ─────────────────────────────────────────────────────────
const EDITOR_STEPS = ['Label & Style', 'Your Message', 'Add Media', 'Stickers', 'Preview'];

function toggleHTML(checked, field) {
  return `<label class="toggle-wrap">
    <input type="checkbox" class="toggle-input" data-action="editor-toggle-flag" data-field="${field}" ${checked ? 'checked' : ''} />
    <div class="toggle-track"><div class="toggle-thumb"></div></div>
  </label>`;
}

function letterEditorHTML() {
  const l = state.editor.draft;
  const step = state.editor.step;
  const isEditing = state.editingLetter && state.editingLetter !== null;

  let stepHTML = '';
  if (step === 1) {
    stepHTML = `
    <div class="glass-gold" style="border-radius:28px;padding:28px;display:flex;flex-direction:column;gap:24px;animation:fadeIn 0.3s ease-out;">
      <div>
        <p class="font-mono" style="font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:0.15em;margin-bottom:12px;">Choose a label:</p>
        <div style="max-height:240px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;">
          ${LABELS.map(lb => `
            <button data-action="editor-pick-label" data-label="${esc(lb)}" class="font-mono" style="text-align:left;padding:11px 16px;border-radius:14px;font-size:13px;cursor:pointer;
              background:${l.label === lb ? 'rgba(var(--accent-rgb),0.15)' : 'rgba(178,200,237,0.04)'};
              border:${l.label === lb ? '1px solid rgba(var(--accent-rgb),0.6)' : '1px solid transparent'};
              color:${l.label === lb ? 'var(--accent)' : '#b2c8ed'};transition:all 0.15s;">${esc(lb)}</button>`).join('')}
        </div>
      </div>
      <div>
        <p class="font-mono" style="font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:0.15em;margin-bottom:8px;">Or write your own:</p>
        <input type="text" value="${esc(l.label)}" data-scope="editor" data-field="label" placeholder="Open when..." class="font-mono" style="${EDITOR_INPUT_STYLE}" />
      </div>
      <div>
        <p class="font-mono" style="font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:0.15em;margin-bottom:12px;">Envelope color:</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          ${ENVELOPE_COLORS.map(c => `
            <button data-action="editor-pick-color" data-color="${c.id}" title="${c.label}" style="width:40px;height:40px;border-radius:50%;background:${c.color};border:none;cursor:pointer;
              outline:${l.envelopeColor === c.id ? '3px solid white' : '3px solid transparent'};outline-offset:3px;
              transform:${l.envelopeColor === c.id ? 'scale(1.25)' : 'scale(1)'};transition:all 0.2s;"></button>`).join('')}
        </div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:rgba(178,200,237,0.05);border-radius:16px;">
        <span class="font-mono" style="font-size:13px;color:#b2c8ed;">Publish for Panther</span>
        ${toggleHTML(l.isPublished, 'isPublished')}
      </div>
    </div>`;
  } else if (step === 2) {
    stepHTML = `
    <div class="glass-gold" style="border-radius:28px;padding:28px;display:flex;flex-direction:column;gap:20px;animation:fadeIn 0.3s ease-out;">
      <div>
        <p class="font-mono" style="font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:0.15em;margin-bottom:8px;">Greeting:</p>
        <input type="text" value="${esc(l.greeting)}" data-scope="editor" data-field="greeting" placeholder="My Dearest Panther," class="font-serif" style="${EDITOR_INPUT_STYLE}" />
      </div>
      <div>
        <p class="font-mono" style="font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:0.15em;margin-bottom:8px;">Sign off:</p>
        <input type="text" value="${esc(l.signOff)}" data-scope="editor" data-field="signOff" placeholder="Forever yours, Dino 🖤" class="font-serif" style="${EDITOR_INPUT_STYLE}" />
      </div>
      <div>
        <p class="font-mono" style="font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:0.15em;margin-bottom:8px;">Date stamp (auto):</p>
        <p class="font-serif" style="color:#b2c8ed;font-size:14px;padding:12px 16px;">${esc(l.date)}</p>
      </div>
      <div>
        <p class="font-mono" style="font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:0.15em;margin-bottom:8px;">Your letter:</p>
        <textarea rows="10" data-scope="editor" data-field="content" placeholder="Pour your heart out here... Tell him how much he means to you." class="font-serif"
          style="${EDITOR_INPUT_STYLE}resize:vertical;line-height:1.9;font-size:15px;">${esc(l.content)}</textarea>
      </div>
    </div>`;
  } else if (step === 3) {
    stepHTML = `
    <div style="display:flex;flex-direction:column;gap:16px;animation:fadeIn 0.3s ease-out;">
      <div class="glass-gold" style="border-radius:24px;padding:22px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:${l.hasPhoto ? 18 : 0}px;">
          <div style="display:flex;align-items:center;gap:10px;"><span style="font-size:22px;">📷</span><span class="font-mono" style="font-size:14px;font-weight:600;color:#7dd3fc;">Photo</span></div>
          ${toggleHTML(l.hasPhoto, 'hasPhoto')}
        </div>
        ${l.hasPhoto ? `
          <div style="display:flex;flex-direction:column;gap:12px;">
            <label class="font-mono" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 0;border-radius:14px;border:1px dashed rgba(125,211,252,0.3);color:#7dd3fc;font-size:13px;cursor:pointer;">
              📁 Upload photo
              <input type="file" accept="image/*" style="display:none;" data-action="editor-file" data-field="photoUrl" />
            </label>
            ${l.photoUrl ? `<img src="${esc(l.photoUrl)}" alt="" ${IMG_ERROR_ATTR} style="width:80px;height:80px;object-fit:cover;border-radius:12px;border:1px solid rgba(125,211,252,0.3);" />` : ''}
            <input type="text" value="${esc(l.photoCaption)}" data-scope="editor" data-field="photoCaption" placeholder="Photo caption..." class="font-serif" style="${EDITOR_INPUT_STYLE}font-size:13px;" />
          </div>` : ''}
      </div>
      <div class="glass-gold" style="border-radius:24px;padding:22px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:${l.hasAudio ? 18 : 0}px;">
          <div style="display:flex;align-items:center;gap:10px;"><span style="font-size:22px;">🎙️</span><span class="font-mono" style="font-size:14px;font-weight:600;color:#fb7185;">Voice Note</span></div>
          ${toggleHTML(l.hasAudio, 'hasAudio')}
        </div>
        ${l.hasAudio ? `<input type="text" value="${esc(l.audioTitle)}" data-scope="editor" data-field="audioTitle" placeholder="e.g. A midnight message for you..." class="font-mono" style="${EDITOR_INPUT_STYLE}font-size:13px;" />` : ''}
      </div>
      <div class="glass-gold" style="border-radius:24px;padding:22px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:${l.hasVideo ? 18 : 0}px;">
          <div style="display:flex;align-items:center;gap:10px;"><span style="font-size:22px;">🎬</span><span class="font-mono" style="font-size:14px;font-weight:600;color:#a78bfa;">Video</span></div>
          ${toggleHTML(l.hasVideo, 'hasVideo')}
        </div>
        ${l.hasVideo ? `
          <div style="display:flex;flex-direction:column;gap:12px;">
            <label class="font-mono" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 0;border-radius:14px;border:1px dashed rgba(167,139,250,0.3);color:#a78bfa;font-size:13px;cursor:pointer;">
              📁 Upload video
              <input type="file" accept="video/*" style="display:none;" data-action="editor-file" data-field="videoUrl" />
            </label>
            <input type="text" value="${esc(l.videoTitle)}" data-scope="editor" data-field="videoTitle" placeholder="Video title..." class="font-mono" style="${EDITOR_INPUT_STYLE}font-size:13px;" />
          </div>` : ''}
      </div>
      <div class="glass-gold" style="border-radius:24px;padding:22px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:${l.hasMusic ? 18 : 0}px;">
          <div style="display:flex;align-items:center;gap:10px;"><span style="font-size:22px;">🎵</span><span class="font-mono" style="font-size:14px;font-weight:600;color:#4ade80;">Background Music</span></div>
          ${toggleHTML(l.hasMusic, 'hasMusic')}
        </div>
        ${l.hasMusic ? `
          <div style="display:flex;flex-direction:column;gap:12px;">
            <label class="font-mono" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 0;border-radius:14px;border:1px dashed rgba(74,222,128,0.3);color:${state.editor.musicUploading ? 'rgba(74,222,128,0.4)' : '#4ade80'};font-size:13px;cursor:${state.editor.musicUploading ? 'default' : 'pointer'};">
              ${state.editor.musicUploading ? '⏳ Uploading...' : '📁 Upload music (up to ~5 min)'}
              <input type="file" accept="audio/*" style="display:none;" data-action="editor-music-file" ${state.editor.musicUploading ? 'disabled' : ''} />
            </label>
            ${l.musicUrl ? `<audio controls src="${esc(l.musicUrl)}" style="width:100%;height:36px;"></audio>` : ''}
            <input type="text" value="${esc(l.musicTitle)}" data-scope="editor" data-field="musicTitle" placeholder="Song title (optional)..." class="font-mono" style="${EDITOR_INPUT_STYLE}font-size:13px;" />
          </div>` : ''}
      </div>
    </div>`;
  } else if (step === 4) {
    stepHTML = `
    <div class="glass-gold" style="border-radius:28px;padding:28px;animation:fadeIn 0.3s ease-out;">
      <p class="font-mono" style="font-size:13px;color:#b2c8ed;margin-bottom:18px;">Tap stickers to add to your letter:</p>
      <div style="display:grid;grid-template-columns:repeat(6, 1fr);gap:10px;">
        ${STICKERS.map(s => `
          <button data-action="editor-toggle-sticker" data-sticker="${s}" style="font-size:24px;width:48px;height:48px;border-radius:14px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;
            background:${l.stickers.includes(s) ? 'rgba(var(--accent-rgb),0.2)' : 'rgba(178,200,237,0.06)'};
            outline:${l.stickers.includes(s) ? '2px solid rgba(var(--accent-rgb),0.6)' : '2px solid transparent'};
            transform:${l.stickers.includes(s) ? 'scale(1.1)' : 'scale(1)'};transition:all 0.15s;">${s}</button>`).join('')}
      </div>
      ${l.stickers.length > 0 ? `
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(178,200,237,0.1);">
          <p class="font-mono" style="font-size:11px;color:var(--accent);margin-bottom:10px;">Your stickers (${l.stickers.length}):</p>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${l.stickers.map(s => `<button data-action="editor-toggle-sticker" data-sticker="${s}" style="font-size:24px;border:none;background:none;cursor:pointer;opacity:0.8;">${s}</button>`).join('')}
          </div>
        </div>` : ''}
    </div>`;
  } else if (step === 5) {
    stepHTML = `
    <div style="display:flex;flex-direction:column;gap:16px;animation:fadeIn 0.3s ease-out;">
      <div style="text-align:center;">
        <span class="font-mono" style="font-size:12px;color:#4ade80;background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.25);padding:6px 16px;border-radius:999px;">✓ Exactly what Panther sees</span>
      </div>
      <div class="letter-paper" style="border-radius:28px;padding:32px 28px;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
        <div style="padding-bottom:20px;margin-bottom:20px;border-bottom:1px solid rgba(44,29,17,0.1);">
          <p class="font-mono" style="font-size:10px;opacity:0.35;text-transform:uppercase;letter-spacing:0.2em;margin-bottom:6px;">💌 Open When</p>
          <h2 class="font-serif" style="font-size:22px;font-weight:700;margin-bottom:6px;">${esc(l.label || '(no label set)')}</h2>
          <p class="font-mono" style="font-size:11px;opacity:0.3;">${esc(l.date)}</p>
        </div>
        ${l.stickers.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;">${l.stickers.map(s => `<span style="font-size:20px;">${s}</span>`).join('')}</div>` : ''}
        <div class="font-serif" style="line-height:1.9;">
          ${l.greeting ? `<p style="font-weight:700;margin-bottom:14px;">${esc(l.greeting)}</p>` : ''}
          <p style="white-space:pre-line;">${esc(l.content || '(letter content here...)')}</p>
          ${l.signOff ? `<p style="font-weight:700;font-style:italic;margin-top:20px;text-align:right;">${esc(l.signOff)}</p>` : ''}
        </div>
        ${l.hasPhoto && l.photoUrl ? `
          <div style="display:flex;justify-content:center;margin-top:24px;">
            <div style="background:white;padding:8px 8px 28px;box-shadow:0 6px 20px rgba(0,0,0,0.15);transform:rotate(1.5deg);max-width:220px;">
              <img src="${esc(l.photoUrl)}" alt="" ${IMG_ERROR_ATTR} style="width:100%;aspect-ratio:1/1;object-fit:cover;display:block;" />
              ${l.photoCaption ? `<p class="font-serif" style="text-align:center;font-size:11px;color:#78716c;margin-top:8px;font-style:italic;">"${esc(l.photoCaption)}"</p>` : ''}
            </div>
          </div>` : ''}
        ${l.hasMusic && l.musicUrl ? `
          <div style="margin-top:20px;">
            <p class="font-mono" style="font-size:10px;opacity:0.4;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:6px;">🎵 ${esc(l.musicTitle || 'Background Music')}</p>
            <audio controls src="${esc(l.musicUrl)}" style="width:100%;height:36px;"></audio>
          </div>` : ''}
      </div>
      <button data-action="editor-save" class="btn-gold" style="width:100%;padding:18px 0;border-radius:22px;font-size:15px;border:none;cursor:pointer;letter-spacing:0.04em;">✓ Save & Publish Letter</button>
    </div>`;
  }

  return `
  <div style="min-height:100vh;background:var(--page-bg);position:relative;">
    ${skyBackdropHTML(state.owner.data.theme)}
    <div style="position:relative;z-index:10;max-width:680px;margin:0 auto;padding:24px 16px 100px;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;">
        <div>
          <p class="font-mono" style="font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:0.15em;margin-bottom:4px;">Step ${step}/${EDITOR_STEPS.length} — ${EDITOR_STEPS[step - 1]}</p>
          <h2 class="font-serif" style="font-size:26px;font-weight:700;color:white;">${isEditing ? 'Edit Letter' : 'New Letter ✍️'}</h2>
        </div>
        <button data-action="editor-cancel" style="width:36px;height:36px;border-radius:50%;background:rgba(178,200,237,0.08);border:1px solid rgba(178,200,237,0.12);cursor:pointer;display:flex;align-items:center;justify-content:center;color:#b2c8ed;">✕</button>
      </div>

      <div style="display:flex;gap:8px;margin-bottom:28px;overflow-x:auto;padding-bottom:4px;">
        ${EDITOR_STEPS.map((s, i) => `
          <button data-action="editor-step" data-step="${i + 1}" class="font-mono" style="flex-shrink:0;padding:7px 14px;border-radius:999px;font-size:11px;border:none;cursor:pointer;
            background:${step === i + 1 ? 'var(--accent)' : step > i + 1 ? 'rgba(var(--accent-rgb),0.15)' : 'rgba(178,200,237,0.06)'};
            color:${step === i + 1 ? '#000d20' : step > i + 1 ? 'var(--accent)' : 'rgba(178,200,237,0.4)'};
            font-weight:${step === i + 1 ? 700 : 400};transition:all 0.2s;">${i + 1}. ${s}</button>`).join('')}
      </div>

      ${stepHTML}

      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:28px;">
        <button data-action="editor-back" class="font-mono" style="display:flex;align-items:center;gap:6px;padding:12px 20px;border-radius:16px;background:rgba(178,200,237,0.06);border:1px solid rgba(178,200,237,0.1);color:#b2c8ed;font-size:13px;cursor:pointer;">‹ ${step > 1 ? 'Back' : 'Cancel'}</button>
        <div style="display:flex;gap:10px;">
          ${isEditing ? `<button data-action="editor-delete" class="font-mono" style="padding:12px 18px;border-radius:16px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);color:#f87171;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:6px;">🗑 Delete</button>` : ''}
          <button data-action="editor-save" class="font-mono" style="padding:12px 18px;border-radius:16px;background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.25);color:#4ade80;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:6px;">✓ Save</button>
          ${step < EDITOR_STEPS.length ? `<button data-action="editor-next" class="btn-gold font-mono" style="display:flex;align-items:center;gap:6px;padding:12px 20px;border-radius:16px;font-size:13px;border:none;cursor:pointer;">Next ›</button>` : ''}
        </div>
      </div>
    </div>
  </div>`;
}

// ── Owner studio ─────────────────────────────────────────────────────────
function ownerStudioHTML() {
  const data = state.owner.data;
  const tab = state.owner.tab;
  const url = shareUrl();
  const waText = encodeURIComponent(`Panther 🐾✈️\n\nI made something for you — open when you need me 💌\n\n${url}\n\nCode: ${data.recipientPin} 🔐`);

  let tabHTML = '';
  if (tab === 'home') {
    tabHTML = `
    <div style="display:flex;flex-direction:column;gap:16px;animation:fadeIn 0.3s ease-out;">
      <div class="glass-gold" style="border-radius:28px;padding:28px;border:1px solid rgba(var(--accent-rgb),0.18);">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:22px;">
          <div style="font-size:44px;animation:float 6s ease-in-out infinite;">🦖🐾</div>
          <div>
            <h2 class="font-serif" style="font-size:20px;font-weight:700;color:#ffddb0;">Between Two Skies</h2>
            <p class="font-mono" style="font-size:12px;color:rgba(178,200,237,0.45);margin-top:3px;">${data.letters.length} letters · ${data.gallery.length} photos</p>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:14px;margin-bottom:18px;
          background:${data.isPublished ? 'rgba(74,222,128,0.08)' : 'rgba(251,191,36,0.08)'};border:1px solid ${data.isPublished ? 'rgba(74,222,128,0.2)' : 'rgba(251,191,36,0.2)'};">
          <div style="width:8px;height:8px;border-radius:50%;background:${data.isPublished ? '#4ade80' : '#fbbf24'};animation:bounceDot 1.5s ease-in-out infinite;"></div>
          <p class="font-mono" style="font-size:12px;color:${data.isPublished ? '#4ade80' : '#fbbf24'};">${data.isPublished ? 'Published — Panther can open your letters' : 'Draft — not yet shared with Panther'}</p>
        </div>
        <button data-action="publish" ${state.owner.saving ? 'disabled' : ''} class="btn-gold font-mono" style="width:100%;padding:16px 0;border-radius:20px;font-size:14px;border:none;cursor:pointer;margin-bottom:14px;letter-spacing:0.04em;
          background:${state.owner.pubOk ? '#4ade80' : state.owner.saving ? 'rgba(var(--accent-rgb),0.5)' : 'var(--accent)'};color:${state.owner.pubOk ? 'white' : '#000d20'};">
          ${state.owner.saving ? 'Saving...' : state.owner.pubOk ? '✓ Published!' : data.isPublished ? '↑ Update Gift' : '🚀 Publish for Panther'}
        </button>
        <div style="display:flex;gap:10px;margin-bottom:12px;">
          <input readonly value="${esc(url)}" class="font-mono" style="${OWNER_INPUT_STYLE}flex:1;padding:10px 14px;font-size:12px;color:#b2c8ed;" />
          <button data-action="copy-link" class="font-mono" style="padding:10px 16px;border-radius:14px;border:none;cursor:pointer;font-size:12px;font-weight:700;
            background:${state.owner.copied ? '#4ade80' : 'rgba(var(--accent-rgb),0.12)'};color:${state.owner.copied ? 'white' : 'var(--accent)'};display:flex;align-items:center;gap:6px;white-space:nowrap;transition:all 0.2s;">
            ${state.owner.copied ? '✓ Copied!' : '⧉ Copy'}
          </button>
        </div>
        <a href="https://api.whatsapp.com/send?text=${waText}" target="_blank" rel="noopener noreferrer" class="font-mono"
          style="display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:12px 0;border-radius:16px;background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.2);color:#4ade80;font-size:13px;font-weight:700;text-decoration:none;">
          📱 Send via WhatsApp ↗
        </a>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
        <button data-action="new-letter" class="glass-gold font-mono" style="border-radius:22px;padding:16px 4px;text-align:center;border:none;cursor:pointer;">
          <div style="font-size:28px;margin-bottom:6px;">✍️</div><p style="font-size:11px;color:#b2c8ed;">Write Letter</p>
        </button>
        <button data-action="owner-tab" data-tab="gallery" class="glass-gold font-mono" style="border-radius:22px;padding:16px 4px;text-align:center;border:none;cursor:pointer;">
          <div style="font-size:28px;margin-bottom:6px;">📷</div><p style="font-size:11px;color:#b2c8ed;">Add Photo</p>
        </button>
        <button data-action="owner-tab" data-tab="bouquet" class="glass-gold font-mono" style="border-radius:22px;padding:16px 4px;text-align:center;border:none;cursor:pointer;">
          <div style="font-size:28px;margin-bottom:6px;">💐</div><p style="font-size:11px;color:#b2c8ed;">Bouquet</p>
        </button>
        <button data-action="owner-tab" data-tab="moon" class="glass-gold font-mono" style="border-radius:22px;padding:16px 4px;text-align:center;border:none;cursor:pointer;">
          <div style="font-size:28px;margin-bottom:6px;">🌙</div><p style="font-size:11px;color:#b2c8ed;">Moon Chat</p>
        </button>
      </div>
    </div>`;
  } else if (tab === 'letters') {
    tabHTML = `
    <div style="animation:fadeIn 0.3s ease-out;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
        <h2 class="font-serif" style="font-size:22px;font-weight:700;color:white;">Letters (${data.letters.length})</h2>
        <button data-action="new-letter" class="btn-gold font-mono" style="display:flex;align-items:center;gap:6px;padding:10px 18px;border-radius:16px;border:none;cursor:pointer;font-size:13px;">+ New Letter</button>
      </div>
      ${envelopeGridHTML(data.letters, true)}
    </div>`;
  } else if (tab === 'gallery') {
    tabHTML = `
    <div style="animation:fadeIn 0.3s ease-out;">
      <h2 class="font-serif" style="font-size:22px;font-weight:700;color:white;margin-bottom:20px;">Gallery (${data.gallery.length})</h2>
      <div class="glass-gold" style="border-radius:24px;padding:22px;margin-bottom:20px;">
        <p class="font-mono" style="font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:0.15em;margin-bottom:14px;">Add a photo</p>
        <label class="font-mono" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:14px 0;border-radius:14px;border:1px dashed rgba(var(--accent-rgb),0.35);color:${state.galleryUploading ? 'rgba(var(--accent-rgb),0.5)' : 'var(--accent)'};font-size:13px;cursor:${state.galleryUploading ? 'default' : 'pointer'};margin-bottom:10px;">
          ${state.galleryUploading ? '⏳ Uploading...' : (state.newPhoto.url ? '📁 Change photo' : '📁 Upload a photo from your device')}
          <input type="file" accept="image/*" style="display:none;" data-action="gallery-photo-file" ${state.galleryUploading ? 'disabled' : ''} />
        </label>
        ${state.newPhoto.url ? `<img src="${esc(state.newPhoto.url)}" ${IMG_ERROR_ATTR} style="width:100%;max-height:180px;object-fit:cover;border-radius:14px;margin-bottom:10px;display:block;" />` : ''}
        <p class="font-mono" style="font-size:10px;color:rgba(178,200,237,0.35);margin-bottom:8px;">Or paste an image URL instead:</p>
        <input type="text" value="${esc(state.newPhoto.url)}" data-scope="newPhoto" data-field="url" placeholder="https://..." class="font-mono" style="${OWNER_INPUT_STYLE}margin-bottom:10px;font-size:13px;" />
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
          <input type="text" value="${esc(state.newPhoto.caption)}" data-scope="newPhoto" data-field="caption" placeholder="Caption..." class="font-serif" style="${OWNER_INPUT_STYLE}font-size:13px;" />
          <input type="text" value="${esc(state.newPhoto.location)}" data-scope="newPhoto" data-field="location" placeholder="Location..." class="font-mono" style="${OWNER_INPUT_STYLE}font-size:13px;" />
        </div>
        <button data-action="add-photo" ${!state.newPhoto.url.trim() ? 'disabled' : ''} class="btn-gold font-mono" style="width:100%;padding:12px 0;border-radius:16px;border:none;cursor:pointer;font-size:13px;">Add Photo</button>
      </div>
      ${galleryGridHTML(data.gallery, true)}
    </div>`;
  } else if (tab === 'settings') {
    tabHTML = `
    <div style="display:flex;flex-direction:column;gap:16px;animation:fadeIn 0.3s ease-out;">
      <h2 class="font-serif" style="font-size:22px;font-weight:700;color:white;">Settings</h2>
      <div class="glass-gold" style="border-radius:24px;padding:24px;">
        <p class="font-mono" style="font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:0.15em;margin-bottom:16px;">Distance</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
          <div>
            <p class="font-mono" style="font-size:11px;color:rgba(178,200,237,0.45);margin-bottom:6px;">Your city (Dino):</p>
            <input type="text" value="${esc(state.owner.cityForm.fromCity)}" data-scope="cityForm" data-field="fromCity" class="font-mono" style="${OWNER_INPUT_STYLE}" />
          </div>
          <div>
            <p class="font-mono" style="font-size:11px;color:rgba(178,200,237,0.45);margin-bottom:6px;">His city (Panther):</p>
            <input type="text" value="${esc(state.owner.cityForm.toCity)}" data-scope="cityForm" data-field="toCity" class="font-mono" style="${OWNER_INPUT_STYLE}" />
          </div>
        </div>
        <button data-action="update-cities" class="btn-gold font-mono" style="width:100%;padding:12px 0;border-radius:16px;border:none;cursor:pointer;font-size:13px;">Update Cities</button>
      </div>
      <div class="glass-gold" style="border-radius:24px;padding:24px;">
        <p class="font-mono" style="font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:0.15em;margin-bottom:14px;">Screens shown to Panther</p>
        ${[['letters', 'Letters'], ['gallery', 'Gallery'], ['voicenotes', 'Voice Notes'], ['bouquet', 'Bouquet'], ['mixtape', 'Mixtape'], ['memorymap', 'Memory Map'], ['moon', 'Talk to Moon']].map(([t, label]) => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(178,200,237,0.06);">
            <span class="font-mono" style="font-size:13px;color:#b2c8ed;">${label}</span>
            <label class="toggle-wrap">
              <input type="checkbox" class="toggle-input" data-action="toggle-hidden-tab" data-tab="${t}" ${!data.hiddenTabs[t] ? 'checked' : ''} />
              <div class="toggle-track"><div class="toggle-thumb"></div></div>
            </label>
          </div>`).join('')}
        <p class="font-mono" style="font-size:10px;color:rgba(178,200,237,0.35);margin-top:10px;">Toggle off to leave a piece out of Panther's gift — he'll step through what's left on, in order. Collection (everything, ever sent) is always reachable and can't be turned off.</p>
      </div>
      <div class="glass-gold" style="border-radius:24px;padding:24px;">
        <p class="font-mono" style="font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:0.15em;margin-bottom:12px;">App Theme</p>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">
          ${THEMES.map(t => `
            <button data-action="pick-theme" data-theme="${t.id}" class="font-mono" title="${esc(t.label)}"
              style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 4px;border-radius:14px;cursor:pointer;
              background:${data.theme === t.id ? `rgba(${t.accentRgb},0.18)` : 'rgba(178,200,237,0.05)'};
              border:${data.theme === t.id ? `1px solid ${t.accent}` : '1px solid transparent'};">
              <span style="width:18px;height:18px;border-radius:50%;background:${t.accent};display:block;"></span>
              <span style="font-size:9px;color:#b2c8ed;">${t.icon || '✨'}</span>
            </button>`).join('')}
        </div>
        <p class="font-mono" style="font-size:10px;color:rgba(178,200,237,0.35);margin-top:10px;">Recolors the whole app and adds seasonal touches. Hover a swatch for its name.</p>
      </div>
      <div class="glass-gold" style="border-radius:24px;padding:24px;">
        <p class="font-mono" style="font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:0.15em;margin-bottom:14px;">Share Info</p>
        <p class="font-mono" style="font-size:13px;color:#b2c8ed;margin-bottom:8px;">Owner PIN: <span style="color:var(--accent);font-weight:700;font-size:16px;">${OWNER_PIN}</span></p>
        <p class="font-mono" style="font-size:12px;color:rgba(178,200,237,0.4);margin-bottom:12px;word-break:break-all;">Panther's link: <span style="color:#7dd3fc;">${esc(url)}</span></p>
        <button data-action="copy-link" class="font-mono" style="padding:10px 20px;border-radius:14px;background:rgba(var(--accent-rgb),0.1);border:1px solid rgba(var(--accent-rgb),0.25);color:var(--accent);cursor:pointer;font-size:13px;font-weight:700;display:flex;align-items:center;gap:6px;margin-bottom:16px;">
          ${state.owner.copied ? '✓ Copied!' : '⧉ Copy Link'}
        </button>
        <p class="font-mono" style="font-size:11px;color:rgba(178,200,237,0.45);margin-bottom:8px;">Panther's code — he'll need this to open the link (tell him separately, e.g. in your message):</p>
        <div style="display:flex;gap:10px;">
          <input type="text" inputmode="numeric" maxlength="4" value="${esc(state.recipientPinForm.pin)}" data-scope="recipientPinForm" data-field="pin" placeholder="1122" class="font-mono"
            style="${OWNER_INPUT_STYLE}flex:1;font-size:16px;letter-spacing:0.3em;text-align:center;" />
          <button data-action="save-recipient-pin" class="font-mono" style="padding:10px 16px;border-radius:14px;border:1px solid rgba(var(--accent-rgb),0.25);background:rgba(var(--accent-rgb),0.1);color:var(--accent);cursor:pointer;font-size:12px;white-space:nowrap;">Save</button>
        </div>
      </div>
      <div class="glass-gold" style="border-radius:24px;padding:24px;">
        <button data-action="lock-app" class="font-mono" style="width:100%;padding:12px 0;border-radius:16px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);color:#f87171;cursor:pointer;font-size:13px;font-weight:700;">🔒 Lock App</button>
      </div>
    </div>`;
  }

  return `
  <div style="${PAGE_STYLE}">
    ${skyBackdropHTML(data.theme)}
    <div style="${INNER_STYLE}">
      <div style="padding-top:24px;padding-bottom:20px;display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;">
        <div>
          <p class="font-mono" style="font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:0.18em;margin-bottom:4px;">Creator Studio 🦖</p>
          <h1 class="font-serif" style="font-size:26px;font-weight:700;color:white;">For Panther 🐾</h1>
        </div>
        <div class="glass-gold font-mono" style="padding:10px 16px;border-radius:16px;font-size:12px;color:#b2c8ed;text-align:right;">
          <span style="color:var(--accent);">📍</span> ${esc(data.fromCity)} <span style="color:var(--accent);">✈️</span> ${esc(data.toCity)}<br />
          <span style="color:var(--accent);font-weight:700;">${data.distanceKm} km</span> <span style="opacity:0.4;">apart</span>
        </div>
      </div>
      ${tabHTML}
    </div>
    <nav style="position:fixed;bottom:0;left:0;width:100%;z-index:50;background:rgba(0,13,32,0.85);backdrop-filter:blur(16px);border-top:1px solid rgba(var(--accent-rgb),0.1);">
      <div style="display:flex;justify-content:space-around;align-items:center;padding:8px 4px 12px;max-width:680px;margin:0 auto;overflow-x:auto;">
        ${OWNER_TABS.map(t => `
          <button data-action="owner-tab" data-tab="${t.id}" class="font-mono" style="display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 10px;border-radius:16px;border:none;cursor:pointer;font-size:10px;font-weight:600;flex-shrink:0;
            background:${tab === t.id ? 'rgba(var(--accent-rgb),0.12)' : 'transparent'};color:${tab === t.id ? 'var(--accent)' : 'rgba(178,200,237,0.4)'};transition:all 0.2s;">
            <span style="font-size:18px;">${t.icon}</span><span>${t.label}</span>
          </button>`).join('')}
      </div>
    </nav>
  </div>` + (tab === 'letters' ? letterModalOverlayHTML(data.letters) : (tab === 'gallery' ? lightboxOverlayHTML(data.gallery) : ''));
}

// ── Data actions ─────────────────────────────────────────────────────────
// The owner's screen updates optimistically (from local state) before the
// Firestore write even starts, so a silent save failure would otherwise
// look identical to success on this screen — Panther just never gets it.
// Checking the result here makes that impossible to miss.
async function persist(newData) {
  state.owner.data = newData;
  render();
  const ok = await saveData(newData);
  if (!ok) {
    window.alert("⚠️ This didn't save — Panther won't see it yet. Check your internet connection and try again (and re-check whatever you just changed).");
  }
}

function openEditor(letter) {
  state.editingLetter = letter === null ? null : letter;
  state.editor.draft = letter ? { ...letter, stickers: [...letter.stickers] } : freshLetter();
  state.editor.step = 1;
  render();
}
function cancelEditor() {
  state.editingLetter = undefined;
  state.editor.draft = null;
  render();
}
async function saveLetterFromEditor() {
  const letter = state.editor.draft;
  const letters = state.owner.data.letters.some(x => x.id === letter.id)
    ? state.owner.data.letters.map(x => x.id === letter.id ? letter : x)
    : [letter, ...state.owner.data.letters];
  state.editingLetter = undefined;
  state.editor.draft = null;
  await persist({ ...state.owner.data, letters });
}
async function deleteLetter(id) {
  await persist({ ...state.owner.data, letters: state.owner.data.letters.filter(l => l.id !== id) });
}
async function addPhoto() {
  const url = (state.newPhoto.url || '').trim();
  if (!url) return;
  const photo = {
    id: `photo-${Date.now()}`, url,
    caption: (state.newPhoto.caption || '').trim() || 'A memory for you',
    date: todayLabel(),
    location: (state.newPhoto.location || '').trim() || 'Under our sky',
    createdAt: new Date().toISOString(),
  };
  state.newPhoto = { url: '', caption: '', location: '' };
  await persist({ ...state.owner.data, gallery: [photo, ...state.owner.data.gallery] });
}
async function deletePhoto(id) {
  await persist({ ...state.owner.data, gallery: state.owner.data.gallery.filter(p => p.id !== id) });
}
async function publish() {
  state.owner.saving = true; render();
  await persist({ ...state.owner.data, isPublished: true });
  state.owner.saving = false; state.owner.pubOk = true; render();
  setTimeout(() => { state.owner.pubOk = false; render(); }, 3000);
}
async function updateCities() {
  await persist({ ...state.owner.data, fromCity: state.owner.cityForm.fromCity, toCity: state.owner.cityForm.toCity });
}
async function saveRecipientPin() {
  const pin = (state.recipientPinForm.pin || '').replace(/\D/g, '').slice(0, 4);
  if (pin.length !== 4) { window.alert('Panther\'s code needs to be exactly 4 digits.'); return; }
  state.recipientPinForm.pin = pin;
  await persist({ ...state.owner.data, recipientPin: pin });
}
async function pickTheme(id) {
  applyTheme(id); // instant preview, doesn't wait on the save
  await persist({ ...state.owner.data, theme: id });
}
async function pickMoonDay(day) {
  state.moonEditor.openPicker = null;
  await persist({ ...state.owner.data, moonPhaseDay: day });
}
async function pickSkyEffect(id) {
  state.moonEditor.openPicker = null;
  await persist({ ...state.owner.data, skyEffectId: id });
}
async function pickSkyColor(id) {
  state.moonEditor.openPicker = null;
  await persist({ ...state.owner.data, skyColorId: id });
}
async function addBouquetFlower(id) {
  const bq = state.owner.data.bouquet;
  if (bq.flowers.length >= MAX_FLOWERS) return;
  await persist({ ...state.owner.data, bouquet: { ...bq, flowers: [...bq.flowers, id], updatedAt: new Date().toISOString() } });
}
async function applyBouquetTemplate(id) {
  const t = BOUQUET_TEMPLATES.find(x => x.id === id);
  if (!t) return;
  if (state.owner.data.bouquet.flowers.length > 0 && !window.confirm('Replace your current flowers with this template?')) return;
  await persist({ ...state.owner.data, bouquet: { ...state.owner.data.bouquet, flowers: [...t.flowers], wrapping: t.wrapping, updatedAt: new Date().toISOString() } });
}
async function removeBouquetFlower(index) {
  const bq = state.owner.data.bouquet;
  await persist({ ...state.owner.data, bouquet: { ...bq, flowers: bq.flowers.filter((_, i) => i !== index), updatedAt: new Date().toISOString() } });
}
async function pickBouquetWrapping(id) {
  await persist({ ...state.owner.data, bouquet: { ...state.owner.data.bouquet, wrapping: id, updatedAt: new Date().toISOString() } });
}
async function pickBouquetBgPreset(id) {
  await persist({ ...state.owner.data, bouquet: { ...state.owner.data.bouquet, background: { type: 'preset', value: id }, updatedAt: new Date().toISOString() } });
}
async function setBouquetBgCustom() {
  const url = (state.bouquetForm.bgUrl || '').trim();
  if (!url) return;
  await persist({ ...state.owner.data, bouquet: { ...state.owner.data.bouquet, background: { type: 'custom', value: url }, updatedAt: new Date().toISOString() } });
}
async function saveBouquetNote() {
  await persist({ ...state.owner.data, bouquet: { ...state.owner.data.bouquet, note: state.bouquetForm.note, updatedAt: new Date().toISOString() } });
}
async function pickMixtapeColor(id) {
  await persist({ ...state.owner.data, mixtape: { ...state.owner.data.mixtape, color: id, updatedAt: new Date().toISOString() } });
}
async function saveMixtapeLabel() {
  const label = (state.mixtapeForm.label || '').trim() || 'Songs for you';
  await persist({ ...state.owner.data, mixtape: { ...state.owner.data.mixtape, label, updatedAt: new Date().toISOString() } });
}
async function removeMixtapeSong(index) {
  const mt = state.owner.data.mixtape;
  await persist({ ...state.owner.data, mixtape: { ...mt, songs: mt.songs.filter((_, i) => i !== index), updatedAt: new Date().toISOString() } });
}
async function saveMixtapeNote() {
  await persist({ ...state.owner.data, mixtape: { ...state.owner.data.mixtape, note: state.mixtapeForm.note, updatedAt: new Date().toISOString() } });
}
async function addMemoryPin() {
  const d = state.memoryMapDraft;
  if (!d) return;
  const pin = {
    id: `pin-${Date.now()}`,
    x: d.x, y: d.y,
    title: (d.title || '').trim() || 'A memory',
    date: (d.date || '').trim() || todayLabel(),
    note: d.note || '',
    photoUrl: d.photoUrl || '',
    voiceUrl: d.voiceUrl || '',
    createdAt: new Date().toISOString(),
  };
  const mm = state.owner.data.memoryMap;
  state.memoryMapDraft = null;
  await persist({ ...state.owner.data, memoryMap: { ...mm, pins: [...mm.pins, pin] } });
}
async function deleteMemoryPin(id) {
  const mm = state.owner.data.memoryMap;
  state.memoryMapViewingId = null;
  await persist({ ...state.owner.data, memoryMap: { ...mm, pins: mm.pins.filter(p => p.id !== id) } });
}
// The <audio> element lives outside #root, created once and reused, so the
// periodic re-renders that drive the photo slideshow (see afterRender())
// don't tear it down and restart playback from 0 every few seconds.
let voiceNoteAudioEl = null;
function getVoiceNoteAudio() {
  if (!voiceNoteAudioEl) {
    voiceNoteAudioEl = document.createElement('audio');
    voiceNoteAudioEl.id = 'voicenote-audio-player';
    voiceNoteAudioEl.style.display = 'none';
    document.body.appendChild(voiceNoteAudioEl);
    voiceNoteAudioEl.addEventListener('timeupdate', () => {
      if (!voiceNoteAudioEl.duration) return;
      const frac = voiceNoteAudioEl.currentTime / voiceNoteAudioEl.duration;
      const bars = root.querySelectorAll('.wave-bar');
      bars.forEach((b, i) => {
        const barFrac = bars.length > 1 ? i / (bars.length - 1) : 0;
        b.style.background = barFrac <= frac ? 'var(--accent)' : 'rgba(178,200,237,0.25)';
      });
    });
    voiceNoteAudioEl.addEventListener('ended', () => {
      state.voiceNotePlayer.playing = false;
      render();
    });
  }
  return voiceNoteAudioEl;
}
let voiceNoteSlideshowTimer = null;
let voiceNoteSlideshowNoteId = null;
function stopVoiceNoteSlideshow() {
  if (voiceNoteSlideshowTimer) { clearInterval(voiceNoteSlideshowTimer); voiceNoteSlideshowTimer = null; }
  voiceNoteSlideshowNoteId = null;
}
async function saveVoiceNote() {
  const d = state.voiceNoteDraft;
  if (!d.photos.length || !d.audioUrl) return;
  const note = {
    id: `voicenote-${Date.now()}`,
    title: (d.title || '').trim() || 'A voice note',
    photos: [...d.photos],
    audioUrl: d.audioUrl,
    createdAt: new Date().toISOString(),
  };
  state.voiceNoteDraft = { title: '', photos: [], audioUrl: '' };
  const vn = state.owner.data.voiceNotes;
  await persist({ ...state.owner.data, voiceNotes: [...vn, note] });
}
async function deleteVoiceNote(id) {
  if (state.voiceNoteViewingId === id) {
    stopVoiceNoteSlideshow();
    getVoiceNoteAudio().pause();
    state.voiceNoteViewingId = null;
  }
  const vn = state.owner.data.voiceNotes;
  await persist({ ...state.owner.data, voiceNotes: vn.filter(n => n.id !== id) });
}
function copyLink() {
  navigator.clipboard.writeText(shareUrl());
  state.owner.copied = true; render();
  setTimeout(() => { state.owner.copied = false; render(); }, 2500);
}
function moveLightbox(delta) {
  const photos = (state.isRecipient && state.recipient.data) ? state.recipient.data.gallery : state.owner.data.gallery;
  if (!state.lightbox || !photos.length) return;
  const n = photos.length;
  state.lightbox.idx = (state.lightbox.idx + delta + n) % n;
  render();
}
async function addMoonLine(from) {
  const field = from === 'dino' ? 'dinoDraft' : 'moonDraft';
  const text = (state.moonEditor[field] || '').trim();
  if (!text) return;
  state.moonEditor[field] = '';
  await persist({ ...state.owner.data, moonMessages: [...state.owner.data.moonMessages, { id: `moon-${Date.now()}`, from, text, createdAt: new Date().toISOString() }] });
}
function moonEditStart(id) {
  const m = state.owner.data.moonMessages.find(x => x.id === id);
  if (!m) return;
  state.moonEditor.editingId = id;
  state.moonEditor.editingText = m.text;
  render();
}
async function moonEditSave() {
  const id = state.moonEditor.editingId;
  const text = (state.moonEditor.editingText || '').trim();
  state.moonEditor.editingId = null;
  if (!id || !text) { render(); return; }
  const moonMessages = state.owner.data.moonMessages.map(m => m.id === id ? { ...m, text } : m);
  await persist({ ...state.owner.data, moonMessages });
}
async function moonDelete(id) {
  await persist({ ...state.owner.data, moonMessages: state.owner.data.moonMessages.filter(m => m.id !== id) });
}

// ── PIN logic ─────────────────────────────────────────────────────────────
async function unlock() {
  state.pinOk = true;
  render();
  await signInOwner(); // required by Firestore rules before any save
  const d = await loadData();
  if (d) {
    state.owner.data = normalizeData(d);
    state.owner.cityForm = { fromCity: state.owner.data.fromCity, toCity: state.owner.data.toCity };
    state.bouquetForm.note = state.owner.data.bouquet.note;
    state.mixtapeForm.label = state.owner.data.mixtape.label;
    state.mixtapeForm.note = state.owner.data.mixtape.note;
    state.recipientPinForm.pin = state.owner.data.recipientPin;
    applyTheme(state.owner.data.theme);
    render();
  }
}
function pinError() {
  state.pin.error = true;
  state.pin.shaking = true;
  render();
  setTimeout(() => {
    state.pin.shaking = false;
    state.pin.digits = ['', '', '', ''];
    state.pin.error = false;
    state.pinFocusIndex = 0;
    render();
  }, 650);
}
function handlePinDigitInput(target) {
  const i = Number(target.dataset.index);
  const v = target.value.replace(/\D/g, '').slice(-1);
  target.value = v;
  state.pin.digits[i] = v;
  target.style.borderColor = v ? 'var(--accent)' : 'rgba(178,200,237,0.2)';
  target.style.boxShadow = v ? '0 0 14px rgba(var(--accent-rgb),0.3)' : 'none';
  if (v && i < 3) {
    const next = target.parentElement.querySelector(`[data-index="${i + 1}"]`);
    if (next) next.focus();
  }
  if (i === 3 && v) {
    const pin = state.pin.digits.join('');
    if (pin === OWNER_PIN) unlock();
    else pinError();
  }
}
function recipientUnlock() {
  state.recipient.pinOk = true;
  state.recipient.tab = firstVisibleRecipientTab(state.recipient.data);
  render();
}
function recipientPinError() {
  state.recipient.pin.error = true;
  state.recipient.pin.shaking = true;
  render();
  setTimeout(() => {
    state.recipient.pin.shaking = false;
    state.recipient.pin.digits = ['', '', '', ''];
    state.recipient.pin.error = false;
    state.recipient.pinFocusIndex = 0;
    render();
  }, 650);
}
function handleRecipientPinDigitInput(target) {
  const i = Number(target.dataset.index);
  const v = target.value.replace(/\D/g, '').slice(-1);
  target.value = v;
  state.recipient.pin.digits[i] = v;
  target.style.borderColor = v ? 'var(--accent)' : 'rgba(178,200,237,0.2)';
  target.style.boxShadow = v ? '0 0 14px rgba(var(--accent-rgb),0.3)' : 'none';
  if (v && i < 3) {
    const next = target.parentElement.querySelector(`[data-index="${i + 1}"]`);
    if (next) next.focus();
  }
  if (i === 3 && v) {
    const pin = state.recipient.pin.digits.join('');
    if (pin === (state.recipient.data.recipientPin || '')) recipientUnlock();
    else recipientPinError();
  }
}

// ── Event delegation ─────────────────────────────────────────────────────
function handleClick(e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  switch (action) {
    case 'stop': break;
    case 'pin-submit': {
      const pin = state.pin.digits.join('');
      if (pin.length === 4 && pin === OWNER_PIN) unlock(); else pinError();
      break;
    }
    case 'recipient-pin-submit': {
      const pin = state.recipient.pin.digits.join('');
      if (pin.length === 4 && pin === (state.recipient.data.recipientPin || '')) recipientUnlock(); else recipientPinError();
      break;
    }
    case 'owner-tab': state.owner.tab = el.dataset.tab; render(); break;
    case 'lock-app': state.pinOk = false; render(); break;
    case 'publish': publish(); break;
    case 'copy-link': copyLink(); break;
    case 'new-letter': openEditor(null); break;
    case 'edit-letter': {
      const letter = state.owner.data.letters.find(l => l.id === el.dataset.id);
      if (letter) openEditor(letter);
      break;
    }
    case 'delete-letter':
      if (window.confirm('Delete this letter?')) deleteLetter(el.dataset.id);
      break;
    case 'open-letter': state.openLetterId = el.dataset.id; render(); break;
    case 'close-letter-modal': state.openLetterId = null; render(); break;
    case 'add-photo': addPhoto(); break;
    case 'delete-photo':
      if (window.confirm('Remove photo?')) deletePhoto(el.dataset.id);
      break;
    case 'open-lightbox': state.lightbox = { idx: Number(el.dataset.idx) }; render(); break;
    case 'close-lightbox': state.lightbox = null; render(); break;
    case 'lightbox-prev': moveLightbox(-1); break;
    case 'lightbox-next': moveLightbox(1); break;
    case 'update-cities': updateCities(); break;
    case 'save-recipient-pin': saveRecipientPin(); break;
    case 'pick-theme': pickTheme(el.dataset.theme); break;
    case 'moon-toggle-picker':
      state.moonEditor.openPicker = state.moonEditor.openPicker === el.dataset.picker ? null : el.dataset.picker;
      render();
      break;
    case 'pick-moon-day': pickMoonDay(Number(el.dataset.day)); break;
    case 'pick-sky-effect': pickSkyEffect(Number(el.dataset.effect)); break;
    case 'pick-sky-color': pickSkyColor(Number(el.dataset.color)); break;
    case 'editor-cancel': cancelEditor(); break;
    case 'editor-save': saveLetterFromEditor(); break;
    case 'editor-delete': {
      if (!window.confirm('Delete this letter? This cannot be undone.')) break;
      const id = state.editor.draft.id;
      state.editingLetter = undefined;
      state.editor.draft = null;
      deleteLetter(id);
      break;
    }
    case 'editor-step': state.editor.step = Number(el.dataset.step); render(); break;
    case 'editor-back':
      if (state.editor.step > 1) { state.editor.step--; render(); }
      else cancelEditor();
      break;
    case 'editor-next': state.editor.step++; render(); break;
    case 'editor-pick-label': state.editor.draft.label = el.dataset.label; render(); break;
    case 'editor-pick-color': state.editor.draft.envelopeColor = el.dataset.color; render(); break;
    case 'editor-toggle-sticker': {
      const s = el.dataset.sticker;
      const stickers = state.editor.draft.stickers;
      state.editor.draft.stickers = stickers.includes(s) ? stickers.filter(x => x !== s) : [...stickers, s];
      render();
      break;
    }
    case 'moon-add-dino': addMoonLine('dino'); break;
    case 'moon-add-moon': addMoonLine('moon'); break;
    case 'moon-suggest': state.moonEditor.moonDraft = getMoonReply(); render(); break;
    case 'moon-edit-start': moonEditStart(el.dataset.id); break;
    case 'moon-edit-save': moonEditSave(); break;
    case 'moon-edit-cancel': state.moonEditor.editingId = null; render(); break;
    case 'moon-delete':
      if (window.confirm('Delete this line?')) moonDelete(el.dataset.id);
      break;
    case 'moon-close':
    case 'bouquet-close':
    case 'mixtape-close':
    case 'memorymap-close':
    case 'voicenotes-close':
      if (state.isRecipient && state.recipient.data) state.recipient.tab = 'collection';
      else state.owner.tab = 'home';
      render();
      break;
    case 'collection-close':
      if (state.isRecipient && state.recipient.data) state.recipient.tab = firstVisibleRecipientTab(state.recipient.data);
      else state.owner.tab = 'home';
      render();
      break;
    case 'collection-delete-entry':
      if (window.confirm('Delete this from the Collection? This removes it everywhere, not just here.')) {
        deleteCollectionEntry(el.dataset.kind, el.dataset.id);
      }
      break;
    case 'recipient-next': {
      const d = state.recipient.data;
      state.recipient.tab = stepRecipientTab(d, state.recipient.tab, 1) || 'collection';
      render();
      break;
    }
    case 'recipient-prev': {
      const d = state.recipient.data;
      state.recipient.tab = stepRecipientTab(d, state.recipient.tab, -1) || firstVisibleRecipientTab(d);
      render();
      break;
    }
    case 'bouquet-add-flower': addBouquetFlower(el.dataset.flower); break;
    case 'bouquet-apply-template': applyBouquetTemplate(el.dataset.template); break;
    case 'bouquet-remove-flower': removeBouquetFlower(Number(el.dataset.index)); break;
    case 'bouquet-pick-wrapping': pickBouquetWrapping(el.dataset.wrap); break;
    case 'bouquet-pick-bg-preset': pickBouquetBgPreset(el.dataset.bg); break;
    case 'bouquet-set-bg-custom': setBouquetBgCustom(); break;
    case 'bouquet-save-note': saveBouquetNote(); break;
    case 'mixtape-step': state.mixtapeStep = Number(el.dataset.step); render(); break;
    case 'mixtape-back':
      if (state.mixtapeStep > 1) { state.mixtapeStep--; render(); break; }
      if (state.isRecipient && state.recipient.data) state.recipient.tab = firstVisibleRecipientTab(state.recipient.data);
      else state.owner.tab = 'home';
      render();
      break;
    case 'mixtape-next': state.mixtapeStep = Math.min(MIXTAPE_STEPS.length, state.mixtapeStep + 1); render(); break;
    case 'mixtape-pick-color': pickMixtapeColor(el.dataset.color); break;
    case 'mixtape-save-label': saveMixtapeLabel(); break;
    case 'mixtape-remove-song':
      if (window.confirm('Remove this song?')) removeMixtapeSong(Number(el.dataset.index));
      break;
    case 'mixtape-save-note': saveMixtapeNote(); break;
    case 'memorymap-place': {
      const rect = el.getBoundingClientRect();
      const xPct = Math.max(3, Math.min(97, ((e.clientX - rect.left) / rect.width) * 100));
      const yPct = Math.max(3, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));
      state.memoryMapDraft = { x: Number(xPct.toFixed(1)), y: Number(yPct.toFixed(1)), title: '', date: todayLabel(), note: '', photoUrl: '', voiceUrl: '' };
      render();
      break;
    }
    case 'memorymap-cancel-pin': state.memoryMapDraft = null; render(); break;
    case 'memorymap-save-pin': addMemoryPin(); break;
    case 'memorymap-view-pin': state.memoryMapViewingId = el.dataset.id; render(); break;
    case 'memorymap-close-detail': state.memoryMapViewingId = null; render(); break;
    case 'memorymap-delete-pin':
      if (window.confirm('Delete this memory?')) deleteMemoryPin(el.dataset.id);
      break;
    case 'voicenote-remove-photo':
      state.voiceNoteDraft.photos.splice(Number(el.dataset.idx), 1);
      render();
      break;
    case 'voicenote-save': saveVoiceNote(); break;
    case 'voicenote-open': {
      const list = ((state.isRecipient && state.recipient.data) ? state.recipient.data : state.owner.data).voiceNotes;
      const note = list.find(n => n.id === el.dataset.id);
      state.voiceNoteViewingId = el.dataset.id;
      state.voiceNotePlayer = { playing: false, photoIndex: 0 };
      const audio = getVoiceNoteAudio();
      audio.pause();
      audio.src = note ? note.audioUrl : '';
      render();
      break;
    }
    case 'voicenote-close-detail':
      stopVoiceNoteSlideshow();
      getVoiceNoteAudio().pause();
      state.voiceNoteViewingId = null;
      state.voiceNotePlayer.playing = false;
      render();
      break;
    case 'voicenote-toggle-play': {
      const audio = getVoiceNoteAudio();
      if (state.voiceNotePlayer.playing) { audio.pause(); state.voiceNotePlayer.playing = false; }
      else { audio.play().catch(() => {}); state.voiceNotePlayer.playing = true; }
      render();
      break;
    }
    case 'voicenote-seek': {
      const audio = getVoiceNoteAudio();
      const bars = root.querySelectorAll('.wave-bar');
      const idx = Number(el.dataset.idx);
      if (audio.duration && bars.length > 1) audio.currentTime = (idx / (bars.length - 1)) * audio.duration;
      break;
    }
    case 'voicenote-delete':
      if (window.confirm('Delete this voice note?')) deleteVoiceNote(el.dataset.id);
      break;
    case 'recipient-retry': window.location.reload(); break;
  }
}

function handleInput(e) {
  const t = e.target;
  if (t.dataset.role === 'pin-digit') { handlePinDigitInput(t); return; }
  if (t.dataset.role === 'recipient-pin-digit') { handleRecipientPinDigitInput(t); return; }
  const scope = t.dataset.scope, field = t.dataset.field;
  if (!scope || !field) return;
  const target = scope === 'editor' ? state.editor.draft
    : scope === 'newPhoto' ? state.newPhoto
    : scope === 'cityForm' ? state.owner.cityForm
    : scope === 'moonEditor' ? state.moonEditor
    : scope === 'bouquetForm' ? state.bouquetForm
    : scope === 'mixtapeForm' ? state.mixtapeForm
    : scope === 'memoryMapDraft' ? state.memoryMapDraft
    : scope === 'recipientPinForm' ? state.recipientPinForm
    : scope === 'voiceNoteDraft' ? state.voiceNoteDraft
    : null;
  if (target) target[field] = t.value;
  // keep the add buttons' disabled state in sync without a full re-render
  if (scope === 'moonEditor' && field === 'dinoDraft') {
    const btn = root.querySelector('[data-action="moon-add-dino"]');
    if (btn) btn.disabled = !t.value.trim();
  }
  if (scope === 'moonEditor' && field === 'moonDraft') {
    const btn = root.querySelector('[data-action="moon-add-moon"]');
    if (btn) btn.disabled = !t.value.trim();
  }
  if (scope === 'newPhoto' && field === 'url') {
    const btn = root.querySelector('[data-action="add-photo"]');
    if (btn) btn.disabled = !t.value.trim();
  }
}

function handleChange(e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  if (action === 'editor-toggle-flag') {
    state.editor.draft[el.dataset.field] = el.checked;
    render();
  } else if (action === 'toggle-hidden-tab') {
    const t = el.dataset.tab;
    persist({ ...state.owner.data, hiddenTabs: { ...state.owner.data.hiddenTabs, [t]: !el.checked } });
  } else if (action === 'editor-file') {
    const file = el.files && el.files[0];
    if (!file) return;
    const field = el.dataset.field;
    const flag = field === 'photoUrl' ? 'hasPhoto' : 'hasVideo';
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        state.editor.draft[field] = reader.result;
        state.editor.draft[flag] = true;
        render();
      }
    };
    reader.readAsDataURL(file);
  } else if (action === 'editor-music-file') {
    const file = el.files && el.files[0];
    if (!file) return;
    state.editor.musicUploading = true;
    render();
    uploadMusicFile(file)
      .then(url => {
        if (!state.editor.draft) return; // editor was closed mid-upload
        state.editor.draft.musicUrl = url;
        if (!state.editor.draft.musicTitle) state.editor.draft.musicTitle = file.name.replace(/\.[^.]+$/, '');
      })
      .catch(err => {
        console.error('❌ Music upload error:', err);
        window.alert('Music upload failed: ' + (err && err.message ? err.message : 'check that Firebase Storage is enabled and its rules allow writes.'));
      })
      .finally(() => {
        state.editor.musicUploading = false;
        render();
      });
  } else if (action === 'mixtape-song-file') {
    const file = el.files && el.files[0];
    if (!file) return;
    state.mixtapeUploading = true;
    render();
    uploadMixtapeSong(file)
      .then(url => {
        const song = {
          id: `song-${Date.now()}`,
          title: (state.mixtapeForm.songTitle || '').trim() || file.name.replace(/\.[^.]+$/, ''),
          artist: (state.mixtapeForm.songArtist || '').trim(),
          url,
          addedAt: new Date().toISOString(),
        };
        state.mixtapeForm.songTitle = '';
        state.mixtapeForm.songArtist = '';
        const mt = state.owner.data.mixtape;
        return persist({ ...state.owner.data, mixtape: { ...mt, songs: [...mt.songs, song], updatedAt: new Date().toISOString() } });
      })
      .catch(err => {
        console.error('❌ Mixtape song upload error:', err);
        window.alert('Song upload failed: ' + (err && err.message ? err.message : 'check that Firebase Storage is enabled and its rules allow writes.'));
      })
      .finally(() => {
        state.mixtapeUploading = false;
        render();
      });
  } else if (action === 'gallery-photo-file') {
    const file = el.files && el.files[0];
    if (!file) return;
    state.galleryUploading = true;
    render();
    uploadGalleryPhoto(file)
      .then(url => { state.newPhoto.url = url; })
      .catch(err => {
        console.error('❌ Gallery photo upload error:', err);
        window.alert('Photo upload failed: ' + (err && err.message ? err.message : 'check that Firebase Storage is enabled and its rules allow writes.'));
      })
      .finally(() => {
        state.galleryUploading = false;
        render();
      });
  } else if (action === 'memorymap-photo-file') {
    const file = el.files && el.files[0];
    if (!file || !state.memoryMapDraft) return;
    state.memoryMapUploading = true;
    render();
    uploadMemoryFile(file, 'photo')
      .then(url => {
        if (!state.memoryMapDraft) return; // form was closed mid-upload
        state.memoryMapDraft.photoUrl = url;
      })
      .catch(err => {
        console.error('❌ Memory photo upload error:', err);
        window.alert('Photo upload failed: ' + (err && err.message ? err.message : 'check that Firebase Storage is enabled and its rules allow writes.'));
      })
      .finally(() => {
        state.memoryMapUploading = false;
        render();
      });
  } else if (action === 'memorymap-voice-file') {
    const file = el.files && el.files[0];
    if (!file || !state.memoryMapDraft) return;
    state.memoryMapUploading = true;
    render();
    uploadMemoryFile(file, 'voice')
      .then(url => {
        if (!state.memoryMapDraft) return;
        state.memoryMapDraft.voiceUrl = url;
      })
      .catch(err => {
        console.error('❌ Memory voice upload error:', err);
        window.alert('Voice note upload failed: ' + (err && err.message ? err.message : 'check that Firebase Storage is enabled and its rules allow writes.'));
      })
      .finally(() => {
        state.memoryMapUploading = false;
        render();
      });
  } else if (action === 'voicenote-photo-file') {
    const files = el.files ? Array.from(el.files) : [];
    if (!files.length) return;
    state.voiceNotePhotoUploading = true;
    render();
    (async () => {
      for (const file of files) {
        try {
          const url = await uploadVoiceNotePhoto(file);
          state.voiceNoteDraft.photos.push(url);
        } catch (err) {
          console.error('❌ Voice note photo upload error:', err);
          window.alert('Photo upload failed: ' + (err && err.message ? err.message : 'please try again.'));
        }
      }
      state.voiceNotePhotoUploading = false;
      render();
    })();
  } else if (action === 'voicenote-audio-file') {
    const file = el.files && el.files[0];
    if (!file) return;
    state.voiceNoteAudioUploading = true;
    render();
    uploadVoiceNoteAudio(file)
      .then(url => { state.voiceNoteDraft.audioUrl = url; })
      .catch(err => {
        console.error('❌ Voice note audio upload error:', err);
        window.alert('Voice note upload failed: ' + (err && err.message ? err.message : 'please try again.'));
      })
      .finally(() => {
        state.voiceNoteAudioUploading = false;
        render();
      });
  }
}

function handleKeydown(e) {
  const pinEl = e.target.closest('[data-role="pin-digit"]');
  if (pinEl && e.key === 'Backspace' && !pinEl.value) {
    const i = Number(pinEl.dataset.index);
    if (i > 0) {
      const prev = pinEl.parentElement.querySelector(`[data-index="${i - 1}"]`);
      if (prev) prev.focus();
    }
    return;
  }
  const recipientPinEl = e.target.closest('[data-role="recipient-pin-digit"]');
  if (recipientPinEl && e.key === 'Backspace' && !recipientPinEl.value) {
    const i = Number(recipientPinEl.dataset.index);
    if (i > 0) {
      const prev = recipientPinEl.parentElement.querySelector(`[data-index="${i - 1}"]`);
      if (prev) prev.focus();
    }
    return;
  }
  if (e.target.dataset.role === 'moon-dino-input' && e.key === 'Enter') {
    e.preventDefault();
    addMoonLine('dino');
  }
  if (e.target.dataset.role === 'moon-moon-input' && e.key === 'Enter') {
    e.preventDefault();
    addMoonLine('moon');
  }
}

root.addEventListener('click', handleClick);
root.addEventListener('input', handleInput);
root.addEventListener('change', handleChange);
root.addEventListener('keydown', handleKeydown);

// ── Bootstrap ─────────────────────────────────────────────────────────────
function getGiftParam() {
  return new URLSearchParams(window.location.search).get('gift');
}

async function init() {
  const gift = getGiftParam();
  if (gift) {
    state.isRecipient = true;
    state.giftParam = gift;
    state.recipient.loading = true;
    render();
    const d = await loadData();
    if (d) {
      state.recipient.data = normalizeData(d);
      state.recipient.tab = firstVisibleRecipientTab(state.recipient.data);
      applyTheme(state.recipient.data.theme);
      state.recipient.pinFocusIndex = 0;
    } else state.recipient.error = true;
    state.recipient.loading = false;
    render();
    if (state.recipient.data) requestLiveLocation();
  } else {
    state.pinFocusIndex = 0;
    render();
  }
}

init();

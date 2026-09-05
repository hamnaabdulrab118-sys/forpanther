// ═══════════════════════════════════════════════════════════════════════
// FOR PANTHER — Between Two Skies (vanilla HTML/CSS/JS build)
// Same Firebase/Firestore backend and sharing rule as the React version:
//   Owner saves → Firestore doc "forpanther/main"
//   Share URL   → yoursite.com/?gift=main
//   Panther opens URL → app reads "main" from Firestore → shows letters
// ═══════════════════════════════════════════════════════════════════════
import { loadData, saveData, signInOwner, uploadMusicFile } from './db.js';

// ── Constants ────────────────────────────────────────────────────────────
const OWNER_PIN = '5425';
const OWNER_COORDS = { lat: 32.4945, lng: 74.5229 }; // Sialkot, Pakistan

const DEFAULT_DATA = {
  letters: [], gallery: [],
  fromCity: 'Sialkot', toCity: 'Ormara',
  distanceKm: 730, distanceMiles: 454,
  isPublished: false,
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
const nowTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const OWNER_TABS = [
  { id: 'home', icon: '🏠', label: 'Home' },
  { id: 'letters', icon: '✉️', label: 'Letters' },
  { id: 'gallery', icon: '🖼️', label: 'Gallery' },
  { id: 'moon', icon: '🌙', label: 'Moon' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];

const PAGE_STYLE = "min-height:100vh;background:linear-gradient(180deg,#000005 0%,#000814 30%,#000d20 70%,#001a3d 100%);position:relative;";
const INNER_STYLE = "position:relative;z-index:10;max-width:680px;margin:0 auto;padding:0 16px 100px;";
const OWNER_INPUT_STYLE = "width:100%;background:rgba(0,13,32,0.75);border:1px solid rgba(178,200,237,0.14);border-radius:14px;padding:12px 16px;color:#eef4ff;font-size:14px;outline:none;font-family:inherit;";
const EDITOR_INPUT_STYLE = "width:100%;background:rgba(0,13,32,0.7);border:1px solid rgba(178,200,237,0.15);border-radius:14px;padding:12px 16px;color:#eef4ff;font-size:14px;outline:none;font-family:inherit;transition:border-color 0.2s;";

// ── Helpers ─────────────────────────────────────────────────────────────
function esc(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
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
  return { ...DEFAULT_DATA, ...d, letters: d.letters || [], gallery: d.gallery || [] };
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

function shareUrl() {
  return `${window.location.origin}${window.location.pathname}?gift=main`;
}
function emptyStateHTML(msg, emoji) {
  return `<div style="text-align:center;padding:80px 0;"><div style="font-size:56px;margin-bottom:16px;">${emoji}</div><p class="font-mono" style="color:rgba(178,200,237,0.35);font-size:14px;">${esc(msg)}</p></div>`;
}

// ── Stars background (stable across renders) ───────────────────────────
const rnd = Math.random;
const GLOBAL_STARS = Array.from({ length: 150 }, (_, i) => ({
  id: i, x: rnd() * 100, y: rnd() * 100, size: rnd() * 2.4 + 0.3,
  dur: rnd() * 3 + 2, delay: rnd() * 5, opacity: rnd() * 0.6 + 0.2,
}));
const GLOBAL_SHOOTING = Array.from({ length: 5 }, (_, i) => ({
  id: i, x: rnd() * 50 + 5, y: rnd() * 30 + 2, delay: i * 5 + rnd() * 4,
}));
function starsHTML() {
  return `<div class="stars-bg">` +
    GLOBAL_STARS.map(s => `<div class="star-dot" style="left:${s.x}%;top:${s.y}%;width:${s.size}px;height:${s.size}px;opacity:${s.opacity};animation:twinkle ${s.dur}s ease-in-out ${s.delay}s infinite;"></div>`).join('') +
    GLOBAL_SHOOTING.map(s => `<div class="shooting-star" style="left:${s.x}%;top:${s.y}%;animation:shooting 2.5s ease-out ${s.delay}s infinite;"><div></div></div>`).join('') +
    `</div>`;
}

const MOON_STARS = Array.from({ length: 120 }, (_, i) => ({
  id: i, x: rnd() * 100, y: rnd() * 75, s: rnd() * 2 + 0.3,
  d: rnd() * 3 + 2, dl: rnd() * 5, op: rnd() * 0.6 + 0.2,
}));
function moonStarsHTML() {
  let html = MOON_STARS.map(s => `<div style="position:absolute;left:${s.x}%;top:${s.y}%;width:${s.s}px;height:${s.s}px;border-radius:50%;background:white;opacity:${s.op};animation:twinkle ${s.d}s ease-in-out ${s.dl}s infinite;pointer-events:none;"></div>`).join('');
  html += [0, 1, 2].map(i => `<div style="position:absolute;left:${8 + i * 22}%;top:${4 + i * 4}%;animation:shooting 2.5s ease-out ${i * 8 + 3}s infinite;pointer-events:none;"><div style="width:1px;height:72px;background:linear-gradient(to bottom,white,transparent);transform:rotate(35deg);opacity:0.7;"></div></div>`).join('');
  return html;
}

// ── State ────────────────────────────────────────────────────────────────
const state = {
  isRecipient: false,
  giftParam: null,
  recipient: { loading: false, error: false, data: null, tab: 'letters', live: { status: 'idle' } },
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
  moon: {
    input: '', typing: false,
    messages: [{ id: '0', from: 'moon', text: "Hello, little Dino 🦖 I've been watching over your Panther tonight. What's on your heart? 🌙", time: nowTime() }],
  },
};

const root = document.getElementById('root');

// ── View resolution ──────────────────────────────────────────────────────
function computeView() {
  if (state.isRecipient && state.recipient.loading) return 'recipient-loading';
  if (state.isRecipient && state.recipient.error) return 'recipient-error';
  if (state.isRecipient && state.recipient.data) {
    return state.recipient.tab === 'moon' ? 'moon' : 'recipient';
  }
  if (!state.pinOk) return 'pin';
  if (state.owner.tab === 'moon') return 'moon';
  if (state.editingLetter !== undefined) return 'editor';
  return 'owner';
}

function render() {
  const view = computeView();
  let html = '';
  switch (view) {
    case 'recipient-loading': html = recipientLoadingHTML(); break;
    case 'recipient-error': html = recipientErrorHTML(); break;
    case 'recipient': html = recipientViewHTML(); break;
    case 'pin': html = pinScreenHTML(); break;
    case 'moon': html = moonChatHTML(); break;
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
  if (view === 'moon') {
    const box = root.querySelector('#moon-messages');
    if (box) box.scrollTop = box.scrollHeight;
  }
  const musicEl = root.querySelector('#letter-music-player');
  if (musicEl) musicEl.play().catch(() => {}); // autoplay can be blocked; controls stay visible either way
}

// ── PIN screen ───────────────────────────────────────────────────────────
function pinScreenHTML() {
  const { digits, error, shaking } = state.pin;
  return `
  <div style="min-height:100vh;background:linear-gradient(180deg,#000005 0%,#000814 40%,#000d20 100%);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;">
    ${starsHTML()}
    <div style="position:relative;z-index:10;width:100%;max-width:380px;padding:0 24px;display:flex;flex-direction:column;align-items:center;gap:32px;">
      <div style="text-align:center;animation:slideUp 0.5s ease-out forwards;">
        <div style="font-size:72px;margin-bottom:12px;display:inline-block;animation:float 6s ease-in-out infinite;">🦖🐾</div>
        <h1 class="font-serif gold-glow" style="font-size:42px;font-weight:700;color:#ffddb0;margin-bottom:6px;">For Panther</h1>
        <p class="font-serif" style="color:#b2c8ed;font-size:14px;font-style:italic;">From your Dino, with love ✈️</p>
        <div class="glass-gold font-mono" style="margin-top:14px;display:inline-flex;align-items:center;gap:8px;padding:8px 18px;border-radius:999px;font-size:12px;color:#b2c8ed;">
          <span style="color:#e9c349;">📍</span> Sialkot
          <span style="color:#e9c349;">✈️</span> Ormara
          <span style="color:#e9c349;font-weight:700;">· 730 km</span>
        </div>
      </div>

      <div class="glass-gold" style="width:100%;border-radius:28px;padding:36px;box-shadow:0 24px 60px rgba(0,0,0,0.5);animation:slideUp 0.5s 0.1s ease-out forwards;opacity:0;">
        <div style="text-align:center;margin-bottom:28px;">
          <div style="font-size:32px;margin-bottom:8px;">🔐</div>
          <p class="font-mono" style="font-size:11px;color:#e9c349;letter-spacing:0.2em;text-transform:uppercase;">Enter Access Code</p>
        </div>

        <div class="${shaking ? 'do-shake' : ''}" style="display:flex;justify-content:center;gap:14px;margin-bottom:16px;">
          ${[0, 1, 2, 3].map(i => {
            const d = digits[i];
            const borderColor = error ? '#f87171' : d ? '#e9c349' : 'rgba(178,200,237,0.2)';
            const boxShadow = d ? '0 0 14px rgba(233,195,73,0.3)' : 'none';
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
    <div class="glass-gold" style="position:relative;z-index:10;border-radius:28px;padding:48px 40px;max-width:360px;width:100%;margin:0 16px;text-align:center;">
      <div style="font-size:56px;margin-bottom:16px;animation:float 3s ease-in-out infinite;">🦖💌🐾</div>
      <h2 class="font-serif" style="font-size:24px;font-weight:700;color:#ffddb0;margin-bottom:10px;">Opening your letter...</h2>
      <p class="font-mono" style="font-size:13px;color:#b2c8ed;margin-bottom:24px;">Loading across the miles from Sialkot to Ormara</p>
      <div style="display:flex;justify-content:center;gap:8px;">
        ${[0, 1, 2].map(i => `<div style="width:10px;height:10px;border-radius:50%;background:#e9c349;animation:bounceDot 1s ease-in-out ${i * 0.15}s infinite;"></div>`).join('')}
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
  const tabs = [
    { id: 'letters', label: `Letters (${d.letters.filter(l => l.isPublished).length})`, emoji: '💌' },
    { id: 'gallery', label: `Gallery (${d.gallery.length})`, emoji: '📷' },
    { id: 'moon', label: 'Talk to Moon', emoji: '🌙' },
  ];
  return `
  <div style="${PAGE_STYLE}">
    ${starsHTML()}
    <div style="${INNER_STYLE}">
      <div style="padding-top:48px;padding-bottom:32px;text-align:center;animation:slideUp 0.5s ease-out;">
        <div style="font-size:64px;margin-bottom:14px;display:inline-block;animation:float 6s ease-in-out infinite;">🦖🐾</div>
        <h1 class="font-serif gold-glow" style="font-size:44px;font-weight:700;color:#ffddb0;margin-bottom:8px;">For Panther</h1>
        <p class="font-serif" style="color:#b2c8ed;font-size:15px;font-style:italic;margin-bottom:20px;">From your Dino, written under the same sky ✈️</p>
        <div class="glass-gold font-mono" style="display:inline-flex;align-items:center;gap:8px;padding:10px 22px;border-radius:999px;font-size:13px;color:#b2c8ed;">
          <span style="color:#e9c349;">📍</span>${esc(d.fromCity)}
          <span style="color:#e9c349;">✈️</span>${esc(toLabel)}
          <span style="color:rgba(178,200,237,0.35);">·</span>
          <span style="color:#e9c349;font-weight:700;">${kmLabel} km</span>
          <span style="color:rgba(178,200,237,0.35);">·</span>
          <span style="font-style:italic;opacity:0.6;">same sky 🌙</span>
        </div>
        ${isLive ? `<p class="font-mono" style="margin-top:8px;font-size:10px;color:rgba(74,222,128,0.7);">📡 live distance from your current location</p>` : ''}
      </div>

      <div class="glass-gold" style="border-radius:20px;padding:6px;display:flex;gap:6px;margin-bottom:24px;">
        ${tabs.map(t => `
          <button data-action="recipient-tab" data-tab="${t.id}" class="font-mono"
            style="flex:1;padding:11px 8px;border-radius:14px;border:none;cursor:pointer;font-size:12px;font-weight:700;
            background:${tab === t.id ? '#e9c349' : 'transparent'};color:${tab === t.id ? '#000d20' : 'rgba(178,200,237,0.5)'};transition:all 0.2s;">
            ${t.emoji} ${esc(t.label)}
          </button>`).join('')}
      </div>

      ${tab === 'letters' ? envelopeGridHTML(d.letters, false) : ''}
      ${tab === 'gallery' ? galleryGridHTML(d.gallery, false) : ''}
    </div>
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
        <button data-action="edit-letter" data-id="${esc(letter.id)}" style="width:28px;height:28px;border-radius:50%;background:#e9c349;border:none;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;color:#000d20;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.4);">✎</button>
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
            <img src="${esc(letter.photoUrl)}" alt="" style="width:100%;aspect-ratio:1/1;object-fit:cover;display:block;" />
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
        <img src="${esc(p.url)}" alt="${esc(p.caption)}" />
        <div class="gallery-caption">
          <div style="position:absolute;bottom:0;left:0;right:0;padding:12px;">
            <p class="font-serif" style="color:white;font-size:12px;font-style:italic;margin-bottom:2px;">"${esc(p.caption)}"</p>
            <p class="font-mono" style="color:#e9c349;font-size:10px;">📍 ${esc(p.location)}</p>
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
      <img src="${esc(p.url)}" alt="" style="width:100%;border-radius:24px;box-shadow:0 32px 80px rgba(0,0,0,0.8);display:block;" />
      <div style="margin-top:16px;text-align:center;">
        <p class="font-serif" style="color:white;font-size:16px;font-style:italic;">"${esc(p.caption)}"</p>
        <p class="font-mono" style="color:#e9c349;font-size:12px;margin-top:6px;">📍 ${esc(p.location)} · ${esc(p.date)}</p>
      </div>
      <button data-action="close-lightbox" style="position:absolute;top:12px;right:12px;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.1);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:white;">✕</button>
      ${photos.length > 1 ? `
        <button data-action="lightbox-prev" style="position:absolute;left:12px;top:40%;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.1);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:white;font-size:20px;">‹</button>
        <button data-action="lightbox-next" style="position:absolute;right:12px;top:40%;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.1);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:white;font-size:20px;">›</button>` : ''}
    </div>
  </div>`;
}

// ── Moon chat ─────────────────────────────────────────────────────────────
function moonChatHTML() {
  const { messages, typing, input } = state.moon;
  return `
  <div style="min-height:100vh;display:flex;flex-direction:column;position:relative;overflow:hidden;background:linear-gradient(180deg,#000005 0%,#000814 50%,#000d20 100%);">
    ${moonStarsHTML()}
    <div style="position:absolute;top:20px;right:20px;pointer-events:none;animation:pulseGlow 2.5s ease-in-out infinite;">
      <div style="width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle,#fef9c3,#fde68a,#fbbf24);box-shadow:0 0 40px rgba(251,191,36,0.55);">
        <span style="font-size:36px;">🌙</span>
      </div>
    </div>

    <div class="glass" style="position:relative;z-index:10;display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.08);">
      <div>
        <h2 class="font-serif" style="font-size:22px;font-weight:700;color:#ffddb0;">Talk to the Moon</h2>
        <p class="font-mono" style="font-size:11px;color:rgba(178,200,237,0.45);margin-top:2px;">Whisper across the miles ✈️</p>
      </div>
      <button data-action="moon-close" style="width:36px;height:36px;border-radius:50%;background:rgba(178,200,237,0.08);border:1px solid rgba(178,200,237,0.12);cursor:pointer;display:flex;align-items:center;justify-content:center;color:#b2c8ed;">✕</button>
    </div>

    <div id="moon-messages" style="flex:1;overflow-y:auto;padding:20px 16px;display:flex;flex-direction:column;gap:16px;position:relative;z-index:10;">
      ${messages.map(m => `
        <div style="display:flex;justify-content:${m.from === 'dino' ? 'flex-end' : 'flex-start'};animation:fadeIn 0.3s ease-out;">
          ${m.from === 'moon' ? `<div style="width:34px;height:34px;border-radius:50%;background:rgba(251,191,36,0.15);border:1px solid rgba(251,191,36,0.3);display:flex;align-items:center;justify-content:center;margin-right:10px;flex-shrink:0;margin-top:4px;font-size:16px;">🌙</div>` : ''}
          <div style="max-width:300px;">
            <div class="${m.from === 'dino' ? '' : 'font-serif'}" style="padding:12px 18px;border-radius:22px;font-size:14px;line-height:1.6;
              background:${m.from === 'dino' ? '#e9c349' : 'rgba(3,28,57,0.8)'};color:${m.from === 'dino' ? '#000d20' : '#eef4ff'};font-weight:${m.from === 'dino' ? 500 : 400};
              border-bottom-right-radius:${m.from === 'dino' ? '6px' : '22px'};border-bottom-left-radius:${m.from === 'moon' ? '6px' : '22px'};
              border:${m.from === 'moon' ? '1px solid rgba(251,191,36,0.15)' : 'none'};">
              ${esc(m.text)}
            </div>
            <p class="font-mono" style="font-size:10px;color:rgba(178,200,237,0.3);margin-top:4px;text-align:${m.from === 'dino' ? 'right' : 'left'};">
              ${m.from === 'dino' ? 'Dino 🦖' : 'Moon 🌙'} · ${esc(m.time)}
            </p>
          </div>
          ${m.from === 'dino' ? `<div style="width:34px;height:34px;border-radius:50%;background:rgba(74,222,128,0.12);border:1px solid rgba(74,222,128,0.25);display:flex;align-items:center;justify-content:center;margin-left:10px;flex-shrink:0;margin-top:4px;font-size:16px;">🦖</div>` : ''}
        </div>`).join('')}
      ${typing ? `
        <div style="display:flex;align-items:center;gap:10px;animation:fadeIn 0.3s ease-out;">
          <div style="width:34px;height:34px;border-radius:50%;background:rgba(251,191,36,0.15);border:1px solid rgba(251,191,36,0.3);display:flex;align-items:center;justify-content:center;font-size:16px;">🌙</div>
          <div style="padding:14px 18px;border-radius:22px 22px 22px 6px;background:rgba(3,28,57,0.8);border:1px solid rgba(251,191,36,0.15);display:flex;gap:6px;">
            ${[0, 1, 2].map(i => `<div style="width:7px;height:7px;border-radius:50%;background:#fbbf24;animation:bounceDot 1s ease-in-out ${i * 0.15}s infinite;"></div>`).join('')}
          </div>
        </div>` : ''}
    </div>

    <div class="glass" style="position:relative;z-index:10;padding:14px 16px 24px;border-top:1px solid rgba(255,255,255,0.07);">
      <div style="display:flex;gap:12px;align-items:flex-end;">
        <input type="text" value="${esc(input)}" data-scope="moon" data-field="input" data-role="moon-input" placeholder="Whisper to the moon..." class="font-serif"
          style="flex:1;background:rgba(0,13,32,0.8);border:1px solid rgba(251,191,36,0.18);border-radius:20px;padding:13px 18px;color:#eef4ff;font-size:14px;outline:none;" />
        <button data-action="moon-send" ${!input.trim() ? 'disabled' : ''} class="btn-gold" style="width:50px;height:50px;border-radius:16px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px;">➤</button>
      </div>
      <p class="font-mono" style="text-align:center;font-size:10px;color:rgba(178,200,237,0.22);margin-top:10px;">Your words travel with every shooting star ✨</p>
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
        <p class="font-mono" style="font-size:11px;color:#e9c349;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:12px;">Choose a label:</p>
        <div style="max-height:240px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;">
          ${LABELS.map(lb => `
            <button data-action="editor-pick-label" data-label="${esc(lb)}" class="font-mono" style="text-align:left;padding:11px 16px;border-radius:14px;font-size:13px;cursor:pointer;
              background:${l.label === lb ? 'rgba(233,195,73,0.15)' : 'rgba(178,200,237,0.04)'};
              border:${l.label === lb ? '1px solid rgba(233,195,73,0.6)' : '1px solid transparent'};
              color:${l.label === lb ? '#e9c349' : '#b2c8ed'};transition:all 0.15s;">${esc(lb)}</button>`).join('')}
        </div>
      </div>
      <div>
        <p class="font-mono" style="font-size:11px;color:#e9c349;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:8px;">Or write your own:</p>
        <input type="text" value="${esc(l.label)}" data-scope="editor" data-field="label" placeholder="Open when..." class="font-mono" style="${EDITOR_INPUT_STYLE}" />
      </div>
      <div>
        <p class="font-mono" style="font-size:11px;color:#e9c349;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:12px;">Envelope color:</p>
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
        <p class="font-mono" style="font-size:11px;color:#e9c349;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:8px;">Greeting:</p>
        <input type="text" value="${esc(l.greeting)}" data-scope="editor" data-field="greeting" placeholder="My Dearest Panther," class="font-serif" style="${EDITOR_INPUT_STYLE}" />
      </div>
      <div>
        <p class="font-mono" style="font-size:11px;color:#e9c349;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:8px;">Sign off:</p>
        <input type="text" value="${esc(l.signOff)}" data-scope="editor" data-field="signOff" placeholder="Forever yours, Dino 🖤" class="font-serif" style="${EDITOR_INPUT_STYLE}" />
      </div>
      <div>
        <p class="font-mono" style="font-size:11px;color:#e9c349;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:8px;">Date stamp (auto):</p>
        <p class="font-serif" style="color:#b2c8ed;font-size:14px;padding:12px 16px;">${esc(l.date)}</p>
      </div>
      <div>
        <p class="font-mono" style="font-size:11px;color:#e9c349;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:8px;">Your letter:</p>
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
            ${l.photoUrl ? `<img src="${esc(l.photoUrl)}" alt="" style="width:80px;height:80px;object-fit:cover;border-radius:12px;border:1px solid rgba(125,211,252,0.3);" />` : ''}
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
            background:${l.stickers.includes(s) ? 'rgba(233,195,73,0.2)' : 'rgba(178,200,237,0.06)'};
            outline:${l.stickers.includes(s) ? '2px solid rgba(233,195,73,0.6)' : '2px solid transparent'};
            transform:${l.stickers.includes(s) ? 'scale(1.1)' : 'scale(1)'};transition:all 0.15s;">${s}</button>`).join('')}
      </div>
      ${l.stickers.length > 0 ? `
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(178,200,237,0.1);">
          <p class="font-mono" style="font-size:11px;color:#e9c349;margin-bottom:10px;">Your stickers (${l.stickers.length}):</p>
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
              <img src="${esc(l.photoUrl)}" alt="" style="width:100%;aspect-ratio:1/1;object-fit:cover;display:block;" />
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
  <div style="min-height:100vh;background:linear-gradient(180deg,#000005,#000814,#000d20);position:relative;">
    ${starsHTML()}
    <div style="position:relative;z-index:10;max-width:680px;margin:0 auto;padding:24px 16px 100px;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;">
        <div>
          <p class="font-mono" style="font-size:11px;color:#e9c349;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:4px;">Step ${step}/${EDITOR_STEPS.length} — ${EDITOR_STEPS[step - 1]}</p>
          <h2 class="font-serif" style="font-size:26px;font-weight:700;color:white;">${isEditing ? 'Edit Letter' : 'New Letter ✍️'}</h2>
        </div>
        <button data-action="editor-cancel" style="width:36px;height:36px;border-radius:50%;background:rgba(178,200,237,0.08);border:1px solid rgba(178,200,237,0.12);cursor:pointer;display:flex;align-items:center;justify-content:center;color:#b2c8ed;">✕</button>
      </div>

      <div style="display:flex;gap:8px;margin-bottom:28px;overflow-x:auto;padding-bottom:4px;">
        ${EDITOR_STEPS.map((s, i) => `
          <button data-action="editor-step" data-step="${i + 1}" class="font-mono" style="flex-shrink:0;padding:7px 14px;border-radius:999px;font-size:11px;border:none;cursor:pointer;
            background:${step === i + 1 ? '#e9c349' : step > i + 1 ? 'rgba(233,195,73,0.15)' : 'rgba(178,200,237,0.06)'};
            color:${step === i + 1 ? '#000d20' : step > i + 1 ? '#e9c349' : 'rgba(178,200,237,0.4)'};
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
  const waText = encodeURIComponent(`Panther 🐾✈️\n\nI made something for you — open when you need me 💌\n\n${url}\n\nPIN: ${OWNER_PIN} 🔐`);

  let tabHTML = '';
  if (tab === 'home') {
    tabHTML = `
    <div style="display:flex;flex-direction:column;gap:16px;animation:fadeIn 0.3s ease-out;">
      <div class="glass-gold" style="border-radius:28px;padding:28px;border:1px solid rgba(233,195,73,0.18);">
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
          background:${state.owner.pubOk ? '#4ade80' : state.owner.saving ? 'rgba(233,195,73,0.5)' : '#e9c349'};color:${state.owner.pubOk ? 'white' : '#000d20'};">
          ${state.owner.saving ? 'Saving...' : state.owner.pubOk ? '✓ Published!' : data.isPublished ? '↑ Update Gift' : '🚀 Publish for Panther'}
        </button>
        <div style="display:flex;gap:10px;margin-bottom:12px;">
          <input readonly value="${esc(url)}" class="font-mono" style="${OWNER_INPUT_STYLE}flex:1;padding:10px 14px;font-size:12px;color:#b2c8ed;" />
          <button data-action="copy-link" class="font-mono" style="padding:10px 16px;border-radius:14px;border:none;cursor:pointer;font-size:12px;font-weight:700;
            background:${state.owner.copied ? '#4ade80' : 'rgba(233,195,73,0.12)'};color:${state.owner.copied ? 'white' : '#e9c349'};display:flex;align-items:center;gap:6px;white-space:nowrap;transition:all 0.2s;">
            ${state.owner.copied ? '✓ Copied!' : '⧉ Copy'}
          </button>
        </div>
        <a href="https://api.whatsapp.com/send?text=${waText}" target="_blank" rel="noopener noreferrer" class="font-mono"
          style="display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:12px 0;border-radius:16px;background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.2);color:#4ade80;font-size:13px;font-weight:700;text-decoration:none;">
          📱 Send via WhatsApp ↗
        </a>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
        <button data-action="new-letter" class="glass-gold font-mono" style="border-radius:22px;padding:20px 8px;text-align:center;border:none;cursor:pointer;">
          <div style="font-size:32px;margin-bottom:8px;">✍️</div><p style="font-size:12px;color:#b2c8ed;">Write Letter</p>
        </button>
        <button data-action="owner-tab" data-tab="gallery" class="glass-gold font-mono" style="border-radius:22px;padding:20px 8px;text-align:center;border:none;cursor:pointer;">
          <div style="font-size:32px;margin-bottom:8px;">📷</div><p style="font-size:12px;color:#b2c8ed;">Add Photo</p>
        </button>
        <button data-action="owner-tab" data-tab="moon" class="glass-gold font-mono" style="border-radius:22px;padding:20px 8px;text-align:center;border:none;cursor:pointer;">
          <div style="font-size:32px;margin-bottom:8px;">🌙</div><p style="font-size:12px;color:#b2c8ed;">Moon Chat</p>
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
        <p class="font-mono" style="font-size:11px;color:#e9c349;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:14px;">Add a photo</p>
        <input type="text" value="${esc(state.newPhoto.url)}" data-scope="newPhoto" data-field="url" placeholder="Paste image URL..." class="font-mono" style="${OWNER_INPUT_STYLE}margin-bottom:10px;font-size:13px;" />
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
        <p class="font-mono" style="font-size:11px;color:#e9c349;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:16px;">Distance</p>
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
        <p class="font-mono" style="font-size:11px;color:#e9c349;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:14px;">Share Info</p>
        <p class="font-mono" style="font-size:13px;color:#b2c8ed;margin-bottom:8px;">Owner PIN: <span style="color:#e9c349;font-weight:700;font-size:16px;">${OWNER_PIN}</span></p>
        <p class="font-mono" style="font-size:12px;color:rgba(178,200,237,0.4);margin-bottom:12px;word-break:break-all;">Panther's link: <span style="color:#7dd3fc;">${esc(url)}</span></p>
        <button data-action="copy-link" class="font-mono" style="padding:10px 20px;border-radius:14px;background:rgba(233,195,73,0.1);border:1px solid rgba(233,195,73,0.25);color:#e9c349;cursor:pointer;font-size:13px;font-weight:700;display:flex;align-items:center;gap:6px;">
          ${state.owner.copied ? '✓ Copied!' : '⧉ Copy Link'}
        </button>
      </div>
      <div class="glass-gold" style="border-radius:24px;padding:24px;">
        <button data-action="lock-app" class="font-mono" style="width:100%;padding:12px 0;border-radius:16px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);color:#f87171;cursor:pointer;font-size:13px;font-weight:700;">🔒 Lock App</button>
      </div>
    </div>`;
  }

  return `
  <div style="${PAGE_STYLE}">
    ${starsHTML()}
    <div style="${INNER_STYLE}">
      <div style="padding-top:24px;padding-bottom:20px;display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;">
        <div>
          <p class="font-mono" style="font-size:11px;color:#e9c349;text-transform:uppercase;letter-spacing:0.18em;margin-bottom:4px;">Creator Studio 🦖</p>
          <h1 class="font-serif" style="font-size:26px;font-weight:700;color:white;">For Panther 🐾</h1>
        </div>
        <div class="glass-gold font-mono" style="padding:10px 16px;border-radius:16px;font-size:12px;color:#b2c8ed;text-align:right;">
          <span style="color:#e9c349;">📍</span> ${esc(data.fromCity)} <span style="color:#e9c349;">✈️</span> ${esc(data.toCity)}<br />
          <span style="color:#e9c349;font-weight:700;">${data.distanceKm} km</span> <span style="opacity:0.4;">apart</span>
        </div>
      </div>
      ${tabHTML}
    </div>
    <nav style="position:fixed;bottom:0;left:0;width:100%;z-index:50;background:rgba(0,13,32,0.85);backdrop-filter:blur(16px);border-top:1px solid rgba(233,195,73,0.1);">
      <div style="display:flex;justify-content:space-around;align-items:center;padding:8px 8px 12px;max-width:680px;margin:0 auto;">
        ${OWNER_TABS.map(t => `
          <button data-action="owner-tab" data-tab="${t.id}" class="font-mono" style="display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 16px;border-radius:16px;border:none;cursor:pointer;font-size:11px;font-weight:600;
            background:${tab === t.id ? 'rgba(233,195,73,0.12)' : 'transparent'};color:${tab === t.id ? '#e9c349' : 'rgba(178,200,237,0.4)'};transition:all 0.2s;">
            <span style="font-size:18px;">${t.icon}</span><span>${t.label}</span>
          </button>`).join('')}
      </div>
    </nav>
  </div>` + (tab === 'letters' ? letterModalOverlayHTML(data.letters) : (tab === 'gallery' ? lightboxOverlayHTML(data.gallery) : ''));
}

// ── Data actions ─────────────────────────────────────────────────────────
async function persist(newData) {
  state.owner.data = newData;
  render();
  await saveData(newData);
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
function sendMoonMessage() {
  const text = (state.moon.input || '').trim();
  if (!text) return;
  state.moon.messages.push({ id: String(Date.now()), from: 'dino', text, time: nowTime() });
  state.moon.input = '';
  state.moon.typing = true;
  render();
  setTimeout(() => {
    state.moon.typing = false;
    state.moon.messages.push({ id: String(Date.now() + 1), from: 'moon', text: getMoonReply(), time: nowTime() });
    render();
  }, 1200 + Math.random() * 900);
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
  target.style.borderColor = v ? '#e9c349' : 'rgba(178,200,237,0.2)';
  target.style.boxShadow = v ? '0 0 14px rgba(233,195,73,0.3)' : 'none';
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
    case 'moon-send': sendMoonMessage(); break;
    case 'moon-close':
      if (state.isRecipient && state.recipient.data) state.recipient.tab = 'letters';
      else state.owner.tab = 'home';
      render();
      break;
    case 'recipient-tab': state.recipient.tab = el.dataset.tab; render(); break;
    case 'recipient-retry': window.location.reload(); break;
  }
}

function handleInput(e) {
  const t = e.target;
  if (t.dataset.role === 'pin-digit') { handlePinDigitInput(t); return; }
  const scope = t.dataset.scope, field = t.dataset.field;
  if (!scope || !field) return;
  const target = scope === 'editor' ? state.editor.draft
    : scope === 'newPhoto' ? state.newPhoto
    : scope === 'cityForm' ? state.owner.cityForm
    : scope === 'moon' ? state.moon
    : null;
  if (target) target[field] = t.value;
  // keep the send button's disabled state in sync without a full re-render
  if (scope === 'moon' && field === 'input') {
    const btn = root.querySelector('[data-action="moon-send"]');
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
        window.alert('Music upload failed — check that Firebase Storage is enabled and its rules allow writes.');
      })
      .finally(() => {
        state.editor.musicUploading = false;
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
  if (e.target.dataset.role === 'moon-input' && e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMoonMessage();
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
    if (d) state.recipient.data = normalizeData(d);
    else state.recipient.error = true;
    state.recipient.loading = false;
    render();
    if (state.recipient.data) requestLiveLocation();
  } else {
    state.pinFocusIndex = 0;
    render();
  }
}

init();

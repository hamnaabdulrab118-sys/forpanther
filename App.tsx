// ═══════════════════════════════════════════════════════════════════════
// FOR PANTHER — Between Two Skies
// Built clean from scratch. Correct sharing architecture.
//
// HOW SHARING WORKS (simple and guaranteed):
//   Owner saves → Firestore doc "forpanther/main"
//   Share URL  → yoursite.netlify.app/?gift=main
//   Panther opens URL → app reads "main" from Firestore → shows letters
//   Works on EVERY device. No localStorage. No account state. URL wins.
// ═══════════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react';
import { SiteData, Letter, GalleryPhoto, OwnerTab } from './types';
import { loadData, saveData } from './utils/db';
import { Stars } from './components/Stars';
import { PinScreen } from './components/PinScreen';
import { EnvelopeGrid } from './components/EnvelopeGrid';
import { LetterEditor } from './components/LetterEditor';
import { Gallery } from './components/Gallery';
import { MoonChat } from './components/MoonChat';
import { Home, Mail, Image, Moon, Settings, Plus, Copy, Check, ExternalLink } from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────────────────
const OWNER_PIN = '5425';
const SHARE_URL_PARAM = 'main'; // the gift ID in the share link

const DEFAULT_DATA: SiteData = {
  letters: [], gallery: [],
  fromCity: 'Sialkot', toCity: 'Ormara',
  distanceKm: 730, distanceMiles: 454,
  isPublished: false,
};

// ── URL detection ─────────────────────────────────────────────────────────────
// Reads ONLY from the URL. If ?gift= is present, this is a recipient visit.
// Account state, localStorage — all ignored. The URL is the only truth.
function getGiftParam(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('gift');
}

// ── Nav config ────────────────────────────────────────────────────────────────
const TABS: { id: OwnerTab; icon: React.ReactNode; label: string }[] = [
  { id: 'home',     icon: <Home size={20} />,     label: 'Home' },
  { id: 'letters',  icon: <Mail size={20} />,     label: 'Letters' },
  { id: 'gallery',  icon: <Image size={20} />,    label: 'Gallery' },
  { id: 'moon',     icon: <Moon size={20} />,     label: 'Moon' },
  { id: 'settings', icon: <Settings size={20} />, label: 'Settings' },
];

// ── Styles ────────────────────────────────────────────────────────────────────
const PAGE: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(180deg,#000005 0%,#000814 30%,#000d20 70%,#001a3d 100%)',
  position: 'relative',
};
const INNER: React.CSSProperties = {
  position: 'relative', zIndex: 10,
  maxWidth: 680, margin: '0 auto', padding: '0 16px 100px',
};
const inputCss: React.CSSProperties = {
  width: '100%', background: 'rgba(0,13,32,0.75)',
  border: '1px solid rgba(178,200,237,0.14)',
  borderRadius: 14, padding: '12px 16px', color: '#eef4ff',
  fontSize: 14, outline: 'none', fontFamily: 'inherit',
};

export default function App() {
  const giftParam = getGiftParam();
  const isRecipient = Boolean(giftParam);

  // ── Recipient state ──
  const [recData,  setRecData]  = useState<SiteData | null>(null);
  const [recLoading, setRecLoading] = useState(isRecipient);
  const [recError,   setRecError]   = useState(false);

  // ── Owner state ──
  const [pinOk,    setPinOk]    = useState(false);
  const [data,     setData]     = useState<SiteData>(DEFAULT_DATA);
  const [tab,      setTab]      = useState<OwnerTab>('home');
  const [editing,  setEditing]  = useState<Letter | null | undefined>(undefined);
  const [copied,   setCopied]   = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [pubOk,    setPubOk]    = useState(false);
  // Gallery add
  const [newUrl,   setNewUrl]   = useState('');
  const [newCap,   setNewCap]   = useState('');
  const [newLoc,   setNewLoc]   = useState('');
  // Settings
  const [fromIn,   setFromIn]   = useState('Sialkot');
  const [toIn,     setToIn]     = useState('Ormara');

  // ══════════════════════════════════════════════════════════════════════
  // RECIPIENT FLOW — load from Firestore using URL param ONLY
  // ══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!isRecipient || !giftParam) return;
    (async () => {
      setRecLoading(true);
      console.log('🔗 Recipient: loading gift ID =', giftParam);
      const d = await loadData();
      if (d) {
        console.log('✅ Recipient: loaded', d.letters.length, 'letters');
        setRecData(d);
      } else {
        console.warn('⚠️ Recipient: no data found');
        setRecError(true);
      }
      setRecLoading(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ══════════════════════════════════════════════════════════════════════
  // OWNER FLOW — load from Firestore after PIN unlock
  // ══════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!pinOk || isRecipient) return;
    (async () => {
      const d = await loadData();
      if (d) { setData(d); setFromIn(d.fromCity); setToIn(d.toCity); }
    })();
  }, [pinOk]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Owner helpers ──────────────────────────────────────────────────────
  const persist = async (d: SiteData) => { setData(d); await saveData(d); };

  const saveLetter = async (l: Letter) => {
    const letters = data.letters.some(x => x.id === l.id)
      ? data.letters.map(x => x.id === l.id ? l : x)
      : [l, ...data.letters];
    await persist({ ...data, letters });
    setEditing(undefined);
  };

  const deleteLetter = async (id: string) =>
    persist({ ...data, letters: data.letters.filter(l => l.id !== id) });

  const addPhoto = async () => {
    if (!newUrl.trim()) return;
    const p: GalleryPhoto = {
      id: `photo-${Date.now()}`, url: newUrl.trim(),
      caption: newCap.trim() || 'A memory for you',
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      location: newLoc.trim() || 'Under our sky',
    };
    await persist({ ...data, gallery: [p, ...data.gallery] });
    setNewUrl(''); setNewCap(''); setNewLoc('');
  };

  const deletePhoto = async (id: string) =>
    persist({ ...data, gallery: data.gallery.filter(p => p.id !== id) });

  const publish = async () => {
    setSaving(true);
    await persist({ ...data, isPublished: true });
    setSaving(false); setPubOk(true);
    setTimeout(() => setPubOk(false), 3000);
  };

  const updateCities = async () =>
    persist({ ...data, fromCity: fromIn, toCity: toIn });

  const shareUrl = `${window.location.origin}${window.location.pathname}?gift=${SHARE_URL_PARAM}`;
  const copyLink = () => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2500); };

  const waText = encodeURIComponent(`Panther 🐾✈️\n\nI made something for you — open when you need me 💌\n\n${shareUrl}\n\nPIN: ${OWNER_PIN} 🔐`);

  // ════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════

  // ── Recipient: loading ────────────────────────────────────────────────
  if (isRecipient && recLoading) return (
    <div style={{ ...PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Stars />
      <div className="glass-gold" style={{ position: 'relative', zIndex: 10, borderRadius: 28, padding: '48px 40px', maxWidth: 360, width: '100%', margin: '0 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16, animation: 'float 3s ease-in-out infinite' }}>🦖💌🐾</div>
        <h2 className="font-serif" style={{ fontSize: 24, fontWeight: 700, color: '#ffddb0', marginBottom: 10 }}>Opening your letter...</h2>
        <p className="font-mono" style={{ fontSize: 13, color: '#b2c8ed', marginBottom: 24 }}>Loading across the miles from Sialkot to Ormara</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          {[0, 1, 2].map(i => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: '#e9c349', animation: `bounceDot 1s ease-in-out ${i * 0.15}s infinite` }} />)}
        </div>
      </div>
    </div>
  );

  // ── Recipient: error ──────────────────────────────────────────────────
  if (isRecipient && recError) return (
    <div style={{ ...PAGE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Stars />
      <div className="glass-gold" style={{ position: 'relative', zIndex: 10, borderRadius: 28, padding: '48px 40px', maxWidth: 360, width: '100%', margin: '0 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>💌</div>
        <h2 className="font-serif" style={{ fontSize: 22, fontWeight: 700, color: '#ffddb0', marginBottom: 10 }}>Not published yet</h2>
        <p className="font-mono" style={{ fontSize: 13, color: '#b2c8ed', marginBottom: 24 }}>Dino is still writing your letters. Check back soon, Panther! 🐾</p>
        <button onClick={() => window.location.reload()} className="btn-gold font-mono"
          style={{ padding: '12px 28px', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 13 }}>
          Try again ↺
        </button>
      </div>
    </div>
  );

  // ── Recipient: gift view (ZERO owner tools — clean for Panther) ───────
  if (isRecipient && recData) {
    const [rTab, setRTab] = React.useState<'letters' | 'gallery' | 'moon'>('letters');
    if (rTab === 'moon') return <MoonChat onClose={() => setRTab('letters')} />;
    return (
      <div style={PAGE}>
        <Stars />
        <div style={{ ...INNER }}>
          {/* Hero */}
          <div style={{ paddingTop: 48, paddingBottom: 32, textAlign: 'center', animation: 'slideUp 0.5s ease-out' }}>
            <div style={{ fontSize: 64, marginBottom: 14, display: 'inline-block', animation: 'float 6s ease-in-out infinite' }}>🦖🐾</div>
            <h1 className="font-serif gold-glow" style={{ fontSize: 44, fontWeight: 700, color: '#ffddb0', marginBottom: 8 }}>For Panther</h1>
            <p className="font-serif" style={{ color: '#b2c8ed', fontSize: 15, fontStyle: 'italic', marginBottom: 20 }}>From your Dino, written under the same sky ✈️</p>
            <div className="glass-gold font-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 999, fontSize: 13, color: '#b2c8ed' }}>
              <span style={{ color: '#e9c349' }}>📍</span>{recData.fromCity}
              <span style={{ color: '#e9c349' }}>✈️</span>{recData.toCity}
              <span style={{ color: 'rgba(178,200,237,0.35)' }}>·</span>
              <span style={{ color: '#e9c349', fontWeight: 700 }}>{recData.distanceKm.toLocaleString()} km</span>
              <span style={{ color: 'rgba(178,200,237,0.35)' }}>·</span>
              <span style={{ fontStyle: 'italic', opacity: 0.6 }}>same sky 🌙</span>
            </div>
          </div>

          {/* Tab bar */}
          <div className="glass-gold" style={{ borderRadius: 20, padding: 6, display: 'flex', gap: 6, marginBottom: 24 }}>
            {([
              { id: 'letters' as const, label: `Letters (${recData.letters.filter(l => l.isPublished).length})`, emoji: '💌' },
              { id: 'gallery' as const, label: `Gallery (${recData.gallery.length})`, emoji: '📷' },
              { id: 'moon' as const, label: 'Talk to Moon', emoji: '🌙' },
            ]).map(t => (
              <button key={t.id} onClick={() => setRTab(t.id)}
                className="font-mono"
                style={{
                  flex: 1, padding: '11px 8px', borderRadius: 14, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                  background: rTab === t.id ? '#e9c349' : 'transparent',
                  color: rTab === t.id ? '#000d20' : 'rgba(178,200,237,0.5)',
                  transition: 'all 0.2s',
                }}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>

          {rTab === 'letters' && <EnvelopeGrid letters={recData.letters} />}
          {rTab === 'gallery' && <Gallery photos={recData.gallery} />}
        </div>
      </div>
    );
  }

  // ── Owner: PIN gate ───────────────────────────────────────────────────
  if (!pinOk) return <PinScreen onUnlock={() => setPinOk(true)} />;

  // ── Owner: Moon chat ──────────────────────────────────────────────────
  if (tab === 'moon') return <MoonChat onClose={() => setTab('home')} />;

  // ── Owner: Letter editor ──────────────────────────────────────────────
  if (editing !== undefined) return <LetterEditor initial={editing} onSave={saveLetter} onCancel={() => setEditing(undefined)} />;

  // ── Owner: Main studio ────────────────────────────────────────────────
  return (
    <div style={PAGE}>
      <Stars />
      <div style={INNER}>

        {/* Top bar */}
        <div style={{ paddingTop: 24, paddingBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p className="font-mono" style={{ fontSize: 11, color: '#e9c349', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 4 }}>Creator Studio 🦖</p>
            <h1 className="font-serif" style={{ fontSize: 26, fontWeight: 700, color: 'white' }}>For Panther 🐾</h1>
          </div>
          <div className="glass-gold font-mono" style={{ padding: '10px 16px', borderRadius: 16, fontSize: 12, color: '#b2c8ed', textAlign: 'right' }}>
            <span style={{ color: '#e9c349' }}>📍</span> {data.fromCity} <span style={{ color: '#e9c349' }}>✈️</span> {data.toCity}<br />
            <span style={{ color: '#e9c349', fontWeight: 700 }}>{data.distanceKm} km</span> <span style={{ opacity: 0.4 }}>apart</span>
          </div>
        </div>

        {/* ── HOME ── */}
        {tab === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.3s ease-out' }}>
            <div className="glass-gold" style={{ borderRadius: 28, padding: 28, border: '1px solid rgba(233,195,73,0.18)' }}>
              {/* Title row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
                <div style={{ fontSize: 44, animation: 'float 6s ease-in-out infinite' }}>🦖🐾</div>
                <div>
                  <h2 className="font-serif" style={{ fontSize: 20, fontWeight: 700, color: '#ffddb0' }}>Between Two Skies</h2>
                  <p className="font-mono" style={{ fontSize: 12, color: 'rgba(178,200,237,0.45)', marginTop: 3 }}>
                    {data.letters.length} letters · {data.gallery.length} photos
                  </p>
                </div>
              </div>

              {/* Status */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 14, marginBottom: 18,
                background: data.isPublished ? 'rgba(74,222,128,0.08)' : 'rgba(251,191,36,0.08)',
                border: `1px solid ${data.isPublished ? 'rgba(74,222,128,0.2)' : 'rgba(251,191,36,0.2)'}`,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: data.isPublished ? '#4ade80' : '#fbbf24', animation: 'bounceDot 1.5s ease-in-out infinite' }} />
                <p className="font-mono" style={{ fontSize: 12, color: data.isPublished ? '#4ade80' : '#fbbf24' }}>
                  {data.isPublished ? 'Published — Panther can open your letters' : 'Draft — not yet shared with Panther'}
                </p>
              </div>

              {/* Publish button */}
              <button onClick={publish} disabled={saving} className="btn-gold font-mono"
                style={{ width: '100%', padding: '16px 0', borderRadius: 20, fontSize: 14, border: 'none', cursor: 'pointer', marginBottom: 14, letterSpacing: '0.04em', background: pubOk ? '#4ade80' : saving ? 'rgba(233,195,73,0.5)' : '#e9c349', color: pubOk ? 'white' : '#000d20' }}>
                {saving ? 'Saving...' : pubOk ? '✓ Published!' : data.isPublished ? '↑ Update Gift' : '🚀 Publish for Panther'}
              </button>

              {/* Share link */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <input readOnly value={shareUrl} className="font-mono"
                  style={{ ...inputCss, flex: 1, padding: '10px 14px', fontSize: 12, color: '#b2c8ed' }} />
                <button onClick={copyLink} className="font-mono"
                  style={{
                    padding: '10px 16px', borderRadius: 14, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    background: copied ? '#4ade80' : 'rgba(233,195,73,0.12)', color: copied ? 'white' : '#e9c349',
                    display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', transition: 'all 0.2s',
                  }}>
                  {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
                </button>
              </div>

              {/* WhatsApp */}
              <a href={`https://api.whatsapp.com/send?text=${waText}`} target="_blank" rel="noopener noreferrer"
                className="font-mono"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px 0', borderRadius: 16, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                📱 Send via WhatsApp <ExternalLink size={13} />
              </a>
            </div>

            {/* Quick actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {[
                { label: 'Write Letter', emoji: '✍️', action: () => setEditing(null) },
                { label: 'Add Photo', emoji: '📷', action: () => setTab('gallery') },
                { label: 'Moon Chat', emoji: '🌙', action: () => setTab('moon') },
              ].map(a => (
                <button key={a.label} onClick={a.action}
                  className="glass-gold font-mono"
                  style={{ borderRadius: 22, padding: '20px 8px', textAlign: 'center', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(233,195,73,0.4)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(233,195,73,0.2)'; }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{a.emoji}</div>
                  <p style={{ fontSize: 12, color: '#b2c8ed' }}>{a.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── LETTERS ── */}
        {tab === 'letters' && (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 className="font-serif" style={{ fontSize: 22, fontWeight: 700, color: 'white' }}>Letters ({data.letters.length})</h2>
              <button onClick={() => setEditing(null)} className="btn-gold font-mono"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 13 }}>
                <Plus size={15} /> New Letter
              </button>
            </div>
            <EnvelopeGrid letters={data.letters} isOwner onEdit={l => setEditing(l)} onDelete={deleteLetter} />
          </div>
        )}

        {/* ── GALLERY ── */}
        {tab === 'gallery' && (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <h2 className="font-serif" style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 20 }}>Gallery ({data.gallery.length})</h2>

            <div className="glass-gold" style={{ borderRadius: 24, padding: 22, marginBottom: 20 }}>
              <p className="font-mono" style={{ fontSize: 11, color: '#e9c349', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 14 }}>Add a photo</p>
              <input type="text" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="Paste image URL..."
                className="font-mono" style={{ ...inputCss, marginBottom: 10, fontSize: 13 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <input type="text" value={newCap} onChange={e => setNewCap(e.target.value)} placeholder="Caption..."
                  className="font-serif" style={{ ...inputCss, fontSize: 13 }} />
                <input type="text" value={newLoc} onChange={e => setNewLoc(e.target.value)} placeholder="Location..."
                  className="font-mono" style={{ ...inputCss, fontSize: 13 }} />
              </div>
              <button onClick={addPhoto} disabled={!newUrl.trim()} className="btn-gold font-mono"
                style={{ width: '100%', padding: '12px 0', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 13 }}>
                Add Photo
              </button>
            </div>

            <Gallery photos={data.gallery} isOwner onDelete={deletePhoto} />
          </div>
        )}

        {/* ── SETTINGS ── */}
        {tab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.3s ease-out' }}>
            <h2 className="font-serif" style={{ fontSize: 22, fontWeight: 700, color: 'white' }}>Settings</h2>

            <div className="glass-gold" style={{ borderRadius: 24, padding: 24 }}>
              <p className="font-mono" style={{ fontSize: 11, color: '#e9c349', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 16 }}>Distance</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <p className="font-mono" style={{ fontSize: 11, color: 'rgba(178,200,237,0.45)', marginBottom: 6 }}>Your city (Dino):</p>
                  <input type="text" value={fromIn} onChange={e => setFromIn(e.target.value)} className="font-mono" style={inputCss} />
                </div>
                <div>
                  <p className="font-mono" style={{ fontSize: 11, color: 'rgba(178,200,237,0.45)', marginBottom: 6 }}>His city (Panther):</p>
                  <input type="text" value={toIn} onChange={e => setToIn(e.target.value)} className="font-mono" style={inputCss} />
                </div>
              </div>
              <button onClick={updateCities} className="btn-gold font-mono"
                style={{ width: '100%', padding: '12px 0', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 13 }}>
                Update Cities
              </button>
            </div>

            <div className="glass-gold" style={{ borderRadius: 24, padding: 24 }}>
              <p className="font-mono" style={{ fontSize: 11, color: '#e9c349', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 14 }}>Share Info</p>
              <p className="font-mono" style={{ fontSize: 13, color: '#b2c8ed', marginBottom: 8 }}>Owner PIN: <span style={{ color: '#e9c349', fontWeight: 700, fontSize: 16 }}>{OWNER_PIN}</span></p>
              <p className="font-mono" style={{ fontSize: 12, color: 'rgba(178,200,237,0.4)', marginBottom: 12, wordBreak: 'break-all' }}>
                Panther's link: <span style={{ color: '#7dd3fc' }}>{shareUrl}</span>
              </p>
              <button onClick={copyLink} className="font-mono"
                style={{ padding: '10px 20px', borderRadius: 14, background: 'rgba(233,195,73,0.1)', border: '1px solid rgba(233,195,73,0.25)', color: '#e9c349', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Link</>}
              </button>
            </div>

            <div className="glass-gold" style={{ borderRadius: 24, padding: 24 }}>
              <button onClick={() => setPinOk(false)}
                className="font-mono"
                style={{ width: '100%', padding: '12px 0', borderRadius: 16, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                🔒 Lock App
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', zIndex: 50, background: 'rgba(0,13,32,0.85)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(233,195,73,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '8px 8px 12px', maxWidth: 680, margin: '0 auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="font-mono"
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 16px', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                background: tab === t.id ? 'rgba(233,195,73,0.12)' : 'transparent',
                color: tab === t.id ? '#e9c349' : 'rgba(178,200,237,0.4)',
                transition: 'all 0.2s',
              }}>
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

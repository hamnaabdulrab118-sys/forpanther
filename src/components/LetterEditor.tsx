import React, { useState } from 'react';
import { Letter } from '../types';
import { Stars } from './Stars';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';

const LABELS = [
  "Open when you miss me","Open when you can't sleep",
  "Open when you land safely","Open when you're stressed",
  "Open when you need gym motivation","Open when you want coffee but I'm not there",
  "Open when you're overthinking","Open when you're proud of yourself",
  "Open when you feel homesick","Open when you need a laugh",
  "Open when it's our anniversary","Open when you just want to hear from me",
  "Open when you doubt yourself","Open when you want ice cream",
  "Open when you need to feel loved","Open when it's a hard day",
  "Open when you want to smile","Open when you're bored",
];

const STICKERS = ['🐱','🐾','✈️','🌙','⭐','💫','🦖','🐆','☕','🍦','💚','🖤','💌','🌿','🪐','🔭','📖','💪','🎵','🌸','🏋️','🍕','🌊','🎯','🐉','🌺','💎','🌠','🐈','🌃','🎖️','🧡'];

const ENVELOPE_COLORS = [
  { id: 'gold' as const, label: 'Gold', color: '#e9c349' },
  { id: 'rose' as const, label: 'Rose', color: '#fda4af' },
  { id: 'sky' as const, label: 'Sky', color: '#7dd3fc' },
  { id: 'sage' as const, label: 'Sage', color: '#86efac' },
  { id: 'lavender' as const, label: 'Lavender', color: '#c4b5fd' },
];

const freshLetter = (): Letter => ({
  id: `letter-${Date.now()}`,
  label: '', title: '',
  greeting: 'My Dearest Panther,',
  content: '',
  signOff: 'Forever yours,\nDino 🖤',
  date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  envelopeColor: 'gold',
  hasPhoto: false, photoUrl: '', photoCaption: '',
  hasAudio: false, audioTitle: '',
  hasVideo: false, videoUrl: '', videoTitle: '',
  stickers: [],
  isPublished: true,
  createdAt: new Date().toISOString(),
});

const STEPS = ['Label & Style', 'Your Message', 'Add Media', 'Stickers', 'Preview'];

interface Props { initial?: Letter | null; onSave: (l: Letter) => void; onCancel: () => void; }

export const LetterEditor: React.FC<Props> = ({ initial, onSave, onCancel }) => {
  const [step, setStep] = useState(1);
  const [l, setL] = useState<Letter>(initial ? { ...initial } : freshLetter());
  const up = (f: Partial<Letter>) => setL(p => ({ ...p, ...f }));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, field: 'photoUrl' | 'videoUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        up({ [field]: reader.result, [field === 'photoUrl' ? 'hasPhoto' : 'hasVideo']: true });
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleSticker = (s: string) =>
    up({ stickers: l.stickers.includes(s) ? l.stickers.filter(x => x !== s) : [...l.stickers, s] });

  const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
    <label className="toggle-wrap" onClick={() => onChange(!checked)}>
      <input type="checkbox" className="toggle-input" checked={checked} onChange={() => {}} />
      <div className="toggle-track"><div className="toggle-thumb" /></div>
    </label>
  );

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(0,13,32,0.7)', border: '1px solid rgba(178,200,237,0.15)',
    borderRadius: 14, padding: '12px 16px', color: '#eef4ff', fontSize: 14, outline: 'none',
    fontFamily: 'inherit', transition: 'border-color 0.2s',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#000005,#000814,#000d20)', position: 'relative' }}>
      <Stars />
      <div style={{ position: 'relative', zIndex: 10, maxWidth: 680, margin: '0 auto', padding: '24px 16px 100px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <p className="font-mono" style={{ fontSize: 11, color: '#e9c349', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 }}>
              Step {step}/{STEPS.length} — {STEPS[step - 1]}
            </p>
            <h2 className="font-serif" style={{ fontSize: 26, fontWeight: 700, color: 'white' }}>
              {initial ? 'Edit Letter' : 'New Letter ✍️'}
            </h2>
          </div>
          <button onClick={onCancel}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(178,200,237,0.08)', border: '1px solid rgba(178,200,237,0.12)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b2c8ed' }}>
            <X size={18} />
          </button>
        </div>

        {/* Step pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, overflowX: 'auto', paddingBottom: 4 }}>
          {STEPS.map((s, i) => (
            <button key={i} onClick={() => setStep(i + 1)}
              className="font-mono"
              style={{
                flexShrink: 0, padding: '7px 14px', borderRadius: 999, fontSize: 11, border: 'none', cursor: 'pointer',
                background: step === i + 1 ? '#e9c349' : step > i + 1 ? 'rgba(233,195,73,0.15)' : 'rgba(178,200,237,0.06)',
                color: step === i + 1 ? '#000d20' : step > i + 1 ? '#e9c349' : 'rgba(178,200,237,0.4)',
                fontWeight: step === i + 1 ? 700 : 400,
                transition: 'all 0.2s',
              }}>
              {i + 1}. {s}
            </button>
          ))}
        </div>

        {/* STEP 1 — Label & Style */}
        {step === 1 && (
          <div className="glass-gold" style={{ borderRadius: 28, padding: 28, display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.3s ease-out' }}>
            <div>
              <p className="font-mono" style={{ fontSize: 11, color: '#e9c349', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>Choose a label:</p>
              <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {LABELS.map(lb => (
                  <button key={lb} onClick={() => up({ label: lb })}
                    className="font-mono"
                    style={{
                      textAlign: 'left', padding: '11px 16px', borderRadius: 14, fontSize: 13, cursor: 'pointer',
                      background: l.label === lb ? 'rgba(233,195,73,0.15)' : 'rgba(178,200,237,0.04)',
                      border: l.label === lb ? '1px solid rgba(233,195,73,0.6)' : '1px solid transparent',
                      color: l.label === lb ? '#e9c349' : '#b2c8ed',
                      transition: 'all 0.15s',
                    }}>
                    {lb}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="font-mono" style={{ fontSize: 11, color: '#e9c349', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>Or write your own:</p>
              <input type="text" value={l.label} onChange={e => up({ label: e.target.value })} placeholder="Open when..."
                className="font-mono" style={inputStyle} />
            </div>
            <div>
              <p className="font-mono" style={{ fontSize: 11, color: '#e9c349', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>Envelope color:</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {ENVELOPE_COLORS.map(c => (
                  <button key={c.id} onClick={() => up({ envelopeColor: c.id })} title={c.label}
                    style={{
                      width: 40, height: 40, borderRadius: '50%', background: c.color, border: 'none', cursor: 'pointer',
                      outline: l.envelopeColor === c.id ? `3px solid white` : '3px solid transparent',
                      outlineOffset: 3,
                      transform: l.envelopeColor === c.id ? 'scale(1.25)' : 'scale(1)',
                      transition: 'all 0.2s',
                    }} />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'rgba(178,200,237,0.05)', borderRadius: 16 }}>
              <span className="font-mono" style={{ fontSize: 13, color: '#b2c8ed' }}>Publish for Panther</span>
              <Toggle checked={l.isPublished} onChange={v => up({ isPublished: v })} />
            </div>
          </div>
        )}

        {/* STEP 2 — Message */}
        {step === 2 && (
          <div className="glass-gold" style={{ borderRadius: 28, padding: 28, display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeIn 0.3s ease-out' }}>
            {[
              { label: 'Greeting', key: 'greeting' as const, placeholder: 'My Dearest Panther,' },
              { label: 'Sign off', key: 'signOff' as const, placeholder: 'Forever yours, Dino 🖤' },
              { label: 'Date stamp', key: 'date' as const, placeholder: 'September 3, 2026' },
            ].map(field => (
              <div key={field.key}>
                <p className="font-mono" style={{ fontSize: 11, color: '#e9c349', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>{field.label}:</p>
                <input type="text" value={l[field.key]} onChange={e => up({ [field.key]: e.target.value })} placeholder={field.placeholder}
                  className="font-serif" style={inputStyle} />
              </div>
            ))}
            <div>
              <p className="font-mono" style={{ fontSize: 11, color: '#e9c349', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>Your letter:</p>
              <textarea rows={10} value={l.content} onChange={e => up({ content: e.target.value })}
                placeholder="Pour your heart out here... Tell him how much he means to you."
                className="font-serif"
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.9, fontSize: 15 }} />
            </div>
          </div>
        )}

        {/* STEP 3 — Media */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.3s ease-out' }}>
            {/* Photo */}
            <div className="glass-gold" style={{ borderRadius: 24, padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: l.hasPhoto ? 18 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>📷</span>
                  <span className="font-mono" style={{ fontSize: 14, fontWeight: 600, color: '#7dd3fc' }}>Photo</span>
                </div>
                <Toggle checked={l.hasPhoto} onChange={v => up({ hasPhoto: v })} />
              </div>
              {l.hasPhoto && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 0', borderRadius: 14, border: '1px dashed rgba(125,211,252,0.3)', color: '#7dd3fc', fontSize: 13, cursor: 'pointer' }}
                    className="font-mono">
                    📁 Upload photo
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e, 'photoUrl')} />
                  </label>
                  {l.photoUrl && <img src={l.photoUrl} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 12, border: '1px solid rgba(125,211,252,0.3)' }} />}
                  <input type="text" value={l.photoCaption} onChange={e => up({ photoCaption: e.target.value })} placeholder="Photo caption..."
                    className="font-serif" style={{ ...inputStyle, fontSize: 13 }} />
                </div>
              )}
            </div>

            {/* Audio */}
            <div className="glass-gold" style={{ borderRadius: 24, padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: l.hasAudio ? 18 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>🎙️</span>
                  <span className="font-mono" style={{ fontSize: 14, fontWeight: 600, color: '#fb7185' }}>Voice Note</span>
                </div>
                <Toggle checked={l.hasAudio} onChange={v => up({ hasAudio: v })} />
              </div>
              {l.hasAudio && (
                <input type="text" value={l.audioTitle} onChange={e => up({ audioTitle: e.target.value })} placeholder="e.g. A midnight message for you..."
                  className="font-mono" style={{ ...inputStyle, fontSize: 13 }} />
              )}
            </div>

            {/* Video */}
            <div className="glass-gold" style={{ borderRadius: 24, padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: l.hasVideo ? 18 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>🎬</span>
                  <span className="font-mono" style={{ fontSize: 14, fontWeight: 600, color: '#a78bfa' }}>Video</span>
                </div>
                <Toggle checked={l.hasVideo} onChange={v => up({ hasVideo: v })} />
              </div>
              {l.hasVideo && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 0', borderRadius: 14, border: '1px dashed rgba(167,139,250,0.3)', color: '#a78bfa', fontSize: 13, cursor: 'pointer' }}
                    className="font-mono">
                    📁 Upload video
                    <input type="file" accept="video/*" style={{ display: 'none' }} onChange={e => handleFile(e, 'videoUrl')} />
                  </label>
                  <input type="text" value={l.videoTitle} onChange={e => up({ videoTitle: e.target.value })} placeholder="Video title..."
                    className="font-mono" style={{ ...inputStyle, fontSize: 13 }} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4 — Stickers */}
        {step === 4 && (
          <div className="glass-gold" style={{ borderRadius: 28, padding: 28, animation: 'fadeIn 0.3s ease-out' }}>
            <p className="font-mono" style={{ fontSize: 13, color: '#b2c8ed', marginBottom: 18 }}>Tap stickers to add to your letter:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
              {STICKERS.map(s => (
                <button key={s} onClick={() => toggleSticker(s)}
                  style={{
                    fontSize: 24, width: 48, height: 48, borderRadius: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: l.stickers.includes(s) ? 'rgba(233,195,73,0.2)' : 'rgba(178,200,237,0.06)',
                    outline: l.stickers.includes(s) ? '2px solid rgba(233,195,73,0.6)' : '2px solid transparent',
                    transform: l.stickers.includes(s) ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.15s',
                  }}>
                  {s}
                </button>
              ))}
            </div>
            {l.stickers.length > 0 && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(178,200,237,0.1)' }}>
                <p className="font-mono" style={{ fontSize: 11, color: '#e9c349', marginBottom: 10 }}>Your stickers ({l.stickers.length}):</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {l.stickers.map((s, i) => (
                    <button key={i} onClick={() => toggleSticker(s)} style={{ fontSize: 24, border: 'none', background: 'none', cursor: 'pointer', opacity: 0.8 }}>{s}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 5 — Preview */}
        {step === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ textAlign: 'center' }}>
              <span className="font-mono" style={{ fontSize: 12, color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', padding: '6px 16px', borderRadius: 999 }}>
                ✓ Exactly what Panther sees
              </span>
            </div>

            <div className="letter-paper" style={{ borderRadius: 28, padding: '32px 28px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
              <div style={{ paddingBottom: 20, marginBottom: 20, borderBottom: '1px solid rgba(44,29,17,0.1)' }}>
                <p className="font-mono" style={{ fontSize: 10, opacity: 0.35, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 6 }}>💌 Open When</p>
                <h2 className="font-serif" style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{l.label || '(no label set)'}</h2>
                <p className="font-mono" style={{ fontSize: 11, opacity: 0.3 }}>{l.date}</p>
              </div>
              {l.stickers.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {l.stickers.map((s, i) => <span key={i} style={{ fontSize: 20 }}>{s}</span>)}
                </div>
              )}
              <div className="font-serif" style={{ lineHeight: 1.9 }}>
                {l.greeting && <p style={{ fontWeight: 700, marginBottom: 14 }}>{l.greeting}</p>}
                <p style={{ whiteSpace: 'pre-line' }}>{l.content || '(letter content here...)'}</p>
                {l.signOff && <p style={{ fontWeight: 700, fontStyle: 'italic', marginTop: 20, textAlign: 'right' }}>{l.signOff}</p>}
              </div>
              {l.hasPhoto && l.photoUrl && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                  <div style={{ background: 'white', padding: '8px 8px 28px', boxShadow: '0 6px 20px rgba(0,0,0,0.15)', transform: 'rotate(1.5deg)', maxWidth: 220 }}>
                    <img src={l.photoUrl} alt="" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }} />
                    {l.photoCaption && <p className="font-serif" style={{ textAlign: 'center', fontSize: 11, color: '#78716c', marginTop: 8, fontStyle: 'italic' }}>"{l.photoCaption}"</p>}
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => onSave(l)} className="btn-gold"
              style={{ width: '100%', padding: '18px 0', borderRadius: 22, fontSize: 15, border: 'none', cursor: 'pointer', letterSpacing: '0.04em' }}>
              ✓ Save & Publish Letter
            </button>
          </div>
        )}

        {/* Nav buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 28 }}>
          <button onClick={() => step > 1 ? setStep(step - 1) : onCancel()}
            className="font-mono"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 20px', borderRadius: 16, background: 'rgba(178,200,237,0.06)', border: '1px solid rgba(178,200,237,0.1)', color: '#b2c8ed', fontSize: 13, cursor: 'pointer' }}>
            <ChevronLeft size={16} /> {step > 1 ? 'Back' : 'Cancel'}
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => onSave(l)}
              className="font-mono"
              style={{ padding: '12px 18px', borderRadius: 16, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', color: '#4ade80', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Check size={14} /> Save
            </button>
            {step < STEPS.length && (
              <button onClick={() => setStep(step + 1)} className="btn-gold font-mono"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 20px', borderRadius: 16, fontSize: 13, border: 'none', cursor: 'pointer' }}>
                Next <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

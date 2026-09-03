import React, { useState } from 'react';
import { Letter } from '../types';
import { LetterModal } from './LetterModal';

const COLORS = {
  gold:     { envelope: '#1a1200', flap: '#e9c34922', border: '#e9c349', wax: '#e9c349', badge: 'rgba(233,195,73,0.12)', badgeText: '#e9c349' },
  rose:     { envelope: '#1a0008', flap: '#fda4af22', border: '#fda4af', wax: '#fb7185', badge: 'rgba(253,164,175,0.12)', badgeText: '#fda4af' },
  sky:      { envelope: '#00101a', flap: '#7dd3fc22', border: '#7dd3fc', wax: '#38bdf8', badge: 'rgba(125,211,252,0.12)', badgeText: '#7dd3fc' },
  sage:     { envelope: '#001400', flap: '#86efac22', border: '#86efac', wax: '#4ade80', badge: 'rgba(134,239,172,0.12)', badgeText: '#86efac' },
  lavender: { envelope: '#0d0020', flap: '#c4b5fd22', border: '#c4b5fd', wax: '#a78bfa', badge: 'rgba(196,181,253,0.12)', badgeText: '#c4b5fd' },
};

const EnvelopeCard: React.FC<{ letter: Letter; onClick: () => void }> = ({ letter, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const c = COLORS[letter.envelopeColor] || COLORS.gold;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="envelope-card"
      style={{
        width: '100%', textAlign: 'left', cursor: 'pointer', border: 'none', padding: 0,
        borderRadius: 24, overflow: 'hidden',
        background: c.envelope,
        outline: `1px solid ${c.border}33`,
        transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
        boxShadow: hovered ? `0 28px 60px rgba(0,0,0,0.65), 0 0 0 1px ${c.border}44` : '0 4px 20px rgba(0,0,0,0.4)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      }}>

      {/* SVG envelope */}
      <div style={{ position: 'relative', paddingTop: '58%' }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox="0 0 300 174" preserveAspectRatio="none">
          {/* Envelope body */}
          <rect x="0" y="0" width="300" height="174" fill={c.envelope} />
          {/* Side panels */}
          <polygon points="0,0 0,174 140,87" fill={`${c.border}12`} />
          <polygon points="300,0 300,174 160,87" fill={`${c.border}12`} />
          {/* Flap */}
          <polygon points="0,0 300,0 150,95" fill={`${c.border}18`} stroke={`${c.border}40`} strokeWidth="1" />
          {/* Wax seal */}
          <circle cx="150" cy="97" r="26" fill={c.wax} opacity="0.92"
            style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }} />
          <text x="150" y="105" textAnchor="middle" fontSize="20" fill="white" opacity="0.95">🐾</text>
        </svg>
        {/* Hover shimmer */}
        {hovered && (
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 0%, ${c.border}14 0%, transparent 65%)`, pointerEvents: 'none' }} />
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '14px 18px 18px' }}>
        <div style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, background: c.badge, marginBottom: 8 }}>
          <span className="font-mono" style={{ fontSize: 10, color: c.badgeText, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>Open When...</span>
        </div>
        <h3 className="font-serif" style={{ color: c.border, fontSize: 15, fontWeight: 700, lineHeight: 1.3, marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {letter.label || 'Untitled Letter'}
        </h3>
        <p className="font-mono" style={{ fontSize: 10, color: 'rgba(178,200,237,0.35)' }}>{letter.date}</p>

        {/* Media chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
          {letter.hasPhoto && <span className="font-mono" style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'rgba(125,211,252,0.1)', color: '#7dd3fc' }}>📷 photo</span>}
          {letter.hasAudio && <span className="font-mono" style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'rgba(251,113,133,0.1)', color: '#fb7185' }}>🎙️ audio</span>}
          {letter.hasVideo && <span className="font-mono" style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'rgba(167,139,250,0.1)', color: '#a78bfa' }}>🎬 video</span>}
          {letter.stickers.length > 0 && <span style={{ fontSize: 13 }}>{letter.stickers.slice(0, 4).join('')}</span>}
        </div>
      </div>
    </button>
  );
};

interface Props {
  letters: Letter[];
  isOwner?: boolean;
  onEdit?: (l: Letter) => void;
  onDelete?: (id: string) => void;
}

export const EnvelopeGrid: React.FC<Props> = ({ letters, isOwner, onEdit, onDelete }) => {
  const [open, setOpen] = useState<Letter | null>(null);
  const visible = isOwner ? letters : letters.filter(l => l.isPublished);

  if (visible.length === 0) return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>💌</div>
      <p className="font-mono" style={{ color: 'rgba(178,200,237,0.35)', fontSize: 14 }}>
        {isOwner ? 'No letters yet — write your first one!' : 'Letters are on their way...'}
      </p>
    </div>
  );

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {visible.map(l => (
          <div key={l.id} style={{ position: 'relative' }}>
            <EnvelopeCard letter={l} onClick={() => setOpen(l)} />
            {/* Draft badge */}
            {isOwner && !l.isPublished && (
              <div className="font-mono" style={{ position: 'absolute', bottom: 58, left: 14, fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}>
                draft
              </div>
            )}
            {/* Owner edit/delete */}
            {isOwner && (
              <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 5 }}>
                <button onClick={e => { e.stopPropagation(); onEdit?.(l); }}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: '#e9c349', border: 'none', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000d20', fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                  ✎
                </button>
                <button onClick={e => { e.stopPropagation(); if (window.confirm('Delete this letter?')) onDelete?.(l.id); }}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(239,68,68,0.8)', border: 'none', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                  ×
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      {open && <LetterModal letter={open} onClose={() => setOpen(null)} />}
    </>
  );
};

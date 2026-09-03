import React from 'react';
import { Letter } from '../types';
import { X } from 'lucide-react';

interface Props { letter: Letter; onClose: () => void; }

export const LetterModal: React.FC<Props> = ({ letter, onClose }) => (
  <div
    onClick={onClose}
    style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fadeIn 0.25s ease-out' }}>
    <div
      onClick={e => e.stopPropagation()}
      className="letter-paper"
      style={{ width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto', borderRadius: 28, padding: '36px 32px', boxShadow: '0 32px 80px rgba(0,0,0,0.7)', position: 'relative', animation: 'slideUp 0.3s ease-out' }}>

      {/* Close */}
      <button onClick={onClose}
        style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2c1d11' }}>
        <X size={18} />
      </button>

      {/* Header */}
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid rgba(44,29,17,0.1)' }}>
        <p className="font-mono" style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.4, marginBottom: 6 }}>💌 Open When</p>
        <h2 className="font-serif" style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2, marginBottom: 6 }}>{letter.label}</h2>
        <p className="font-mono" style={{ fontSize: 11, opacity: 0.35 }}>{letter.date}</p>
      </div>

      {/* Stickers */}
      {letter.stickers.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {letter.stickers.map((s, i) => <span key={i} style={{ fontSize: 24 }}>{s}</span>)}
        </div>
      )}

      {/* Letter body */}
      <div className="font-serif" style={{ lineHeight: 1.9, fontSize: 16 }}>
        {letter.greeting && <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>{letter.greeting}</p>}
        <p style={{ whiteSpace: 'pre-line' }}>{letter.content}</p>
        {letter.signOff && <p style={{ fontWeight: 700, fontStyle: 'italic', marginTop: 24, textAlign: 'right' }}>{letter.signOff}</p>}
      </div>

      {/* Photo */}
      {letter.hasPhoto && letter.photoUrl && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 28 }}>
          <div style={{ background: 'white', padding: '10px 10px 30px', boxShadow: '0 8px 24px rgba(0,0,0,0.18)', transform: 'rotate(1.5deg)', maxWidth: 260, width: '100%' }}>
            <img src={letter.photoUrl} alt="" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }} />
            {letter.photoCaption && (
              <p className="font-serif" style={{ textAlign: 'center', fontSize: 12, color: '#78716c', marginTop: 10, fontStyle: 'italic' }}>"{letter.photoCaption}"</p>
            )}
          </div>
        </div>
      )}

      {/* Audio */}
      {letter.hasAudio && letter.audioTitle && (
        <div style={{ marginTop: 20, padding: '14px 18px', background: 'rgba(251,113,133,0.08)', borderRadius: 16, border: '1px solid rgba(251,113,133,0.15)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>🎙️</span>
          <div>
            <p className="font-mono" style={{ fontSize: 10, color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 2 }}>Voice Note</p>
            <p className="font-serif" style={{ fontWeight: 600, fontSize: 14 }}>{letter.audioTitle}</p>
          </div>
        </div>
      )}

      {/* Video */}
      {letter.hasVideo && letter.videoUrl && (
        <div style={{ marginTop: 20, borderRadius: 16, overflow: 'hidden' }}>
          <video src={letter.videoUrl} controls style={{ width: '100%', display: 'block' }} />
          {letter.videoTitle && <p className="font-mono" style={{ textAlign: 'center', fontSize: 11, marginTop: 8, opacity: 0.5 }}>{letter.videoTitle}</p>}
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 28, paddingTop: 16, borderTop: '1px solid rgba(44,29,17,0.08)', display: 'flex', justifyContent: 'space-between' }}>
        <span className="font-mono" style={{ fontSize: 11, opacity: 0.3 }}>🦖 From Dino</span>
        <span className="font-mono" style={{ fontSize: 11, opacity: 0.3 }}>Sialkot → Ormara</span>
      </div>
    </div>
  </div>
);

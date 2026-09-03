import React, { useState } from 'react';
import { GalleryPhoto } from '../types';
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

interface Props { photos: GalleryPhoto[]; isOwner?: boolean; onDelete?: (id: string) => void; }

export const Gallery: React.FC<Props> = ({ photos, isOwner, onDelete }) => {
  const [lightbox, setLightbox] = useState<{ photo: GalleryPhoto; idx: number } | null>(null);

  const open = (photo: GalleryPhoto, idx: number) => setLightbox({ photo, idx });
  const close = () => setLightbox(null);
  const prev = () => { if (!lightbox) return; const ni = (lightbox.idx - 1 + photos.length) % photos.length; setLightbox({ photo: photos[ni], idx: ni }); };
  const next = () => { if (!lightbox) return; const ni = (lightbox.idx + 1) % photos.length; setLightbox({ photo: photos[ni], idx: ni }); };

  if (photos.length === 0) return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>📷</div>
      <p className="font-mono" style={{ color: 'rgba(178,200,237,0.35)', fontSize: 14 }}>
        {isOwner ? 'No photos yet — add your first memory!' : 'Gallery coming soon...'}
      </p>
    </div>
  );

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {photos.map((p, i) => (
          <div key={p.id}
            onClick={() => open(p, i)}
            style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', aspectRatio: '1/1', cursor: 'pointer' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}>
            <img src={p.url} alt={p.caption} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)', opacity: 0, transition: 'opacity 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0'; }}>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px' }}>
                <p className="font-serif" style={{ color: 'white', fontSize: 12, fontStyle: 'italic', marginBottom: 2 }}>"{p.caption}"</p>
                <p className="font-mono" style={{ color: '#e9c349', fontSize: 10 }}>📍 {p.location}</p>
              </div>
            </div>
            {isOwner && (
              <button onClick={e => { e.stopPropagation(); if (window.confirm('Remove photo?')) onDelete?.(p.id); }}
                style={{ position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: '50%', background: 'rgba(239,68,68,0.8)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', opacity: 0.85 }}>
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={close}
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fadeIn 0.2s ease-out' }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: 520, width: '100%' }}>
            <img src={lightbox.photo.url} alt="" style={{ width: '100%', borderRadius: 24, boxShadow: '0 32px 80px rgba(0,0,0,0.8)', display: 'block' }} />
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <p className="font-serif" style={{ color: 'white', fontSize: 16, fontStyle: 'italic' }}>"{lightbox.photo.caption}"</p>
              <p className="font-mono" style={{ color: '#e9c349', fontSize: 12, marginTop: 6 }}>📍 {lightbox.photo.location} · {lightbox.photo.date}</p>
            </div>
            <button onClick={close} style={{ position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <X size={18} />
            </button>
            {photos.length > 1 && (
              <>
                <button onClick={e => { e.stopPropagation(); prev(); }} style={{ position: 'absolute', left: 12, top: '40%', width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <ChevronLeft size={22} />
                </button>
                <button onClick={e => { e.stopPropagation(); next(); }} style={{ position: 'absolute', right: 12, top: '40%', width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <ChevronRight size={22} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

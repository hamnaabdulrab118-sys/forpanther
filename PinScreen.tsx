import React, { useState, useRef, useEffect } from 'react';
import { Stars } from './Stars';

interface Props { onUnlock: () => void; }

export const PinScreen: React.FC<Props> = ({ onUnlock }) => {
  const CORRECT = '5425';
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { inputs.current[0]?.focus(); }, []);

  const verify = (pin: string) => {
    if (pin === CORRECT) {
      onUnlock();
    } else {
      setError(true);
      setShaking(true);
      setTimeout(() => {
        setShaking(false);
        setDigits(['', '', '', '']);
        setError(false);
        inputs.current[0]?.focus();
      }, 650);
    }
  };

  const onChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...digits];
    next[i] = val.slice(-1);
    setDigits(next);
    setError(false);
    if (val && i < 3) inputs.current[i + 1]?.focus();
    if (i === 3 && val) verify(next.join(''));
  };

  const onKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#000005 0%,#000814 40%,#000d20 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <Stars />
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 380, padding: '0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', animation: 'slideUp 0.5s ease-out forwards' }}>
          <div style={{ fontSize: 72, marginBottom: 12, display: 'inline-block', animation: 'float 6s ease-in-out infinite' }}>🦖🐾</div>
          <h1 className="font-serif gold-glow" style={{ fontSize: 42, fontWeight: 700, color: '#ffddb0', marginBottom: 6 }}>For Panther</h1>
          <p className="font-serif" style={{ color: '#b2c8ed', fontSize: 14, fontStyle: 'italic' }}>From your Dino, with love ✈️</p>
          <div className="glass-gold font-mono" style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 999, fontSize: 12, color: '#b2c8ed' }}>
            <span style={{ color: '#e9c349' }}>📍</span> Sialkot
            <span style={{ color: '#e9c349' }}>✈️</span> Ormara
            <span style={{ color: '#e9c349', fontWeight: 700 }}>· 730 km</span>
          </div>
        </div>

        {/* PIN card */}
        <div className="glass-gold" style={{ width: '100%', borderRadius: 28, padding: 36, boxShadow: '0 24px 60px rgba(0,0,0,0.5)', animation: 'slideUp 0.5s 0.1s ease-out forwards', opacity: 0 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔐</div>
            <p className="font-mono" style={{ fontSize: 11, color: '#e9c349', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Enter Access Code</p>
          </div>

          <div className={shaking ? 'do-shake' : ''} style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 16 }}>
            {digits.map((d, i) => (
              <input key={i}
                ref={el => (inputs.current[i] = el)}
                type="password" inputMode="numeric" maxLength={1}
                value={d}
                onChange={e => onChange(i, e.target.value)}
                onKeyDown={e => onKey(i, e)}
                className="font-mono"
                style={{
                  width: 58, height: 68, textAlign: 'center', fontSize: 30, fontWeight: 700,
                  background: 'rgba(0,13,32,0.85)', border: `2px solid ${error ? '#f87171' : d ? '#e9c349' : 'rgba(178,200,237,0.2)'}`,
                  borderRadius: 16, color: '#ffddb0', outline: 'none',
                  boxShadow: d ? '0 0 14px rgba(233,195,73,0.3)' : 'none',
                  transition: 'all 0.2s',
                }} />
            ))}
          </div>

          {error && (
            <p className="font-mono" style={{ textAlign: 'center', color: '#f87171', fontSize: 12, marginBottom: 12, animation: 'fadeIn 0.2s ease-out' }}>
              Incorrect code. Try again 💫
            </p>
          )}

          <button onClick={() => verify(digits.join(''))} className="btn-gold"
            style={{ width: '100%', padding: '16px 0', borderRadius: 18, fontSize: 14, border: 'none', cursor: 'pointer', letterSpacing: '0.05em' }}>
            Unlock Letters ✨
          </button>
        </div>

        <p className="font-mono" style={{ color: 'rgba(178,200,237,0.2)', fontSize: 11 }}>Awaiting clearance...</p>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Send } from 'lucide-react';

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

let replyIdx = 0;
const getReply = () => MOON_REPLIES[replyIdx++ % MOON_REPLIES.length];
const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

interface Msg { id: string; from: 'dino' | 'moon'; text: string; time: string; }
interface Props { onClose: () => void; }

export const MoonChat: React.FC<Props> = ({ onClose }) => {
  const [msgs, setMsgs] = useState<Msg[]>([{
    id: '0', from: 'moon',
    text: "Hello, little Dino 🦖 I've been watching over your Panther tonight. What's on your heart? 🌙",
    time: now(),
  }]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  const stars = useMemo(() =>
    Array.from({ length: 120 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 75,
      s: Math.random() * 2 + 0.3, d: Math.random() * 3 + 2, dl: Math.random() * 5, op: Math.random() * 0.6 + 0.2,
    })), []);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, typing]);

  const send = () => {
    if (!input.trim()) return;
    const m: Msg = { id: Date.now().toString(), from: 'dino', text: input.trim(), time: now() };
    setMsgs(p => [...p, m]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs(p => [...p, { id: (Date.now() + 1).toString(), from: 'moon', text: getReply(), time: now() }]);
    }, 1200 + Math.random() * 900);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg,#000005 0%,#000814 50%,#000d20 100%)' }}>

      {/* Stars */}
      {stars.map(s => (
        <div key={s.id} style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, borderRadius: '50%', background: 'white', opacity: s.op, animation: `twinkle ${s.d}s ease-in-out ${s.dl}s infinite`, pointerEvents: 'none' }} />
      ))}

      {/* Shooting stars */}
      {[0, 1, 2].map(i => (
        <div key={i} style={{ position: 'absolute', left: `${8 + i * 22}%`, top: `${4 + i * 4}%`, animation: `shooting 2.5s ease-out ${i * 8 + 3}s infinite`, pointerEvents: 'none' }}>
          <div style={{ width: 1, height: 72, background: 'linear-gradient(to bottom,white,transparent)', transform: 'rotate(35deg)', opacity: 0.7 }} />
        </div>
      ))}

      {/* Moon */}
      <div style={{ position: 'absolute', top: 20, right: 20, pointerEvents: 'none', animation: 'pulseGlow 2.5s ease-in-out infinite' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'radial-gradient(circle,#fef9c3,#fde68a,#fbbf24)',
          boxShadow: '0 0 40px rgba(251,191,36,0.55)',
        }}>
          <span style={{ fontSize: 36 }}>🌙</span>
        </div>
      </div>

      {/* Header */}
      <div className="glass" style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <h2 className="font-serif" style={{ fontSize: 22, fontWeight: 700, color: '#ffddb0' }}>Talk to the Moon</h2>
          <p className="font-mono" style={{ fontSize: 11, color: 'rgba(178,200,237,0.45)', marginTop: 2 }}>Whisper across the miles ✈️</p>
        </div>
        <button onClick={onClose}
          style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(178,200,237,0.08)', border: '1px solid rgba(178,200,237,0.12)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b2c8ed' }}>
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 10 }}>
        {msgs.map(m => (
          <div key={m.id} style={{ display: 'flex', justifyContent: m.from === 'dino' ? 'flex-end' : 'flex-start', animation: 'fadeIn 0.3s ease-out' }}>
            {m.from === 'moon' && (
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 10, flexShrink: 0, marginTop: 4, fontSize: 16 }}>🌙</div>
            )}
            <div style={{ maxWidth: 300 }}>
              <div style={{
                padding: '12px 18px', borderRadius: 22, fontSize: 14, lineHeight: 1.6,
                background: m.from === 'dino' ? '#e9c349' : 'rgba(3,28,57,0.8)',
                color: m.from === 'dino' ? '#000d20' : '#eef4ff',
                fontWeight: m.from === 'dino' ? 500 : 400,
                borderBottomRightRadius: m.from === 'dino' ? 6 : 22,
                borderBottomLeftRadius: m.from === 'moon' ? 6 : 22,
                border: m.from === 'moon' ? '1px solid rgba(251,191,36,0.15)' : 'none',
              }} className={m.from === 'dino' ? '' : 'font-serif'}>
                {m.text}
              </div>
              <p className="font-mono" style={{ fontSize: 10, color: 'rgba(178,200,237,0.3)', marginTop: 4, textAlign: m.from === 'dino' ? 'right' : 'left' }}>
                {m.from === 'dino' ? 'Dino 🦖' : 'Moon 🌙'} · {m.time}
              </p>
            </div>
            {m.from === 'dino' && (
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 10, flexShrink: 0, marginTop: 4, fontSize: 16 }}>🦖</div>
            )}
          </div>
        ))}

        {typing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🌙</div>
            <div style={{ padding: '14px 18px', borderRadius: '22px 22px 22px 6px', background: 'rgba(3,28,57,0.8)', border: '1px solid rgba(251,191,36,0.15)', display: 'flex', gap: 6 }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#fbbf24', animation: `bounceDot 1s ease-in-out ${i * 0.15}s infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={bottom} />
      </div>

      {/* Input */}
      <div className="glass" style={{ position: 'relative', zIndex: 10, padding: '14px 16px 24px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Whisper to the moon..."
            className="font-serif"
            style={{ flex: 1, background: 'rgba(0,13,32,0.8)', border: '1px solid rgba(251,191,36,0.18)', borderRadius: 20, padding: '13px 18px', color: '#eef4ff', fontSize: 14, outline: 'none' }} />
          <button onClick={send} disabled={!input.trim()} className="btn-gold"
            style={{ width: 50, height: 50, borderRadius: 16, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Send size={18} />
          </button>
        </div>
        <p className="font-mono" style={{ textAlign: 'center', fontSize: 10, color: 'rgba(178,200,237,0.22)', marginTop: 10 }}>Your words travel with every shooting star ✨</p>
      </div>
    </div>
  );
};

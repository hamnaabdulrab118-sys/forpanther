import React, { useMemo } from 'react';

export const Stars: React.FC = () => {
  const stars = useMemo(() =>
    Array.from({ length: 150 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.4 + 0.3,
      dur: Math.random() * 3 + 2,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.6 + 0.2,
    })), []);

  const shooting = useMemo(() =>
    Array.from({ length: 5 }, (_, i) => ({
      id: i,
      x: Math.random() * 50 + 5,
      y: Math.random() * 30 + 2,
      delay: i * 5 + Math.random() * 4,
    })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {stars.map(s => (
        <div key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`, top: `${s.y}%`,
            width: s.size, height: s.size,
            opacity: s.opacity,
            animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }} />
      ))}
      {shooting.map(s => (
        <div key={s.id}
          className="absolute"
          style={{
            left: `${s.x}%`, top: `${s.y}%`,
            animation: `shooting 2.5s ease-out ${s.delay}s infinite`,
          }}>
          <div style={{
            width: 1, height: 80,
            background: 'linear-gradient(to bottom, white, transparent)',
            transform: 'rotate(35deg)',
            opacity: 0.75,
          }} />
        </div>
      ))}
    </div>
  );
};

import { useEffect, useState } from 'react';

export default function LoadingScreen({ onDone }) {
  const [progress, setProgress] = useState(0);
  const [logoIn, setLogoIn] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t0 = setTimeout(() => setLogoIn(true), 120);

    const start = Date.now();
    const DURATION = 3000;
    let rafId;

    const tick = () => {
      const elapsed = Date.now() - start;
      const raw = Math.min(elapsed / DURATION, 1);
      // Smooth ease-out cubic
      const eased = 1 - Math.pow(1 - raw, 3);
      setProgress(Math.round(eased * 100));

      if (raw < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          setExiting(true);
          setTimeout(() => onDone?.(), 700);
        }, 400);
      }
    };
    rafId = requestAnimationFrame(tick);

    return () => { clearTimeout(t0); cancelAnimationFrame(rafId); };
  }, [onDone]);

  return (
    <>
      <style>{CSS_KEYFRAMES}</style>

      {/* ── Root overlay ── */}
      <div className="ses-root" style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: "'Inter', system-ui, sans-serif",
        WebkitFontSmoothing: 'antialiased',
        animation: exiting ? 'ses-exit 700ms cubic-bezier(0.4,0,1,1) forwards'
          : 'ses-bg 12s ease-in-out infinite',
        background: 'linear-gradient(-45deg,#f0f8ff,#dbeafe,#e0f2fe,#eff6ff,#f5f9ff)',
        backgroundSize: '400% 400%',
      }}>

        {/* Floating particles */}
        {PARTICLES.map((p, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: p.x, top: p.y,
            width: p.s, height: p.s,
            borderRadius: '50%',
            background: p.c,
            willChange: 'transform, opacity',
            animation: `${p.a} ${p.d}s ease-in-out ${p.dl}s infinite`,
          }} />
        ))}

        {/* Big soft glow */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: 'clamp(300px, 60vmin, 520px)',
          height: 'clamp(260px, 52vmin, 440px)',
          transform: 'translate(-50%, -52%)',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(59,130,246,0.13) 0%, transparent 70%)',
          willChange: 'transform, opacity',
          animation: 'ses-glow 4s ease-in-out infinite',
          pointerEvents: 'none',
        }} />

        {/* ── Logo + rings ── */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

          {/* Outer orbital ring */}
          <Ring size="clamp(220px,42vmin,296px)" dur="5s" opacity={0.65} dir="normal" offset="80%" />
          {/* Inner orbital ring */}
          <Ring size="clamp(182px,35vmin,248px)" dur="8s" opacity={0.45} dir="reverse" offset="75%" />

          {/* Glassy circle card */}
          <div style={{
            position: 'relative',
            width: 'clamp(136px,26vmin,188px)',
            height: 'clamp(136px,26vmin,188px)',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.88)',
            boxShadow:
              '0 12px 48px rgba(59,130,246,0.16),' +
              '0  4px 16px rgba(59,130,246,0.10),' +
              'inset 0 1px 0 rgba(255,255,255,1)',
            backdropFilter: 'blur(16px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            willChange: 'transform, opacity, filter',
            animation: logoIn
              ? 'ses-logo-in 0.9s cubic-bezier(0.34,1.5,0.64,1) forwards'
              : 'none',
            opacity: logoIn ? undefined : 0,
          }}>
            <img
              src="/logo.png"
              alt="SES"
              style={{ width: '78%', height: '78%', objectFit: 'contain', display: 'block' }}
            />
            {/* Glass highlight */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'linear-gradient(135deg,rgba(255,255,255,0.55) 0%,transparent 55%)',
              pointerEvents: 'none',
            }} />
          </div>
        </div>

        {/* ── Text block ── */}
        <div style={{
          marginTop: 'clamp(22px,4.5vmin,36px)',
          textAlign: 'center',
          animation: 'ses-text-in 0.7s 0.55s cubic-bezier(0.16,1,0.3,1) both',
        }}>
          <h1 style={{
            margin: 0, padding: 0,
            fontSize: 'clamp(16px,2.8vmin,21px)',
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            background: 'linear-gradient(90deg,#1e40af 0%,#0ea5e9 40%,#1d4ed8 70%,#0ea5e9 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'ses-shimmer 3s linear infinite',
          }}>
            Student Evaluation System
          </h1>
          <p style={{
            margin: '5px 0 0',
            fontSize: 'clamp(9px,1.6vmin,11px)',
            fontWeight: 600,
            letterSpacing: '0.3em',
            color: '#94a3b8',
            textTransform: 'uppercase',
          }}>
            Initializing platform
          </p>
        </div>

        {/* ── Progress bar ── */}
        <div style={{
          marginTop: 'clamp(20px,3.8vmin,30px)',
          width: 'clamp(200px,48vw,340px)',
          animation: 'ses-text-in 0.7s 0.75s cubic-bezier(0.16,1,0.3,1) both',
        }}>
          {/* Track */}
          <div style={{
            width: '100%', height: 5, borderRadius: 99,
            background: 'rgba(59,130,246,0.10)',
            overflow: 'hidden', position: 'relative',
          }}>
            {/* Fill */}
            <div style={{
              position: 'absolute', inset: 0,
              right: `${100 - progress}%`,
              borderRadius: 99,
              background: 'linear-gradient(90deg,#3b82f6,#0ea5e9)',
              boxShadow: '0 0 12px rgba(59,130,246,0.55)',
              transition: 'right 160ms cubic-bezier(0.25,0.46,0.45,0.94)',
            }}>
              {/* Travelling shimmer */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)',
                animation: 'ses-bar-shine 1.4s linear infinite',
              }} />
            </div>
          </div>

          {/* Labels */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginTop: 8,
          }}>
            <span style={{
              fontSize: 'clamp(9px,1.4vmin,11px)', fontWeight: 600,
              letterSpacing: '0.22em', color: '#94a3b8', textTransform: 'uppercase',
            }}>Loading</span>
            <span style={{
              fontSize: 'clamp(11px,1.8vmin,13px)', fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              background: 'linear-gradient(90deg,#2563eb,#0ea5e9)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>{progress}%</span>
          </div>
        </div>

      </div>
    </>
  );
}

/* ── Orbital ring helper ── */
function Ring({ size, dur, opacity, dir, offset }) {
  return (
    <div style={{
      position: 'absolute',
      width: size, height: size,
      borderRadius: '50%',
      border: '1.5px solid transparent',
      background: `
        linear-gradient(white,white) padding-box,
        conic-gradient(from 0deg, transparent ${offset}, rgba(59,130,246,0.9) 100%) border-box
      `,
      opacity,
      willChange: 'transform',
      animation: `${dir === 'reverse' ? 'ses-orbit-rev' : 'ses-orbit'} ${dur} linear infinite`,
    }} />
  );
}

/* ── Particles ── */
const PARTICLES = [
  { x: '7%', y: '11%', s: 10, c: 'rgba(59,130,246,0.30)', a: 'ses-fa', d: 6.2, dl: 0 },
  { x: '18%', y: '71%', s: 7, c: 'rgba(14,165,233,0.25)', a: 'ses-fb', d: 8.0, dl: 1.0 },
  { x: '79%', y: '14%', s: 12, c: 'rgba(37,99,235,0.22)', a: 'ses-fc', d: 5.8, dl: 0.4 },
  { x: '87%', y: '67%', s: 8, c: 'rgba(59,130,246,0.28)', a: 'ses-fa', d: 8.5, dl: 1.5 },
  { x: '4%', y: '44%', s: 6, c: 'rgba(14,165,233,0.24)', a: 'ses-fb', d: 6.9, dl: 2.2 },
  { x: '91%', y: '39%', s: 9, c: 'rgba(96,165,250,0.26)', a: 'ses-fc', d: 7.4, dl: 0.7 },
  { x: '44%', y: '87%', s: 7, c: 'rgba(59,130,246,0.20)', a: 'ses-fa', d: 9.0, dl: 1.8 },
  { x: '54%', y: '4%', s: 10, c: 'rgba(14,165,233,0.24)', a: 'ses-fb', d: 6.6, dl: 1.1 },
  { x: '29%', y: '79%', s: 6, c: 'rgba(37,99,235,0.18)', a: 'ses-fc', d: 8.8, dl: 2.6 },
  { x: '69%', y: '81%', s: 8, c: 'rgba(96,165,250,0.24)', a: 'ses-fa', d: 7.2, dl: 1.3 },
  { x: '24%', y: '7%', s: 9, c: 'rgba(59,130,246,0.26)', a: 'ses-fb', d: 7.0, dl: 0.6 },
  { x: '61%', y: '91%', s: 6, c: 'rgba(14,165,233,0.20)', a: 'ses-fc', d: 9.3, dl: 2.0 },
];

/* ── All keyframes ── */
const CSS_KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

  @keyframes ses-bg {
    0%,100% { background-position: 0% 50%; }
    50%      { background-position: 100% 50%; }
  }
  @keyframes ses-exit {
    to { opacity: 0; transform: scale(1.05); }
  }
  @keyframes ses-orbit {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes ses-orbit-rev {
    from { transform: rotate(0deg); }
    to   { transform: rotate(-360deg); }
  }
  @keyframes ses-logo-in {
    0%   { opacity:0; transform:scale(0.55) translateY(18px); filter:blur(10px); }
    60%  { opacity:1; transform:scale(1.06) translateY(-3px); filter:blur(0); }
    80%  { transform:scale(0.97) translateY(2px); }
    100% { transform:scale(1) translateY(0); }
  }
  @keyframes ses-text-in {
    from { opacity:0; transform:translateY(14px); filter:blur(4px); }
    to   { opacity:1; transform:translateY(0);    filter:blur(0); }
  }
  @keyframes ses-glow {
    0%,100% { opacity:.55; transform:translate(-50%,-52%) scale(1);    }
    50%      { opacity:.85; transform:translate(-50%,-52%) scale(1.06); }
  }
  @keyframes ses-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes ses-bar-shine {
    0%   { left:-50%; }
    100% { left:130%; }
  }
  @keyframes ses-fa {
    0%,100% { transform:translateY(0)    translateX(0)    scale(1);    opacity:.5; }
    35%      { transform:translateY(-16px) translateX(7px)  scale(1.18); opacity:.85; }
    70%      { transform:translateY(9px)   translateX(-5px) scale(.88);  opacity:.6; }
  }
  @keyframes ses-fb {
    0%,100% { transform:translateY(0)    translateX(0);     opacity:.38; }
    50%      { transform:translateY(20px) translateX(-9px);  opacity:.75; }
  }
  @keyframes ses-fc {
    0%,100% { transform:translateY(0)    translateX(0)    scale(1);    opacity:.45; }
    42%      { transform:translateY(-11px) translateX(-7px) scale(1.14); opacity:.80; }
    82%      { transform:translateY(7px)   translateX(11px) scale(.92);  opacity:.52; }
  }
`;
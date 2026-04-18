import { useEffect, useState } from 'react';
import { GraduationCap } from 'lucide-react';

const loadingSteps = [
  "Establishing secure connection...",
  "Loading student dashboard...",
  "Syncing academic modules...",
  "Optimizing interface...",
  "Almost ready..."
];

export default function LoadingScreen({ onDone }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const duration = 2500;

    const tick = () => {
      const elapsed = Date.now() - start;
      const easeOutQuart = 1 - Math.pow(1 - elapsed / duration, 4);
      const pct = Math.min(100, easeOutQuart * 100);

      setProgress(pct);

      if (elapsed < duration) {
        requestAnimationFrame(tick);
      } else {
        setPhase(1);
        setTimeout(() => onDone?.(), 600);
      }
    };
    requestAnimationFrame(tick);
  }, [onDone]);

  const stepIndex = Math.min(
    Math.floor((progress / 100) * loadingSteps.length),
    loadingSteps.length - 1
  );

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#0047AB] to-[#001a40] transition-all duration-700 ease-in-out ${phase === 1 ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
        }`}
    >
      {/* Enterprise Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)] opacity-70" />

      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Highly Animated Logo Container */}
      <div className="relative mb-12 group animate-logo-entrance">
        {/* Outer ambient pulse */}
        <div className="absolute -inset-2 bg-white/20 rounded-2xl blur-xl opacity-60 animate-pulse-slow" />

        {/* The Spinning Gradient Border Container */}
        <div className="relative w-28 h-28 rounded-2xl p-[2px] overflow-hidden flex items-center justify-center shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
          {/* Spinning Light Effect */}
          <div className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_0_280deg,#60A5FA_360deg)] animate-[spin_2s_linear_infinite]" />

          {/* Inner White Solid Box */}
          <div className="absolute inset-[2px] bg-white rounded-[14px] z-10" />

          {/* Animated Logo Icon */}
          <div className="z-20 animate-float">
            <GraduationCap size={48} className="text-[#0047AB] drop-shadow-md" />
          </div>
        </div>
      </div>

      {/* Typography & Animated Text */}
      <div className="text-center z-10 flex flex-col items-center">
        <h1 className="text-white font-bold text-3xl tracking-tight mb-3 flex items-center gap-2 drop-shadow-lg">
          Student Eval System
        </h1>

        {/* Dynamic Status Text with Blur-Reveal */}
        <div className="h-8 overflow-hidden relative w-72 flex justify-center mb-10">
          {/* The key property forces React to re-mount the element, triggering the animation again */}
          <p
            key={stepIndex}
            className="text-blue-100/90 text-sm font-semibold tracking-wide absolute animate-text-reveal"
          >
            {loadingSteps[stepIndex]}
          </p>
        </div>

        {/* Premium Progress Bar */}
        <div className="w-80 flex flex-col items-end gap-2">
          <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden relative shadow-inner backdrop-blur-sm">
            <div
              className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-150 ease-out shadow-[0_0_12px_rgba(255,255,255,0.8)]"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer Effect Inside Bar */}
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-blue-400/40 to-transparent -translate-x-full animate-shimmer" />
            </div>
          </div>

          <span className="text-blue-100 text-xs font-mono tracking-widest font-bold">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      <style>{`
        /* Cinematic Text Entrance */
        @keyframes text-reveal {
          0% { opacity: 0; transform: translateY(15px) scale(0.95); filter: blur(4px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        
        /* Smooth Floating Logo */
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }

        /* Initial Screen Load Logo Scale */
        @keyframes logo-entrance {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        /* Fast Shimmer for Progress Bar */
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }

        /* Ambient Glow Pulse */
        @keyframes pulse-slow { 
          0%, 100% { opacity: 0.4; transform: scale(1); } 
          50% { opacity: 0.7; transform: scale(1.05); } 
        }

        .animate-text-reveal { animation: text-reveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-logo-entrance { animation: logo-entrance 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-shimmer { animation: shimmer 1.2s infinite; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
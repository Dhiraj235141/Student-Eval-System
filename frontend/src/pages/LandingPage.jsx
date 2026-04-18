import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowRight, Brain, BarChart2, Users, Shield, ChevronDown } from 'lucide-react';

export default function LandingPage() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animRef = useRef(null);
  const particlesRef = useRef([]);
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleNavigation = (path) => {
    setIsExiting(true);
    setTimeout(() => {
      navigate(path);
    }, 600); // Provide enough time for fade out
  };

  // Entrance animation
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Canvas particle system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const newParticles = [];
      const spacingX = 35; // Dense structural grid
      const spacingY = 35;
      const cols = Math.floor(canvas.width / spacingX) + 2;
      const rows = Math.floor(canvas.height / spacingY) + 2;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          newParticles.push({
            ox: i * spacingX,
            oy: j * spacingY,
            x: i * spacingX,
            y: j * spacingY,
            vx: 0,
            vy: 0
          });
        }
      }
      particlesRef.current = newParticles;
    };
    resize();
    window.addEventListener('resize', resize);

    const mouseMoveHandler = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', mouseMoveHandler);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Standard transparent clear

      const mouse = mouseRef.current;
      const particles = particlesRef.current;

      particles.forEach((p) => {
        // Stationary spring physics (They do not drift wildly! They are tied to their origin)
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let opacity = 0; // Completely invisible by default
        const REVEAL_RADIUS = 250;

        // When mouse is near, they repel and light up
        if (dist < REVEAL_RADIUS) {
          const force = (REVEAL_RADIUS - dist) / REVEAL_RADIUS;
          p.vx -= (dx / dist) * Math.pow(force, 1.5) * 2.5;
          p.vy -= (dy / dist) * Math.pow(force, 1.5) * 2.5;

          // Spotlight visibility fading based on distance to mouse
          opacity = Math.pow(force, 1.2) * 1.5;
        }

        // Strong spring logic pulling them back to their rigid grid origin
        p.vx += (p.ox - p.x) * 0.15;
        p.vy += (p.oy - p.y) * 0.15;

        // Friction to quickly dampen movement
        p.vx *= 0.80;
        p.vy *= 0.80;

        p.x += p.vx;
        p.y += p.vy;

        // Draw only if illuminated by the mouse
        if (opacity > 0.01) {
          const normalizedX = p.ox / canvas.width;
          let r, g, b;

          // Authentic Color Zoning mapped to their permanent origin
          if (normalizedX < 0.40) {
            r = 148; g = 163; b = 184; // Neutral Slate
          } else if (normalizedX < 0.65) {
            r = 181; g = 66; b = 111; // Deep Crimson/Pink
          } else {
            r = 49; g = 104; b = 206; // Vivid Blue
          }

          ctx.beginPath();
          // Draw a very tiny, premium dot exactly matching Antigravity sizes
          ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.min(opacity, 1)})`;
          ctx.fill();
        }
      });

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', mouseMoveHandler);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  const features = [
    { icon: Brain, title: 'AI-Powered Tests', desc: 'Unique questions generated per student from your syllabus', color: 'from-blue-500 to-cyan-400' },
    { icon: BarChart2, title: 'Smart Analytics', desc: 'Track performance, weak topics, and growth over time', color: 'from-purple-500 to-pink-400' },
    { icon: Users, title: 'Multi-Role System', desc: 'Student, Teacher, and Admin dashboards in one platform', color: 'from-emerald-500 to-teal-400' },
    { icon: Shield, title: 'Anti-Cheat Monitoring', desc: 'Tab switch detection and timed exams for integrity', color: 'from-orange-500 to-amber-400' },
  ];

  return (
    <div className={`relative min-h-screen bg-white overflow-hidden font-inter transition-opacity duration-700 ease-in-out ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
      {/* Gradient overlays (Placed under canvas) */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-white via-slate-50 to-white pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed bottom-0 right-1/4 w-80 h-80 bg-blue-100/40 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Canvas background */}
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
            <GraduationCap size={20} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-base tracking-tight">Student Eval System</span>
        </div>
        <button
          onClick={() => handleNavigation('/login')}
          className="text-sm text-gray-600 hover:text-blue-600 transition-colors font-semibold"
        >
          Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[88vh] text-center px-6">
        <div className={`transition-all duration-1000 ${visible && !isExiting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 px-4 py-1.5 rounded-full text-xs font-semibold mb-8 shadow-sm">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            AI-Powered Education Platform
          </div>

          {/* Main heading */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-gray-900 leading-tight mb-6 tracking-tight">
            Learn Smarter,{' '}
            <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 bg-clip-text text-transparent">
              Grow Faster
            </span>
          </h1>

          <p className="text-gray-600 text-lg sm:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            A complete student evaluation ecosystem with AI-generated tests, smart attendance tracking,
            assignment management, and real-time performance analytics.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <button
              onClick={() => handleNavigation('/login')}
              className="group flex items-center gap-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300 text-base hover:-translate-y-0.5 active:translate-y-0"
            >
              Start Journey
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => {
                document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold px-6 py-4 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all text-sm"
            >
              Learn More <ChevronDown size={16} />
            </button>
          </div>
        </div>

        {/* Floating stats */}
        <div className={`absolute bottom-12 flex gap-8 transition-all duration-1000 delay-500 ${visible && !isExiting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {[
            { value: 'AI', label: 'Generated Tests' },
            { value: '3', label: 'User Roles' },
            { value: '100%', label: 'Secure Exams' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl font-black text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">Everything in One Place</h2>
            <p className="text-gray-600 max-w-xl mx-auto">Built for modern classrooms with AI at its core, making education measurable and effective.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className="group relative bg-white border border-gray-100 rounded-2xl p-6 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 cursor-default"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon size={22} className="text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center pb-8 text-gray-400 font-medium text-xs">
        © 2026 Student Evaluation System. All rights reserved.
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        .font-inter { font-family: 'Inter', sans-serif; }
      `}</style>
    </div>
  );
}

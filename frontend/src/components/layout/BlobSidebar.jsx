import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Shield, MessageSquare, Info, Rocket, X, Menu } from 'lucide-react';

const BlobSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Home', icon: Home, path: '/' },
    { name: 'Privacy Policy', icon: Shield, path: '/privacy' },
    { name: 'Feedback', icon: MessageSquare, path: '/feedback' },
    { name: 'About Us', icon: Info, path: '/about' },
    { name: 'Contact', icon: MessageSquare, path: '/contact' },
    { name: 'Start Journey', icon: Rocket, path: '/login', highlight: true },
  ];

  const handleNavigate = (path) => {
    setIsOpen(false);
    // Smooth delay to allow the sidebar to slide out before navigating
    setTimeout(() => {
      navigate(path);
    }, 500);
  };

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) setIsOpen(false);
    };
    window.addEventListener('keydown', handleEsc);

    // Lock body scroll when menu is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Menu Toggle Button - Perfectly aligned with logo */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-[18px] right-8 z-[60] p-3 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden"
        aria-label="Toggle Menu"
      >
        <div className="relative z-10">
          {isOpen ? (
            <X size={24} className="text-gray-900 group-hover:rotate-90 transition-transform duration-300" />
          ) : (
            <Menu size={24} className="text-gray-900 group-hover:scale-110 transition-transform duration-300" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-gray-900/10 backdrop-blur-[2px] z-[50] transition-opacity duration-500 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar Container - Optimized Mobile Width to prevent wrapping */}
      <div
        className={`fixed top-0 right-0 h-screen w-[60%] sm:w-[45%] md:w-1/3 bg-white shadow-[-20px_0_100px_-15px_rgba(0,0,0,0.08)] z-[55] transition-all duration-700 ease-[cubic-bezier(0.85,0,0.15,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* The "Blob" Morphing Edge - Smooth Organic Curve */}
        <div
          className={`absolute top-0 left-0 h-full w-16 -translate-x-full overflow-hidden pointer-events-none transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        >
          <svg
            viewBox="0 0 100 100"
            className="h-full w-full fill-white"
            preserveAspectRatio="none"
          >
            <path d="M100 0 C 30 0, 0 25, 0 50 C 0 75, 30 100, 100 100 Z" />
          </svg>
        </div>

        {/* Sidebar Content - Clean & Non-wrapping */}
        <div className="relative h-full flex flex-col p-5 pt-24 overflow-y-auto scrollbar-hide">
          <style>{`
            .scrollbar-hide::-webkit-scrollbar { display: none; }
            .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>

          <nav className="flex flex-col gap-3 py-6">
            {menuItems.map((item, index) => (
              <button
                key={item.name}
                onClick={() => handleNavigate(item.path)}
                className={`group flex items-center gap-4 transition-all duration-300 relative overflow-hidden whitespace-nowrap ${item.highlight
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-1 p-4 rounded-[28px] mt-4'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50/50 p-4 rounded-2xl'
                  }`}
                style={{
                  transitionDelay: `${index * 50}ms`,
                  transform: isOpen ? 'translateX(0)' : 'translateX(50px)',
                  opacity: isOpen ? 1 : 0
                }}
              >
                <item.icon size={item.highlight ? 22 : 20} className={item.highlight ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
                <span className={`font-bold ${item.highlight ? 'text-lg' : 'text-base'}`}>{item.name}</span>

                {!item.highlight && (
                  <div className="absolute right-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2 transition-all">
                    <Rocket size={16} className="text-blue-500" />
                  </div>
                )}
              </button>
            ))}
          </nav>

          {/* Bottom Decorative Element to fill space */}
          <div className="mt-auto pt-10 pb-6 opacity-40">
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-6" />
            <div className="flex justify-center gap-4">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500/20" />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500/20" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlobSidebar;

import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Github, Twitter, Linkedin, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="relative z-10 bg-[#0a0a0a] border-t border-white/5 pt-10 pb-6 overflow-hidden text-gray-400">

      {/* Decorative Blobs */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-rose-900/10 rounded-full blur-3xl opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md p-1.5 shrink-0">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>

              <div>
                <h3 className="font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 text-xl tracking-tight">Student Eval System</h3>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] animate-pulse">Education Reimagined</p>
              </div>
            </div>
            {/* Description removed as requested */}
            {/* Social icons removed */}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white mb-4 text-base tracking-tight">Quick Links</h4>
            <ul className="space-y-3">

              {[
                { name: 'About Us', path: '/about' },
                { name: 'Contact', path: '/contact' },
                { name: 'Feedback', path: '/feedback' },
                { name: 'Login / Signup', path: '/login' },
              ].map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="relative text-gray-400 hover:text-blue-400 transition-all duration-300 text-sm font-medium flex items-center gap-2 group hover:translate-x-2">
                    <span className="absolute -inset-2 bg-blue-500/0 group-hover:bg-blue-500/5 rounded-xl transition-all duration-300 -z-10" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-blue-500 transition-all duration-300" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="font-bold text-white mb-4 text-base tracking-tight">Policies</h4>
            <ul className="space-y-3">

              {[
                { name: 'Privacy Policy', path: '/privacy' },
                { name: 'Terms of Service', path: '/terms' },
              ].map((link) => (
                <li key={link.name}>
                  <Link to={link.path} className="relative text-gray-400 hover:text-blue-400 transition-all duration-300 text-sm font-medium flex items-center gap-2 group hover:translate-x-2">
                    <span className="absolute -inset-2 bg-blue-500/0 group-hover:bg-blue-500/5 rounded-xl transition-all duration-300 -z-10" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-blue-500 transition-all duration-300" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold text-white mb-4 text-base tracking-tight">Contact Info</h4>
            <ul className="space-y-3">

              <li className="flex items-start gap-3 group">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mt-0.5 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Email Us</p>
                  <a href="mailto:studentevalsystem@gmail.com" className="text-gray-300 hover:text-blue-400 font-bold text-sm transition-all duration-300 inline-block hover:translate-x-1">studentevalsystem@gmail.com</a>
                </div>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mt-0.5 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Call Us</p>
                  <div className="flex flex-col gap-1">
                    <a href="tel:+9579970183" className="text-gray-300 hover:text-blue-400 font-bold text-sm transition-all duration-300 inline-block hover:translate-x-1">+91 9579970183</a>
                    <a href="tel:+917972815280" className="text-gray-300 hover:text-blue-400 font-bold text-sm transition-all duration-300 inline-block hover:translate-x-1">+91 7972815280</a>
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mt-0.5 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Visit Us</p>
                  <p className="text-gray-300 font-bold text-sm leading-tight">Government Polytechnic Nashik</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Credits Section */}
        <div className="border-t border-white/5 pt-8 pb-4">

          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <p className="text-gray-500 text-[11px] leading-relaxed mb-6 font-medium">
              Developed by <span className="text-white font-bold">Vishal Misal,Dhiraj Patil,Kunal Patil,Mansi Patil,Janhavi Nandan,Rakshanda Kakade</span>
              <br />
              <span className="opacity-60">Department of Information Technology, Government Polytechnic Nashik (Batch 2023–2026)</span>
              <br />
              Guided by <span className="text-white font-bold">Prof: Mrs.D.V.Agrawal</span>
            </p>
            <div className="w-12 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6" />
            <p className="text-gray-600 text-[10px] font-bold uppercase tracking-[0.3em]">
              2026 © Copyright Student Evaluation System All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

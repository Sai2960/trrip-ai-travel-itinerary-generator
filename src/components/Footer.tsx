import React from 'react';
import { Compass, Gift, Heart, ShieldCheck } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext.js';

export function Footer() {
  const { navigate } = useNavigation();

  return (
    <footer className="w-full bg-slate-950 border-t border-slate-900/60 py-12 px-4 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0 text-center md:text-left">
        
        {/* Left corner: Logo and sub-tagline */}
        <div className="flex flex-col items-center md:items-start space-y-2">
          <div className="flex items-center space-x-1.5 cursor-pointer" onClick={() => navigate('landing')}>
            <Compass className="w-4 h-4 text-cyan-400" />
            <span className="text-base font-bold text-white tracking-tight">
              Trrip<span className="text-cyan-400 font-normal">.ai</span>
            </span>
          </div>
          <p className="text-xs text-slate-500">
            A secure AI Travel Companion designed by Senior Architect.
          </p>
        </div>

        {/* Middle part: environment status markers */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
          <div className="flex items-center space-x-1.5 bg-slate-900/40 border border-slate-800/80 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            <span>Gemini LLM Engine Online</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-slate-900/40 border border-slate-800/80 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
            <span>MERN Secure Storage</span>
          </div>
        </div>

        {/* Right side: standard licensing */}
        <div className="flex flex-col items-center md:items-end space-y-1">
          <p className="text-xs text-slate-500 flex items-center space-x-1 justify-center md:justify-end">
            <span>© {new Date().getFullYear()} Trrip AI. Designed with</span>
            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
            <span>for travellers.</span>
          </p>
          <p className="text-[10px] text-slate-600 font-mono">
            Vite 6 • Node 22 • Express 4 • React 19
          </p>
        </div>

      </div>
    </footer>
  );
}

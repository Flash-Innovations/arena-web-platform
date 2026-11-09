import React from 'react';
import { Link } from 'react-router-dom';
import { Swords, Trophy, ExternalLink, Layers, Sparkles } from 'lucide-react';

export function ArenaNavbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-black tracking-wider text-white">FLASH</span>
              <span className="ml-1.5 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold">
                ARENA
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/contest/studio"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Contest Studio</span>
          </Link>

          <Link
            to="/series"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Coding Series 2026</span>
          </Link>

          {/* Quick link back to the Student Placement Portal */}
          <a
            href="https://student.flashedu.in"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors"
          >
            <span>Training Deck</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
        </nav>
      </div>
    </header>
  );
}

export default ArenaNavbar;

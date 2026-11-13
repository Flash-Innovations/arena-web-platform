import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Terminal, Trophy, ExternalLink, Layers, ArrowUpRight } from 'lucide-react';

export function ArenaNavbar() {
  const location = useLocation();

  const navItems = [
    { label: 'Duels & Lobby', path: '/' },
    { label: 'Tournament Series', path: '/series' },
    { label: 'Contest Studio', path: '/contest/studio' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-[#09090b]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 text-zinc-100 hover:text-white transition-colors group">
            <div className="w-6 h-6 rounded bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-zinc-300 group-hover:border-zinc-500 transition-colors">
              <Terminal className="w-3.5 h-3.5 text-zinc-200" />
            </div>
            <div className="flex items-center gap-1.5 font-mono text-xs tracking-tight">
              <span className="font-bold text-zinc-100">FLASH</span>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-400 font-semibold">ARENA</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-800 text-zinc-100 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Utilities */}
        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-2 py-0.5 rounded bg-zinc-900/60 border border-zinc-800 text-[11px] font-mono text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Judge0 VM : Online</span>
          </div>

          {/* Training Deck Link */}
          <a
            href="https://student.flashedu.in"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-zinc-800 transition-colors"
          >
            <span>Student Portal</span>
            <ArrowUpRight className="w-3 h-3 text-zinc-500" />
          </a>
        </div>
      </div>
    </header>
  );
}

export default ArenaNavbar;

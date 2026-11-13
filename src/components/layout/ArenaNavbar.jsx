import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Terminal, Trophy, ArrowUpRight, LogOut, User as UserIcon, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function ArenaNavbar() {
  const location = useLocation();
  const { user, isAuthenticated, openAuthModal, logout, getSpectatorQuota } = useAuth();
  const spectatorQuota = getSpectatorQuota();

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
        <div className="flex items-center gap-2.5">
          {/* Spectator Quota Badge for Guests */}
          {!isAuthenticated && !spectatorQuota.isUnlimited && (
            <div
              onClick={() => openAuthModal({
                mode: 'signin',
                title: 'Guest Spectator Pass',
                message: `You have ${spectatorQuota.remaining} of 3 free spectator previews remaining. Sign in for unlimited access.`
              })}
              className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900/80 border border-zinc-800 text-[11px] font-mono text-zinc-400 hover:text-zinc-300 hover:border-zinc-700 cursor-pointer transition-colors"
              title="Click to sign in for unlimited spectator access"
            >
              <Eye className="w-3 h-3 text-zinc-500" />
              <span>Spectator: <strong className="text-zinc-200">{spectatorQuota.remaining}/3</strong></span>
            </div>
          )}

          {/* Training Deck Link */}
          <a
            href="https://student.flashedu.in"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-zinc-800 transition-colors"
          >
            <span>Student Portal</span>
            <ArrowUpRight className="w-3 h-3 text-zinc-500" />
          </a>

          {/* Authentication State */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {/* Rating ELO Badge */}
              <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300">
                <Trophy className="w-3 h-3 text-amber-400" />
                <span className="font-semibold text-zinc-200">{user?.rating || 1200}</span>
                <span className="text-zinc-500 text-[10px]">ELO</span>
              </div>

              {/* User Pill */}
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-200">
                <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-300 overflow-hidden">
                  {user?.avatar || user?.profileImageUrl ? (
                    <img src={user.avatar || user.profileImageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{(user?.name || 'G')[0].toUpperCase()}</span>
                  )}
                </div>
                <span className="max-w-[100px] truncate hidden sm:inline">{user?.name || 'Gladiator'}</span>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={logout}
                title="Log out"
                className="p-1.5 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors cursor-pointer"
                aria-label="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => openAuthModal({ mode: 'signin' })}
                className="px-2.5 py-1 rounded text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => openAuthModal({ mode: 'signup' })}
                className="px-2.5 py-1 rounded bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition-colors cursor-pointer"
              >
                Join Arena
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default ArenaNavbar;

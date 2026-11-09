import React, { useState } from 'react';
import { Trophy, Frown, Share2, ArrowRight, ExternalLink, RefreshCw, Swords } from 'lucide-react';
import arenaApi from '../../api/arenaApi';

export function VictoryModal({ isOpen, isWinner, match, winReason, onPlayAgain }) {
  const [rematchLoading, setRematchLoading] = useState(false);

  if (!isOpen) return null;

  const handleShareWhatsApp = () => {
    const text = `I just claimed a Sudden Death 1v1 Battle Victory on Flash Arena! Think you have faster DSA chops? Challenge me: https://arena.flashedu.in`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleRequestRematch = async () => {
    if (!match?.roomCode) return;
    try {
      setRematchLoading(true);
      const res = await arenaApi.requestRematch(match.roomCode);
      if (res.success && res.newRoomCode) {
        window.location.href = `/battle/${res.newRoomCode}`;
      }
    } catch (err) {
      onPlayAgain();
    } finally {
      setRematchLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-8 text-center space-y-6 shadow-2xl">
        
        {/* Glow Header Icon */}
        <div className="flex justify-center">
          {isWinner ? (
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-xl shadow-amber-500/30 text-slate-950 animate-bounce">
              <Trophy className="w-10 h-10" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
              <Frown className="w-10 h-10" />
            </div>
          )}
        </div>

        {/* Title & Reason */}
        <div className="space-y-2">
          <h2 className={`text-3xl font-black tracking-tight ${isWinner ? 'text-amber-400' : 'text-slate-200'}`}>
            {isWinner ? 'SUDDEN DEATH VICTORY!' : 'KNOCKED OUT!'}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {isWinner
              ? 'You passed 100% of test cases first and claimed the 1v1 match victory.'
              : 'Your opponent achieved sudden death by passing all test cases first.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {/* Rematch Button */}
          <button
            onClick={handleRequestRematch}
            disabled={rematchLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            <Swords className="w-4 h-4" />
            <span>{rematchLoading ? 'Creating Rematch...' : 'Request Instant Rematch'}</span>
          </button>

          {isWinner ? (
            <button
              onClick={handleShareWhatsApp}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-emerald-600/20"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Victory on WhatsApp</span>
            </button>
          ) : (
            <a
              href="https://student.flashedu.in"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Train on Student Portal</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>
          )}

          <button
            onClick={onPlayAgain}
            className="w-full py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Return to Arena Lobby</span>
          </button>
        </div>

      </div>
    </div>
  );
}

export default VictoryModal;

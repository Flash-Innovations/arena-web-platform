import React, { useState, useEffect } from 'react';
import { Swords, Shield, Zap, ArrowRight, X } from 'lucide-react';
import { useMatchmaking } from '../../context/MatchmakingContext';

export function MatchFoundModal() {
  const { foundMatch, acceptFoundMatch, declineFoundMatch, isSparringAiInBackground } = useMatchmaking();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (!foundMatch) {
      setCountdown(10);
      return;
    }

    setCountdown(10);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          acceptFoundMatch();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [foundMatch, acceptFoundMatch]);

  if (!foundMatch) return null;

  const opponent = foundMatch.opponent || foundMatch.match?.player1 || foundMatch.match?.player2;
  const isRanked = foundMatch.queueType === 'RANKED';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-zinc-950 border-2 border-amber-500/80 shadow-2xl shadow-amber-500/20 p-6 space-y-5 text-center overflow-hidden">
        {/* Animated Background Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Top Badge */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Swords className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div>
          <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest uppercase mb-1.5 ${
            isRanked
              ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
              : 'bg-blue-950/80 text-blue-300 border border-blue-800/80'
          }`}>
            {isRanked ? 'Ranked 1v1 Arena Clash' : 'Casual Sparring Duel'}
          </span>
          <h2 className="text-2xl font-black text-zinc-100 tracking-tight">
            MATCH FOUND!
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            An active contender has joined the duel. Ready up for the showdown.
          </p>
        </div>

        {/* Opponent Card Preview */}
        <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center gap-3 text-left">
          <img
            src={opponent?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(opponent?.name || 'Challenger')}`}
            alt={opponent?.name || 'Opponent'}
            className="w-12 h-12 rounded-xl border border-zinc-700 bg-zinc-800 shrink-0 object-cover"
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-zinc-100 truncate">
              {opponent?.name || 'Verified Gladiator'}
            </div>
            <div className="text-xs text-zinc-400 font-mono truncate">
              {opponent?.collegeName || 'Student Challenger'}
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 text-[10px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Connected
            </span>
          </div>
        </div>

        {isSparringAiInBackground && (
          <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-800/40 text-[11px] text-blue-300">
            You are currently in an AI sparring session. Entering will switch you to the live human duel.
          </div>
        )}

        {/* Action Controls */}
        <div className="space-y-2 pt-1">
          <button
            onClick={acceptFoundMatch}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/30"
          >
            <span>Enter Battle Room Now ({countdown}s)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={declineFoundMatch}
            className="w-full py-2 px-3 text-xs text-zinc-400 hover:text-rose-400 transition-colors font-mono cursor-pointer"
          >
            Decline Match
          </button>
        </div>
      </div>
    </div>
  );
}

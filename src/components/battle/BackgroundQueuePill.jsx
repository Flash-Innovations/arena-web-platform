import React from 'react';
import { Loader2, X, Zap, Bot } from 'lucide-react';
import { useMatchmaking } from '../../context/MatchmakingContext';

export function BackgroundQueuePill() {
  const {
    isMatchmaking,
    isSparringAiInBackground,
    matchmakingQueueType,
    searchTimer,
    cancelMatchmaking
  } = useMatchmaking();

  if (!isMatchmaking || !isSparringAiInBackground) return null;

  const minutes = Math.floor(searchTimer / 60);
  const seconds = searchTimer % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isRanked = matchmakingQueueType === 'RANKED';

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[70] pointer-events-auto animate-in slide-in-from-top-3 duration-300">
      <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-zinc-950/95 border border-amber-500/50 shadow-xl shadow-amber-500/10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span className="text-[11px] font-mono text-zinc-300 flex items-center gap-1.5">
            <span className={`px-1.5 py-0.2 rounded font-bold uppercase ${
              isRanked ? 'bg-amber-950 text-amber-300' : 'bg-blue-950 text-blue-300'
            }`}>
              {isRanked ? 'Ranked' : 'Casual'}
            </span>
            <span>Searching pool in background...</span>
            <span className="text-amber-400 font-bold">{formattedTime}</span>
          </span>
        </div>

        <button
          onClick={cancelMatchmaking}
          className="text-zinc-500 hover:text-rose-400 transition-colors p-0.5 rounded cursor-pointer"
          title="Cancel background matchmaking"
          aria-label="Cancel background search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

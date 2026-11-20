import React from 'react';
import { Bot, Clock, ArrowRight, X } from 'lucide-react';
import { useMatchmaking } from '../../context/MatchmakingContext';

export function AiSparringOfferModal() {
  const {
    showAiPrompt,
    matchmakingQueueType,
    acceptAiSparring,
    dismissAiPrompt,
    cancelMatchmaking
  } = useMatchmaking();

  if (!showAiPrompt) return null;

  const isRanked = matchmakingQueueType === 'RANKED';

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-zinc-950 border border-blue-500/60 shadow-2xl shadow-blue-500/10 p-6 space-y-4 text-center">
        {/* Dismiss Button */}
        <button
          onClick={dismissAiPrompt}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Icon */}
        <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
          <Bot className="w-6 h-6 animate-pulse" />
        </div>

        <div>
          <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest uppercase bg-blue-950/80 text-blue-300 border border-blue-800/80 mb-1.5">
            1 Minute Queue Threshold
          </span>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">
            Play Casual Game with AI?
          </h2>
          <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
            Finding a human {isRanked ? 'ranked' : 'casual'} opponent is taking longer than usual.
            You can spar with an AI Neural Rival right now while we continue searching in the background.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-left text-xs space-y-1.5">
          <div className="flex items-center gap-2 text-zinc-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Zero-wait warm-up code duel vs AI</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Search stays active: Instant alert as soon as match is found</span>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <button
            onClick={acceptAiSparring}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-blue-600/30"
          >
            <Bot className="w-4 h-4" />
            <span>Spar AI While Searching in Background</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={dismissAiPrompt}
            className="w-full py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs border border-zinc-800 transition-colors cursor-pointer"
          >
            Keep Waiting in Lobby
          </button>

          <button
            onClick={cancelMatchmaking}
            className="text-[11px] text-zinc-500 hover:text-rose-400 transition-colors font-mono cursor-pointer"
          >
            Cancel Matchmaking
          </button>
        </div>
      </div>
    </div>
  );
}

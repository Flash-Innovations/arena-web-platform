import React, { useState } from 'react';
import { ArrowRight, Share2, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import arenaApi from '../../api/arenaApi';

export function VictoryModal({ isOpen, isWinner, match, winReason, onPlayAgain }) {
  const [rematchLoading, setRematchLoading] = useState(false);

  if (!isOpen) return null;

  const handleShareWhatsApp = () => {
    const text = `I just won a 1v1 Code Duel on Flash Arena (${match?.problemTitle || 'DSA Problem'}). Challenge me: https://arena.flashedu.in`;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm rounded-xl bg-zinc-900 border border-zinc-800 p-6 space-y-5 shadow-2xl">
        
        {/* Status Indicator */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {isWinner ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-zinc-400" />
            )}
            <span className={`text-xs font-mono font-semibold uppercase tracking-wider ${isWinner ? 'text-emerald-400' : 'text-zinc-400'}`}>
              {isWinner ? 'Victory Confirmed' : 'Match Concluded'}
            </span>
          </div>
          <h2 className="text-lg font-bold text-zinc-100">
            {isWinner ? 'You won the duel' : 'Opponent passed all test cases first'}
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {isWinner
              ? 'All test cases passed and verified by Judge0 runtime before opponent.'
              : 'Better luck next match. Analyze the problem or request a fresh rematch.'}
          </p>
        </div>

        {/* Telemetry Summary */}
        <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-850 space-y-2 text-xs font-mono">
          <div className="flex justify-between text-zinc-400">
            <span>Room Code</span>
            <span className="text-zinc-200 font-bold">{match?.roomCode || 'FLASH-0000'}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Problem</span>
            <span className="text-zinc-200 truncate max-w-[180px]">{match?.problemTitle || 'Challenge'}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Game Mode</span>
            <span className="text-zinc-200">{match?.gameMode?.replace('_', ' ') || 'Speed DSA'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleRequestRematch}
            disabled={rematchLoading}
            className="w-full py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {rematchLoading ? 'Configuring Rematch...' : 'Rematch with Fresh Problem'}
          </button>

          {isWinner && (
            <button
              onClick={handleShareWhatsApp}
              className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 font-medium text-xs border border-zinc-700/80 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Result on WhatsApp</span>
            </button>
          )}

          <button
            onClick={onPlayAgain}
            className="w-full py-1.5 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors cursor-pointer"
          >
            Return to Arena Lobby
          </button>
        </div>

      </div>
    </div>
  );
}

export default VictoryModal;

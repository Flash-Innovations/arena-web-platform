import React, { useState } from 'react';
import { ArrowRight, Share2, RefreshCw, CheckCircle2, XCircle, Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import { arenaApi } from '../../api/arenaApi';

export function VictoryModal({ isOpen, isWinner, match, winReason, ratingChange, newRating, onPlayAgain }) {
  const [rematchLoading, setRematchLoading] = useState(false);

  if (!isOpen) return null;

  const handleShareWhatsApp = () => {
    const text = `I just won a 1v1 Code Duel on Flash Arena (${match?.problemTitle || 'DSA Challenge'}). Challenge me: https://arena.flashedu.in`;
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

  const getWinReasonDescription = () => {
    if (winReason === 'FORFEIT') {
      return isWinner ? 'Opponent conceded the match.' : 'You forfeited the match.';
    }
    if (winReason === 'WALKOVER') {
      return isWinner ? 'Opponent disconnected and exceeded the 45-second reconnect window.' : 'Match abandoned.';
    }
    if (winReason === 'SHORTEST_CODE') {
      return isWinner ? 'Victory by Code Golf (Shortest verified byte count).' : 'Opponent submitted a more concise solution.';
    }
    if (winReason === 'MOST_TEST_CASES') {
      return isWinner ? 'Victory by test case count at time limit.' : 'Opponent completed more test cases.';
    }
    return isWinner
      ? 'All test cases passed and verified before opponent.'
      : 'Opponent passed all test cases first.';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm rounded-xl bg-zinc-900 border border-zinc-800 p-6 space-y-5 shadow-2xl">
        
        {/* Status Indicator */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
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

            {/* Elo Rating Delta Badge */}
            {ratingChange !== undefined && ratingChange !== null && (
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold ${
                ratingChange >= 0
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {ratingChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{ratingChange >= 0 ? `+${ratingChange}` : ratingChange} ELO</span>
              </div>
            )}
          </div>

          <h2 className="text-lg font-bold text-zinc-100">
            {isWinner ? 'Victory in the Arena' : 'Defeat in the Arena'}
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {getWinReasonDescription()}
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
          {newRating && (
            <div className="flex justify-between text-zinc-400 pt-1 border-t border-zinc-800/60">
              <span>Updated ELO</span>
              <span className="text-zinc-100 font-bold">{newRating} ELO</span>
            </div>
          )}
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

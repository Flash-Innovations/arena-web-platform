import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Share2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Trophy,
  TrendingUp,
  TrendingDown,
  Code2,
  Eye,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Swords,
  Clock,
  AlertCircle
} from 'lucide-react';
import { arenaApi } from '../../api/arenaApi';
import GladiatorBadge from '../common/GladiatorBadge';

export function VictoryModal({
  isOpen,
  isWinner,
  match,
  winReason,
  ratingChange,
  newRating,
  onPlayAgain,
  rematchState,
  currentUserId,
  onRematchUpdate
}) {
  const navigate = useNavigate();
  const [rematchLoading, setRematchLoading] = useState(false);
  const [rematchError, setRematchError] = useState('');
  const [localRematch, setLocalRematch] = useState(() => rematchState || match?.rematch || { status: 'NONE' });
  const [showReview, setShowReview] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [loadingReview, setLoadingReview] = useState(false);

  useEffect(() => {
    if (rematchState) {
      setLocalRematch(rematchState);
    } else if (match?.rematch) {
      setLocalRematch(match.rematch);
    }
  }, [rematchState, match?.rematch]);

  if (!isOpen) return null;

  const isCasual = match?.queueType === 'CASUAL' || Boolean(match?.isAiRival);
  const isDraw = !match?.winnerId || winReason === 'TIEBREAKER_SEED';

  const myIdStr = currentUserId ? currentUserId.toString() : '';
  const requesterIdStr = localRematch?.requestedBy ? localRematch.requestedBy.toString() : '';
  const isMyRequest = localRematch?.status === 'REQUESTED' && requesterIdStr === myIdStr;
  const isIncomingRequest = localRematch?.status === 'REQUESTED' && requesterIdStr && requesterIdStr !== myIdStr;
  const isAccepted = localRematch?.status === 'ACCEPTED';
  const isDeclined = localRematch?.status === 'DECLINED';

  const handleReturnLobby = () => {
    if (typeof onPlayAgain === 'function') {
      onPlayAgain();
    } else {
      navigate('/');
    }
  };

  const handleShareWhatsApp = () => {
    const text = `I just won a 1v1 Code Duel on Flash Arena (${match?.problemTitle || 'DSA Challenge'}). Challenge me: https://arena.flashedu.in`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleRequestRematch = async () => {
    if (!match?.roomCode) return;
    try {
      setRematchLoading(true);
      setRematchError('');
      const res = await arenaApi.requestRematch(match.roomCode);
      if (res.success) {
        if (res.newRoomCode) {
          window.location.href = `/battle/${res.newRoomCode}`;
          return;
        }
        if (res.rematch) {
          setLocalRematch(res.rematch);
          if (onRematchUpdate) onRematchUpdate(res.rematch);
        }
      }
    } catch (err) {
      setRematchError(err.message || 'Failed to request rematch.');
    } finally {
      setRematchLoading(false);
    }
  };

  const handleAcceptRematch = async () => {
    if (!match?.roomCode) return;
    try {
      setRematchLoading(true);
      setRematchError('');
      const res = await arenaApi.acceptRematch(match.roomCode);
      if (res.success && res.newRoomCode) {
        window.location.href = `/battle/${res.newRoomCode}`;
      }
    } catch (err) {
      setRematchError(err.message || 'Failed to accept rematch.');
    } finally {
      setRematchLoading(false);
    }
  };

  const handleDeclineRematch = async () => {
    if (!match?.roomCode) return;
    try {
      setRematchLoading(true);
      const res = await arenaApi.declineRematch(match.roomCode);
      if (res.success && res.rematch) {
        setLocalRematch(res.rematch);
        if (onRematchUpdate) onRematchUpdate(res.rematch);
      }
    } catch (err) {
      // Ignore
    } finally {
      setRematchLoading(false);
    }
  };

  const loadReviewData = async () => {
    if (reviewData) {
      setShowReview(!showReview);
      return;
    }

    try {
      setLoadingReview(true);
      const res = await arenaApi.getMatchReview(match.roomCode);
      if (res.success && res.match) {
        setReviewData(res.match);
        setShowReview(true);
      }
    } catch (e) {
      // Ignore
    } finally {
      setLoadingReview(false);
    }
  };

  const getWinReasonDescription = () => {
    if (isDraw) {
      return 'Time expired: Neither competitor passed all required test cases before the final buzzer. Match ended in a draw.';
    }
    if (winReason === 'MALPRACTICE_DISQUALIFIED') {
      return isWinner
        ? 'Opponent was disqualified due to anti-cheat malpractice (exiting full screen or repeated tab focus violations).'
        : 'You were disqualified for exceeding anti-cheat malpractice limits (tab switching or exiting full-screen).';
    }
    if (winReason === 'FORFEIT') {
      return isWinner ? 'Opponent surrendered and conceded the duel.' : 'You surrendered and forfeited the match.';
    }
    if (winReason === 'WALKOVER') {
      return isWinner ? 'Opponent disconnected and exceeded the 45-second reconnect window.' : 'You disconnected and exceeded the reconnect grace window.';
    }
    if (winReason === 'SHORTEST_CODE') {
      return isWinner ? 'Victory by Code Golf: You submitted a valid passing solution with fewer code bytes than opponent.' : 'Opponent submitted a more concise valid solution.';
    }
    if (winReason === 'MOST_TEST_CASES') {
      return isWinner ? 'Victory by test case count: You passed more test cases than opponent before the timer expired.' : 'Time expired: Opponent completed more test cases at the final buzzer.';
    }
    if (winReason === 'FIRST_AC') {
      return isWinner
        ? 'First All-Correct Submission: You submitted and verified 100% of test cases before opponent!'
        : 'Opponent submitted an all-correct solution first.';
    }
    return isWinner
      ? 'Victory confirmed in the Arena.'
      : 'Match concluded. Better luck in the next duel.';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className={`relative w-full ${showReview ? 'max-w-2xl' : 'max-w-sm'} rounded-xl bg-zinc-900 border border-zinc-800 p-6 space-y-5 shadow-2xl transition-all my-8`}>
        {/* Status Indicator */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isDraw ? (
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
              ) : isWinner ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-zinc-400" />
              )}
              <span className={`text-xs font-mono font-semibold uppercase tracking-wider ${
                isDraw ? 'text-amber-400' : isWinner ? 'text-emerald-400' : 'text-zinc-400'
              }`}>
                {isDraw ? 'Match Drawn' : isWinner ? 'Victory Confirmed' : 'Match Concluded'}
              </span>
            </div>

            {/* Elo Rating Delta or Casual Stakes Badge */}
            {isCasual ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-blue-950/60 text-blue-300 border border-blue-800/60 font-semibold">
                Casual / 0 Elo Risk
              </span>
            ) : ratingChange !== undefined && ratingChange !== null ? (
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold ${
                  ratingChange > 0
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : ratingChange < 0
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-zinc-800 text-zinc-300 border border-zinc-750'
                }`}
              >
                {ratingChange > 0 ? <TrendingUp className="w-3 h-3" /> : ratingChange < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                <span>{ratingChange > 0 ? `+${ratingChange}` : ratingChange} ELO</span>
              </div>
            ) : null}
          </div>

          <h2 className="text-lg font-bold text-zinc-100">
            {isDraw ? 'Match Drawn' : isWinner ? 'Victory in the Arena' : 'Defeat in the Arena'}
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
            <span>Match Stakes</span>
            <span className="text-zinc-200">{match?.queueType || 'RANKED'}</span>
          </div>
          {newRating && !isCasual && (
            <div className="flex items-center justify-between text-zinc-400 pt-1 border-t border-zinc-800/60">
              <span>Gladiator Rating</span>
              <GladiatorBadge elo={newRating} size="xs" />
            </div>
          )}
        </div>

        {/* Toggle Post-Match Code Review */}
        <div className="pt-1">
          <button
            type="button"
            onClick={loadReviewData}
            disabled={loadingReview}
            className="w-full py-2 px-3 rounded-lg bg-zinc-800/90 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 text-xs font-mono flex items-center justify-between border border-zinc-700 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5 text-amber-400" />
              <span>{showReview ? 'Hide Code Diff & Analysis' : 'Review Code Diff & Complexity'}</span>
            </div>
            {showReview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Side-by-Side Review Section */}
        {showReview && reviewData && (
          <div className="space-y-4 pt-2 border-t border-zinc-800 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              {/* Player 1 Submission */}
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-zinc-200 truncate">{reviewData.player1.name}</span>
                  <span className="text-emerald-400">
                    {reviewData.player1.testCasesPassed}/{reviewData.player1.totalTestCases || 5} AC
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500">
                  Tab Blurs: {reviewData.player1.tabBlurCount || 0} | Length: {reviewData.player1.codeLength} chars
                </div>
                <pre className="max-h-40 overflow-y-auto p-2 rounded bg-zinc-900 border border-zinc-850 text-[10px] text-zinc-300 font-mono">
                  {reviewData.player1.code || '// No code submitted'}
                </pre>
              </div>

              {/* Player 2 Submission */}
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-zinc-200 truncate">{reviewData.player2.name}</span>
                  <span className="text-emerald-400">
                    {reviewData.player2.testCasesPassed}/{reviewData.player2.totalTestCases || 5} AC
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500">
                  Tab Blurs: {reviewData.player2.tabBlurCount || 0} | Length: {reviewData.player2.codeLength} chars
                </div>
                <pre className="max-h-40 overflow-y-auto p-2 rounded bg-zinc-900 border border-zinc-850 text-[10px] text-zinc-300 font-mono">
                  {reviewData.player2.code || '// No code submitted'}
                </pre>
              </div>
            </div>

            {/* Anti-Cheat Transparency Audit */}
            <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-850 flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fair-Play Anti-Cheat Telemetry Verified</span>
              </div>
              <span className="text-zinc-500">
                {reviewData.antiCheatLogs?.length || 0} telemetry logs
              </span>
            </div>
          </div>
        )}

        {/* Rematch Handshake & Action Banners */}
        {rematchError && (
          <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs font-mono">
            {rematchError}
          </div>
        )}

        {isAccepted && (
          <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-700/60 text-center space-y-1 animate-fade-in">
            <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold text-xs">
              <Swords className="w-4 h-4 animate-spin" />
              <span>Rematch Accepted! Launching Arena...</span>
            </div>
            <p className="text-[11px] text-zinc-400">Preparing fresh question and starting timers</p>
          </div>
        )}

        {isIncomingRequest && !isAccepted && (
          <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-600/60 space-y-2.5 animate-fade-in">
            <div className="flex items-center gap-2">
              <Swords className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-200">
                {localRematch.requestedByName || 'Opponent'} has challenged you to a Rematch!
              </span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-normal">
              Accept to immediately start a fresh 1v1 duel with a new problem.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleAcceptRematch}
                disabled={rematchLoading}
                className="py-1.5 px-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-md"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>{rematchLoading ? 'Starting...' : 'Accept Rematch'}</span>
              </button>
              <button
                type="button"
                onClick={handleDeclineRematch}
                disabled={rematchLoading}
                className="py-1.5 px-3 rounded-md bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-medium text-xs transition-colors cursor-pointer border border-zinc-700"
              >
                Decline
              </button>
            </div>
          </div>
        )}

        {isMyRequest && !isAccepted && (
          <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-700/50 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
                <Clock className="w-4 h-4 animate-pulse text-blue-400" />
                <span>Rematch Challenge Sent</span>
              </div>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-200">
                Waiting for Opponent
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Prompt displayed on opponent's screen. The duel will begin as soon as they accept.
            </p>
          </div>
        )}

        {isDeclined && (
          <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs text-zinc-400 animate-fade-in">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-zinc-500" />
              <span>Opponent declined the rematch challenge.</span>
            </div>
            <button
              type="button"
              onClick={handleRequestRematch}
              disabled={rematchLoading}
              className="text-[11px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
            >
              Send Again
            </button>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="space-y-2 pt-1">
          {!isMyRequest && !isIncomingRequest && !isAccepted && (
            <button
              type="button"
              onClick={handleRequestRematch}
              disabled={rematchLoading}
              className="w-full py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Swords className="w-3.5 h-3.5" />
              <span>{rematchLoading ? 'Sending Challenge...' : 'Rematch with Fresh Problem'}</span>
            </button>
          )}

          {isWinner && (
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 font-medium text-xs border border-zinc-700/80 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Result on WhatsApp</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleReturnLobby}
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

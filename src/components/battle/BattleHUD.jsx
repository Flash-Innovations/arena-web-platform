import React, { useState } from 'react';
import { Timer, Radio, Flag, Wifi, WifiOff, Volume2, VolumeX, Mic, MicOff, Zap } from 'lucide-react';
import arenaSound from '../../services/arenaSoundService';

export function BattleHUD({
  match,
  opponentProgress,
  myWpm = 0,
  timeRemainingSeconds,
  opponentStatus = 'ONLINE',
  disconnectGraceSeconds = null,
  onForfeit,
  isCompetitor = false
}) {
  const [isAudioOn, setIsAudioOn] = useState(() => arenaSound.isMasterEnabled());
  const [isVoiceOn, setIsVoiceOn] = useState(() => arenaSound.isVoiceEnabled());

  const toggleAudio = () => {
    const next = !isAudioOn;
    setIsAudioOn(next);
    arenaSound.setMasterEnabled(next);
  };

  const toggleVoice = () => {
    const next = !isVoiceOn;
    setIsVoiceOn(next);
    arenaSound.setVoiceEnabled(next);
  };
  const p1 = match?.player1 || {};
  const p2 = match?.player2 || {};

  const formatTime = (secs) => {
    if (secs === null || secs === undefined || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isCriticalTime = timeRemainingSeconds !== null && timeRemainingSeconds < 120; // Under 2 mins

  const p1Passed = p1.testCasesPassed || 0;
  const p1Total = p1.totalTestCases || 5;

  const p2Passed = opponentProgress?.testCasesPassed ?? (p2.testCasesPassed || 0);
  const p2Total = opponentProgress?.totalTestCases ?? (p2.totalTestCases || 5);

  const renderSegmentedDots = (passed, total) => {
    const dots = [];
    for (let i = 0; i < total; i++) {
      const isPassed = i < passed;
      dots.push(
        <span
          key={i}
          className={`w-2 h-2 rounded-sm transition-colors ${
            isPassed ? 'bg-emerald-500' : 'bg-zinc-800 border border-zinc-700/60'
          }`}
        />
      );
    }
    return <div className="flex items-center gap-1">{dots}</div>;
  };

  return (
    <div className="w-full bg-[#09090b] border-b border-zinc-800 px-4 sm:px-6 py-2 select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Player 1 (Contender) */}
        <div className="flex items-center gap-3 w-1/3 min-w-0">
          <div className="w-7 h-7 rounded bg-zinc-900 border border-zinc-750 flex items-center justify-center font-mono font-bold text-xs text-zinc-200 shrink-0">
            {p1.name ? p1.name.substring(0, 2).toUpperCase() : 'P1'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-100 truncate">{p1.name || 'Player 1'}</span>
              <span className="text-[11px] font-mono font-bold text-zinc-400">
                {p1Passed}/{p1Total}
              </span>
              {myWpm > 0 && (
                <span className="text-[10px] font-mono font-bold text-blue-400 flex items-center gap-0.5 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/30">
                  <Zap className="w-2.5 h-2.5 text-blue-400" />
                  <span>{myWpm} WPM</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {renderSegmentedDots(p1Passed, p1Total)}
              <span className="text-[10px] text-zinc-500 font-mono truncate hidden sm:inline">
                {p1.collegeName || 'Contender'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Real-Time Chess Clock, Room Code & Forfeit */}
        <div className="flex flex-col items-center justify-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-sm font-bold tracking-wider">
              <Timer className={`w-3.5 h-3.5 ${isCriticalTime ? 'text-amber-400' : 'text-zinc-400'}`} />
              <span className={isCriticalTime ? 'text-amber-400 font-mono font-black' : 'text-zinc-100'}>
                {formatTime(timeRemainingSeconds)}
              </span>
            </div>

            {/* Audio & Voice Announcer Toggles */}
            <div className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 rounded px-1 py-0.5">
              <button
                type="button"
                onClick={toggleAudio}
                title={isAudioOn ? 'Mute Game Audio' : 'Unmute Game Audio'}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  isAudioOn ? 'text-zinc-300 hover:text-white' : 'text-zinc-600 hover:text-zinc-400'
                }`}
              >
                {isAudioOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-500" />}
              </button>
              <button
                type="button"
                onClick={toggleVoice}
                title={isVoiceOn ? 'Disable Voice Announcer' : 'Enable Voice Announcer'}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  isVoiceOn ? 'text-blue-400 hover:text-blue-300' : 'text-zinc-600 hover:text-zinc-400'
                }`}
              >
                {isVoiceOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5 text-zinc-500" />}
              </button>
            </div>

            {isCompetitor && match?.status === 'IN_PROGRESS' && onForfeit && (
              <button
                onClick={onForfeit}
                title="Forfeit match and concede to opponent"
                className="px-2 py-0.5 rounded text-[11px] font-mono text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-zinc-800 hover:border-rose-500/20 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Flag className="w-3 h-3" />
                <span className="hidden sm:inline">Forfeit</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 tracking-tight mt-0.5">
            <span>{match?.roomCode || 'FLASH-DUEL'} · {match?.gameMode?.replace('_', ' ')}</span>
            <span
              className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                match?.queueType === 'RANKED'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                  : 'bg-blue-950/80 text-blue-300 border border-blue-800/60'
              }`}
            >
              {match?.isAiRival ? 'AI Rival' : match?.queueType || 'RANKED'}
            </span>
            {opponentStatus === 'DISCONNECTED' && (
              <span className="text-rose-400 flex items-center gap-1 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20 animate-pulse">
                <WifiOff className="w-2.5 h-2.5" />
                <span>Opponent Offline ({disconnectGraceSeconds || 45}s)</span>
              </span>
            )}
          </div>
        </div>

        {/* Right: Player 2 (Opponent) */}
        <div className="flex items-center gap-3 w-1/3 min-w-0 justify-end text-right">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-end gap-2">
              {opponentProgress?.isTyping && (opponentProgress?.wpm || 0) > 0 ? (
                <span className="text-[10px] font-mono font-bold text-amber-400 flex items-center gap-0.5 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/30 animate-pulse">
                  <Zap className="w-2.5 h-2.5 text-amber-400" />
                  <span>{opponentProgress.wpm} WPM</span>
                </span>
              ) : (
                <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">
                  {opponentStatus === 'DISCONNECTED' ? 'Offline' : 'Idle'}
                </span>
              )}
              <span className="text-[11px] font-mono font-bold text-zinc-400">
                {p2Passed}/{p2Total}
              </span>
              <span className="text-xs font-semibold text-zinc-100 truncate">{p2.name || 'Opponent'}</span>
            </div>
            <div className="flex items-center justify-end gap-2 mt-0.5">
              <span className="text-[10px] text-zinc-500 font-mono truncate hidden sm:inline">
                {p2.collegeName || 'Waiting...'}
              </span>
              {renderSegmentedDots(p2Passed, p2Total)}
            </div>
          </div>
          <div className="w-7 h-7 rounded bg-zinc-900 border border-zinc-750 flex items-center justify-center font-mono font-bold text-xs text-zinc-200 shrink-0">
            {p2.name ? p2.name.substring(0, 2).toUpperCase() : 'P2'}
          </div>
        </div>

      </div>
    </div>
  );
}

export default BattleHUD;

import React, { useState, useEffect } from 'react';
import { Timer, Swords, Shield, AlertTriangle } from 'lucide-react';

export function BattleHUD({ match, opponentProgress, timeRemainingSeconds }) {
  const p1 = match?.player1 || {};
  const p2 = match?.player2 || {};

  const formatTime = (secs) => {
    if (secs === null || secs === undefined || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isCriticalTime = timeRemainingSeconds !== null && timeRemainingSeconds < 120; // Last 2 mins

  const p1Passed = p1.testCasesPassed || 0;
  const p1Total = p1.totalTestCases || 5;
  const p1Percent = Math.min(100, Math.round((p1Passed / p1Total) * 100));

  const p2Passed = opponentProgress?.testCasesPassed ?? (p2.testCasesPassed || 0);
  const p2Total = opponentProgress?.totalTestCases ?? (p2.totalTestCases || 5);
  const p2Percent = Math.min(100, Math.round((p2Passed / p2Total) * 100));

  return (
    <div className="w-full bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-4 sm:px-6 py-3 select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Player 1 Card */}
        <div className="flex items-center gap-3 w-full md:w-1/3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center font-bold text-white text-sm shrink-0 border border-indigo-400/30 shadow-md">
            {p1.name ? p1.name.substring(0, 2).toUpperCase() : 'P1'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white truncate">{p1.name || 'Player 1'}</span>
              <span className="text-[10px] font-mono text-indigo-400 font-bold">
                {p1Passed}/{p1Total} Passed
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">{p1.collegeName || 'Contender'}</p>
            <div className="w-full bg-slate-950 h-1.5 rounded-full mt-1 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${p1Percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center: Live Timer & Match VS Pillar */}
        <div className="flex flex-col items-center justify-center shrink-0">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
              ROOM: {match?.roomCode || 'FLASH-0000'}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <Timer className={`w-4 h-4 ${isCriticalTime ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
            <span
              className={`text-xl sm:text-2xl font-black font-mono tracking-wider ${
                isCriticalTime ? 'text-red-400 animate-pulse' : 'text-white'
              }`}
            >
              {formatTime(timeRemainingSeconds)}
            </span>
          </div>
        </div>

        {/* Right: Player 2 / Opponent Card */}
        <div className="flex items-center gap-3 w-full md:w-1/3 justify-end">
          <div className="flex-1 min-w-0 text-right">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-violet-400 font-bold">
                {p2Passed}/{p2Total} Passed
              </span>
              <span className="text-xs font-bold text-white truncate">{p2.name || 'Opponent'}</span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">{p2.collegeName || 'Waiting...'}</p>
            <div className="w-full bg-slate-950 h-1.5 rounded-full mt-1 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-violet-500 to-purple-500 h-full rounded-full transition-all duration-300 ml-auto"
                style={{ width: `${p2Percent}%` }}
              />
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center font-bold text-white text-sm shrink-0 border border-violet-400/30 shadow-md">
            {p2.name ? p2.name.substring(0, 2).toUpperCase() : 'VS'}
          </div>
        </div>

      </div>
    </div>
  );
}

export default BattleHUD;

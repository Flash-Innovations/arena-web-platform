import React, { useState, useEffect } from 'react';
import { Trophy, Swords, Shield, ExternalLink, Sparkles } from 'lucide-react';
import arenaApi from '../api/arenaApi';

export function TournamentBracketPage() {
  const [selectedRound, setSelectedRound] = useState(1);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock Bracket generator if tournament is still in registration
  useEffect(() => {
    async function fetchBracket() {
      try {
        setLoading(true);
        const res = await arenaApi.getTournamentBracket();
        if (res.success && res.matches && res.matches.length > 0) {
          setMatches(res.matches);
        } else {
          // Generate sample seeds for preview
          const sample = [];
          for (let i = 1; i <= 8; i++) {
            sample.push({
              matchIndex: i,
              roomCode: `TOUR-R1-M${String(i).padStart(3, '0')}`,
              player1: { name: `Seed #${i}`, collegeName: 'IIT Delhi', testCasesPassed: 5 },
              player2: { name: `Seed #${513 - i}`, collegeName: 'BITS Pilani', testCasesPassed: 4 },
              winner: `Seed #${i}`,
              status: 'COMPLETED'
            });
          }
          setMatches(sample);
        }
      } catch (err) {
        // Fallback
        const sample = [];
        for (let i = 1; i <= 8; i++) {
          sample.push({
            matchIndex: i,
            roomCode: `TOUR-R1-M${String(i).padStart(3, '0')}`,
            player1: { name: `Seed #${i}`, collegeName: 'IIT Delhi', testCasesPassed: 5 },
            player2: { name: `Seed #${513 - i}`, collegeName: 'BITS Pilani', testCasesPassed: 4 },
            winner: `Seed #${i}`,
            status: 'COMPLETED'
          });
        }
        setMatches(sample);
      } finally {
        setLoading(false);
      }
    }
    fetchBracket();
  }, [selectedRound]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-fade-in">
      {/* Bracket Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-mono text-indigo-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            512-Knockout Single-Elimination Tree
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Flash Coding Series 2026 Bracket
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Standard sports power-of-two seeding (Seed 1 faces Seed 512).
          </p>
        </div>

        {/* Round Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { round: 1, label: 'R512' },
            { round: 2, label: 'R256' },
            { round: 3, label: 'R128' },
            { round: 4, label: 'Super 64' },
            { round: 5, label: 'Sweet 16' },
            { round: 6, label: 'Quarterfinals' },
            { round: 7, label: 'Semifinals' },
            { round: 8, label: 'Grand Finals' }
          ].map((r) => (
            <button
              key={r.round}
              onClick={() => setSelectedRound(r.round)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                selectedRound === r.round
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Matches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {matches.map((m) => (
          <div
            key={m.roomCode}
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 hover:border-indigo-500/50 transition-all shadow-md"
          >
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="font-bold text-indigo-400">{m.roomCode}</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-950 text-[10px] text-slate-400 uppercase">
                {m.status}
              </span>
            </div>

            {/* Players */}
            <div className="space-y-1.5 text-xs">
              <div
                className={`p-2 rounded-lg flex items-center justify-between ${
                  m.winner === m.player1?.name
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold'
                    : 'bg-slate-950 text-slate-300'
                }`}
              >
                <div className="truncate">
                  <span>{m.player1?.name || 'TBD'}</span>
                  <span className="block text-[10px] text-slate-400 font-normal truncate">
                    {m.player1?.collegeName || 'Contender'}
                  </span>
                </div>
                <span className="font-mono text-[11px] ml-2">{m.player1?.testCasesPassed || 0}/5</span>
              </div>

              <div
                className={`p-2 rounded-lg flex items-center justify-between ${
                  m.winner === m.player2?.name
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold'
                    : 'bg-slate-950 text-slate-300'
                }`}
              >
                <div className="truncate">
                  <span>{m.player2?.name || 'TBD'}</span>
                  <span className="block text-[10px] text-slate-400 font-normal truncate">
                    {m.player2?.collegeName || 'Contender'}
                  </span>
                </div>
                <span className="font-mono text-[11px] ml-2">{m.player2?.testCasesPassed || 0}/5</span>
              </div>
            </div>

            <div className="pt-1">
              <a
                href={`/battle/${m.roomCode}`}
                className="w-full py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-indigo-400 text-xs font-mono font-bold flex items-center justify-center gap-1.5 border border-slate-800 transition-colors"
              >
                <span>Enter Duel</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TournamentBracketPage;

import React, { useState, useEffect } from 'react';
import { ExternalLink, Loader2, GitCommit, ChevronRight } from 'lucide-react';
import arenaApi from '../api/arenaApi';

export function TournamentBracketPage() {
  const [selectedRound, setSelectedRound] = useState(1);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBracket() {
      try {
        setLoading(true);
        const res = await arenaApi.getTournamentBracket();
        if (res.success && Array.isArray(res.matches)) {
          setMatches(res.matches);
        } else {
          setMatches([]);
        }
      } catch (err) {
        setMatches([]);
      } finally {
        setLoading(false);
      }
    }
    fetchBracket();
  }, [selectedRound]);

  const roundMatches = matches.filter(m => (m.roundNumber || 1) === selectedRound);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      {/* Bracket Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
              Single-Elimination Draw (K=512)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight mt-1">
            Flash Coding Series 2026 Bracket
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Orthogonal power-of-two draw. Seed 1 faces Seed 512, Seed 2 faces Seed 511.
          </p>
        </div>

        {/* Round Filter Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { round: 1, label: 'R512' },
            { round: 2, label: 'R256' },
            { round: 3, label: 'R128' },
            { round: 4, label: 'Super 64' },
            { round: 5, label: 'Sweet 16' },
            { round: 6, label: 'Quarterfinals' },
            { round: 7, label: 'Semifinals' },
            { round: 8, label: 'Finals' }
          ].map((r) => (
            <button
              key={r.round}
              onClick={() => setSelectedRound(r.round)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                selectedRound === r.round
                  ? 'bg-zinc-800 text-zinc-100 font-semibold'
                  : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-850'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-2">
          <Loader2 className="w-5 h-5 mx-auto text-zinc-400 animate-spin" />
          <p className="text-xs font-mono text-zinc-500">Syncing tournament tree from server...</p>
        </div>
      ) : roundMatches.length === 0 ? (
        <div className="p-12 rounded-xl bg-zinc-900/40 border border-zinc-800 text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-lg bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-400">
            <GitCommit className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">Bracket Seeding Pending</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto leading-relaxed">
              Knockout fixtures will generate immediately upon Day 1 Qualifying Quiz completion on Nov 28. The top 512 contenders will be auto-seeded into the draw.
            </p>
          </div>
          <div className="pt-2">
            <a
              href="/series/quiz"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition-colors"
            >
              <span>Take Stage 1 Quiz</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      ) : (
        /* Matches Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {roundMatches.map((m) => (
            <div
              key={m.roomCode}
              className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span className="font-semibold text-zinc-200">{m.roomCode}</span>
                <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-[10px] text-zinc-400 uppercase">
                  {m.status}
                </span>
              </div>

              {/* Players */}
              <div className="space-y-1 text-xs">
                <div
                  className={`p-2 rounded border flex items-center justify-between font-mono ${
                    m.winner === m.player1?.name
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300 font-bold'
                      : 'bg-zinc-950/60 border-zinc-850 text-zinc-300'
                  }`}
                >
                  <div className="truncate">
                    <span>{m.player1?.name || 'TBD'}</span>
                    <span className="block text-[10px] text-zinc-500 truncate font-normal">
                      {m.player1?.collegeName || 'Contender'}
                    </span>
                  </div>
                  <span className="text-[11px] ml-2 text-zinc-400">{m.player1?.testCasesPassed || 0}/5</span>
                </div>

                <div
                  className={`p-2 rounded border flex items-center justify-between font-mono ${
                    m.winner === m.player2?.name
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300 font-bold'
                      : 'bg-zinc-950/60 border-zinc-850 text-zinc-300'
                  }`}
                >
                  <div className="truncate">
                    <span>{m.player2?.name || 'TBD'}</span>
                    <span className="block text-[10px] text-zinc-500 truncate font-normal">
                      {m.player2?.collegeName || 'Contender'}
                    </span>
                  </div>
                  <span className="text-[11px] ml-2 text-zinc-400">{m.player2?.testCasesPassed || 0}/5</span>
                </div>
              </div>

              <div className="pt-1">
                <a
                  href={`/battle/${m.roomCode}`}
                  className="w-full py-1.5 rounded bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-mono font-medium flex items-center justify-center gap-1 border border-zinc-750 transition-colors"
                >
                  <span>Enter Duel</span>
                  <ExternalLink className="w-3 h-3 text-zinc-500" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TournamentBracketPage;

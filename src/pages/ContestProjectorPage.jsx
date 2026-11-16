import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Trophy,
  Swords,
  Maximize2,
  Minimize2,
  Users,
  Clock,
  Radio,
  Sparkles,
  Megaphone,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import arenaApi from '../api/arenaApi';

export function ContestProjectorPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchProjectorData = async () => {
    try {
      const res = await arenaApi.getProjectorData(slug);
      if (res && res.success) {
        setData(res.contest);
        setLastUpdated(new Date());
      }
    } catch (err) {
      // Keep displaying existing state on network hiccup
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectorData();
    const interval = setInterval(fetchProjectorData, 3500);
    return () => clearInterval(interval);
  }, [slug]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex flex-col items-center justify-center p-8 font-mono">
        <Radio className="w-8 h-8 text-amber-400 animate-pulse mb-3" />
        <h2 className="text-sm uppercase tracking-widest text-zinc-400">Connecting Auditorium Projector Stream...</h2>
      </div>
    );
  }

  const activeStage = data?.activeStage;
  const liveMatches = data?.liveMatches || [];
  const topContenders = data?.topContenders || [];
  const announcements = data?.announcements || [];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-8 flex flex-col justify-between font-sans select-none overflow-hidden">
      {/* Top Projector Header */}
      <header className="pb-6 border-b border-zinc-800/80 flex items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 font-mono text-[11px] font-bold uppercase tracking-widest animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Auditorium Projector Feed
            </span>
            <span className="text-zinc-600 font-mono">·</span>
            <span className="text-xs font-mono text-zinc-400">
              {data?.participantCount || 0} Registered Competitors
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white uppercase font-mono">
            {data?.title || 'Campus Contest Championship'}
          </h1>
        </div>

        {/* Right Stage & Controls */}
        <div className="flex items-center gap-4">
          {activeStage ? (
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-amber-500/40 text-right">
              <div className="text-[10px] font-mono uppercase text-amber-400 font-bold tracking-wider">
                Active Stage
              </div>
              <div className="text-sm font-bold text-zinc-100">{activeStage.title}</div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-right">
              <span className="text-xs font-mono text-zinc-400">Lobby Waiting</span>
            </div>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Arena Projector Content */}
      <main className="flex-1 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Live 1v1 Battle Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Swords className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-mono uppercase font-bold text-zinc-200 tracking-wider">
                Live Duel Arenas ({liveMatches.length} Active)
              </h2>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">Auto-refresh 3s</span>
          </div>

          {liveMatches.length === 0 ? (
            <div className="h-72 rounded-2xl bg-zinc-900/40 border border-zinc-850 flex flex-col items-center justify-center p-6 text-center space-y-2">
              <Clock className="w-8 h-8 text-zinc-600 mb-1" />
              <p className="text-xs font-mono text-zinc-400">No active 1v1 duels in progress right now.</p>
              <p className="text-[11px] text-zinc-600">Matches populate automatically when the stage host commences round pairings.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {liveMatches.map((match) => (
                <div
                  key={match.roomCode}
                  className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-colors space-y-3"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-amber-400">{match.roomCode}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        match.status === 'COMPLETED'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {match.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Contenders Face-off */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800">
                    {/* Player 1 */}
                    <div className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-850 space-y-1.5">
                      <div className="font-bold text-xs text-zinc-100 truncate">{match.player1.name}</div>
                      <div className="text-[10px] text-zinc-500 truncate">{match.player1.college || 'Challenger'}</div>
                      <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                        <span className="text-zinc-400">Tests:</span>
                        <span className="font-bold text-emerald-400">
                          {match.player1.testCasesPassed} / {match.player1.totalTestCases || 5}
                        </span>
                      </div>
                    </div>

                    {/* Player 2 */}
                    <div className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-850 space-y-1.5">
                      <div className="font-bold text-xs text-zinc-100 truncate">{match.player2.name}</div>
                      <div className="text-[10px] text-zinc-500 truncate">{match.player2.college || 'Opponent'}</div>
                      <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                        <span className="text-zinc-400">Tests:</span>
                        <span className="font-bold text-emerald-400">
                          {match.player2.testCasesPassed} / {match.player2.totalTestCases || 5}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Top 10 Contenders Leaderboard */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-mono uppercase font-bold text-zinc-200 tracking-wider">
              Contest Leaderboard
            </h2>
          </div>

          <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-4 space-y-2">
            {topContenders.length === 0 ? (
              <div className="py-12 text-center text-xs font-mono text-zinc-500">
                Scores will register as stages complete.
              </div>
            ) : (
              topContenders.slice(0, 10).map((p) => (
                <div
                  key={p.rank}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-850"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs ${
                        p.rank === 1
                          ? 'bg-amber-400 text-zinc-950'
                          : p.rank === 2
                          ? 'bg-slate-300 text-zinc-950'
                          : p.rank === 3
                          ? 'bg-amber-700 text-zinc-100'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {p.rank}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-zinc-100">{p.name}</div>
                      <div className="text-[10px] text-zinc-500">{p.college}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-amber-400">{p.score} pts</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Footer Ticker / Announcements Bar */}
      <footer className="pt-4 border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-amber-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
            <Megaphone className="w-3 h-3" />
            <span>Host Feed</span>
          </span>
          <span className="truncate text-zinc-300">
            {announcements.length > 0 ? announcements[0].message : 'Welcome to the Flash Arena Contest Broadcast.'}
          </span>
        </div>

        <div className="shrink-0 text-zinc-600 pl-4">
          Synced: {lastUpdated.toLocaleTimeString()}
        </div>
      </footer>
    </div>
  );
}

export default ContestProjectorPage;

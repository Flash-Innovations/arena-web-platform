import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  ArrowRight,
  Search,
  Filter,
  Users,
  Layers,
  Trophy,
  ArrowUpRight,
  Shield,
  Activity,
  ChevronRight
} from 'lucide-react';
import CreateBattleModal from '../components/battle/CreateBattleModal';
import arenaApi from '../api/arenaApi';

export function ArenaLobbyPage() {
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [openBattles, setOpenBattles] = useState([]);
  const [publicContests, setPublicContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');

  useEffect(() => {
    async function loadLobbyData() {
      try {
        setLoading(true);
        const [battlesRes, contestsRes] = await Promise.allSettled([
          arenaApi.getOpenBattles(),
          arenaApi.getPublicContests()
        ]);

        if (battlesRes.status === 'fulfilled' && battlesRes.value?.success) {
          setOpenBattles(battlesRes.value.battles || []);
        }
        if (contestsRes.status === 'fulfilled' && contestsRes.value?.success) {
          setPublicContests(contestsRes.value.contests || []);
        }
      } catch (e) {
        // Fallback
      } finally {
        setLoading(false);
      }
    }

    loadLobbyData();
    const interval = setInterval(loadLobbyData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut: Press 'C' to open Create Duel Modal
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setIsCreateModalOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomCodeInput.trim()) {
      window.location.href = `/battle/${roomCodeInput.trim().toUpperCase()}`;
    }
  };

  const filteredBattles = openBattles.filter((b) => {
    if (activeTab === 'ALL') return true;
    return b.gameMode === activeTab;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Top Command Bar & Telemetry */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">Battle Operations</h1>
            <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400">
              v2.1
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time algorithmic duels, custom tournament stages, and collegiate knockout brackets.
          </p>
        </div>

        {/* Global Action Tools */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Room Code Entry */}
          <form onSubmit={handleJoin} className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Join Code (e.g. FLASH-4829)"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs font-mono font-medium text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 w-52"
            />
          </form>

          {/* Create Duel Trigger */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Duel</span>
            <kbd className="hidden sm:inline-block px-1 rounded bg-zinc-200 text-[10px] font-mono text-zinc-800 font-bold ml-1">
              C
            </kbd>
          </button>
        </div>
      </div>

      {/* Flagship Banner: Flash Coding Series Announcement */}
      <div className="p-5 rounded-xl bg-zinc-900/70 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
              Flagship Tournament Series
            </span>
            <span className="text-zinc-600">·</span>
            <span className="text-xs font-mono text-zinc-400">Nov 28 Qualifier</span>
          </div>
          <h2 className="text-base font-bold text-zinc-100">
            Flash Coding Series 2026 : 512-Contender Single-Elimination Knockout
          </h2>
          <p className="text-xs text-zinc-400 max-w-2xl">
            Pass the Day 1 Qualifying Quiz to secure seed in the 512 knockout tree. Compete for Day-1 Avengers: Doomsday IMAX Premiere Tickets and annual placement packages.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/series"
            className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700/80 transition-colors flex items-center gap-1"
          >
            <span>Tournament Hub</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/series/quiz"
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
          >
            Take Qualifier
          </Link>
        </div>
      </div>

      {/* Live Open Duels Section (Linear Dense Table) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-200">Open Duels</h3>
            <span className="px-1.5 py-0.2 rounded bg-zinc-900 text-[10px] font-mono text-zinc-400 border border-zinc-800">
              {filteredBattles.length} Available
            </span>
          </div>

          {/* Mode Filter Tabs */}
          <div className="flex items-center gap-1">
            {[
              { id: 'ALL', label: 'All Modes' },
              { id: 'SPEED_DSA', label: 'Speed DSA' },
              { id: 'CODE_GOLF', label: 'Code Golf' },
              { id: 'BUG_HUNTER', label: 'Bug Hunter' },
              { id: 'TIME_ATTACK', label: 'Time Attack' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-zinc-800 text-zinc-100 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 overflow-hidden">
          {filteredBattles.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <p className="text-xs font-mono text-zinc-500">No open duels matching this filter right now.</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-300 text-xs font-medium border border-zinc-800 cursor-pointer"
              >
                Create a duel room
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 font-mono text-[11px]">
                    <th className="py-2.5 px-4 font-medium">Room</th>
                    <th className="py-2.5 px-4 font-medium">Problem / Focus</th>
                    <th className="py-2.5 px-4 font-medium">Mode</th>
                    <th className="py-2.5 px-4 font-medium">Tier</th>
                    <th className="py-2.5 px-4 font-medium">Host</th>
                    <th className="py-2.5 px-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850 text-zinc-300">
                  {filteredBattles.map((b) => (
                    <tr key={b.roomCode} className="hover:bg-zinc-900/40 transition-colors group">
                      <td className="py-3 px-4 font-mono font-bold text-zinc-100">
                        {b.roomCode}
                      </td>
                      <td className="py-3 px-4 font-medium text-zinc-200">
                        <div className="line-clamp-1">{b.problemTitle || 'Random Challenge'}</div>
                        <span className="text-[11px] text-zinc-500 font-mono">{b.category || 'DSA'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-900 text-zinc-300 border border-zinc-800">
                          {b.gameMode.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-zinc-300">
                        {b.difficulty}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-zinc-200 font-medium">{b.hostName}</span>
                        <span className="block text-[11px] text-zinc-500 truncate max-w-[140px]">{b.hostCollege}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <a
                          href={`/battle/${b.roomCode}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium border border-zinc-750 transition-colors"
                        >
                          <span>Enter Duel</span>
                          <ChevronRight className="w-3 h-3 text-zinc-400" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Student Contest Studio Showcase */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-200">Campus Contests</h3>
            <span className="text-xs text-zinc-500 font-mono">Student Created</span>
          </div>
          <Link
            to="/contest/studio"
            className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors"
          >
            <span>Open Contest Studio</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {publicContests.length === 0 ? (
          <div className="p-8 rounded-xl border border-zinc-800 bg-zinc-950/30 text-center space-y-2">
            <p className="text-xs font-mono text-zinc-500">No public campus contests running right now.</p>
            <Link
              to="/contest/studio"
              className="inline-block px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-300 text-xs font-medium border border-zinc-800"
            >
              Build your own contest stage
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {publicContests.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors space-y-3"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-zinc-800 text-zinc-300">
                    {c.status.replace('_', ' ')}
                  </span>
                  <span className="text-zinc-500 text-[11px]">
                    {c.maxParticipants === 0 ? 'Unlimited' : `${c.participantCount}/${c.maxParticipants}`} Contenders
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-zinc-100 line-clamp-1">{c.title}</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    By <strong className="text-zinc-300">{c.creatorName}</strong> ({c.creatorCollege})
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-500">{c.stageCount} Stages</span>
                  <Link
                    to={`/contest/${c.slug}`}
                    className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                  >
                    View Contest
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for Creating 1v1 Battle */}
      <CreateBattleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}

export default ArenaLobbyPage;

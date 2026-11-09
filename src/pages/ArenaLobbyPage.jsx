import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Swords,
  Trophy,
  Users,
  Zap,
  ArrowRight,
  Shield,
  Sparkles,
  Layers,
  Clock,
  Play,
  Plus
} from 'lucide-react';
import CreateBattleModal from '../components/battle/CreateBattleModal';
import arenaApi from '../api/arenaApi';

export function ArenaLobbyPage() {
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [openBattles, setOpenBattles] = useState([]);
  const [publicContests, setPublicContests] = useState([]);
  const [loading, setLoading] = useState(true);

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
        // Fallback gracefully
      } finally {
        setLoading(false);
      }
    }

    loadLobbyData();
    const interval = setInterval(loadLobbyData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomCodeInput.trim()) {
      window.location.href = `/battle/${roomCodeInput.trim().toUpperCase()}`;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12 animate-fade-in">
      {/* Hero Banner: Flash Coding Series */}
      <div className="relative rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-black border border-indigo-900/40 p-8 sm:p-12 overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-mono text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
            Competitive Coding Esports Colosseum
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Prove Your Code in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">1v1 Real-Time Battle</span>
          </h1>
          <p className="text-xs sm:text-base text-slate-300 leading-relaxed">
            Create friendly 1v1 duels, share via WhatsApp, or build your own multi-round tournament with drag-and-drop formats in the Contest Studio.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Swords className="w-4 h-4" />
              <span>Create 1v1 Battle</span>
            </button>

            <Link
              to="/contest/studio"
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
            >
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Contest Studio</span>
            </Link>

            <Link
              to="/series"
              className="px-5 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-850 text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2 border border-indigo-900/40 transition-colors cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Flash Series (Nov 28)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Custom Battle Creator Trigger */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 hover:border-slate-700 transition-all">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Swords className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Create Custom 1v1 Battle</h3>
            <p className="text-xs text-slate-400 mt-1">
              Select mode (Speed DSA, Code Golf, Bug Hunter, Time Attack), pick topic, and share room invite via WhatsApp.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Configure & Generate Room</span>
          </button>
        </div>

        {/* Card 2: Join Match via Room Code */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 hover:border-slate-700 transition-all">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Join with Room Code</h3>
            <p className="text-xs text-slate-400 mt-1">
              Received a duel code from a friend? Enter it below to jump straight into the arena.
            </p>
          </div>
          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. FLASH-4829"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold uppercase text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
            />
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Join
            </button>
          </form>
        </div>
      </div>

      {/* Live Open 1v1 Duels Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Live Open Duels (Waiting for Challenger)
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-500">{openBattles.length} Rooms Active</span>
        </div>

        {openBattles.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-center space-y-2">
            <p className="text-xs text-slate-400 font-mono">No public duels currently waiting.</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300"
            >
              Create the first battle room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {openBattles.map((b) => (
              <div
                key={b.roomCode}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition-all shadow-md"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-indigo-400">{b.roomCode}</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-300 font-bold">
                    {b.gameMode.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white line-clamp-1">{b.problemTitle}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Host: <strong className="text-slate-300">{b.hostName}</strong> ({b.hostCollege})
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                  <span>Tier: <strong className="text-slate-200">{b.difficulty}</strong></span>
                  <span>{b.durationMinutes} Mins</span>
                </div>

                <a
                  href={`/battle/${b.roomCode}`}
                  className="block w-full py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs uppercase tracking-wider text-center transition-all shadow-md shadow-indigo-600/20"
                >
                  Accept Challenge
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student Created Contests Showcase */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Student Campus Contests
            </h2>
          </div>
          <Link
            to="/contest/studio"
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>Host a Contest</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {publicContests.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-center space-y-3">
            <p className="text-xs text-slate-400">
              No campus contests scheduled yet. Build your own multi-round tournament using our drag-and-drop studio!
            </p>
            <Link
              to="/contest/studio"
              className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider"
            >
              Open Contest Studio
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicContests.map((c) => (
              <div
                key={c.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition-all shadow-md"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                    {c.status.replace('_', ' ')}
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    {c.maxParticipants === 0 ? 'Unlimited Cap' : `${c.participantCount}/${c.maxParticipants}`}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white line-clamp-1">{c.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    By <strong className="text-slate-300">{c.creatorName}</strong> ({c.creatorCollege})
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                  <span>{c.stageCount} Formats</span>
                  <span>{c.participantCount} Registered</span>
                </div>

                <Link
                  to={`/contest/${c.slug}`}
                  className="block w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs uppercase tracking-wider text-center border border-slate-700 transition-colors"
                >
                  View Contest
                </Link>
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

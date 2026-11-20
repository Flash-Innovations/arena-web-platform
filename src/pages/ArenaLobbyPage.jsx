import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  ArrowRight,
  Search,
  Users,
  Trophy,
  ChevronRight,
  Swords,
  Bot,
  Loader2,
  Sparkles,
  Shield,
  Clock,
  Zap,
  Flame,
  Award,
  Calendar,
  X
} from 'lucide-react';
import CreateBattleModal from '../components/battle/CreateBattleModal';
import GladiatorBadge from '../components/common/GladiatorBadge';
import { useAuth } from '../context/AuthContext';
import { useMatchmaking } from '../context/MatchmakingContext';
import arenaApi from '../api/arenaApi';

export function ArenaLobbyPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const {
    isMatchmaking,
    matchmakingQueueType,
    searchTimer,
    matchmakingError,
    startMatchmaking,
    cancelMatchmaking,
    acceptAiSparring
  } = useMatchmaking();

  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [openBattles, setOpenBattles] = useState([]);
  const [publicContests, setPublicContests] = useState([]);
  const [featuredContest, setFeaturedContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [queueFilter, setQueueFilter] = useState('ALL'); // 'ALL' | 'RANKED' | 'CASUAL'

  useEffect(() => {
    async function loadLobbyData() {
      try {
        setLoading(true);
        const [battlesRes, contestsRes, featuredRes] = await Promise.allSettled([
          arenaApi.getOpenBattles(),
          arenaApi.getPublicContests(),
          arenaApi.getFeaturedContest()
        ]);

        if (battlesRes.status === 'fulfilled' && battlesRes.value?.success) {
          setOpenBattles(battlesRes.value.battles || []);
        }
        if (contestsRes.status === 'fulfilled' && contestsRes.value?.success) {
          setPublicContests(contestsRes.value.contests || []);
        }
        if (featuredRes.status === 'fulfilled' && featuredRes.value?.success) {
          setFeaturedContest(featuredRes.value.contest || null);
        }
      } catch (e) {
        // Fallback silently
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

  // Cleanup matchmaking timer on unmount
  useEffect(() => {
    return () => {
      if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
    };
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomCodeInput.trim()) {
      window.location.href = `/battle/${roomCodeInput.trim().toUpperCase()}`;
    }
  };

  // Direct AI Sparring launcher
  const spawnAiRival = async () => {
    if (!isAuthenticated) {
      openAuthModal({
        mode: 'signin',
        title: 'Sign In to Spar with AI Rival',
        message: 'Sign in with your student account to challenge AI Rival bots and record your sparring performance.'
      });
      return;
    }

    try {
      const res = await arenaApi.createAiRivalMatch({
        gameMode: 'SPEED_DSA',
        difficulty: 'MEDIUM'
      });
      if (res.success && res.roomCode) {
        navigate(`/battle/${res.roomCode}`);
      }
    } catch (err) {
      const msg = err.message || '';
      if (err.status === 401 || msg.toLowerCase().includes('auth')) {
        openAuthModal({
          mode: 'signin',
          title: 'Sign In to Spar with AI Rival',
          message: 'Your session has expired. Please sign in to spar with AI Rival.'
        });
        return;
      }
    }
  };

  const filteredBattles = openBattles.filter((b) => {
    const modeMatch = activeTab === 'ALL' || b.gameMode === activeTab;
    const queueMatch = queueFilter === 'ALL' || (b.queueType || 'RANKED') === queueFilter;
    return modeMatch && queueMatch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Top Command Bar & Telemetry */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">Battle Operations</h1>
            <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400">
              v2.2
            </span>
            {isAuthenticated && user && (
              <GladiatorBadge elo={user.rating || 1200} size="sm" />
            )}
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

      {/* Dual Queue Quick-Play & Matchmaking HUD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ranked Matchmaking Card */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-zinc-900/90 to-zinc-950 border border-amber-500/30 hover:border-amber-500/50 transition-all space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                Ranked Queue
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-950/60 text-amber-300 border border-amber-800/60">
              Elo At Stake
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Swords className="w-4 h-4 text-amber-400" />
              <span>Ranked 1v1 Arena Clash</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Paired strictly within your Elo bracket (+/- 100). Sudden-death code duel: First to pass 100% test cases claims rating victory.
            </p>
          </div>

          <div className="pt-2 flex items-center gap-2">
            {isMatchmaking && matchmakingQueueType === 'RANKED' ? (
              <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-amber-500/50">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                  <span className="text-xs font-mono text-zinc-200">
                    Searching pool... {String(Math.floor(searchTimer / 60)).padStart(2, '0')}:{String(searchTimer % 60).padStart(2, '0')}
                  </span>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {searchTimer >= 60 && (
                    <button
                      onClick={acceptAiSparring}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 cursor-pointer transition-colors"
                      title="Play against AI while searching continues in background"
                    >
                      Spar AI in BG
                    </button>
                  )}
                  <button
                    onClick={cancelMatchmaking}
                    className="text-xs font-mono text-zinc-400 hover:text-rose-400 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => startMatchmaking('RANKED')}
                className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-amber-950/50"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Find Ranked Match</span>
              </button>
            )}
          </div>
        </div>

        {/* Casual Sparring & AI Training Card */}
        <div className="p-5 rounded-xl bg-gradient-to-br from-zinc-900/90 to-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">
                Casual / Sparring
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-blue-950/60 text-blue-300 border border-blue-800/60">
              Zero Rating Risk
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-400" />
              <span>Friendly Clash or AI Rival</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Practice algorithmic problems stress-free with friends or instant zero-wait sparring against AI Neural Rival bots.
            </p>
          </div>

          <div className="pt-2 flex items-center gap-2">
            {isMatchmaking && matchmakingQueueType === 'CASUAL' ? (
              <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-blue-500/50">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  <span className="text-xs font-mono text-zinc-200">
                    Searching pool... {String(Math.floor(searchTimer / 60)).padStart(2, '0')}:{String(searchTimer % 60).padStart(2, '0')}
                  </span>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {searchTimer >= 60 && (
                    <button
                      onClick={acceptAiSparring}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 cursor-pointer transition-colors"
                      title="Play against AI while searching continues in background"
                    >
                      Spar AI in BG
                    </button>
                  )}
                  <button
                    onClick={cancelMatchmaking}
                    className="text-xs font-mono text-zinc-400 hover:text-rose-400 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => startMatchmaking('CASUAL')}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-colors border border-zinc-700 cursor-pointer"
                >
                  Casual Queue
                </button>
                <button
                  onClick={spawnAiRival}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Spar vs AI Rival</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* AI Rival Background Sparring Notice Bar (Visible when queue reaches >= 60s) */}
      {isMatchmaking && searchTimer >= 60 && (
        <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3 text-xs text-blue-200">
            <Bot className="w-5 h-5 text-blue-400 shrink-0 animate-pulse" />
            <div>
              <div className="font-bold text-zinc-100 text-sm">
                Queue reached 1 minute ({searchTimer}s). Spar with AI while searching?
              </div>
              <div className="text-zinc-400 text-xs mt-0.5">
                Play a casual practice duel against an AI Neural Rival. Matchmaking will keep running in the background and pop up the moment a human match is found.
              </div>
            </div>
          </div>
          <button
            onClick={acceptAiSparring}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 cursor-pointer flex items-center gap-1.5 transition-colors shadow-md shadow-blue-600/30"
          >
            <Bot className="w-4 h-4" />
            <span>Spar AI While Queueing</span>
          </button>
        </div>
      )}

      {/* Dynamic Flagship Tournament Hero Banner */}
      {featuredContest ? (
        <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
          <div className="space-y-1.5 z-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
                {featuredContest.organizerType === 'FLASH_OFFICIAL'
                  ? 'Flagship National Series'
                  : featuredContest.organizerType === 'COLLEGE_PARTNERED'
                  ? 'Campus Partnered Championship'
                  : 'Official Tournament'}
              </span>
              <span className="text-zinc-600">·</span>
              <span className="text-xs font-mono text-zinc-400">
                {featuredContest.scheduledStartTime
                  ? new Date(featuredContest.scheduledStartTime).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric'
                    })
                  : 'Season 2026'}
              </span>
              {featuredContest.eloImpactEligible && (
                <span className="px-1.5 py-0.2 rounded bg-amber-950/80 text-[10px] font-mono text-amber-300 border border-amber-800/60 uppercase">
                  Ranked Rated
                </span>
              )}
            </div>

            <h2 className="text-base font-bold text-zinc-100">
              {featuredContest.title}
            </h2>

            <p className="text-xs text-zinc-400 max-w-2xl">
              {featuredContest.description}
            </p>

            {featuredContest.prizes && featuredContest.prizes.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-zinc-400">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Rewards: {featuredContest.prizes[0].reward}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0 z-10">
            <Link
              to="/series"
              className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700/80 transition-colors flex items-center gap-1"
            >
              <span>Tournament Hub</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to={featuredContest.stages?.[0]?.stageType === 'MCQ_QUIZ' ? '/series/quiz' : `/contest/${featuredContest.slug}`}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
            >
              Enter Stage
            </Link>
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">Competitive Arena Seasonal League</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Explore open campus championships or start your own custom contest stage.</p>
          </div>
          <Link
            to="/contest/studio"
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
          >
            Launch Contest
          </Link>
        </div>
      )}

      {/* Live Open Duels Section (Linear Dense Table) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-200">Open Duels</h3>
            <span className="px-1.5 py-0.2 rounded bg-zinc-900 text-[10px] font-mono text-zinc-400 border border-zinc-800">
              {filteredBattles.length} Available
            </span>
          </div>

          {/* Mode & Stakes Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-1 bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-800">
              {['ALL', 'RANKED', 'CASUAL'].map((stake) => (
                <button
                  key={stake}
                  onClick={() => setQueueFilter(stake)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                    queueFilter === stake
                      ? 'bg-zinc-800 text-zinc-100 font-bold'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {stake === 'ALL' ? 'All Stakes' : stake}
                </button>
              ))}
            </div>

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
                    <th className="py-2.5 px-4 font-medium">Stakes</th>
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
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            b.queueType === 'RANKED'
                              ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                              : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                          }`}
                        >
                          {b.queueType || 'RANKED'}
                        </span>
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
            <span className="text-xs text-zinc-500 font-mono">Student & College Hosted</span>
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

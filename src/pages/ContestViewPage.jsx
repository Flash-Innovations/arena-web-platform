import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Trophy,
  Users,
  Clock,
  Swords,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Shield,
  MessageSquare
} from 'lucide-react';
import arenaApi from '../api/arenaApi';

export function ContestViewPage() {
  const { slug } = useParams();
  const [contest, setContest] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'stages' | 'leaderboard'
  const [error, setError] = useState(null);

  const fetchContest = async () => {
    try {
      setLoading(true);
      const res = await arenaApi.getContestBySlug(slug);
      if (res.success) {
        setContest(res.contest);
      }
      const lbRes = await arenaApi.getContestLeaderboard(slug).catch(() => ({ leaderboard: [] }));
      if (lbRes.success) {
        setLeaderboard(lbRes.leaderboard);
      }
    } catch (err) {
      setError(err.message || 'Contest not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContest();
  }, [slug]);

  const handleRegister = async () => {
    try {
      setRegistering(true);
      setError(null);
      const res = await arenaApi.registerContest(slug, passcode);
      if (res.success) {
        await fetchContest();
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setRegistering(false);
    }
  };

  const handleCopy = () => {
    const url = contest?.shareUrl || window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 mx-auto border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 mt-4 font-mono">Loading Arena Contest...</p>
      </div>
    );
  }

  if (error && !contest) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 mx-auto text-rose-500" />
        <h2 className="text-xl font-bold text-white">Contest Not Found</h2>
        <p className="text-xs text-slate-400">{error}</p>
        <Link to="/" className="inline-block px-4 py-2 rounded-xl bg-slate-800 text-white text-xs">
          Return to Arena Lobby
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-fade-in">
      {/* Contest Specification Box */}
      <div className="rounded-xl bg-zinc-900/70 border border-zinc-800 p-6 sm:p-8 space-y-4">
        <div className="space-y-3 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-mono">
              Campus Contest
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
              {contest.status.replace('_', ' ')}
            </span>
            {contest.maxParticipants === 0 ? (
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 text-xs font-mono">
                Unlimited Capacity
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 text-xs font-mono">
                {contest.participantCount} / {contest.maxParticipants} Registered
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
            {contest.title}
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            {contest.description}
          </p>

          <div className="flex items-center gap-3 pt-1 text-xs text-zinc-400 font-mono">
            <span>Hosted by <strong className="text-zinc-200">{contest.creatorName}</strong> ({contest.creatorCollege})</span>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            {contest.isCreator && (
              <Link
                to={`/contest/${contest.slug}/host`}
                className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium border border-zinc-700 transition-colors flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Host Control Deck</span>
              </Link>
            )}

            {contest.isRegistered ? (
              <div className="px-3.5 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-xs flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Registered for Contest</span>
              </div>
            ) : (
              <button
                onClick={handleRegister}
                disabled={registering}
                className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-colors cursor-pointer"
              >
                <span>{registering ? 'Entering...' : 'Register for Contest'}</span>
              </button>
            )}

            <a
              href={contest.whatsappShareUrl || '#'}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-medium text-xs border border-zinc-700 transition-colors flex items-center gap-1.5"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Invite</span>
            </a>

            <button
              onClick={handleCopy}
              className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Share Link'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6 text-xs font-mono font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'overview' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Stages Road ({contest.stages.length})
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'leaderboard' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Live Leaderboard ({leaderboard.length})
        </button>
      </div>

      {/* Tab: Stages Road */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contest.stages.map((stage, idx) => (
              <div
                key={stage.stageId}
                className={`p-6 rounded-2xl border transition-all ${
                  stage.status === 'ACTIVE'
                    ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-600/10'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-mono font-bold text-indigo-400">
                    R{idx + 1}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                      stage.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : stage.status === 'COMPLETED'
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {stage.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-1">{stage.title}</h3>
                <p className="text-xs font-mono text-slate-400 mb-4">
                  Format: {stage.stageType.replace(/_/g, ' ')}
                </p>

                <div className="space-y-2 text-xs text-slate-400 font-mono border-t border-slate-800/80 pt-3">
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <strong className="text-slate-200">{stage.durationMinutes} Mins</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Cutoff:</span>
                    <strong className="text-slate-200">Top {stage.cutoffValue} Advance</strong>
                  </div>
                </div>

                {stage.status === 'ACTIVE' && (
                  <div className="mt-4 pt-3 border-t border-indigo-500/30">
                    <button
                      onClick={() => {
                        window.location.href = `/battle/CST-${stage.stageId.slice(-4)}`;
                      }}
                      className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      <span>Enter Battle Room</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">College</th>
                <th className="py-3 px-4 text-right">Score</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-mono">
                    No scores recorded yet. Results populate live during stages!
                  </td>
                </tr>
              ) : (
                leaderboard.map((item) => (
                  <tr key={item.rank} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-400">#{item.rank}</td>
                    <td className="py-3 px-4 font-bold text-white">{item.name}</td>
                    <td className="py-3 px-4 text-slate-400">{item.college}</td>
                    <td className="py-3 px-4 font-mono font-bold text-right text-emerald-400">
                      {item.totalScore} pts
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.isEliminated ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Eliminated
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ContestViewPage;

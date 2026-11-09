import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Shield,
  Play,
  Users,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  ArrowRight,
  Layers,
  Sparkles
} from 'lucide-react';
import arenaApi from '../api/arenaApi';

export function ContestHostDeckPage() {
  const { slug } = useParams();
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchContest = async () => {
    try {
      setLoading(true);
      const res = await arenaApi.getContestBySlug(slug);
      if (res.success) {
        setContest(res.contest);
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load contest.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContest();
  }, [slug]);

  const handleStartStage = async (stageIndex) => {
    try {
      setActionLoading(true);
      setFeedback(null);
      const res = await arenaApi.startContestStage(slug, stageIndex);
      if (res.success) {
        setFeedback({ type: 'success', text: `Stage ${stageIndex + 1} is now active!` });
        await fetchContest();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to start stage.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdvanceQualifiers = async (stageIndex) => {
    try {
      setActionLoading(true);
      setFeedback(null);
      const res = await arenaApi.advanceContestQualifiers(slug, stageIndex);
      if (res.success) {
        setFeedback({ type: 'success', text: 'Top qualifiers advanced to next stage!' });
        await fetchContest();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to advance qualifiers.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!announcementMsg.trim()) return;

    try {
      setActionLoading(true);
      const res = await arenaApi.broadcastContestAnnouncement(slug, announcementMsg);
      if (res.success) {
        setAnnouncementMsg('');
        setFeedback({ type: 'success', text: 'Announcement broadcasted to participants.' });
        await fetchContest();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to send broadcast.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center font-mono text-xs text-slate-400">
        Loading Host Command Deck...
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Contest Not Found</h2>
        <Link to="/" className="text-xs text-indigo-400">Return to Arena</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-fade-in">
      {/* Deck Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-mono text-violet-400 mb-2">
            <Shield className="w-3.5 h-3.5" />
            Host Command Deck
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {contest.title}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered Contenders: <strong className="text-white">{contest.participantCount}</strong>
          </p>
        </div>

        <Link
          to={`/contest/${contest.slug}`}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs border border-slate-700 transition-colors"
        >
          View Public Contest Page
        </Link>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-mono border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Stage Control Panels */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
          Stage Pipeline Controls
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contest.stages.map((stage, idx) => (
            <div
              key={stage.stageId}
              className={`p-6 rounded-2xl border space-y-4 ${
                stage.status === 'ACTIVE'
                  ? 'bg-indigo-950/30 border-indigo-500/50'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-400">
                  STAGE {idx + 1}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-slate-800 text-slate-300">
                  {stage.status}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{stage.title}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Format: {stage.stageType.replace(/_/g, ' ')}
                </p>
              </div>

              <div className="text-xs font-mono text-slate-400 space-y-1">
                <div>Duration: {stage.durationMinutes} Minutes</div>
                <div>Advancement: Top {stage.cutoffValue}</div>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-2">
                {stage.status !== 'ACTIVE' && stage.status !== 'COMPLETED' && (
                  <button
                    onClick={() => handleStartStage(idx)}
                    disabled={actionLoading}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Start This Stage</span>
                  </button>
                )}

                {stage.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleAdvanceQualifiers(idx)}
                    disabled={actionLoading}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Advance Qualifiers & Complete</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Broadcast Announcement Bar */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Broadcast Announcement to Contestants
          </h2>
        </div>
        <form onSubmit={handleBroadcast} className="flex gap-3">
          <input
            type="text"
            placeholder="e.g. Round 2 matches are live! Check your assigned room code."
            value={announcementMsg}
            onChange={(e) => setAnnouncementMsg(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={actionLoading || !announcementMsg.trim()}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider disabled:opacity-50 transition-colors"
          >
            Broadcast
          </button>
        </form>
      </div>
    </div>
  );
}

export default ContestHostDeckPage;

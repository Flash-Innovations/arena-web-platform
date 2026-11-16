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
  Sparkles,
  BookOpen,
  Shuffle,
  Radio,
  ExternalLink
} from 'lucide-react';
import arenaApi from '../api/arenaApi';
import QuestionBankModal from '../components/contest/QuestionBankModal';

export function ContestHostDeckPage() {
  const { slug } = useParams();
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Question Bank curation state
  const [activeStageForQuestions, setActiveStageForQuestions] = useState(null);

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

  const handleShuffleStageProblems = async (stageId) => {
    try {
      setActionLoading(true);
      setFeedback(null);
      const res = await arenaApi.shuffleStageQuestions(slug, stageId, { count: 3 });
      if (res.success) {
        setFeedback({ type: 'success', text: res.message || 'Fresh problems shuffled and locked.' });
        await fetchContest();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to shuffle stage problems.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveStageProblems = async (selectedIds) => {
    if (activeStageForQuestions === null || !contest) return;
    const stage = contest.stages[activeStageForQuestions];
    if (!stage) return;

    try {
      setActionLoading(true);
      setFeedback(null);
      const res = await arenaApi.updateStageQuestions(slug, stage.stageId, {
        curatedProblemIds: selectedIds
      });
      if (res.success) {
        setFeedback({ type: 'success', text: 'Stage problem locker updated successfully.' });
        await fetchContest();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update problem locker.' });
    } finally {
      setActionLoading(false);
      setActiveStageForQuestions(null);
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
      <div className="max-w-4xl mx-auto px-4 py-20 text-center font-mono text-xs text-zinc-400">
        Loading Host Command Deck...
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Contest Not Found</h2>
        <Link to="/" className="text-xs text-amber-400">Return to Arena</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-fade-in">
      {/* Deck Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-amber-400 mb-2">
            <Shield className="w-3.5 h-3.5" />
            Host Command Deck & Control Center
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {contest.title}
          </h1>
          <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
            <span>Registered Contenders: <strong className="text-white">{contest.participantCount}</strong></span>
            <span>·</span>
            <span className="font-mono text-amber-400 uppercase">
              {contest.eloImpactEligible ? 'Ranked ELO Eligible' : 'Community Contest'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to={`/contest/${contest.slug}/projector`}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 font-bold text-xs border border-rose-800/80 transition-colors flex items-center gap-1.5"
          >
            <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>Auditorium Projector</span>
            <ExternalLink className="w-3 h-3 text-rose-400" />
          </Link>

          <Link
            to={`/contest/${contest.slug}`}
            className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-white font-semibold text-xs border border-zinc-700 transition-colors"
          >
            View Public Page
          </Link>
        </div>
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
                  ? 'bg-zinc-900 border-amber-500/60 shadow-lg'
                  : 'bg-zinc-950/80 border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-400">
                  STAGE {idx + 1}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-zinc-900 border border-zinc-800 text-zinc-300">
                  {stage.status}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{stage.title}</h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  Format: {stage.stageType.replace(/_/g, ' ')}
                </p>
              </div>

              <div className="text-xs font-mono text-zinc-400 space-y-1">
                <div>Duration: {stage.durationMinutes} Minutes</div>
                <div>Advancement: Top {stage.cutoffValue}</div>
                <div>Locked Problems: {stage.curatedProblemIds?.length || 0}</div>
              </div>

              {/* Problem Locker Actions (Allowed prior to stage start) */}
              {stage.status !== 'ACTIVE' && stage.status !== 'COMPLETED' && (
                <div className="pt-2 border-t border-zinc-800 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveStageForQuestions(idx)}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>Locker ({stage.curatedProblemIds?.length || 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShuffleStageProblems(stage.stageId)}
                    disabled={actionLoading}
                    title="Shuffle random problems from Neon DB question bank"
                    className="py-1.5 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 text-xs font-mono transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="pt-2 border-t border-zinc-800 space-y-2">
                {stage.status !== 'ACTIVE' && stage.status !== 'COMPLETED' && (
                  <button
                    onClick={() => handleStartStage(idx)}
                    disabled={actionLoading}
                    className="w-full py-2.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start This Stage</span>
                  </button>
                )}

                {stage.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleAdvanceQualifiers(idx)}
                    disabled={actionLoading}
                    className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
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
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
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
            className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={actionLoading || !announcementMsg.trim()}
            className="px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs uppercase tracking-wider disabled:opacity-50 transition-colors cursor-pointer"
          >
            Broadcast
          </button>
        </form>
      </div>

      {/* Question Bank Modal for Host Problem Locker */}
      {activeStageForQuestions !== null && contest.stages[activeStageForQuestions] && (
        <QuestionBankModal
          isOpen={true}
          onClose={() => setActiveStageForQuestions(null)}
          stageTitle={contest.stages[activeStageForQuestions].title}
          selectedIds={contest.stages[activeStageForQuestions].curatedProblemIds || []}
          onSave={handleSaveStageProblems}
        />
      )}
    </div>
  );
}

export default ContestHostDeckPage;

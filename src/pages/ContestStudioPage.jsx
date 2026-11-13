import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Clock,
  Users,
  Trophy,
  Share2,
  Copy,
  Check,
  Sparkles,
  HelpCircle,
  Swords,
  Bug,
  Code2,
  CheckCircle2,
  MessageSquare
} from 'lucide-react';
import arenaApi from '../api/arenaApi';

const AVAILABLE_STAGE_TYPES = [
  {
    type: 'MCQ_QUIZ',
    name: 'Qualifier Quiz / Aptitude',
    icon: HelpCircle,
    color: 'bg-zinc-850 border-zinc-700 text-zinc-200',
    description: 'Timed screening quiz to filter out bottom percentile quickly.'
  },
  {
    type: 'SPEED_DSA_1V1',
    name: '1v1 Knockout Bracket',
    icon: Swords,
    color: 'bg-zinc-850 border-zinc-700 text-zinc-200',
    description: 'Single-elimination esports tournament tree (8, 16, 32, 64 survivors).'
  },
  {
    type: 'OPEN_LEADERBOARD',
    name: 'Open Contest Leaderboard',
    icon: Trophy,
    color: 'bg-zinc-850 border-zinc-700 text-zinc-200',
    description: 'Multi-problem open contest with live LeetCode/Codeforces score.'
  },
  {
    type: 'BUG_HUNTER_DUEL',
    name: 'Bug Hunter Reverse Debug',
    icon: Bug,
    color: 'bg-zinc-850 border-zinc-700 text-zinc-200',
    description: 'Contestants are given broken algorithms and race to fix edge cases.'
  },
  {
    type: 'CODE_GOLF',
    name: 'Code Golf Showdown',
    icon: Code2,
    color: 'bg-zinc-850 border-zinc-700 text-zinc-200',
    description: 'Shortest clean code passing all tests wins the round.'
  }
];

export function ContestStudioPage() {
  const navigate = useNavigate();

  // Contest Metadata
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [passcode, setPasscode] = useState('');
  const [isUnlimitedStudents, setIsUnlimitedStudents] = useState(true);
  const [maxParticipants, setMaxParticipants] = useState(100);

  // Stage Pipeline
  const [stages, setStages] = useState([
    {
      stageId: 'stg_1',
      stageType: 'MCQ_QUIZ',
      title: 'Round 1: Screening Quiz',
      durationMinutes: 15,
      cutoffType: 'TOP_N',
      cutoffValue: 16,
      bracketSize: 16
    },
    {
      stageId: 'stg_2',
      stageType: 'SPEED_DSA_1V1',
      title: 'Round 2: Top 16 Knockout Arena',
      durationMinutes: 20,
      cutoffType: 'TOP_N',
      cutoffValue: 8,
      bracketSize: 16
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [publishedContest, setPublishedContest] = useState(null);
  const [copied, setCopied] = useState(false);

  // Add Stage to Pipeline
  const handleAddStage = (stageType) => {
    const meta = AVAILABLE_STAGE_TYPES.find((s) => s.type === stageType);
    const newStage = {
      stageId: `stg_${Date.now()}`,
      stageType,
      title: `Round ${stages.length + 1}: ${meta?.name || 'Stage'}`,
      durationMinutes: 20,
      cutoffType: 'TOP_N',
      cutoffValue: 8,
      bracketSize: 16
    };
    setStages([...stages, newStage]);
  };

  // Reorder Stages
  const moveStage = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= stages.length) return;
    const updated = [...stages];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setStages(updated);
  };

  const removeStage = (index) => {
    if (stages.length <= 1) {
      setError('A contest must have at least one stage.');
      return;
    }
    setStages(stages.filter((_, i) => i !== index));
  };

  const updateStageField = (index, field, value) => {
    const updated = [...stages];
    updated[index] = { ...updated[index], [field]: value };
    setStages(updated);
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a contest title.');
      return;
    }
    if (stages.length === 0) {
      setError('Please add at least one stage.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        title: title.trim(),
        description: description.trim() || 'Custom Student Esports Contest',
        isPublic,
        passcode: passcode.trim(),
        maxParticipants: isUnlimitedStudents ? 0 : Number(maxParticipants),
        stages
      };

      const res = await arenaApi.createContest(payload);
      if (res.success) {
        setPublishedContest(res);
      }
    } catch (err) {
      setError(err.message || 'Failed to create contest.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (publishedContest) {
      const url = publishedContest.contestUrl || `https://arena.flashedu.in/contest/${publishedContest.contest.slug}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-fade-in">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-mono text-indigo-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Contest Studio
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Design & Host Your Contest
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Drag-and-drop game stages, configure qualification brackets, and invite any number of students.
          </p>
        </div>

        {publishedContest && (
          <button
            onClick={() => navigate(`/contest/${publishedContest.contest.slug}`)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-colors"
          >
            Go to Live Contest
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
          {error}
        </div>
      )}

      {publishedContest ? (
        /* Published Success Banner */
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="max-w-lg mx-auto space-y-2">
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-bold">
              Contest Successfully Published
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">{publishedContest.contest.title}</h2>
            <p className="text-xs text-slate-400">
              Your contest is live with {stages.length} modular stages. Share the invitation link with your classmates or campus group!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <a
              href={publishedContest.whatsappShareUrl || '#'}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Invite via WhatsApp</span>
            </a>
            <button
              onClick={handleCopy}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Link Copied!' : 'Copy Contest Link'}</span>
            </button>
          </div>

          <div className="pt-4">
            <button
              onClick={() => navigate(`/contest/${publishedContest.contest.slug}`)}
              className="px-6 py-2.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-colors cursor-pointer"
            >
              Enter Contest Lobby
            </button>
          </div>
        </div>
      ) : (
        /* The Contest Builder Canvas */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Contest Settings & Palette */}
          <div className="space-y-6">
            {/* Contest Basic Settings */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                1. Contest Details
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Contest Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ACM Intra-College Coding Clash 2026"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Rules, college batch eligibility, prizes..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Unlimited Capacity Toggle */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white">Student Capacity</span>
                      <p className="text-[10px] text-slate-400">Support any number of students</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isUnlimitedStudents}
                        onChange={(e) => setIsUnlimitedStudents(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-800 focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs text-indigo-400 font-bold">Unlimited</span>
                    </label>
                  </div>

                  {!isUnlimitedStudents && (
                    <div className="animate-fade-in pt-1">
                      <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                        Max Participant Cap
                      </label>
                      <input
                        type="number"
                        min="2"
                        value={maxParticipants}
                        onChange={(e) => setMaxParticipants(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                      />
                    </div>
                  )}
                </div>

                {/* Passcode Protection */}
                <div className="pt-2 border-t border-slate-800">
                  <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                    Contest Passcode (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Leave blank for open public contest"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Stage Palette */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                2. Add Game Formats
              </h3>
              <p className="text-xs text-slate-400">
                Click any module to append it to your competition stages pipeline.
              </p>

              <div className="space-y-2.5">
                {AVAILABLE_STAGE_TYPES.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => handleAddStage(item.type)}
                      className="w-full p-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-950 text-left transition-all group cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg border ${item.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                            {item.name}
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1">{item.description}</p>
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-slate-500 group-hover:text-white" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right 2 Columns: Sequential Modular Stage Pipeline Canvas */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  3. Stage Pipeline ({stages.length} Rounds)
                </h3>
                <p className="text-xs text-slate-400">
                  Arrange sequential rounds. Contestants qualify through each stage.
                </p>
              </div>

              <button
                onClick={handlePublish}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <span>Publish Contest</span>
                  </>
                )}
              </button>
            </div>

            {/* Stages Stack */}
            <div className="space-y-4">
              {stages.map((stg, index) => {
                const meta = AVAILABLE_STAGE_TYPES.find((m) => m.type === stg.stageType);
                const Icon = meta?.icon || Layers;

                return (
                  <div
                    key={stg.stageId}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 transition-all hover:border-slate-700 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-[11px] font-mono font-bold text-indigo-400">
                          {index + 1}
                        </span>
                        <div className={`p-1.5 rounded-lg border ${meta?.color || 'border-zinc-700 bg-zinc-800'}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={stg.title}
                            onChange={(e) => updateStageField(index, 'title', e.target.value)}
                            className="bg-transparent text-sm font-bold text-white focus:outline-none focus:border-b border-indigo-500"
                          />
                          <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                            Format: {meta?.name}
                          </span>
                        </div>
                      </div>

                      {/* Controls: Up, Down, Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveStage(index, -1)}
                          disabled={index === 0}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStage(index, 1)}
                          disabled={index === stages.length - 1}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeStage(index)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer ml-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Stage Configurations Drawer */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                          Duration (Minutes)
                        </label>
                        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <input
                            type="number"
                            min="5"
                            value={stg.durationMinutes}
                            onChange={(e) => updateStageField(index, 'durationMinutes', e.target.value)}
                            className="w-full bg-transparent text-xs text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                          Advance Cutoff
                        </label>
                        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-[11px] text-slate-400">Top</span>
                          <input
                            type="number"
                            min="2"
                            value={stg.cutoffValue}
                            onChange={(e) => updateStageField(index, 'cutoffValue', e.target.value)}
                            className="w-12 bg-transparent text-xs text-white focus:outline-none"
                          />
                          <span className="text-[11px] text-slate-400">Qualify</span>
                        </div>
                      </div>

                      {stg.stageType === 'SPEED_DSA_1V1' && (
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                            Bracket Size (K)
                          </label>
                          <select
                            value={stg.bracketSize}
                            onChange={(e) => updateStageField(index, 'bracketSize', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                          >
                            {[4, 8, 16, 32, 64].map((k) => (
                              <option key={k} value={k}>
                                {k} Contenders
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContestStudioPage;

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
  MessageSquare,
  BookOpen,
  EyeOff,
  Flame,
  Award,
  Shield,
  Zap,
  Sliders
} from 'lucide-react';
import arenaApi from '../api/arenaApi';
import QuestionBankModal from '../components/contest/QuestionBankModal';
import { useAuth } from '../context/AuthContext';

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

const PRESETS = [
  {
    id: 'FRIENDLY_DUEL',
    title: '30s Friendly Clash',
    badge: 'Quick Clash',
    description: 'Instant 1v1 sudden-death duel for campus friend groups.',
    setup: {
      title: 'Friendly 1v1 Code Clash',
      description: 'Single-elimination sudden-death duel. First to pass all test cases claims victory.',
      stages: [
        {
          stageId: 'stg_clash_1',
          stageType: 'SPEED_DSA_1V1',
          title: 'Finals: 1v1 Sudden Death',
          durationMinutes: 15,
          cutoffType: 'TOP_N',
          cutoffValue: 1,
          bracketSize: 2,
          curatedProblemIds: [],
          rules: { fogOfWar: false, maxSubmissions: 0, speedMultiplier: 1.0, allowedLanguages: ['python', 'javascript', 'cpp', 'java'] }
        }
      ]
    }
  },
  {
    id: 'CAMPUS_CUP',
    title: 'Campus Knockout Cup',
    badge: 'Techfest Format',
    description: 'Qualifier Aptitude Quiz into Top 16 single-elimination bracket.',
    setup: {
      title: 'Inter-College Knockout Cup 2026',
      description: 'Round 1 screening quiz qualifies top 16 contestants into sudden-death 1v1 algorithmic bracket.',
      stages: [
        {
          stageId: 'stg_cup_1',
          stageType: 'MCQ_QUIZ',
          title: 'Round 1: CS & Aptitude Qualifier',
          durationMinutes: 15,
          cutoffType: 'TOP_N',
          cutoffValue: 16,
          bracketSize: 16,
          curatedProblemIds: [],
          rules: { fogOfWar: false, maxSubmissions: 1, speedMultiplier: 1.0, allowedLanguages: [] }
        },
        {
          stageId: 'stg_cup_2',
          stageType: 'SPEED_DSA_1V1',
          title: 'Round 2: Top 16 Knockout Bracket',
          durationMinutes: 20,
          cutoffType: 'TOP_N',
          cutoffValue: 1,
          bracketSize: 16,
          curatedProblemIds: [],
          rules: { fogOfWar: true, maxSubmissions: 3, speedMultiplier: 1.5, allowedLanguages: ['python', 'javascript', 'cpp', 'java'] }
        }
      ]
    }
  },
  {
    id: 'OPEN_LEETCODE',
    title: 'Open Leaderboard Contest',
    badge: 'ICPC / LeetCode',
    description: 'Open multi-problem algorithmic scoreboard with penalty timer.',
    setup: {
      title: 'Open Algorithmic Contest',
      description: 'Solve curated problems to climb the live leaderboard. Speed and accuracy count.',
      stages: [
        {
          stageId: 'stg_open_1',
          stageType: 'OPEN_LEADERBOARD',
          title: 'Round 1: Open Leaderboard',
          durationMinutes: 90,
          cutoffType: 'TOP_N',
          cutoffValue: 3,
          bracketSize: 0,
          curatedProblemIds: [],
          rules: { fogOfWar: false, maxSubmissions: 0, speedMultiplier: 1.0, allowedLanguages: ['python', 'javascript', 'cpp', 'java'] }
        }
      ]
    }
  },
  {
    id: 'BUG_BASH',
    title: 'Bug Hunter Reverse Debug',
    badge: 'Reverse Engineering',
    description: 'Race to locate and fix broken edge cases in existing code.',
    setup: {
      title: 'Bug Hunter Reverse Debug Bash',
      description: 'Analyze faulty algorithms and rectify edge cases before opponent.',
      stages: [
        {
          stageId: 'stg_bug_1',
          stageType: 'BUG_HUNTER_DUEL',
          title: 'Finals: Bug Hunter 1v1',
          durationMinutes: 15,
          cutoffType: 'TOP_N',
          cutoffValue: 1,
          bracketSize: 8,
          curatedProblemIds: [],
          rules: { fogOfWar: false, maxSubmissions: 5, speedMultiplier: 1.0, allowedLanguages: ['python', 'javascript', 'cpp'] }
        }
      ]
    }
  }
];

export function ContestStudioPage() {
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal } = useAuth();

  // Contest Metadata
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [organizerType, setOrganizerType] = useState('COMMUNITY'); // 'COMMUNITY' | 'COLLEGE_PARTNERED' | 'FLASH_OFFICIAL'
  const [isFeaturedHero, setIsFeaturedHero] = useState(false);
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
      bracketSize: 16,
      curatedProblemIds: [],
      rules: {
        fogOfWar: false,
        maxSubmissions: 1,
        speedMultiplier: 1.0,
        allowedLanguages: ['python', 'javascript', 'cpp', 'java']
      }
    },
    {
      stageId: 'stg_2',
      stageType: 'SPEED_DSA_1V1',
      title: 'Round 2: Top 16 Knockout Arena',
      durationMinutes: 20,
      cutoffType: 'TOP_N',
      cutoffValue: 8,
      bracketSize: 16,
      curatedProblemIds: [],
      rules: {
        fogOfWar: true,
        maxSubmissions: 3,
        speedMultiplier: 1.5,
        allowedLanguages: ['python', 'javascript', 'cpp', 'java']
      }
    }
  ]);

  // Question Bank Modal State
  const [activeStageForQuestions, setActiveStageForQuestions] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [publishedContest, setPublishedContest] = useState(null);
  const [copied, setCopied] = useState(false);

  // Apply Quick Preset
  const handleApplyPreset = (preset) => {
    setTitle(preset.setup.title);
    setDescription(preset.setup.description);
    setStages(preset.setup.stages);
  };

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
      bracketSize: 16,
      curatedProblemIds: [],
      rules: {
        fogOfWar: false,
        maxSubmissions: 0,
        speedMultiplier: 1.0,
        allowedLanguages: ['python', 'javascript', 'cpp', 'java']
      }
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

  const updateStageRule = (index, ruleKey, value) => {
    const updated = [...stages];
    const currentRules = updated[index].rules || {};
    updated[index] = {
      ...updated[index],
      rules: { ...currentRules, [ruleKey]: value }
    };
    setStages(updated);
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal({
        mode: 'signin',
        title: 'Sign In to Publish Contest',
        message: 'Sign in with your student account to configure modular stages and host campus contests.'
      });
      return;
    }
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
        organizerType,
        isFeaturedHero: Boolean(isFeaturedHero),
        eloImpactEligible: organizerType === 'COLLEGE_PARTNERED' || organizerType === 'FLASH_OFFICIAL',
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
      const msg = err.message || '';
      if (err.status === 401 || msg.toLowerCase().includes('auth')) {
        openAuthModal({
          mode: 'signin',
          title: 'Sign In to Publish Contest',
          message: 'Your session has expired. Please sign in to publish your contest.'
        });
        return;
      }
      setError(msg || 'Failed to create contest.');
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Contest Studio Architecture v2.2
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Design & Host Your Contest
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Drag-and-drop game stages, configure qualification brackets, curate Neon DB problem sets, and invite competitors.
          </p>
        </div>

        {publishedContest && (
          <button
            onClick={() => navigate(`/contest/${publishedContest.contest.slug}`)}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
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

      {/* Quick-Start Presets Selector */}
      {!publishedContest && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-zinc-400 font-bold tracking-wider">
              Quick-Start Presets (1-Click Setup)
            </span>
            <span className="text-[11px] font-mono text-zinc-500">Auto-configures pipeline</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-amber-500/60 hover:bg-zinc-900 transition-all text-left cursor-pointer group space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-amber-400 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded">
                    {p.badge}
                  </span>
                  <Zap className="w-3.5 h-3.5 text-zinc-600 group-hover:text-amber-400 transition-colors" />
                </div>
                <div className="text-xs font-bold text-zinc-200 group-hover:text-zinc-100">{p.title}</div>
                <div className="text-[11px] text-zinc-400 line-clamp-2">{p.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {publishedContest ? (
        /* Published Success Banner */
        <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="max-w-lg mx-auto space-y-2">
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-bold">
              Contest Successfully Published
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">{publishedContest.contest.title}</h2>
            <p className="text-xs text-zinc-400">
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
              className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-zinc-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Link Copied!' : 'Copy Contest Link'}</span>
            </button>
          </div>

          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => navigate(`/contest/${publishedContest.contest.slug}`)}
              className="px-6 py-2.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-colors cursor-pointer"
            >
              Enter Contest Lobby
            </button>
            <button
              onClick={() => navigate(`/contest/${publishedContest.contest.slug}/host`)}
              className="px-6 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-colors cursor-pointer border border-zinc-700"
            >
              Open Host Cockpit
            </button>
          </div>
        </div>
      ) : (
        /* The Contest Builder Canvas */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Contest Settings & Palette */}
          <div className="space-y-6">
            {/* Contest Basic Settings */}
            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                1. Contest Details
              </h3>

              <div className="space-y-3">
                {/* Stakes / Organizer Mode */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5">
                    Organizer Tier & Stakes
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setOrganizerType('COMMUNITY')}
                      className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                        organizerType === 'COMMUNITY'
                          ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-xs font-bold">Community</div>
                      <div className="text-[10px] text-zinc-500">Free open contest</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrganizerType('COLLEGE_PARTNERED')}
                      className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                        organizerType === 'COLLEGE_PARTNERED'
                          ? 'bg-amber-950/40 border-amber-500/70 text-amber-300'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-xs font-bold">Campus Official</div>
                      <div className="text-[10px] text-zinc-500">Ranked ELO eligible</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrganizerType('FLASH_OFFICIAL')}
                      className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                        organizerType === 'FLASH_OFFICIAL'
                          ? 'bg-blue-950/40 border-blue-500/70 text-blue-300'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-xs font-bold">Flash Official</div>
                      <div className="text-[10px] text-zinc-500">Flagship National Series</div>
                    </button>
                  </div>

                  {/* Flagship Hero Promotion Toggle */}
                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={isFeaturedHero}
                        onChange={(e) => setIsFeaturedHero(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-amber-500 bg-zinc-950 border-zinc-800 cursor-pointer"
                      />
                      <span>Promote as Arena Hero Banner (Featured Flagship)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                    Contest Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ACM Intra-College Coding Clash 2026"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Rules, college batch eligibility, prizes..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Unlimited Capacity Toggle */}
                <div className="pt-2 border-t border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white">Student Capacity</span>
                      <p className="text-[10px] text-zinc-400">Support any number of students</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isUnlimitedStudents}
                        onChange={(e) => setIsUnlimitedStudents(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-500 bg-zinc-950 border-zinc-800 focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs text-amber-400 font-bold">Unlimited</span>
                    </label>
                  </div>

                  {!isUnlimitedStudents && (
                    <div className="animate-fade-in pt-1">
                      <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                        Max Participant Cap
                      </label>
                      <input
                        type="number"
                        min="2"
                        value={maxParticipants}
                        onChange={(e) => setMaxParticipants(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                      />
                    </div>
                  )}
                </div>

                {/* Passcode Protection */}
                <div className="pt-2 border-t border-zinc-800">
                  <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1">
                    Contest Passcode (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Leave blank for open public contest"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Stage Palette */}
            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                2. Add Game Formats
              </h3>
              <p className="text-xs text-zinc-400">
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
                      className="w-full p-3 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 hover:bg-zinc-950 text-left transition-all group cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg border ${item.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                            {item.name}
                          </div>
                          <p className="text-[10px] text-zinc-400 line-clamp-1">{item.description}</p>
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-zinc-500 group-hover:text-white" />
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
                <p className="text-xs text-zinc-400">
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
                    className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 transition-all hover:border-zinc-700 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[11px] font-mono font-bold text-amber-400">
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
                            className="bg-transparent text-sm font-bold text-white focus:outline-none focus:border-b border-amber-500"
                          />
                          <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
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
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStage(index, 1)}
                          disabled={index === stages.length - 1}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-zinc-800/80">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                          Duration (Minutes)
                        </label>
                        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5">
                          <Clock className="w-3.5 h-3.5 text-zinc-500" />
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
                        <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                          Advance Cutoff
                        </label>
                        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5">
                          <Users className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="text-[11px] text-zinc-400">Top</span>
                          <input
                            type="number"
                            min="1"
                            value={stg.cutoffValue}
                            onChange={(e) => updateStageField(index, 'cutoffValue', e.target.value)}
                            className="w-12 bg-transparent text-xs text-white focus:outline-none"
                          />
                          <span className="text-[11px] text-zinc-400">Qualify</span>
                        </div>
                      </div>

                      {stg.stageType === 'SPEED_DSA_1V1' && (
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                            Bracket Size (K)
                          </label>
                          <select
                            value={stg.bracketSize}
                            onChange={(e) => updateStageField(index, 'bracketSize', Number(e.target.value))}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                          >
                            {[2, 4, 8, 16, 32, 64].map((k) => (
                              <option key={k} value={k}>
                                {k} Contenders
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Problem Locker & Game Physics Controls */}
                    <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveStageForQuestions(index)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                          <span>
                            Problem Locker ({stg.curatedProblemIds?.length || 0} Locked)
                          </span>
                        </button>
                      </div>

                      {/* Game Physics Toggles */}
                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                        <label className="flex items-center gap-1.5 cursor-pointer text-zinc-400 hover:text-zinc-200">
                          <input
                            type="checkbox"
                            checked={Boolean(stg.rules?.fogOfWar)}
                            onChange={(e) => updateStageRule(index, 'fogOfWar', e.target.checked)}
                            className="w-3.5 h-3.5 rounded text-amber-500 bg-zinc-950 border-zinc-800 cursor-pointer"
                          />
                          <span>Fog of War</span>
                        </label>

                        <div className="flex items-center gap-1 text-zinc-400">
                          <span>Max Attempts:</span>
                          <select
                            value={stg.rules?.maxSubmissions || 0}
                            onChange={(e) => updateStageRule(index, 'maxSubmissions', Number(e.target.value))}
                            className="bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-[11px] text-zinc-300 focus:outline-none"
                          >
                            <option value={0}>Unlimited</option>
                            <option value={1}>1 Try</option>
                            <option value={3}>3 Tries</option>
                            <option value={5}>5 Tries</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Question Bank Modal */}
      {activeStageForQuestions !== null && (
        <QuestionBankModal
          isOpen={true}
          onClose={() => setActiveStageForQuestions(null)}
          stageTitle={stages[activeStageForQuestions]?.title}
          selectedIds={stages[activeStageForQuestions]?.curatedProblemIds || []}
          onSave={(ids) => {
            updateStageField(activeStageForQuestions, 'curatedProblemIds', ids);
          }}
        />
      )}
    </div>
  );
}

export default ContestStudioPage;

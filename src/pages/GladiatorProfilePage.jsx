import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Trophy,
  ShieldCheck,
  Zap,
  Flame,
  Award,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Code2,
  Calendar,
  GraduationCap,
  Briefcase,
  Share2,
  Printer,
  ChevronRight,
  Clock,
  Layers,
  ArrowUpRight,
  Lock,
  Activity,
  FileText,
  Edit3
} from 'lucide-react';
import arenaApi from '../api/arenaApi';
import { useAuth } from '../context/AuthContext';
import GladiatorBadge from '../components/common/GladiatorBadge';

export function GladiatorProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [copiedLink, setCopiedLink] = useState(false);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [copiedBadge, setCopiedBadge] = useState(false);
  const [passportModalOpen, setPassportModalOpen] = useState(false);
  const [handleModalOpen, setHandleModalOpen] = useState(false);
  const [newHandle, setNewHandle] = useState('');
  const [handleSaving, setHandleSaving] = useState(false);
  const [handleError, setHandleError] = useState(null);
  const [eloFilter, setEloFilter] = useState('ALL'); // '30D' | '90D' | 'ALL'

  // Determine query target
  const targetIdentifier = useMemo(() => {
    if (username && username !== 'me') return username;
    if (currentUser?.username) return currentUser.username;
    if (currentUser?.id || currentUser?._id) return currentUser.id || currentUser._id;
    return null;
  }, [username, currentUser]);

  useEffect(() => {
    if (!targetIdentifier) {
      setLoading(false);
      setError('Please sign in to view your Gladiator Profile or specify a candidate username.');
      return;
    }

    let isMounted = true;
    async function fetchProfile() {
      try {
        setLoading(true);
        setError(null);
        const res = await arenaApi.getGladiatorProfile(targetIdentifier);
        if (isMounted) {
          if (res && res.success) {
            setProfileData(res);
          } else {
            setError(res?.message || 'Gladiator profile not found.');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load gladiator profile.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [targetIdentifier]);

  const profile = profileData?.profile;
  const combatRecord = profileData?.combatRecord;
  const rawEloHistory = profileData?.eloHistory || [];
  const algorithmicMastery = profileData?.algorithmicMastery || [];
  const trophies = profileData?.trophies || [];
  const recentDuels = profileData?.recentDuels || [];

  const isOwner = Boolean(
    profileData?.isOwner ||
    (currentUser && (currentUser.id === profile?.id || currentUser._id === profile?.id || currentUser.username === profile?.username))
  );

  const handleCopyLink = () => {
    const url = profile?.shareUrl || `https://flashedu.in/u/${profile?.username || ''}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveUsername = async () => {
    if (!newHandle || newHandle.length < 3) {
      setHandleError('Handle must be at least 3 characters long.');
      return;
    }
    try {
      setHandleSaving(true);
      setHandleError(null);
      const res = await arenaApi.updateProfileUsername(newHandle);
      if (res && res.success) {
        setProfileData((prev) => ({
          ...prev,
          profile: {
            ...prev.profile,
            username: res.username,
            shareUrl: res.shareUrl || `https://flashedu.in/u/${res.username}`,
            embedBadgeUrl: (prev.profile.embedBadgeUrl || '').replace(/\/[^/]+\/badge\.svg$/, `/${res.username}/badge.svg`)
          }
        }));
        setHandleModalOpen(false);
      } else {
        setHandleError(res?.message || 'Failed to update handle.');
      }
    } catch (err) {
      setHandleError(err.message || 'Failed to update handle.');
    } finally {
      setHandleSaving(false);
    }
  };

  const handleCopyBadgeMarkdown = () => {
    const markdown = `[![Flash Arena Rating](${profile?.embedBadgeUrl})](${profile?.shareUrl})`;
    navigator.clipboard.writeText(markdown);
    setCopiedBadge(true);
    setTimeout(() => setCopiedBadge(false), 2000);
  };

  // Filter Elo history for chart
  const filteredEloHistory = useMemo(() => {
    if (rawEloHistory.length === 0) return [];
    if (eloFilter === 'ALL') return rawEloHistory;
    const now = Date.now();
    const days = eloFilter === '30D' ? 30 : 90;
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    const filtered = rawEloHistory.filter((item) => new Date(item.timestamp).getTime() >= cutoff);
    return filtered.length > 0 ? filtered : rawEloHistory;
  }, [rawEloHistory, eloFilter]);

  // Compute SVG coordinates for Elo curve
  const chartPoints = useMemo(() => {
    if (filteredEloHistory.length === 0) return { pathD: '', areaD: '', points: [], minRating: 1100, maxRating: 1500 };
    const ratings = filteredEloHistory.map((h) => h.rating);
    const minRating = Math.max(900, Math.min(...ratings) - 50);
    const maxRating = Math.max(1600, Math.max(...ratings) + 50);
    const range = maxRating - minRating || 1;

    const width = 600;
    const height = 180;
    const paddingX = 20;
    const paddingY = 20;
    const usableW = width - paddingX * 2;
    const usableH = height - paddingY * 2;

    const coords = filteredEloHistory.map((item, idx) => {
      const x = paddingX + (idx / Math.max(1, filteredEloHistory.length - 1)) * usableW;
      const y = height - paddingY - ((item.rating - minRating) / range) * usableH;
      return { x, y, ...item };
    });

    const pathD = coords.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
    const firstX = coords[0]?.x || paddingX;
    const lastX = coords[coords.length - 1]?.x || width - paddingX;
    const areaD = `${pathD} L ${lastX} ${height} L ${firstX} ${height} Z`;

    return { pathD, areaD, points: coords, minRating, maxRating };
  }, [filteredEloHistory]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-6 animate-pulse">
        <div className="h-44 rounded-2xl bg-zinc-900 border border-zinc-800" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-zinc-900 border border-zinc-800" />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-zinc-900 border border-zinc-800" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-zinc-100">Gladiator Profile Unavailable</h2>
        <p className="text-xs text-zinc-400 leading-relaxed">{error || 'This user profile could not be loaded.'}</p>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition-colors"
          >
            <span>Return to Battle Lobby</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in font-sans">
      {/* 1. Gladiator Hero & Tier Identity Card */}
      <section
        className="relative overflow-hidden rounded-2xl border bg-zinc-950 p-6 sm:p-8 shadow-2xl transition-all"
        style={{ borderColor: `${profile.tierColor}40` }}
      >
        {/* Ambient Top Glow */}
        <div
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: profile.tierColor }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Avatar & Identity Details */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div
              className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-2xl p-1 shrink-0 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${profile.tierColor}, #18181b)` }}
            >
              <div className="w-full h-full rounded-xl bg-zinc-950 overflow-hidden flex items-center justify-center">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-zinc-100">
                    {(profile.name || 'G')[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div
                className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase border border-zinc-950 text-zinc-950 shadow"
                style={{ backgroundColor: profile.tierColor }}
              >
                {profile.tierBadge}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight">
                  {profile.name}
                </h1>
                <span className="text-xs font-mono text-zinc-400">@{profile.username}</span>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewHandle(profile.username || '');
                      setHandleError(null);
                      setHandleModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-750 transition-colors cursor-pointer"
                    title="Change public handle"
                  >
                    <Edit3 className="w-2.5 h-2.5 text-blue-400" />
                    <span>Edit Handle</span>
                  </button>
                )}
                {profile.isEmailVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified Student</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-zinc-400">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{profile.collegeName}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Class of {profile.graduationYear}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-zinc-300">
                  <Briefcase className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{profile.targetRole}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Tier Badge & Action Buttons */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-zinc-850">
            <div className="flex items-center gap-2.5">
              <GladiatorBadge elo={profile.rating} size="lg" />
              <div className="text-right">
                <div className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">
                  National Standing
                </div>
                <div className="text-xs font-bold text-zinc-200">
                  {profile.nationalRankPercentile}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied Link' : 'Share'}</span>
              </button>

              {isOwner && (
                <>
                  <button
                    type="button"
                    onClick={() => setBadgeModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 text-xs font-medium text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Code2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Embed Badge</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPassportModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Recruiter Passport</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Combat Record & Telemetry HUD */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Duels & Win Rate */}
        <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
          <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Combat Record</span>
            <Activity className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-100">{combatRecord.totalDuels}</span>
            <span className="text-xs font-mono text-zinc-400">Duels</span>
          </div>
          <div className="text-xs text-zinc-400">
            <strong className="text-emerald-400">{combatRecord.winRate}%</strong> Win Rate ({combatRecord.wins}W / {combatRecord.losses}L)
          </div>
        </div>

        {/* Win Streak */}
        <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
          <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Current Streak</span>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400">{combatRecord.currentStreak}</span>
            <span className="text-xs font-mono text-zinc-400">in a row</span>
          </div>
          <div className="text-xs text-zinc-400">
            All-Time Best: <strong className="text-zinc-200">{combatRecord.bestStreak} Matches</strong>
          </div>
        </div>

        {/* Average Solve Velocity */}
        <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
          <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Avg Solve Speed</span>
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-100">{combatRecord.averageSpeed}</span>
          </div>
          <div className="text-xs text-zinc-400">
            Primary: <strong className="text-zinc-200">{combatRecord.primaryLanguages[0]?.language || 'Python 3'}</strong>
          </div>
        </div>

        {/* Anti-Cheat Integrity Score */}
        <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
          <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Integrity Score</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">
              {combatRecord.antiCheatIntegrity}%
            </span>
          </div>
          <div className="text-xs text-zinc-400">Verified Clean Session History</div>
        </div>
      </section>

      {/* 3. Interactive Elo Progression Chart & Algorithmic Mastery Radar */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Elo History Chart (7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <span>Elo Rating Progression</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400">
                  Current: {profile.rating}
                </span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">Rating trajectory across 1v1 collegiate duels.</p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-[11px] font-mono">
              {['30D', '90D', 'ALL'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setEloFilter(f)}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                    eloFilter === f ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Line Graph */}
          <div className="relative w-full h-48 bg-zinc-950/80 rounded-xl border border-zinc-850 p-2 overflow-hidden">
            <svg viewBox="0 0 600 180" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="eloGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={profile.tierColor} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={profile.tierColor} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="20" y1="35" x2="580" y2="35" stroke="#27272a" strokeDasharray="4 4" />
              <line x1="20" y1="90" x2="580" y2="90" stroke="#27272a" strokeDasharray="4 4" />
              <line x1="20" y1="145" x2="580" y2="145" stroke="#27272a" strokeDasharray="4 4" />

              {/* Tier Benchmark Labels */}
              <text x="25" y="32" fill="#52525b" fontSize="9" fontFamily="monospace">1600 VANGUARD</text>
              <text x="25" y="87" fill="#52525b" fontSize="9" fontFamily="monospace">1400 CENTURION</text>
              <text x="25" y="142" fill="#52525b" fontSize="9" fontFamily="monospace">1200 COMBATANT</text>

              {/* Area & Line */}
              {chartPoints.areaD && (
                <path d={chartPoints.areaD} fill="url(#eloGrad)" />
              )}
              {chartPoints.pathD && (
                <path
                  d={chartPoints.pathD}
                  fill="none"
                  stroke={profile.tierColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Points */}
              {chartPoints.points.map((pt, idx) => (
                <g key={idx} className="cursor-pointer group">
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill="#09090b"
                    stroke={profile.tierColor}
                    strokeWidth="2"
                    className="transition-all hover:r-6"
                  />
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Algorithmic Mastery Radar (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Algorithmic Mastery Radar</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">Syllabus proficiency evaluated from real duel test suites.</p>
          </div>

          <div className="space-y-3 pt-1">
            {algorithmicMastery.map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-300 truncate max-w-[180px]">
                    {cat.category}
                  </span>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-zinc-500">{cat.wins}W / {cat.attempts} matches</span>
                    <span className="font-bold text-emerald-400">{cat.masteryPercent}%</span>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${cat.masteryPercent}%`,
                      backgroundColor:
                        cat.masteryPercent >= 80 ? '#34d399' : cat.masteryPercent >= 60 ? '#fbbf24' : '#60a5fa'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Esports Trophy Cabinet */}
      <section className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Trophy Cabinet & Collegiate Honors</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">Verified algorithmic milestones and national competition honors.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {trophies.map((tr) => (
            <div
              key={tr.id}
              className={`p-4 rounded-xl border space-y-2 transition-all ${
                tr.unlocked
                  ? 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
                  : 'bg-zinc-950/30 border-zinc-900 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-950"
                  style={{ backgroundColor: tr.unlocked ? tr.tierColor : '#3f3f46' }}
                >
                  <Award className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase">
                  {tr.category}
                </span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-zinc-200">{tr.title}</h3>
                <p className="text-[11px] text-zinc-400 leading-snug mt-1">{tr.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Recent Duels & Code Vault */}
      <section className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-sky-400" />
              <span>Recent Duels & Code Vault</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">Chronological record of recent sudden-death algorithmic matches.</p>
          </div>
          <span className="text-xs font-mono text-zinc-500">{recentDuels.length} matches logged</span>
        </div>

        {recentDuels.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
            No competitive duels recorded yet. Enter matchmaking to claim your first Gladiator ranking victory.
          </div>
        ) : (
          <div className="divide-y divide-zinc-850">
            {recentDuels.map((match) => (
              <div
                key={match.roomCode}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                      match.result === 'WON'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {match.result === 'WON' ? 'W' : 'L'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-zinc-200">{match.problemTitle}</span>
                      <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400">
                        {match.difficulty}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">
                        • {match.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1.5">
                      <span>vs {match.opponent.name}</span>
                      <span
                        className="font-mono text-[10px] font-bold"
                        style={{ color: match.opponent.tierColor }}
                      >
                        ({match.opponent.rating} ELO)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right font-mono">
                    <div
                      className={`text-xs font-bold ${
                        match.ratingChange > 0
                          ? 'text-emerald-400'
                          : match.ratingChange < 0
                          ? 'text-rose-400'
                          : 'text-zinc-400'
                      }`}
                    >
                      {match.ratingChange > 0 ? `+${match.ratingChange}` : match.ratingChange} ELO
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {new Date(match.date).toLocaleDateString()}
                    </div>
                  </div>

                  <Link
                    to={`/battle/${match.roomCode}/review`}
                    className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-medium flex items-center gap-1 transition-colors border border-zinc-700"
                  >
                    <span>Review</span>
                    <ArrowRight className="w-3 h-3 text-zinc-400" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODAL 1: Embed GitHub Badge Modal */}
      {isOwner && badgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 p-6 space-y-4 shadow-2xl text-zinc-100">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-zinc-100">Embed Gladiator Rating Badge</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Showcase your verified algorithmic rating on your GitHub README and portfolio.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBadgeModalOpen(false)}
                className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Badge Preview */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <img src={profile.embedBadgeUrl} alt="Badge Preview" className="h-7" />
            </div>

            {/* Code Box */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase text-zinc-400">Markdown Code</label>
              <div className="p-3 rounded-lg bg-zinc-900/90 border border-zinc-800 font-mono text-xs text-zinc-300 break-all select-all">
                {`[![Flash Arena Rating](${profile.embedBadgeUrl})](${profile.shareUrl})`}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBadgeModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleCopyBadgeMarkdown}
                className="px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copiedBadge ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedBadge ? 'Copied' : 'Copy Markdown'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Recruiter Placement Passport Printable View */}
      {isOwner && passportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-zinc-950 border border-zinc-800 p-8 shadow-2xl text-zinc-100 space-y-6 my-8">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-zinc-100 uppercase tracking-widest">
                  FLASH ARENA • VERIFIED RECRUITER PASSPORT
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1 rounded bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPassportModalOpen(false)}
                  className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Passport Printable Container */}
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-6 font-sans">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-white">{profile.name}</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {profile.degree} • {profile.collegeName} (Class of {profile.graduationYear})
                  </p>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">Email: {profile.email}</p>
                </div>

                <div className="text-right">
                  <div
                    className="inline-block px-2.5 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider"
                    style={{ backgroundColor: `${profile.tierColor}20`, color: profile.tierColor }}
                  >
                    {profile.tier} • {profile.rating} ELO
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1 font-mono">
                    Standing: {profile.nationalRankPercentile}
                  </div>
                </div>
              </div>

              {/* Benchmarks Grid */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-lg bg-zinc-950 border border-zinc-850 text-center font-mono">
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase">Duels Analyzed</div>
                  <div className="text-lg font-bold text-zinc-200">{combatRecord.totalDuels}</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase">Win Accuracy</div>
                  <div className="text-lg font-bold text-emerald-400">{combatRecord.winRate}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase">Integrity Score</div>
                  <div className="text-lg font-bold text-emerald-400">{combatRecord.antiCheatIntegrity}%</div>
                </div>
              </div>

              {/* Verified Algorithmic Competencies */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                  Verified Algorithmic Competencies
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {algorithmicMastery.slice(0, 4).map((c) => (
                    <div key={c.category} className="p-2.5 rounded bg-zinc-950/70 border border-zinc-850 flex items-center justify-between">
                      <span className="text-zinc-300 truncate">{c.category}</span>
                      <span className="font-mono font-bold text-emerald-400">{c.masteryPercent}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification Seal */}
              <div className="pt-2 border-t border-zinc-850 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                <span>Cryptographically Verified via Judge0 Real-Time Sandbox</span>
                <span>{profile.shareUrl || `https://flashedu.in/u/${profile.username}`}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Claim / Edit Public Handle */}
      {isOwner && handleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl space-y-5 text-zinc-100">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-100">Claim Public Handle</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Customize your universal profile link across Flash.</p>
              </div>
              <button
                type="button"
                onClick={() => setHandleModalOpen(false)}
                className="p-1 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono uppercase text-zinc-400 block mb-1.5">
                  Public Handle
                </label>
                <div className="flex items-center rounded-lg bg-zinc-900 border border-zinc-800 focus-within:border-blue-500 px-3 py-2 text-xs">
                  <span className="font-mono text-zinc-500 select-none">flashedu.in/u/</span>
                  <input
                    type="text"
                    value={newHandle}
                    onChange={(e) => {
                      setNewHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''));
                      setHandleError(null);
                    }}
                    placeholder="yourhandle"
                    maxLength={24}
                    className="flex-1 bg-transparent text-white font-mono focus:outline-none pl-0.5"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  3-24 characters. Lowercase letters, numbers, hyphens, and underscores only.
                </p>
              </div>

              {handleError && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  {handleError}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setHandleModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                disabled={handleSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveUsername}
                disabled={handleSaving || !newHandle || newHandle.length < 3}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {handleSaving ? 'Saving...' : 'Save Handle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GladiatorProfilePage;

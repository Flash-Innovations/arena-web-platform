import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trophy,
  ArrowRight,
  ShieldCheck,
  Ticket,
  Calendar,
  ChevronRight,
  Layers,
  Search,
  Users,
  Sparkles,
  ExternalLink,
  Plus,
  Clock,
  Swords,
  Award
} from 'lucide-react';
import arenaApi from '../api/arenaApi';
import { useAuth } from '../context/AuthContext';

export function TournamentHubPage() {
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal } = useAuth();

  const [overview, setOverview] = useState(null);
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState(null);

  // Filters & Search for all contests
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'FLASH_OFFICIAL' | 'COLLEGE_PARTNERED' | 'COMMUNITY'

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [featuredRes, publicRes] = await Promise.allSettled([
          arenaApi.getFeaturedContest(),
          arenaApi.getPublicContests()
        ]);

        if (featuredRes.status === 'fulfilled' && featuredRes.value?.success && featuredRes.value.contest) {
          setOverview(featuredRes.value.contest);
          if (featuredRes.value.contest.isRegistered) {
            setRegistered(true);
          }
        } else {
          // Fallback to overview endpoint if featured is unavailable
          try {
            const fallbackRes = await arenaApi.getTournamentOverview();
            if (fallbackRes.success) {
              setOverview(fallbackRes.tournament);
            }
          } catch (e) {
            setOverview({
              title: 'Flash Coding Series 2026',
              slug: 'flash-coding-series-2026',
              organizerType: 'FLASH_OFFICIAL',
              description: 'The premier national collegiate knockout championship. Top qualifiers from the Stage 1 Qualifying Quiz are seeded into sudden-death coding brackets leading to the Grand Championship.',
              scheduledStartTime: '2026-11-28T18:00:00.000Z',
              participantCount: 1,
              maxParticipants: 512,
              eloImpactEligible: true,
              prizes: [
                { rankRange: '1st Place', reward: 'Grand Champion Trophy + Placement Sponsorship' }
              ],
              stages: [
                {
                  stageId: 'stg_1',
                  title: 'Round 1: Screening Aptitude & Core CS',
                  stageType: 'MCQ_QUIZ',
                  durationMinutes: 15,
                  cutoffValue: 64,
                  description: '15 Rapid-fire questions to qualify for Top 64 bracket.'
                },
                {
                  stageId: 'stg_2',
                  title: 'Round 2: Single Elimination 1v1 Bracket',
                  stageType: 'SPEED_DSA_1V1',
                  durationMinutes: 20,
                  bracketSize: 64,
                  description: 'Sudden-death code duels. First to pass 100% test cases advances.'
                }
              ]
            });
          }
        }

        if (publicRes.status === 'fulfilled' && publicRes.value?.success) {
          setContests(publicRes.value.contests || []);
        }
      } catch (err) {
        // Fallback silently
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleRegister = async () => {
    if (!isAuthenticated) {
      openAuthModal({
        mode: 'signin',
        title: 'Sign In to Register for Tournament',
        message: 'Sign in to register for the tournament and secure your slot in the knockout bracket.'
      });
      return;
    }

    try {
      setRegistering(true);
      setMessage(null);
      const slug = overview?.slug || 'flash-coding-series-2026';
      const res = await arenaApi.registerContest(slug).catch(() => arenaApi.registerTournament());
      if (res && res.success) {
        setRegistered(true);
        setMessage(`Successfully registered for ${overview?.title || 'the tournament'}!`);
      }
    } catch (err) {
      const msg = err.message || '';
      if (err.status === 401 || msg.toLowerCase().includes('auth')) {
        openAuthModal({
          mode: 'signin',
          title: 'Sign In to Register for Tournament',
          message: 'Your session has expired. Please sign in to register for the tournament.'
        });
        return;
      }
      setMessage(msg || 'Registration failed.');
    } finally {
      setRegistering(false);
    }
  };

  const formattedDateRange = overview?.scheduledStartTime
    ? new Date(overview.scheduledStartTime).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Season 2026';

  const grandPrizeText =
    overview?.prizes?.[0]?.reward ||
    overview?.prizes?.[0]?.title ||
    'Grand Champion Trophy + Placement Sponsorship';

  // Filter contests for the "All Contests" section
  const filteredContests = contests.filter((c) => {
    const matchesSearch =
      !searchQuery ||
      (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.creatorCollege || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.creatorName || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      filterType === 'ALL' ||
      (filterType === 'FLASH_OFFICIAL' && c.organizerType === 'FLASH_OFFICIAL') ||
      (filterType === 'COLLEGE_PARTNERED' && c.organizerType === 'COLLEGE_PARTNERED') ||
      (filterType === 'COMMUNITY' && !['FLASH_OFFICIAL', 'COLLEGE_PARTNERED'].includes(c.organizerType));

    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10 animate-fade-in">
      {/* 1. Flagship Tournament Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Glow Spheres */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Metadata Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
              {overview?.organizerType === 'FLASH_OFFICIAL'
                ? 'Official Flash Flagship League'
                : 'National Collegiate Championship'}
            </span>
            <span className="text-zinc-600">·</span>
            <span className="text-xs font-mono text-zinc-400">Season 2026</span>
            {overview?.eloImpactEligible && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-950/80 text-amber-300 border border-amber-800/80">
                Ranked Elo Rated
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <span>{formattedDateRange}</span>
          </div>
        </div>

        {/* Hero Title & Description */}
        <div className="space-y-2.5 relative z-10">
          <h1 className="text-2xl sm:text-4xl font-black text-zinc-100 tracking-tight">
            {overview?.title || 'Flash Coding Series 2026'}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-3xl leading-relaxed">
            {overview?.description ||
              'The premier national collegiate knockout championship. 512 contenders enter, 1 champion crowned.'}
          </p>
        </div>

        {/* Grand Prize Banner */}
        <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-amber-400 uppercase font-bold tracking-wider">
                Grand Championship Prize
              </div>
              <div className="text-sm font-bold text-zinc-200">
                {grandPrizeText}
              </div>
            </div>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <span className="text-xs font-mono text-zinc-400">
              <span className="text-amber-400 font-bold">{overview?.participantCount || 1}</span>
              {' / '}
              <span>{overview?.maxParticipants || 512}</span> Contenders Registered
            </span>
          </div>
        </div>

        {message && (
          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 relative z-10">
            {message}
          </div>
        )}

        {/* Hero Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-1 relative z-10">
          {registered ? (
            <div className="px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-2 font-mono">
              <ShieldCheck className="w-4 h-4" />
              <span>Registered for Tournament</span>
            </div>
          ) : (
            <button
              onClick={handleRegister}
              disabled={registering}
              className="px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-zinc-100/10"
            >
              <span>{registering ? 'Registering...' : 'Register for Tournament'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          <Link
            to="/series/bracket"
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-semibold border border-zinc-700/80 transition-colors flex items-center gap-1.5"
          >
            <Swords className="w-3.5 h-3.5 text-zinc-400" />
            <span>View Knockout Tree</span>
          </Link>

          <button
            onClick={() => {
              if (!isAuthenticated) {
                openAuthModal({
                  mode: 'signin',
                  title: 'Sign In to Take Qualifying Quiz',
                  message: 'Sign in with your student account to record your quiz submission and qualify for the bracket.'
                });
              } else {
                navigate('/series/quiz');
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-300 text-xs font-semibold border border-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Award className="w-3.5 h-3.5 text-zinc-400" />
            <span>Stage 1 Quiz</span>
          </button>

          {overview?.slug && (
            <Link
              to={`/contest/${overview.slug}`}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 text-xs font-mono border border-zinc-850 transition-colors flex items-center gap-1.5"
            >
              <span>Contest Details</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Dynamic Modular Stages Pipeline */}
        <div className="space-y-3 pt-4 border-t border-zinc-800/80 relative z-10">
          <h2 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
            Tournament Stages Pipeline ({overview?.stages?.length || 0} Rounds)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {(overview?.stages || []).map((stage, idx) => {
              const isQuiz = stage.stageType === 'MCQ_QUIZ';
              const is1v1 = stage.stageType === 'SPEED_DSA_1V1';

              return (
                <div
                  key={stage.stageId || idx}
                  className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2.5 flex flex-col justify-between hover:border-zinc-700 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-amber-400 font-bold block">
                        STAGE {idx + 1} · {stage.durationMinutes || 20} MINS
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">
                        {stage.bracketSize ? `${stage.bracketSize} Contenders` : `Top ${stage.cutoffValue || 16} Qualify`}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-zinc-100">
                      {stage.title}
                    </h3>

                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                      {stage.description ||
                        (isQuiz
                          ? 'CS & Aptitude timed screening assessment.'
                          : 'Sudden-death 1v1 duel. First to pass 100% test cases advances.')}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-900">
                    {isQuiz ? (
                      <button
                        onClick={() => {
                          if (!isAuthenticated) {
                            openAuthModal({
                              mode: 'signin',
                              title: 'Sign In to Take Qualifying Quiz',
                              message: 'Sign in with your student account to take the Stage 1 quiz.'
                            });
                          } else {
                            navigate('/series/quiz');
                          }
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 cursor-pointer"
                      >
                        <span>Take Quiz</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : is1v1 ? (
                      <Link
                        to="/series/bracket"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                      >
                        <span>View Bracket</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    ) : (
                      <Link
                        to={overview?.slug ? `/contest/${overview.slug}` : '/'}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-zinc-200"
                      >
                        <span>Stage Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. All Tournaments & Campus Contests Section */}
      <div className="space-y-5 pt-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-bold text-zinc-100 tracking-tight">
                All Tournaments & Contests
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                {filteredContests.length}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Explore national championship series, campus partnered hack-duels, and collegiate contests.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search contests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50 w-44 sm:w-56"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono">
              {[
                { key: 'ALL', label: 'All' },
                { key: 'FLASH_OFFICIAL', label: 'Official' },
                { key: 'COLLEGE_PARTNERED', label: 'Campus' },
                { key: 'COMMUNITY', label: 'Community' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilterType(tab.key)}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    filterType === tab.key
                      ? 'bg-zinc-800 text-zinc-100 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Host in Contest Studio shortcut */}
            <Link
              to="/contest/studio"
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Host Contest</span>
            </Link>
          </div>
        </div>

        {/* Contests Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800 animate-pulse space-y-3 h-48"
              />
            ))}
          </div>
        ) : filteredContests.length === 0 ? (
          <div className="p-12 rounded-xl bg-zinc-900/30 border border-zinc-800 text-center space-y-3">
            <Trophy className="w-8 h-8 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-semibold text-zinc-200">No contests found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              {searchQuery
                ? `No contests match "${searchQuery}". Try clearing your search.`
                : 'No tournaments available in this category yet. Launch your own in Contest Studio.'}
            </p>
            <Link
              to="/contest/studio"
              className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold mt-2"
            >
              <span>Create Contest in Contest Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContests.map((c) => {
              const isOfficial = c.organizerType === 'FLASH_OFFICIAL';
              const isCampus = c.organizerType === 'COLLEGE_PARTNERED';
              const startDate = c.scheduledStartTime
                ? new Date(c.scheduledStartTime).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric'
                  })
                : 'Season 2026';

              return (
                <div
                  key={c.id || c.slug}
                  className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden"
                >
                  <div className="space-y-3">
                    {/* Card Top Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            isOfficial
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
                              : isCampus
                              ? 'bg-blue-950/80 text-blue-300 border border-blue-800/80'
                              : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                          }`}
                        >
                          {isOfficial ? 'Flash Official' : isCampus ? 'Campus Partnered' : 'Community'}
                        </span>
                        {c.eloImpactEligible && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-400 border border-amber-800/60 text-[10px] font-mono font-bold uppercase">
                            Rated
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            c.status === 'ACTIVE'
                              ? 'bg-emerald-400 animate-ping'
                              : c.status === 'COMPLETED'
                              ? 'bg-zinc-500'
                              : 'bg-amber-400'
                          }`}
                        />
                        <span className="uppercase">{c.status || 'UPCOMING'}</span>
                      </span>
                    </div>

                    {/* Title & Host */}
                    <div>
                      <h3 className="text-base font-bold text-zinc-100 group-hover:text-amber-400 transition-colors line-clamp-1">
                        {c.title}
                      </h3>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5 line-clamp-1">
                        Hosted by {c.creatorCollege || c.creatorName || 'Flash HQ'}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {c.description || 'Custom Multi-Stage Coding Contest with live brackets and quiz screenings.'}
                    </p>

                    {/* Meta Specs */}
                    <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px] text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{c.stageCount || c.stages?.length || 1} Stages</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-zinc-500" />
                        <span>
                          {c.participantCount || 0} / {c.maxParticipants || 512}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Starts {startDate}</span>
                      </div>
                    </div>

                    {/* Prize snippet if available */}
                    {c.prizes && c.prizes.length > 0 && (
                      <div className="p-2 rounded-lg bg-zinc-950/80 border border-zinc-850 flex items-center gap-2 text-[11px] font-mono text-amber-300">
                        <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">Reward: {c.prizes[0].reward || c.prizes[0].title}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Action Footer */}
                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                    <Link
                      to={`/contest/${c.slug}`}
                      className="flex-1 py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold text-center transition-colors border border-zinc-700 cursor-pointer"
                    >
                      Enter Contest
                    </Link>
                    {c.slug === (overview?.slug || 'flash-coding-series-2026') && (
                      <Link
                        to="/series/bracket"
                        className="py-2 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono border border-zinc-800 transition-colors"
                        title="View Live Bracket"
                      >
                        <Swords className="w-3.5 h-3.5 text-amber-400" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default TournamentHubPage;

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, ArrowRight, ShieldCheck, Ticket, Calendar, ChevronRight, Layers } from 'lucide-react';
import arenaApi from '../api/arenaApi';
import { useAuth } from '../context/AuthContext';

export function TournamentHubPage() {
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal } = useAuth();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load dynamically from unified contest engine
        const res = await arenaApi.getFeaturedContest();
        if (res.success && res.contest) {
          setOverview(res.contest);
          if (res.contest.isRegistered) {
            setRegistered(true);
          }
        } else {
          // Fallback to overview endpoint
          const fallbackRes = await arenaApi.getTournamentOverview();
          if (fallbackRes.success) {
            setOverview(fallbackRes.tournament);
          }
        }
      } catch (err) {
        setOverview({
          title: 'Flash Coding Series 2026',
          slug: 'flash-coding-series-2026',
          description: 'The premier national collegiate knockout championship. Top qualifiers from the Stage 1 Qualifying Quiz are seeded into sudden-death coding brackets leading to the Grand Championship.',
          scheduledStartTime: '2026-11-28T18:00:00.000Z',
          participantCount: 0,
          prizes: [
            { rankRange: '1st Place', reward: 'Avengers: Doomsday Day-1 IMAX Premiere Ticket + 1-Year Flash Pro' }
          ],
          stages: [
            {
              stageId: 'stg_1',
              title: 'Stage 1: CS & Aptitude Qualifier',
              stageType: 'MCQ_QUIZ',
              durationMinutes: 20,
              cutoffValue: 512,
              description: '20-minute timed CS and Aptitude assessment. Top 512 scorers qualify for round 1.'
            },
            {
              stageId: 'stg_2',
              title: 'Stage 2: Round of 512 & 256',
              stageType: 'SPEED_DSA_1V1',
              durationMinutes: 20,
              bracketSize: 512,
              description: 'Opening single-elimination waves. Sudden-death 1v1 duels. First to pass 100% tests moves forward.'
            },
            {
              stageId: 'stg_3',
              title: 'Stage 3: Super 64 & Sweet 16',
              stageType: 'SPEED_DSA_1V1',
              durationMinutes: 25,
              bracketSize: 64,
              description: 'Advanced campus coders clash in high-difficulty Dynamic Programming and Graph challenges.'
            },
            {
              stageId: 'stg_4',
              title: 'Stage 4: Grand Championship',
              stageType: 'SPEED_DSA_1V1',
              durationMinutes: 30,
              bracketSize: 2,
              description: 'Quarterfinals, semifinals, and the Grand Final 1v1 duel. IMAX premiere tickets awarded.'
            }
          ]
        });
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

  const grandPrizeText = overview?.prizes?.[0]?.reward ||
    overview?.prizes?.[0]?.title ||
    'Grand Champion Trophy + Placement Sponsorship';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header Specification Box */}
      <div className="p-6 sm:p-8 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-mono font-semibold text-zinc-300 uppercase tracking-wider">
              {overview?.organizerType === 'FLASH_OFFICIAL' ? 'Official Flash Flagship League' : 'Collegiate Tournament'}
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <span>{formattedDateRange}</span>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
            {overview?.title || 'Flash Coding Series'}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-3xl leading-relaxed">
            {overview?.description || 'The premier national collegiate knockout championship. Top qualifiers advance through power-of-two sudden-death coding brackets leading to the Grand Championship.'}
          </p>
        </div>

        {/* Grand Prize Banner */}
        <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-850 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-750 flex items-center justify-center text-amber-400 shrink-0">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-amber-400 uppercase font-bold tracking-wider">
                Grand Championship Prize
              </div>
              <div className="text-xs font-semibold text-zinc-200">
                {grandPrizeText}
              </div>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-mono text-zinc-500">
            {overview?.participantCount !== undefined ? `${overview.participantCount} Contenders Registered` : 'Single Elimination Draw'}
          </span>
        </div>

        {message && (
          <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300">
            {message}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {registered ? (
            <div className="px-3.5 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-xs flex items-center gap-1.5 font-mono">
              <ShieldCheck className="w-4 h-4" />
              <span>Registered Contender</span>
            </div>
          ) : (
            <button
              onClick={handleRegister}
              disabled={registering}
              className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            >
              <span>{registering ? 'Registering...' : 'Register for Tournament'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          <Link
            to="/series/bracket"
            className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700/80 transition-colors"
          >
            View Knockout Tree
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
            className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-300 text-xs font-medium border border-zinc-800 transition-colors cursor-pointer"
          >
            Stage 1 Quiz
          </button>
        </div>
      </div>

      {/* Dynamic Modular Stages Pipeline */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
          Tournament Stages Pipeline ({overview?.stages?.length || 0} Rounds)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {(overview?.stages || []).map((stage, idx) => {
            const isQuiz = stage.stageType === 'MCQ_QUIZ';
            const is1v1 = stage.stageType === 'SPEED_DSA_1V1';

            return (
              <div
                key={stage.stageId || idx}
                className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-amber-400 font-semibold block">
                      STAGE {idx + 1} · {stage.durationMinutes || 20} MINS
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">
                      {stage.bracketSize ? `${stage.bracketSize} Contenders` : `Top ${stage.cutoffValue || 16} Qualify`}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-zinc-100">
                    {stage.title}
                  </h3>

                  <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                    {stage.description || (isQuiz ? 'CS & Aptitude timed screening assessment.' : 'Sudden-death 1v1 duel. First to pass 100% test cases advances.')}
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-850">
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
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 cursor-pointer"
                    >
                      <span>Take Quiz</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : is1v1 ? (
                    <Link
                      to="/series/bracket"
                      className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300"
                    >
                      <span>View Bracket</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  ) : (
                    <Link
                      to={overview?.slug ? `/contest/${overview.slug}` : '/'}
                      className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-zinc-200"
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
  );
}

export default TournamentHubPage;

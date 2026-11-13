import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ArrowRight, ShieldCheck, Ticket, Calendar, ChevronRight } from 'lucide-react';
import arenaApi from '../api/arenaApi';

export function TournamentHubPage() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await arenaApi.getTournamentOverview();
        if (res.success) {
          setOverview(res.tournament);
        }
      } catch (err) {
        setOverview({
          title: 'Flash Coding Series 2026',
          knockoutBracketSize: 512,
          currentStage: 'REGISTRATION',
          quizStartTime: '2026-11-28T18:00:00.000Z',
          quizEndTime: '2026-11-28T21:00:00.000Z',
          totalRegisteredCount: 0
        });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleRegister = async () => {
    try {
      setRegistering(true);
      setMessage(null);
      const res = await arenaApi.registerTournament();
      if (res.success) {
        setRegistered(true);
        setMessage('Successfully registered for Flash Coding Series 2026.');
      }
    } catch (err) {
      setMessage(err.message || 'Registration failed.');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header Specification Box */}
      <div className="p-6 sm:p-8 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-mono font-semibold text-zinc-300 uppercase tracking-wider">
              Official Collegiate Tournament
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <span>Nov 28 - Dec 13, 2026</span>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
            Flash Coding Series 2026
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-3xl leading-relaxed">
            The national 512-contender single-elimination algorithmic tournament. Top qualifiers from the Stage 1 Qualifying Quiz are seeded into power-of-two sudden-death coding brackets leading to the Grand Championship.
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
                Avengers: Doomsday Day-1 IMAX Premiere Ticket + 1-Year Flash Pro Placement Access
              </div>
            </div>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-mono text-zinc-500">
            512 Contender Draw
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
              <span>Registered for Nov 28 Qualifier</span>
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

          <Link
            to="/series/quiz"
            className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-300 text-xs font-medium border border-zinc-800 transition-colors"
          >
            Stage 1 Quiz
          </Link>
        </div>
      </div>

      {/* 4-Stage Roadmap Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-wider">
          Tournament Stages Pipeline
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-2">
            <span className="text-[10px] font-mono text-zinc-400 font-semibold block">STAGE 1 · NOV 28</span>
            <h3 className="text-sm font-semibold text-zinc-100">Qualifying Quiz</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              20-minute timed CS and Aptitude assessment. Top 512 scorers qualify for round 1.
            </p>
            <div className="pt-1">
              <Link
                to="/series/quiz"
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300"
              >
                <span>Take Quiz</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-2">
            <span className="text-[10px] font-mono text-zinc-400 font-semibold block">STAGE 2 · NOV 29</span>
            <h3 className="text-sm font-semibold text-zinc-100">Round of 512 &amp; 256</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Opening single-elimination waves. Sudden-death 1v1 duels. First to pass 100% tests moves forward.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-2">
            <span className="text-[10px] font-mono text-zinc-400 font-semibold block">STAGE 3 · DEC 05</span>
            <h3 className="text-sm font-semibold text-zinc-100">Super 64 &amp; Sweet 16</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Advanced campus coders clash in high-difficulty Dynamic Programming and Graph challenges.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-2">
            <span className="text-[10px] font-mono text-zinc-400 font-semibold block">STAGE 4 · DEC 13</span>
            <h3 className="text-sm font-semibold text-zinc-100">Grand Championship</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Quarterfinals, semifinals, and the Grand Final 1v1 duel. IMAX premiere tickets awarded.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TournamentHubPage;

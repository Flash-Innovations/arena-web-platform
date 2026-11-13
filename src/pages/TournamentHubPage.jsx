import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Calendar, Ticket, ArrowRight, ShieldCheck, Zap, Users, Sparkles } from 'lucide-react';
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
        // Fallback default tournament data
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
        setMessage('Successfully registered for Flash Coding Series 2026!');
      }
    } catch (err) {
      setMessage(err.message || 'Registration failed.');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12 animate-fade-in">
      {/* Hero Tournament Section */}
      <div className="relative rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-black border border-indigo-900/50 p-8 sm:p-14 overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-mono text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
            Flagship Campus Esports Series
          </div>

          <h1 className="text-3xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Flash Coding Series <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">2026</span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-300 leading-relaxed">
            The ultimate 512-contender single-elimination algorithmic tournament. 4 stages of sudden-death coding duels leading to the Grand Championship.
          </p>

          {/* Grand Prize Spotlight */}
          <div className="p-4 rounded-2xl bg-indigo-900/20 border border-indigo-500/30 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-mono text-amber-400 uppercase tracking-wider font-bold">
                Grand Prize
              </div>
              <div className="text-sm sm:text-base font-bold text-white">
                Avengers: Doomsday Day-1 IMAX Premiere Ticket + 1-Yr Flash Pro
              </div>
            </div>
          </div>

          {message && (
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono">
              {message}
            </div>
          )}

          {/* Registration Button / Status */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            {registered ? (
              <div className="px-6 py-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>You Are Registered For Nov 28</span>
              </div>
            ) : (
              <button
                onClick={handleRegister}
                disabled={registering}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Trophy className="w-4 h-4" />
                <span>{registering ? 'Registering...' : 'Register For Free (Nov 28)'}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            )}

            <Link
              to="/series/bracket"
              className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs uppercase tracking-wider border border-slate-700 transition-colors"
            >
              View 512-Tree Bracket
            </Link>
          </div>
        </div>
      </div>

      {/* 4-Stage Roadmap Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
          Tournament Stages Calendar
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <span className="text-xs font-mono text-indigo-400 font-bold">STAGE 1 • NOV 28</span>
            <h3 className="text-base font-bold text-white">Qualifying Quiz</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              20-minute timed CS and Aptitude test. Top 512 scorers qualify for opening round knockouts.
            </p>
            <div className="pt-2">
              <Link
                to="/series/quiz"
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300"
              >
                <span>Enter Quiz Arena</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <span className="text-xs font-mono text-indigo-400 font-bold">STAGE 2 • NOV 29</span>
            <h3 className="text-base font-bold text-white">Round of 512 & 256</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Opening single-elimination waves. Sudden-death 1v1 duels. First to pass 100% tests moves forward.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <span className="text-xs font-mono text-indigo-400 font-bold">STAGE 3 • DEC 05</span>
            <h3 className="text-base font-bold text-white">Super 64 & Sweet 16</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Elite campus coders clash in high-stakes DP and Graph challenges.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <span className="text-xs font-mono text-indigo-400 font-bold">STAGE 4 • DEC 13</span>
            <h3 className="text-base font-bold text-white">Grand Championship</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Quarter-finals, semi-finals, and the Grand Final 1v1. IMAX premiere tickets awarded!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TournamentHubPage;

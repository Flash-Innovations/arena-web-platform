import React, { useState, useEffect } from 'react';
import { Timer, CheckCircle, ArrowRight, ArrowLeft, ShieldAlert, Award, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { arenaApi } from '../api/arenaApi';

export function TournamentQuizPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes default
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  // Load live questions from PostgreSQL Question Bank
  useEffect(() => {
    async function loadQuiz() {
      try {
        setLoading(true);
        setLoadError(null);
        const res = await arenaApi.getTournamentQuizQuestions(15);
        if (res.success && Array.isArray(res.questions) && res.questions.length > 0) {
          setQuestions(res.questions);
          if (res.durationSeconds) {
            setTimeLeft(res.durationSeconds);
          }
        } else {
          setLoadError('No questions available in the question bank right now.');
        }
      } catch (err) {
        setLoadError(err.message || 'Failed to load qualifying quiz questions.');
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (loading || submitted || timeLeft <= 0 || questions.length === 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, submitted, timeLeft, questions.length]);

  const handleSelectOption = (questionId, optionId) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleSubmit = async () => {
    if (submitting || submitted) return;
    setSubmitting(true);
    const timeTaken = 1200 - timeLeft;

    try {
      const res = await arenaApi.submitTournamentQuiz({
        answers: selectedAnswers,
        timeTakenSeconds: timeTaken,
        totalQuestions: questions.length
      });

      if (res.success) {
        setResult({
          score: res.quizScore,
          correctCount: res.correctCount,
          totalQuestions: res.totalQuestions || questions.length,
          timeTaken,
          perks: res.perks,
          breakdown: res.breakdown
        });
        setSubmitted(true);
      }
    } catch (err) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-32 text-center space-y-4">
        <Loader2 className="w-8 h-8 mx-auto text-indigo-400 animate-spin" />
        <p className="text-sm font-mono text-slate-400">Loading Stage 1 Qualifying Quiz from Question Bank...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Quiz Access Restricted</h2>
          <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">{loadError}</p>
        </div>
        <div className="pt-2 flex justify-center gap-3">
          <a
            href="/series"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Go to Tournament Hub
          </a>
        </div>
      </div>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const currentQ = questions[currentIdx];

  if (submitted && result) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Award className="w-8 h-8" />
        </div>
        <div>
          <span className="text-xs font-mono uppercase text-emerald-400 tracking-widest font-bold">
            Day 1 Qualifying Attempt Verified
          </span>
          <h2 className="text-3xl font-black text-white mt-1">Assessment Officially Scored</h2>
          <p className="text-xs text-slate-400 mt-2">
            Your answers were verified by the Flash Question Bank server. Results are permanently recorded for bracket seeding.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-left">
          <div className="grid grid-cols-3 gap-4 pb-4 border-b border-slate-800 text-center">
            <div>
              <div className="text-xs text-slate-400 font-mono">Official Score</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">{result.score}%</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-mono">Correct Answers</div>
              <div className="text-2xl font-black text-white mt-1">
                {result.correctCount !== undefined ? `${result.correctCount} / ${result.totalQuestions}` : `${result.score}/100`}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-mono">Time Taken</div>
              <div className="text-2xl font-black text-indigo-400 mt-1">
                {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-mono pt-2">
            <span className="text-slate-400">Target Knockout Bracket:</span>
            <span className="font-bold text-indigo-400">Round of 512 (Nov 29 Wave 1)</span>
          </div>

          {result.perks?.voucherCode && (
            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-indigo-300">Founding Contender Voucher</div>
                <div className="text-[11px] text-slate-400">30% off annual placement subscription</div>
              </div>
              <span className="px-3 py-1 rounded-lg bg-indigo-600 font-mono font-bold text-xs text-white">
                {result.perks.voucherCode}
              </span>
            </div>
          )}
        </div>

        <div className="pt-2">
          <a
            href="/series/bracket"
            className="inline-block px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-colors"
          >
            View Knockout Tournament Bracket
          </a>
        </div>
      </div>
    );
  }

  if (!currentQ) return null;

  const currentAnswer = selectedAnswers[currentQ.id];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-fade-in">
      {/* Quiz Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {currentQ.category || 'General'}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-slate-800 text-slate-300">
              {currentQ.difficulty || 'Medium'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1.5">{currentQ.title || 'Flash Series Qualifier'}</h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Question {currentIdx + 1} of {questions.length}
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 font-mono text-sm font-bold text-white">
          <Timer className="w-4 h-4 text-indigo-400" />
          <span>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Question Card */}
      <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <p className="text-base sm:text-lg font-medium text-white leading-relaxed whitespace-pre-wrap">
          {currentQ.statement}
        </p>

        <div className="space-y-3">
          {(currentQ.options || []).map((opt, optIndex) => {
            const optId = opt.id || String.fromCharCode(65 + optIndex);
            const isSelected = currentAnswer === optId;
            return (
              <button
                key={optId}
                onClick={() => handleSelectOption(currentQ.id, optId)}
                className={`w-full p-4 rounded-xl text-left text-xs sm:text-sm font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 border border-slate-800 text-slate-400'
                    }`}
                  >
                    {optId}
                  </span>
                  <span>{opt.text}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
          disabled={currentIdx === 0}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs font-bold border border-slate-800 disabled:opacity-30 cursor-pointer flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        {currentIdx < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Next Question</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{submitting ? 'Verifying with Server...' : 'Submit Final Assessment'}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default TournamentQuizPage;

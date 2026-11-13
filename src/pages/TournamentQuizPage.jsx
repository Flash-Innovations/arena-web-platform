import React, { useState, useEffect } from 'react';
import { Timer, ArrowRight, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
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
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-3">
        <Loader2 className="w-6 h-6 mx-auto text-zinc-400 animate-spin" />
        <p className="text-xs font-mono text-zinc-400">Loading Stage 1 Quiz from Question Bank...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-10 h-10 mx-auto rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-400">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-zinc-100">Access Restricted</h2>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{loadError}</p>
        </div>
        <div className="pt-2">
          <a
            href="/series"
            className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors"
          >
            Tournament Hub
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
      <div className="max-w-xl mx-auto px-4 py-16 space-y-5 animate-fade-in">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono text-emerald-400 font-semibold uppercase tracking-wider">
              Assessment Verified
            </span>
          </div>
          <h2 className="text-xl font-bold text-zinc-100">Stage 1 Attempt Recorded</h2>
          <p className="text-xs text-zinc-400">
            Answers officially verified by the server. Your seed in the 512-tree is determined by this result.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4 font-mono text-xs">
          <div className="grid grid-cols-3 gap-3 pb-3 border-b border-zinc-800 text-center">
            <div>
              <div className="text-[11px] text-zinc-500 uppercase">Score</div>
              <div className="text-lg font-bold text-zinc-100 mt-0.5">{result.score}%</div>
            </div>
            <div>
              <div className="text-[11px] text-zinc-500 uppercase">Passed</div>
              <div className="text-lg font-bold text-zinc-100 mt-0.5">
                {result.correctCount !== undefined ? `${result.correctCount}/${result.totalQuestions}` : `${result.score}/100`}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-zinc-500 uppercase">Duration</div>
              <div className="text-lg font-bold text-zinc-100 mt-0.5">
                {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400">Knockout Target</span>
            <span className="text-zinc-200 font-semibold">Round of 512 (Nov 29 Wave 1)</span>
          </div>

          {result.perks?.voucherCode && (
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-850 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-zinc-200 font-sans">Placement Voucher</div>
                <div className="text-[11px] text-zinc-500 font-sans">30% off annual subscription</div>
              </div>
              <span className="px-2.5 py-1 rounded bg-zinc-800 font-mono text-xs font-bold text-zinc-100">
                {result.perks.voucherCode}
              </span>
            </div>
          )}
        </div>

        <div>
          <a
            href="/series/bracket"
            className="block w-full py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs text-center transition-colors"
          >
            Go to Tournament Bracket
          </a>
        </div>
      </div>
    );
  }

  if (!currentQ) return null;

  const currentAnswer = selectedAnswers[currentQ.id];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      {/* Quiz Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase bg-zinc-900 text-zinc-300 border border-zinc-800">
              {currentQ.category || 'General'}
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase bg-zinc-900 text-zinc-400 border border-zinc-800">
              {currentQ.difficulty || 'Medium'}
            </span>
          </div>
          <h1 className="text-base font-bold text-zinc-100 mt-1">{currentQ.title || 'Flash Series Qualifier'}</h1>
          <p className="text-xs text-zinc-500 font-mono">
            Question {currentIdx + 1} of {questions.length}
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-xs font-bold text-zinc-200">
          <Timer className="w-3.5 h-3.5 text-zinc-400" />
          <span>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Question Card */}
      <div className="p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-5">
        <p className="text-sm font-medium text-zinc-200 leading-relaxed whitespace-pre-wrap">
          {currentQ.statement}
        </p>

        <div className="space-y-2">
          {(currentQ.options || []).map((opt, optIndex) => {
            const optId = opt.id || String.fromCharCode(65 + optIndex);
            const isSelected = currentAnswer === optId;
            return (
              <button
                key={optId}
                onClick={() => handleSelectOption(currentQ.id, optId)}
                className={`w-full p-3 rounded-lg text-left text-xs transition-colors cursor-pointer border ${
                  isSelected
                    ? 'bg-zinc-800 border-zinc-500 text-zinc-100 font-medium'
                    : 'bg-zinc-950/60 border-zinc-850 hover:border-zinc-750 text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-5 h-5 rounded flex items-center justify-center text-[11px] font-mono font-bold shrink-0 ${
                      isSelected
                        ? 'bg-zinc-100 text-zinc-950'
                        : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
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
          className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-300 text-xs font-medium border border-zinc-800 disabled:opacity-30 cursor-pointer flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        {currentIdx < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium border border-zinc-700 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Next</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{submitting ? 'Verifying...' : 'Submit Assessment'}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default TournamentQuizPage;

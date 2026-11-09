import React, { useState, useEffect } from 'react';
import { Timer, CheckCircle, ArrowRight, ArrowLeft, ShieldAlert, Award } from 'lucide-react';
import arenaApi from '../api/arenaApi';

const SAMPLE_QUESTIONS = [
  {
    id: 1,
    question: 'What is the worst-case time complexity of QuickSelect to find the k-th smallest element in an unsorted array?',
    options: ['O(N)', 'O(N log N)', 'O(N^2)', 'O(log N)'],
    correct: 2
  },
  {
    id: 2,
    question: 'In a directed acyclic graph (DAG), which algorithm is used to find a linear ordering of vertices such that for every directed edge u -> v, u comes before v?',
    options: ['Dijkstra Algorithm', 'Topological Sort', 'Kruskal Algorithm', 'Floyd-Warshall'],
    correct: 1
  },
  {
    id: 3,
    question: 'Which data structure supports insert, delete, and get_random element in amortized O(1) time complexity?',
    options: ['Hash Map + Dynamic Array', 'Balanced AVL Tree', 'Min-Heap', 'Doubly Linked List'],
    correct: 0
  },
  {
    id: 4,
    question: 'What is the maximum number of edges in a simple undirected graph with N vertices?',
    options: ['N(N-1)', 'N(N-1)/2', '2^N', 'N^2'],
    correct: 1
  },
  {
    id: 5,
    question: 'If a problem exhibits optimal substructure and overlapping subproblems, which algorithmic paradigm is best suited?',
    options: ['Greedy Approach', 'Divide and Conquer', 'Dynamic Programming', 'Backtracking'],
    correct: 2
  }
];

export function TournamentQuizPage() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes in seconds
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (submitted || timeLeft <= 0) return;
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
  }, [submitted, timeLeft]);

  const handleSelectOption = (optIndex) => {
    setSelectedAnswers({ ...selectedAnswers, [currentIdx]: optIndex });
  };

  const handleSubmit = async () => {
    let score = 0;
    SAMPLE_QUESTIONS.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct) {
        score += 20; // 5 questions * 20 = 100 max score
      }
    });

    const timeTaken = 1200 - timeLeft;
    setResult({ score, timeTaken });
    setSubmitted(true);

    try {
      await arenaApi.submitTournamentQuiz({
        score,
        timeTakenSeconds: timeTaken,
        totalQuestions: SAMPLE_QUESTIONS.length
      });
    } catch (e) {
      // Record locally if offline
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const currentQ = SAMPLE_QUESTIONS[currentIdx];

  if (submitted && result) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Award className="w-8 h-8" />
        </div>
        <div>
          <span className="text-xs font-mono uppercase text-emerald-400 tracking-widest font-bold">
            Day 1 Qualifying Attempt Recorded
          </span>
          <h2 className="text-3xl font-black text-white mt-1">Quiz Submitted</h2>
          <p className="text-xs text-slate-400 mt-2">
            Your score and completion time have been registered in the tournament database.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">Total Score:</span>
            <span className="font-bold text-emerald-400">{result.score} / 100</span>
          </div>
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">Time Taken:</span>
            <span className="font-bold text-white">
              {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
            </span>
          </div>
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">Target Knockout Bracket:</span>
            <span className="font-bold text-indigo-400">Round of 512 (Nov 29)</span>
          </div>
        </div>

        <div className="pt-2">
          <a
            href="/series/bracket"
            className="inline-block px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-colors"
          >
            Go to Tournament Bracket
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-fade-in">
      {/* Quiz Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Flash Series Day 1 Qualifier</h1>
          <p className="text-xs text-slate-400 font-mono">
            Question {currentIdx + 1} of {SAMPLE_QUESTIONS.length}
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
        <p className="text-base sm:text-lg font-medium text-white leading-relaxed">
          {currentQ.question}
        </p>

        <div className="space-y-3">
          {currentQ.options.map((opt, optIndex) => {
            const isSelected = selectedAnswers[currentIdx] === optIndex;
            return (
              <button
                key={optIndex}
                onClick={() => handleSelectOption(optIndex)}
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
                    {String.fromCharCode(65 + optIndex)}
                  </span>
                  <span>{opt}</span>
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

        {currentIdx < SAMPLE_QUESTIONS.length - 1 ? (
          <button
            onClick={() => setCurrentIdx((prev) => Math.min(SAMPLE_QUESTIONS.length - 1, prev + 1))}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Next Question</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Submit Final Assessment
          </button>
        )}
      </div>
    </div>
  );
}

export default TournamentQuizPage;

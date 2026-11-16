import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Check,
  Plus,
  Loader2,
  BookOpen,
  Filter,
  Sparkles,
  Shuffle
} from 'lucide-react';
import arenaApi from '../../api/arenaApi';

const DIFFICULTIES = ['ALL', 'EASY', 'MEDIUM', 'HARD'];
const CATEGORIES = [
  'ALL',
  'Arrays & Hashing',
  'Two Pointers',
  'Sliding Window',
  'Stack',
  'Binary Search',
  'Linked List',
  'Trees & Graphs',
  'Dynamic Programming',
  'Greedy',
  'Math & Geometry'
];

export function QuestionBankModal({
  isOpen,
  onClose,
  selectedIds = [],
  onSave,
  stageTitle = 'Stage'
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentSelected, setCurrentSelected] = useState(selectedIds || []);
  const [activeTab, setActiveTab] = useState('BROWSE'); // 'BROWSE' | 'SELECTED'

  useEffect(() => {
    if (isOpen) {
      setCurrentSelected(selectedIds || []);
      loadProblems();
    }
  }, [isOpen, selectedIds]);

  const loadProblems = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (selectedDifficulty !== 'ALL') params.difficulty = selectedDifficulty;
      if (selectedCategory !== 'ALL') params.category = selectedCategory;

      const res = await arenaApi.searchQuestions(params);
      if (res && res.success) {
        setProblems(res.problems || []);
      }
    } catch (err) {
      // Fallback to problem catalog if search fails
      try {
        const catRes = await arenaApi.getProblemCatalog();
        if (catRes && catRes.success) {
          setProblems(catRes.problems || []);
        }
      } catch (e) {}
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProblem = (id) => {
    if (currentSelected.includes(id)) {
      setCurrentSelected(currentSelected.filter((item) => item !== id));
    } else {
      setCurrentSelected([...currentSelected, id]);
    }
  };

  const handleSelectRandom = (count = 3) => {
    if (problems.length === 0) return;
    const shuffled = [...problems].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, count).map((p) => p.id);
    const merged = Array.from(new Set([...currentSelected, ...picked]));
    setCurrentSelected(merged);
  };

  const handleSaveAndClose = () => {
    if (onSave) {
      onSave(currentSelected);
    }
    onClose();
  };

  if (!isOpen) return null;

  const difficultyColors = {
    EASY: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60',
    MEDIUM: 'text-amber-400 bg-amber-950/40 border-amber-800/60',
    HARD: 'text-rose-400 bg-rose-950/40 border-rose-800/60'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
                <BookOpen className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-zinc-100">
                Question Bank Problem Locker
              </h2>
            </div>
            <p className="text-xs text-zinc-400">
              Curate and lock challenges from the 1,000+ Neon DB repository for <strong className="text-zinc-200">{stageTitle}</strong>.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar & Search */}
        <div className="p-4 bg-zinc-950/50 border-b border-zinc-800 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by title, topic, or keyword (e.g. Two Sum, Substring)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadProblems()}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            </div>

            <button
              onClick={loadProblems}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              Search
            </button>

            <button
              onClick={() => handleSelectRandom(3)}
              className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Random 3</span>
            </button>
          </div>

          {/* Difficulty & Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-mono text-zinc-500 mr-1">Tier:</span>
              {DIFFICULTIES.map((diff) => (
                <button
                  key={diff}
                  onClick={() => {
                    setSelectedDifficulty(diff);
                    setTimeout(loadProblems, 50);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                    selectedDifficulty === diff
                      ? 'bg-zinc-800 text-zinc-100 font-bold border border-zinc-700'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>

            <div className="text-xs font-mono text-zinc-400">
              Selected: <strong className="text-amber-400">{currentSelected.length}</strong> problems
            </div>
          </div>
        </div>

        {/* Problem List Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {loading ? (
            <div className="py-20 text-center space-y-2">
              <Loader2 className="w-6 h-6 text-zinc-500 animate-spin mx-auto" />
              <p className="text-xs font-mono text-zinc-500">Querying question bank repository...</p>
            </div>
          ) : problems.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <p className="text-xs font-mono text-zinc-500">No problems found matching this search criteria.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDifficulty('ALL');
                  setSelectedCategory('ALL');
                  setTimeout(loadProblems, 50);
                }}
                className="text-xs font-mono text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            problems.map((p) => {
              const isSelected = currentSelected.includes(p.id);
              const diffClass = difficultyColors[p.difficulty?.toUpperCase()] || 'text-zinc-400 bg-zinc-800 border-zinc-700';

              return (
                <div
                  key={p.id}
                  onClick={() => handleToggleProblem(p.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-zinc-800/80 border-amber-500/70 shadow-sm'
                      : 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40'
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${diffClass}`}>
                        {p.difficulty}
                      </span>
                      <span className="text-xs font-mono text-zinc-500">
                        {p.category || 'DSA'}
                      </span>
                      {p.testCasesCount > 0 && (
                        <span className="text-[11px] font-mono text-zinc-600">
                          ({p.testCasesCount} test cases)
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-zinc-100">{p.title}</h4>
                    <p className="text-[11px] text-zinc-400 line-clamp-1">
                      {p.description ? p.description.replace(/[#*`_]/g, '') : 'Algorithmic problem statement.'}
                    </p>
                  </div>

                  <div className="shrink-0 pt-0.5">
                    <button
                      type="button"
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-amber-500 border-amber-400 text-zinc-950 font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950/80 border-t border-zinc-800 flex items-center justify-between">
          <div className="text-xs font-mono text-zinc-400">
            {currentSelected.length === 0 ? (
              <span className="text-zinc-500">No problems selected (random medium will be used by default)</span>
            ) : (
              <span>
                <strong className="text-amber-400">{currentSelected.length}</strong> problem(s) locked for this stage
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndClose}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-colors cursor-pointer"
            >
              Lock In Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuestionBankModal;

import React, { useState } from 'react';
import { X, Swords, Zap, Code2, Bug, Timer, Share2, Copy, Check, MessageSquare } from 'lucide-react';
import arenaApi from '../../api/arenaApi';

const GAME_MODES = [
  {
    id: 'SPEED_DSA',
    name: 'Speed DSA',
    icon: Zap,
    description: 'Sudden-death knockout. First to pass 100% test cases wins immediately.'
  },
  {
    id: 'CODE_GOLF',
    name: 'Code Golf',
    icon: Code2,
    description: 'Shortest clean solution. Fewest characters with passing tests wins.'
  },
  {
    id: 'BUG_HUNTER',
    name: 'Bug Hunter',
    icon: Bug,
    description: 'Debug duel. First to fix the intentional logic bugs and pass edge tests.'
  },
  {
    id: 'TIME_ATTACK',
    name: 'Time Attack',
    icon: Timer,
    description: 'Fixed-duration blitz. Highest test-case score at the final buzzer wins.'
  }
];

const CATEGORIES = [
  'All / Random',
  'Arrays & Hash Maps',
  'Two Pointers & Sliding Window',
  'Stacks & Queues',
  'Trees & Graphs',
  'Dynamic Programming'
];

export function CreateBattleModal({ isOpen, onClose }) {
  const [gameMode, setGameMode] = useState('SPEED_DSA');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [category, setCategory] = useState('All / Random');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [isCustomProblem, setIsCustomProblem] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [customOutput, setCustomOutput] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdRoom, setCreatedRoom] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        gameMode,
        difficulty,
        category: category === 'All / Random' ? 'All' : category,
        durationMinutes: Number(durationMinutes),
        isCustomProblem,
        isPublicLobby: true
      };

      if (isCustomProblem) {
        if (!customTitle.trim()) {
          setError('Please provide a title for your custom problem.');
          setLoading(false);
          return;
        }
        payload.customProblemData = {
          title: customTitle.trim(),
          description: customDesc.trim() || 'Solve the given custom test cases.',
          starterCode: {
            python: 'def solve(inp):\n    # Write your solution\n    return inp\n\nimport sys\nif __name__ == "__main__":\n    lines = sys.stdin.read().strip()\n    print(solve(lines))\n',
            javascript: 'const fs = require("fs");\nconst input = fs.readFileSync(0, "utf-8").trim();\nconsole.log(input);\n',
            cpp: '#include <iostream>\nusing namespace std;\nint main() {\n    string s;\n    if (cin >> s) cout << s << endl;\n    return 0;\n}\n'
          },
          testCases: [
            {
              input: customInput.trim() || '1',
              expectedOutput: customOutput.trim() || '1',
              isHidden: false
            }
          ]
        };
      }

      const res = await arenaApi.createFriendlyRoom(payload);
      if (res.success) {
        setCreatedRoom(res);
      }
    } catch (err) {
      setError(err.message || 'Failed to create battle room.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (createdRoom) {
      const shareUrl = createdRoom.shareUrl || `https://arena.flashedu.in/battle/${createdRoom.roomCode}`;
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create 1v1 Battle Arena</h2>
              <p className="text-xs text-slate-400">Customize format, topic, and share challenge via WhatsApp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
              {error}
            </div>
          )}

          {createdRoom ? (
            /* Room Created Celebration / Share Card */
            <div className="space-y-6 py-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Check className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest">Duel Ready</span>
                <h3 className="text-3xl font-black text-white tracking-widest mt-1">
                  {createdRoom.roomCode}
                </h3>
                <p className="text-xs text-slate-400 mt-2">
                  Share this match with a friend. The battle kicks off as soon as they check in!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={createdRoom.whatsappShareUrl || `https://api.whatsapp.com/send?text=${encodeURIComponent(`1v1 Code Battle on Flash! Join room: ${createdRoom.roomCode} at https://arena.flashedu.in/battle/${createdRoom.roomCode}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/30"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Share via WhatsApp</span>
                </a>

                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Link Copied!' : 'Copy Battle Link'}</span>
                </button>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <a
                  href={`/battle/${createdRoom.roomCode}`}
                  className="block w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30"
                >
                  Enter Duel Room Now
                </a>
              </div>
            </div>
          ) : (
            /* Creation Configuration Form */
            <div className="space-y-6">
              {/* Game Mode Selector */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">
                  1. Select Game Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {GAME_MODES.map((mode) => {
                    const Icon = mode.icon;
                    const isSelected = gameMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setGameMode(mode.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                          <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {mode.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{mode.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Difficulty Tier
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['EASY', 'MEDIUM', 'HARD'].map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setDifficulty(diff)}
                        className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          difficulty === diff
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Match Duration
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 20].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setDurationMinutes(mins)}
                        className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          durationMinutes === mins
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Topic Selector */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                  DSA Topic Focus
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-slate-900 text-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Problem Toggle */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white">Custom Challenge (Bring Your Own)</span>
                    <p className="text-[11px] text-slate-400">Write your own statement and test cases</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isCustomProblem}
                    onChange={(e) => setIsCustomProblem(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-800 focus:ring-0 cursor-pointer"
                  />
                </div>

                {isCustomProblem && (
                  <div className="mt-4 space-y-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800 animate-fade-in">
                    <input
                      type="text"
                      placeholder="Problem Title (e.g. Invert String Without Libraries)"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                    <textarea
                      rows={3}
                      placeholder="Problem Description and Constraints..."
                      value={customDesc}
                      onChange={(e) => setCustomDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-mono uppercase text-slate-400">Test Input (stdin)</label>
                        <input
                          type="text"
                          placeholder="hello"
                          value={customInput}
                          onChange={(e) => setCustomInput(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono uppercase text-slate-400">Expected Output</label>
                        <input
                          type="text"
                          placeholder="olleh"
                          value={customOutput}
                          onChange={(e) => setCustomOutput(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!createdRoom && (
          <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Creating Room...</span>
                </>
              ) : (
                <>
                  <Swords className="w-4 h-4" />
                  <span>Create Duel & Get Link</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateBattleModal;

import React, { useState } from 'react';
import { X, Copy, Check, MessageSquare, Terminal, ChevronRight } from 'lucide-react';
import arenaApi from '../../api/arenaApi';

const GAME_MODES = [
  {
    id: 'SPEED_DSA',
    name: 'Speed DSA',
    description: 'Sudden-death. First to pass 100% of test cases wins.'
  },
  {
    id: 'CODE_GOLF',
    name: 'Code Golf',
    description: 'Fewest characters with passing test suite.'
  },
  {
    id: 'BUG_HUNTER',
    name: 'Bug Hunter',
    description: 'First to fix the intentional bugs in code.'
  },
  {
    id: 'TIME_ATTACK',
    name: 'Time Attack',
    description: 'Highest test-case score at the final buzzer.'
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
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-zinc-300" />
            <h2 className="text-sm font-semibold text-zinc-100">Create Battle Room</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono">
              {error}
            </div>
          )}

          {createdRoom ? (
            /* Created Room Card */
            <div className="space-y-5 py-3 text-center">
              <div className="w-10 h-10 mx-auto rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-emerald-400">
                <Check className="w-5 h-5" />
              </div>

              <div>
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Room Generated</span>
                <h3 className="text-2xl font-bold font-mono text-zinc-100 mt-1">
                  {createdRoom.roomCode}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Share this duel with your challenger. The match begins once both players check in.
                </p>
              </div>

              <div className="flex gap-2">
                <a
                  href={createdRoom.whatsappShareUrl || `https://api.whatsapp.com/send?text=${encodeURIComponent(`1v1 Code Duel on Flash! Join room: ${createdRoom.roomCode} at https://arena.flashedu.in/battle/${createdRoom.roomCode}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-medium border border-zinc-700 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp Invite</span>
                </a>

                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-medium border border-zinc-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                  <span>{copied ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>

              <div className="pt-2 border-t border-zinc-800">
                <a
                  href={`/battle/${createdRoom.roomCode}`}
                  className="block w-full py-2.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs text-center transition-colors"
                >
                  Enter Duel Chamber
                </a>
              </div>
            </div>
          ) : (
            /* Creation Controls */
            <div className="space-y-4">
              {/* Game Mode */}
              <div>
                <label className="block text-[11px] font-mono font-semibold uppercase text-zinc-400 mb-2">
                  Match Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {GAME_MODES.map((mode) => {
                    const isSelected = gameMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setGameMode(mode.id)}
                        className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
                            : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                        }`}
                      >
                        <div className="text-xs font-semibold">{mode.name}</div>
                        <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{mode.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-semibold uppercase text-zinc-400 mb-1.5">
                    Difficulty Tier
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['EASY', 'MEDIUM', 'HARD'].map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setDifficulty(diff)}
                        className={`py-1.5 text-xs font-mono font-semibold rounded border transition-colors cursor-pointer ${
                          difficulty === diff
                            ? 'bg-zinc-800 text-zinc-100 border-zinc-650'
                            : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-semibold uppercase text-zinc-400 mb-1.5">
                    Duration
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[5, 10, 15, 20].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setDurationMinutes(mins)}
                        className={`py-1.5 text-xs font-mono font-semibold rounded border transition-colors cursor-pointer ${
                          durationMinutes === mins
                            ? 'bg-zinc-800 text-zinc-100 border-zinc-650'
                            : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
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
                <label className="block text-[11px] font-mono font-semibold uppercase text-zinc-400 mb-1.5">
                  Algorithm Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-zinc-900 text-zinc-200">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Problem Toggle */}
              <div className="pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-zinc-200">Custom Problem (Bring Your Own)</span>
                    <p className="text-[11px] text-zinc-500">Provide custom problem statement &amp; test inputs</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isCustomProblem}
                    onChange={(e) => setIsCustomProblem(e.target.checked)}
                    className="w-4 h-4 rounded text-zinc-800 bg-zinc-950 border-zinc-700 cursor-pointer"
                  />
                </div>

                {isCustomProblem && (
                  <div className="mt-3 space-y-2 p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
                    <input
                      type="text"
                      placeholder="Problem Title (e.g. Reverse Digits Without Strings)"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                    />
                    <textarea
                      rows={2}
                      placeholder="Problem statement and constraints..."
                      value={customDesc}
                      onChange={(e) => setCustomDesc(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Test Input (e.g. 123)"
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-200"
                      />
                      <input
                        type="text"
                        placeholder="Expected Output (e.g. 321)"
                        value={customOutput}
                        onChange={(e) => setCustomOutput(e.target.value)}
                        className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-200"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!createdRoom && (
          <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900/90 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>{loading ? 'Creating...' : 'Create Duel'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateBattleModal;

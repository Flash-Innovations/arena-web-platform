import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { arenaApi } from '../api/arenaApi';
import { BattleHUD } from '../components/battle/BattleHUD';
import { CodeEditor } from '../components/battle/CodeEditor';
import { VictoryModal } from '../components/battle/VictoryModal';
import {
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  MessageSquare,
  Lock,
  ArrowRight
} from 'lucide-react';

export function BattleRoomPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [opponentProgress, setOpponentProgress] = useState(null);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(null);
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [winReason, setWinReason] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [tabBlurViolations, setTabBlurViolations] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isSpectatorGated, setIsSpectatorGated] = useState(false);

  // 1. Guest Spectator Policy: 3 Matches Max Per Device
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('arena_spectated_matches') || '[]');
      const isAlreadyRecorded = stored.includes(roomCode);
      const isUserAuthenticated = Boolean(localStorage.getItem('arena_token') || document.cookie.includes('token'));

      if (!isUserAuthenticated && !isAlreadyRecorded) {
        if (stored.length >= 3) {
          setIsSpectatorGated(true);
        } else {
          stored.push(roomCode);
          localStorage.setItem('arena_spectated_matches', JSON.stringify(stored));
        }
      }
    } catch (e) {
      // Ignore storage errors
    }
  }, [roomCode]);

  // 2. Fetch Initial Match State
  useEffect(() => {
    let isMounted = true;
    arenaApi.getMatch(roomCode)
      .then((res) => {
        if (!isMounted) return;
        if (res && res.success) {
          setMatch(res.match);
          setProblem(res.problem);
          if (res.problem?.starterCode?.[language]) {
            setCode(res.problem.starterCode[language]);
          }
        }
      })
      .catch((err) => {
        if (isMounted) setErrorMsg(err.message || 'Failed to load match room.');
      });

    return () => { isMounted = false; };
  }, [roomCode, language]);

  // 3. Heartbeat Loop
  useEffect(() => {
    if (!match) return;

    const interval = setInterval(() => {
      arenaApi.sendHeartbeat(roomCode, tabBlurViolations)
        .then((res) => {
          if (res && res.success) {
            setOpponentProgress(res.opponent);

            // Follow rematch redirect if opponent initiated
            if (res.rematchRoomCode && res.rematchRoomCode !== roomCode) {
              window.location.href = `/battle/${res.rematchRoomCode}`;
            }

            // If match completed externally by opponent or timeout
            if (res.matchStatus === 'COMPLETED' && match.status !== 'COMPLETED') {
              setMatch((prev) => ({ ...prev, status: 'COMPLETED' }));
              const won = res.winnerId && match?.player1?.userId === res.winnerId;
              setIsWinner(Boolean(won));
              setWinReason(res.winReason);
              setIsVictoryModalOpen(true);
            }
          }
        })
        .catch(() => {});
    }, 2500);

    return () => clearInterval(interval);
  }, [roomCode, match, tabBlurViolations]);

  // 4. Match Countdown Timer
  useEffect(() => {
    if (!match?.actualStartTime || match?.status !== 'IN_PROGRESS') return;

    const startTime = new Date(match.actualStartTime).getTime();
    const durationMs = (match.durationMinutes || 15) * 60 * 1000;
    const endTime = startTime + durationMs;

    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeRemainingSeconds(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [match?.actualStartTime, match?.status, match?.durationMinutes]);

  const handleCheckIn = async () => {
    try {
      const res = await arenaApi.checkIn(roomCode);
      if (res.success) {
        setMatch((prev) => ({
          ...prev,
          status: res.status,
          actualStartTime: res.actualStartTime
        }));
      }
    } catch (err) {
      setErrorMsg(err.message || 'Check-in failed.');
    }
  };

  const handleRunTests = async () => {
    setIsExecuting(true);
    try {
      const res = await arenaApi.submitCode(roomCode, { code, language });
      if (res && res.results) {
        setTestResults(res.results);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Execution failed.');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await arenaApi.submitCode(roomCode, { code, language });
      if (res) {
        setTestResults(res.results || []);
        if (res.isWinner) {
          setIsWinner(true);
          setWinReason('FIRST_AC');
          setIsVictoryModalOpen(true);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareText = `1v1 Code Duel on Flash Arena. Room: ${roomCode}. Join: ${window.location.href}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  if (isSpectatorGated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b] p-4">
        <div className="max-w-md w-full p-8 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-4 shadow-xl">
          <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 mx-auto">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100">Guest Spectator Limit Reached</h2>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              You have watched 3 free guest matches on this device. Sign in or create a free account to continue spectating live campus battles and join the arena.
            </p>
          </div>
          <div className="pt-2 flex gap-2 justify-center">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors"
            >
              Return to Lobby
            </button>
            <a
              href="https://student.flashedu.in/login"
              className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition-colors"
            >
              Sign In Free
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-zinc-100">
      
      {/* 1v1 Battle HUD Header */}
      <BattleHUD
        match={match}
        opponentProgress={opponentProgress}
        timeRemainingSeconds={timeRemainingSeconds}
      />

      {/* Check-In Pre-Battle Lobby */}
      {match?.status === 'CHECKIN_OPEN' || match?.status === 'WAITING_FOR_OPPONENT' ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-5 shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[10px] font-mono uppercase text-blue-400 font-semibold tracking-wider">
                  Pre-Match Chamber · {match?.gameMode?.replace('_', ' ')}
                </span>
              </div>
              <h2 className="text-lg font-bold text-zinc-100 mt-1">Ready Up for Duel</h2>
              <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                Room Code: <strong className="text-zinc-200 font-bold">{roomCode}</strong>
              </p>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Invite your opponent using the room code or link below. When both contenders check in, the dual timer begins.
            </p>

            {/* Quick Share Buttons */}
            <div className="flex gap-2">
              <a
                href={whatsappUrl}
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

            <button
              onClick={handleCheckIn}
              className="w-full py-2.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-colors cursor-pointer"
            >
              Confirm Ready &amp; Check In
            </button>
          </div>
        </div>
      ) : (
        /* Live Split Duel Workspace */
        <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3">
          
          {/* Left Column (5 cols): Problem Statement & Test Case Deck */}
          <div className="lg:col-span-5 flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-100px)]">
            
            {/* Problem Card */}
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium">
                  {problem?.category || 'Algorithm'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-850 text-zinc-400 border border-zinc-750">
                  {problem?.difficulty || 'Medium'}
                </span>
              </div>
              <h2 className="text-sm font-bold text-zinc-100 tracking-tight">{problem?.title}</h2>
              <div className="text-xs text-zinc-300 whitespace-pre-line leading-relaxed font-sans opacity-90">
                {problem?.description}
              </div>
            </div>

            {/* Test Case Execution Output Console */}
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold">
                  Test Case Results
                </span>
                {testResults.length > 0 && (
                  <span className="text-[10px] font-mono text-zinc-500">
                    {testResults.filter(t => t.passed).length}/{testResults.length} Passed
                  </span>
                )}
              </div>

              {testResults.length === 0 ? (
                <p className="text-xs font-mono text-zinc-600 py-4 text-center">
                  Click Run to verify against public test inputs.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {testResults.map((tc) => (
                    <div
                      key={tc.testCaseNumber}
                      className={`p-2 rounded-lg border text-xs flex items-center justify-between font-mono ${
                        tc.passed
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/5 border-rose-500/20 text-rose-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {tc.passed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        <span>
                          Case #{tc.testCaseNumber} {tc.isHidden && '(Hidden)'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold">
                        {tc.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column (7 cols): Monaco Code Editor */}
          <div className="lg:col-span-7 flex flex-col h-[calc(100vh-100px)]">
            <CodeEditor
              code={code}
              onChange={setCode}
              language={language}
              onLanguageChange={setLanguage}
              onRun={handleRunTests}
              onSubmit={handleSubmit}
              isExecuting={isExecuting}
              isSubmitting={isSubmitting}
              onTabBlurViolation={setTabBlurViolations}
            />
          </div>

        </div>
      )}

      {/* Sudden Death Victory / Defeat Modal */}
      <VictoryModal
        isOpen={isVictoryModalOpen}
        isWinner={isWinner}
        match={match}
        winReason={winReason}
        onPlayAgain={() => navigate('/')}
      />

    </div>
  );
}

export default BattleRoomPage;

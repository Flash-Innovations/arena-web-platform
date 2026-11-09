import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { arenaApi } from '../api/arenaApi';
import { BattleHUD } from '../components/battle/BattleHUD';
import { CodeEditor } from '../components/battle/CodeEditor';
import { VictoryModal } from '../components/battle/VictoryModal';
import {
  Swords,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  FileText,
  ArrowRight,
  Share2,
  Copy,
  Check,
  MessageSquare
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

  // 1. Fetch Initial Match State
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

  // 2. Heartbeat Loop
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

  // 3. Match Countdown Timer
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

  const shareText = `I challenge you to a 1v1 Code Battle on Flash Arena! Room: ${roomCode}. Join here: ${window.location.href}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      
      {/* 1v1 Battle HUD Header */}
      <BattleHUD
        match={match}
        opponentProgress={opponentProgress}
        timeRemainingSeconds={timeRemainingSeconds}
      />

      {/* Check-In Lobby Overlay (If match not yet started) */}
      {match?.status === 'CHECKIN_OPEN' || match?.status === 'WAITING_FOR_OPPONENT' ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
              <Swords className="w-8 h-8" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
                Mode: {match?.gameMode?.replace('_', ' ') || 'Speed DSA'}
              </span>
              <h2 className="text-2xl font-black text-white mt-2">1v1 Pre-Battle Lobby</h2>
              <p className="text-xs text-slate-400 mt-1">
                Room Code: <span className="font-mono font-bold text-indigo-400">{roomCode}</span>
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Share this room with your friend. When both players check in, the duel begins!
              </p>
            </div>

            {/* Quick Share Buttons */}
            <div className="flex gap-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
              <button
                onClick={handleCopyLink}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>

            <button
              onClick={handleCheckIn}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              Ready &amp; Check-In
            </button>
          </div>
        </div>
      ) : (
        /* Live Split Duel Workspace */
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Left Column (5 cols): Problem Statement & Test Cases */}
          <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-140px)]">
            
            {/* Problem Card */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold uppercase">
                  {problem?.category || 'DSA Problem'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {problem?.difficulty || 'Medium'}
                </span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">{problem?.title}</h2>
              <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans font-normal opacity-90">
                {problem?.description}
              </div>
            </div>

            {/* Test Case Execution Output Console */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex-1 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Verification Results
              </span>
              {testResults.length === 0 ? (
                <p className="text-xs text-slate-600 py-4 text-center">
                  Click "Run Tests" to test against visible sample inputs.
                </p>
              ) : (
                <div className="space-y-2">
                  {testResults.map((tc) => (
                    <div
                      key={tc.testCaseNumber}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                        tc.passed
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-red-500/10 border-red-500/30 text-red-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {tc.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                        <span>
                          Test Case #{tc.testCaseNumber} {tc.isHidden && '(Hidden Test)'}
                        </span>
                      </div>
                      <span className="font-mono text-[10px]">{tc.passed ? 'PASSED' : 'FAILED'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column (7 cols): Monaco Code Editor with Anti-Paste Lock */}
          <div className="lg:col-span-7 flex flex-col h-[calc(100vh-140px)]">
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

      {/* Sudden Death Victory / Defeat Modal with Rematch Trigger */}
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

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { arenaApi } from '../api/arenaApi';
import { getSocket } from '../api/socket';
import { useAuth } from '../context/AuthContext';
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
  ArrowRight,
  Monitor,
  Laptop
} from 'lucide-react';

export function BattleRoomPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, canSpectateMatch, openAuthModal } = useAuth();

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
  const [ratingChange, setRatingChange] = useState(null);
  const [newRating, setNewRating] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [tabBlurViolations, setTabBlurViolations] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isSpectatorGated, setIsSpectatorGated] = useState(false);

  // Real-time Opponent Connection & Grace Period State
  const [opponentStatus, setOpponentStatus] = useState('ONLINE');
  const [disconnectGraceSeconds, setDisconnectGraceSeconds] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive mobile screen detector
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 1. Guest Spectator Policy: 3 Matches Max Per Device
  useEffect(() => {
    if (isAuthenticated) {
      setIsSpectatorGated(false);
      return;
    }
    const allowed = canSpectateMatch(roomCode);
    setIsSpectatorGated(!allowed);
  }, [roomCode, isAuthenticated, canSpectateMatch]);

  // Determine if current user is Player 1 or Player 2
  const currentUserId = user?._id || user?.id;
  const isP1 = Boolean(currentUserId && match?.player1?.userId?.toString() === currentUserId.toString());
  const isP2 = Boolean(currentUserId && match?.player2?.userId?.toString() === currentUserId.toString());
  const isCompetitor = isP1 || isP2;

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

  // 3. Socket.io Real-Time Room Subscription
  useEffect(() => {
    if (!roomCode) return;
    const socket = getSocket();

    socket.emit('join_room', {
      roomCode,
      userId: currentUserId,
      name: user?.name,
      avatar: user?.avatar,
      college: user?.collegeName,
      isSpectator: !isCompetitor
    });

    socket.on('opponent_progress', (data) => {
      setOpponentProgress(data);
    });

    socket.on('opponent_disconnected', ({ graceSeconds }) => {
      setOpponentStatus('DISCONNECTED');
      setDisconnectGraceSeconds(graceSeconds || 45);
    });

    socket.on('opponent_reconnected', () => {
      setOpponentStatus('ONLINE');
      setDisconnectGraceSeconds(null);
    });

    socket.on('match_updated', (data) => {
      if (data.type === 'MATCH_COMPLETED' && data.match) {
        setMatch(data.match);
        const won = currentUserId && data.winnerId && data.winnerId.toString() === currentUserId.toString();
        setIsWinner(Boolean(won));
        setWinReason(data.winReason || data.match.winReason);
        const change = isP1 ? data.match.player1?.ratingChange : data.match.player2?.ratingChange;
        const nRating = isP1 ? data.match.player1?.newRating : data.match.player2?.newRating;
        setRatingChange(change);
        setNewRating(nRating);
        setIsVictoryModalOpen(true);
      } else if (data.type === 'CHECKIN_UPDATE' && data.match) {
        setMatch(data.match);
      } else if (data.type === 'REMATCH_REDIRECT' && data.rematchRoomCode) {
        window.location.href = `/battle/${data.rematchRoomCode}`;
      }
    });

    socket.on('match_completed', (data) => {
      if (data.match) setMatch(data.match);
      const won = currentUserId && data.winnerId && data.winnerId.toString() === currentUserId.toString();
      setIsWinner(Boolean(won));
      setWinReason(data.winReason);
      const change = isP1 ? data.match?.player1?.ratingChange : data.match?.player2?.ratingChange;
      const nRating = isP1 ? data.match?.player1?.newRating : data.match?.player2?.newRating;
      setRatingChange(change);
      setNewRating(nRating);
      setIsVictoryModalOpen(true);
    });

    socket.on('rematch_redirect', ({ rematchRoomCode }) => {
      if (rematchRoomCode && rematchRoomCode !== roomCode) {
        window.location.href = `/battle/${rematchRoomCode}`;
      }
    });

    return () => {
      socket.off('opponent_progress');
      socket.off('opponent_disconnected');
      socket.off('opponent_reconnected');
      socket.off('match_updated');
      socket.off('match_completed');
      socket.off('rematch_redirect');
    };
  }, [roomCode, currentUserId, user, isCompetitor, isP1, isP2]);

  // 4. Graceful Fallback Presence / Heartbeat (Relaxed 10s Interval)
  useEffect(() => {
    if (!match) return;

    const interval = setInterval(() => {
      arenaApi.sendHeartbeat(roomCode, tabBlurViolations)
        .then((res) => {
          if (res && res.success) {
            if (res.opponent) setOpponentProgress(res.opponent);

            if (res.rematchRoomCode && res.rematchRoomCode !== roomCode) {
              window.location.href = `/battle/${res.rematchRoomCode}`;
            }

            if (res.matchStatus === 'COMPLETED' && match.status !== 'COMPLETED') {
              setMatch((prev) => ({ ...prev, status: 'COMPLETED' }));
              const won = res.winnerId && currentUserId && currentUserId.toString() === res.winnerId.toString();
              setIsWinner(Boolean(won));
              setWinReason(res.winReason);
              setIsVictoryModalOpen(true);
            }
          }
        })
        .catch(() => {});
    }, 10000);

    return () => clearInterval(interval);
  }, [roomCode, match, tabBlurViolations, currentUserId]);

  // 5. Match Countdown Timer
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

  // 6. Disconnect Grace Period Countdown
  useEffect(() => {
    if (disconnectGraceSeconds === null || disconnectGraceSeconds <= 0) return;
    const timer = setInterval(() => {
      setDisconnectGraceSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [disconnectGraceSeconds]);

  const handleCheckIn = async () => {
    try {
      const res = await arenaApi.checkIn(roomCode);
      if (res.success) {
        setMatch((prev) => ({
          ...prev,
          status: res.status,
          actualStartTime: res.actualStartTime
        }));
        const socket = getSocket();
        socket.emit('check_in', { roomCode, userId: currentUserId });
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
        const socket = getSocket();
        socket.emit('code_progress', {
          roomCode,
          userId: currentUserId,
          testCasesPassed: res.testCasesPassed,
          totalTestCases: res.totalTestCases,
          codeLength: (code || '').trim().length
        });
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
          setWinReason(res.winReason || 'FIRST_AC');
          setRatingChange(res.ratingChange);
          setNewRating(res.newRating);
          setIsVictoryModalOpen(true);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForfeit = async () => {
    const confirmed = window.confirm('Are you sure you want to forfeit this duel? Your opponent will be awarded the victory.');
    if (!confirmed) return;

    try {
      const res = await arenaApi.forfeitMatch(roomCode);
      if (res.success) {
        setMatch(res.match);
        setIsWinner(false);
        setWinReason('FORFEIT');
        setRatingChange(isP1 ? res.match?.player1?.ratingChange : res.match?.player2?.ratingChange);
        setNewRating(isP1 ? res.match?.player1?.newRating : res.match?.player2?.newRating);
        setIsVictoryModalOpen(true);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to forfeit match.');
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareText = `1v1 Code Duel on Flash Arena! Room: ${roomCode}. Join here: ${window.location.href}`;
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
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors cursor-pointer"
            >
              Return to Lobby
            </button>
            <button
              type="button"
              onClick={() => openAuthModal({
                mode: 'signin',
                title: 'Sign In to Arena',
                message: 'Sign in or create a free account to unlock unlimited spectator access and join the live arena.'
              })}
              className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition-colors cursor-pointer"
            >
              Sign In to Watch
            </button>
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
        opponentStatus={opponentStatus}
        disconnectGraceSeconds={disconnectGraceSeconds}
        onForfeit={handleForfeit}
        isCompetitor={isCompetitor}
      />

      {/* Mobile Spectator Awareness Banner */}
      {isMobile && (
        <div className="bg-indigo-950/70 border-b border-indigo-800/60 px-4 py-2 text-xs font-mono text-indigo-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Laptop className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Mobile Live View: Coding battles are optimized for desktop/laptop keyboards.</span>
          </div>
          <button
            onClick={handleCopyLink}
            className="px-2 py-0.5 rounded bg-indigo-900 hover:bg-indigo-850 border border-indigo-700 text-indigo-100 text-[11px] shrink-0 cursor-pointer"
          >
            {copied ? 'Copied' : 'Copy Desktop Link'}
          </button>
        </div>
      )}

      {/* Pre-Battle Chamber / Ready-up Room */}
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
              Invite your opponent using the room code or WhatsApp link below. When both contenders confirm ready, the match countdown begins.
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

            {isCompetitor ? (
              <button
                onClick={handleCheckIn}
                className="w-full py-2.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-colors cursor-pointer"
              >
                Confirm Ready &amp; Check In
              </button>
            ) : (
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    openAuthModal({
                      mode: 'signin',
                      title: 'Sign In to Duel',
                      message: 'Sign in to accept this challenge and enter the arena as Player 2.'
                    });
                  } else {
                    arenaApi.getMatch(roomCode).then(res => {
                      if (res?.success) setMatch(res.match);
                    });
                  }
                }}
                className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
              >
                {isAuthenticated ? 'Join as Contender' : 'Sign In to Join Duel'}
              </button>
            )}
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

      {/* Sudden Death Victory / Defeat Modal with Elo Delta */}
      <VictoryModal
        isOpen={isVictoryModalOpen}
        isWinner={isWinner}
        match={match}
        winReason={winReason}
        ratingChange={ratingChange}
        newRating={newRating}
        onPlayAgain={() => navigate('/')}
      />

    </div>
  );
}

export default BattleRoomPage;

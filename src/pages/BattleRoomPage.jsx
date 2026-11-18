import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { arenaApi } from '../api/arenaApi';
import { getSocket } from '../api/socket';
import { useAuth } from '../context/AuthContext';
import { BattleHUD } from '../components/battle/BattleHUD';
import { CodeEditor } from '../components/battle/CodeEditor';
import { VictoryModal } from '../components/battle/VictoryModal';
import { MathRenderer } from '../components/common/MathRenderer';
import GladiatorBadge from '../components/common/GladiatorBadge';
import arenaSound from '../services/arenaSoundService';
import {
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  MessageSquare,
  Lock,
  ArrowRight,
  Laptop,
  Trophy,
  WifiOff,
  ShieldAlert,
  Swords,
  RotateCcw
} from 'lucide-react';

export function BattleRoomPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, canSpectateMatch, openAuthModal } = useAuth();

  const [match, setMatch] = useState(null);
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState(() => {
    try {
      return sessionStorage.getItem(`arena_code_${roomCode}`) || '';
    } catch (e) {
      return '';
    }
  });
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
  const [isRoomExpired, setIsRoomExpired] = useState(false);

  // Real-time Opponent Connection & Grace Period State
  const [opponentStatus, setOpponentStatus] = useState('ONLINE');
  const [disconnectGraceSeconds, setDisconnectGraceSeconds] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Local Disconnection & Reconnection State
  const [isLocalDisconnected, setIsLocalDisconnected] = useState(false);
  const [localDisconnectTimer, setLocalDisconnectTimer] = useState(45);
  const [reconnectedBanner, setReconnectedBanner] = useState(false);

  // Chamber 3-2-1 Countdown & Malpractice Strikes
  const [chamberCountdown, setChamberCountdown] = useState(null);
  const [malpracticeStrikes, setMalpracticeStrikes] = useState(0);
  const [strikeWarning, setStrikeWarning] = useState(null);
  const lastStrikeTimestampRef = useRef(0);
  const hasEnteredFullscreenRef = useRef(false);

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
          if (res.isExpired || ['COMPLETED', 'FORFEIT', 'WALKOVER', 'EXPIRED'].includes(res.match?.status)) {
            setIsRoomExpired(true);
            setMatch(res.match);
            setWinReason(res.winReason || res.match?.winReason);
            return;
          }

          setMatch(res.match);
          setProblem(res.problem);

          // Restore code from session cache or problem starter code
          if (!code && res.problem?.starterCode?.[language]) {
            setCode(res.problem.starterCode[language]);
          }
        }
      })
      .catch((err) => {
        if (isMounted) setErrorMsg(err.message || 'Failed to load match room.');
      });

    return () => { isMounted = false; };
  }, [roomCode, language]);

  // 3. Auto-cache code every 2 seconds to sessionStorage
  useEffect(() => {
    if (!roomCode || !code) return;
    try {
      sessionStorage.setItem(`arena_code_${roomCode}`, code);
    } catch (e) {}
  }, [code, roomCode]);

  // 4. Socket.io Real-Time Room Subscription & Network Events
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

    socket.on('connect', () => {
      setIsLocalDisconnected(false);
      setReconnectedBanner(true);
      setTimeout(() => setReconnectedBanner(false), 2500);
    });

    socket.on('disconnect', () => {
      setIsLocalDisconnected(true);
      setLocalDisconnectTimer(45);
      arenaSound.playWarning();
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

        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }

        if (won) {
          arenaSound.playVictory();
          arenaSound.announce('Victory achieved!');
        } else {
          arenaSound.playDefeat();
          arenaSound.announce('Match concluded');
        }
      } else if (data.type === 'CHECKIN_UPDATE' && data.match) {
        setMatch(data.match);
      } else if (data.type === 'PLAYER_JOINED' && data.match) {
        setMatch(data.match);
        arenaSound.playTone(660, 'sine', 0.15, 0.2);
        arenaSound.announce('Challenger connected to chamber');
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

      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      if (won) {
        arenaSound.playVictory();
        arenaSound.announce('Victory achieved!');
      } else {
        arenaSound.playDefeat();
        arenaSound.announce('Match concluded');
      }
    });

    socket.on('rematch_redirect', ({ rematchRoomCode }) => {
      if (rematchRoomCode && rematchRoomCode !== roomCode) {
        window.location.href = `/battle/${rematchRoomCode}`;
      }
    });

    // Browser offline / online listeners
    const handleOnline = () => {
      setIsLocalDisconnected(false);
      setReconnectedBanner(true);
      setTimeout(() => setReconnectedBanner(false), 2500);
    };

    const handleOffline = () => {
      setIsLocalDisconnected(true);
      setLocalDisconnectTimer(45);
      arenaSound.playWarning();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('opponent_progress');
      socket.off('opponent_disconnected');
      socket.off('opponent_reconnected');
      socket.off('match_updated');
      socket.off('match_completed');
      socket.off('rematch_redirect');
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [roomCode, currentUserId, user, isCompetitor, isP1, isP2]);

  // 5. Local Disconnection 45s Grace Timer
  useEffect(() => {
    if (!isLocalDisconnected) return;
    const interval = setInterval(() => {
      setLocalDisconnectTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLocalDisconnected]);

  // 6. Chamber 3-2-1 Countdown Trigger
  useEffect(() => {
    const p1Ready = match?.player1?.checkedIn;
    const p2Ready = match?.player2?.checkedIn;

    if (p1Ready && p2Ready && match?.status !== 'IN_PROGRESS' && chamberCountdown === null) {
      setChamberCountdown(3);
      arenaSound.playCountdown(3);
      arenaSound.announce('Match starting in 3');

      const cdInterval = setInterval(() => {
        setChamberCountdown((prev) => {
          if (prev === 3) {
            arenaSound.playCountdown(2);
            arenaSound.announce('2');
            return 2;
          }
          if (prev === 2) {
            arenaSound.playCountdown(1);
            arenaSound.announce('1');
            return 1;
          }
          if (prev <= 1) {
            clearInterval(cdInterval);
            arenaSound.playCountdown(0);
            arenaSound.announce('Duel!');
            setChamberCountdown(null);

            // Auto-enter compulsory fullscreen for competitors if not already active
            if (isCompetitor && !document.fullscreenElement && document.documentElement.requestFullscreen) {
              document.documentElement.requestFullscreen()
                .then(() => {
                  hasEnteredFullscreenRef.current = true;
                })
                .catch(() => {});
            }
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(cdInterval);
    }
  }, [match?.player1?.checkedIn, match?.player2?.checkedIn, match?.status, isCompetitor, chamberCountdown]);

  // 7. Presence Heartbeat (Every 10s)
  useEffect(() => {
    if (!match || match.status === 'COMPLETED' || isRoomExpired) return;

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
  }, [roomCode, match, tabBlurViolations, currentUserId, isRoomExpired]);

  // 8. Match Countdown Timer (Chess Clock)
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

  // 9. Disconnect Grace Period Countdown for Opponent
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

  // 10. Compulsory Fullscreen Exit & Tab Blur Tracking (Anti-Cheat 3-Strike System)
  useEffect(() => {
    if (!isCompetitor || match?.status !== 'IN_PROGRESS') return;

    const isRanked = (match?.queueType === 'RANKED' || match?.queueType === 'CONTEST_STAGE') && !match?.isAiRival;

    const recordStrike = (eventType, reason) => {
      const now = Date.now();
      // Cooldown of 4 seconds prevents cascaded duplicate events (blur + visibility + fullscreen) from a single alt-tab
      if (now - lastStrikeTimestampRef.current < 4000) {
        return;
      }
      lastStrikeTimestampRef.current = now;

      arenaSound.playWarning();
      setMalpracticeStrikes((prev) => {
        const next = prev + 1;
        setTabBlurViolations(next);

        if (next === 1) {
          arenaSound.announce('Warning: Focus lost. Return to full screen.');
          setStrikeWarning({
            strike: 1,
            message: 'Navigating away from the battle workspace or exiting full-screen during a duel is prohibited.'
          });
        } else if (next === 2) {
          arenaSound.announce('Critical warning: Malpractice strike 2.');
          setStrikeWarning({
            strike: 2,
            message: 'Final warning: One more screen exit or tab switch will result in immediate match disqualification.'
          });
        } else if (next >= 3) {
          arenaSound.playDefeat();
          arenaSound.announce(isRanked ? 'Disqualified for malpractice' : 'Multiple focus warnings detected');
        }

        arenaApi.reportAntiCheat(roomCode, {
          eventType,
          details: { strikeNumber: next, reason, timestamp: Date.now() }
        }).then((res) => {
          if (res && res.disqualified && isRanked) {
            setIsWinner(false);
            setWinReason('MALPRACTICE_DISQUALIFIED');
            setIsVictoryModalOpen(true);
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(() => {});
            }
          }
        }).catch(() => {});

        return next;
      });
    };

    const handleVisibility = () => {
      if (document.hidden) {
        recordStrike('WINDOW_FOCUS_LOST', 'Tab switched or window minimized');
      }
    };

    const handleBlur = () => {
      // Only fire blur if document is not already hidden to prevent double-counting with visibilitychange
      if (!document.hidden) {
        recordStrike('TAB_BLUR', 'Window focus lost');
      }
    };

    const handleFullscreenChange = () => {
      if (hasEnteredFullscreenRef.current && !document.fullscreenElement && match?.status === 'IN_PROGRESS') {
        recordStrike('FULLSCREEN_EXIT', 'Manual exit from full screen');
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    const handleKeyDown = (e) => {
      // Suppress DevTools and source inspection shortcuts (Windows + macOS)
      const keyUpper = (e.key || '').toUpperCase();
      const isDevToolsKey =
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(keyUpper)) ||
        (e.metaKey && e.altKey && ['I', 'J', 'C'].includes(keyUpper)) ||
        ((e.ctrlKey || e.metaKey) && ['U', 'S'].includes(keyUpper));

      if (isDevToolsKey) {
        e.preventDefault();
        recordStrike('DEVTOOLS_OPENED', 'DevTools key shortcut intercepted');
      }
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [roomCode, isCompetitor, match?.status]);

  // 11. AI Rival Sparring Progress Simulation
  useEffect(() => {
    if (!match?.isAiRival || match?.status !== 'IN_PROGRESS') return;

    const totalTests = problem?.testCases?.length || 5;
    let aiPassed = 0;

    const aiInterval = setInterval(() => {
      aiPassed = Math.min(totalTests, aiPassed + 1);
      setOpponentProgress({
        testCasesPassed: aiPassed,
        totalTestCases: totalTests,
        codeLength: 120 + aiPassed * 45
      });

      if (aiPassed >= totalTests && match.status === 'IN_PROGRESS') {
        clearInterval(aiInterval);
        setIsWinner(false);
        setWinReason('FIRST_AC');
        setIsVictoryModalOpen(true);
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
    }, 18000 + Math.random() * 8000);

    return () => clearInterval(aiInterval);
  }, [match?.isAiRival, match?.status, problem?.testCases?.length]);

  const handleCheckIn = async () => {
    if (!isAuthenticated) {
      openAuthModal({
        mode: 'signin',
        title: 'Sign In to Duel',
        message: 'Sign in to check in to this battle room and start competing.'
      });
      return;
    }

    try {
      // Enter browser fullscreen directly on explicit user click gesture
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen()
          .then(() => {
            hasEnteredFullscreenRef.current = true;
          })
          .catch(() => {});
      }

      const res = await arenaApi.checkIn(roomCode);
      if (res.success) {
        setMatch((prev) => ({
          ...prev,
          status: res.status,
          actualStartTime: res.actualStartTime,
          player1: { ...prev.player1, checkedIn: isP1 ? true : prev.player1?.checkedIn },
          player2: { ...prev.player2, checkedIn: isP2 ? true : prev.player2?.checkedIn }
        }));
        const socket = getSocket();
        socket.emit('check_in', { roomCode, userId: currentUserId });
        arenaSound.playTone(520, 'sine', 0.15, 0.2);
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
        if (res.allPassed) {
          arenaSound.playTestCasePass();
        }
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
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
          arenaSound.playVictory();
          arenaSound.announce('Victory achieved!');
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
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        arenaSound.playDefeat();
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

  // Guest Spectator Limit Reached Screen
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

  // Concluded / Expired Room Card
  if (isRoomExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b] p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-zinc-900 border border-zinc-800 text-center space-y-5 shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
              Match Concluded · Room Expired
            </span>
            <h2 className="text-xl font-bold text-zinc-100 mt-1">This Duel Has Ended</h2>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Results have been finalized. This battle room is concluded and no longer accepting active participants.
            </p>
          </div>

          {match && (
            <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-855 text-left space-y-2">
              <div className="text-[11px] font-mono text-zinc-400">
                Problem: <strong className="text-zinc-200">{match.problemTitle}</strong>
              </div>
              <div className="text-[11px] font-mono text-zinc-400">
                Mode: <strong className="text-zinc-200">{match.gameMode?.replace('_', ' ')}</strong> · Win Reason: <strong className="text-amber-400">{match.winReason || 'COMPLETED'}</strong>
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-2.5 px-4 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
            >
              Return to Lobby
            </button>
            <button
              onClick={() => navigate(`/battle/${roomCode}/review`)}
              className="flex-1 py-2.5 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs border border-zinc-700 transition-colors cursor-pointer"
            >
              View Code Review
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-zinc-100 select-none">
      
      {/* Sticky Top Bar for Local Disconnection */}
      {isLocalDisconnected && (
        <div className="sticky top-0 z-50 w-full bg-rose-600 text-white px-4 py-2 flex items-center justify-between text-xs font-mono shadow-lg animate-pulse">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-white shrink-0" />
            <span className="font-bold">CONNECTION LOST: Reconnecting to battle server...</span>
            <span className="hidden sm:inline opacity-90">Auto-forfeit in {localDisconnectTimer}s</span>
          </div>
          <button
            onClick={() => {
              const socket = getSocket();
              socket.connect();
              arenaApi.sendHeartbeat(roomCode, tabBlurViolations).catch(() => {});
            }}
            className="px-3 py-1 rounded bg-white text-rose-700 font-bold text-xs hover:bg-rose-50 transition-colors cursor-pointer"
          >
            Reconnect Now
          </button>
        </div>
      )}

      {/* Reconnected Confirmation Toast */}
      {reconnectedBanner && (
        <div className="sticky top-0 z-50 w-full bg-emerald-600 text-white px-4 py-1.5 flex items-center justify-center text-xs font-mono font-bold shadow-md animate-fade-in">
          <span>Reconnected to Battle Server</span>
        </div>
      )}

      {/* Malpractice Strike Warning Alert Modal */}
      {strikeWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full p-6 rounded-2xl bg-zinc-950 border border-rose-500/50 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400 font-bold">
                Malpractice Strike {strikeWarning.strike}/3
              </span>
              <h2 className="text-lg font-bold text-zinc-100 mt-1">Anti-Cheat Alert</h2>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                {strikeWarning.message}
              </p>
            </div>
            <button
              onClick={() => {
                setStrikeWarning(null);
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {});
                }
              }}
              className="w-full py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              I Understand &amp; Return to Duel
            </button>
          </div>
        </div>
      )}

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

      {/* Pre-Battle Chamber / Ready-up Room (Option A: Side-by-Side Contender Slots) */}
      {match?.status === 'CHECKIN_OPEN' || match?.status === 'WAITING_FOR_OPPONENT' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-4xl mx-auto w-full space-y-6 animate-fade-in">
          
          {/* Chamber Header */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Pre-Match Chamber · {match?.gameMode?.replace('_', ' ')} · {match?.queueType || 'RANKED'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight">Ready Up for Duel</h1>
            <p className="text-xs text-zinc-400 font-mono">
              Room Code: <strong className="text-zinc-200 tracking-widest">{roomCode}</strong> · Duration: {match?.durationMinutes || 15}m
            </p>
          </div>

          {/* Active 3-2-1 Chamber Countdown Overlay */}
          {chamberCountdown !== null && (
            <div className="w-full p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center animate-bounce">
              <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">Both Contenders Ready!</span>
              <div className="text-4xl font-black text-amber-300 font-mono mt-1">Starting in {chamberCountdown}...</div>
            </div>
          )}

          {/* Side-by-Side Contender Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {/* Left Card: Player 1 (Host) */}
            <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60">
                  Contender 1 · Host
                </span>
                {match?.player1?.checkedIn ? (
                  <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    READY
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                    WAITING
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-base text-zinc-200 overflow-hidden">
                  {match?.player1?.avatar ? (
                    <img src={match.player1.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{(match?.player1?.name || 'H')[0].toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-zinc-100 truncate">{match?.player1?.name || 'Host Contender'}</h3>
                    <GladiatorBadge elo={match?.player1?.newRating || 1200} size="xs" />
                  </div>
                  <p className="text-xs text-zinc-400 truncate font-mono">{match?.player1?.collegeName || 'Gladiator'}</p>
                </div>
              </div>
            </div>

            {/* Right Card: Player 2 (Challenger) */}
            <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60">
                  Contender 2 · Challenger
                </span>
                {match?.player2?.userId ? (
                  match.player2.checkedIn ? (
                    <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      READY
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 font-bold">
                      CONNECTED
                    </span>
                  )
                ) : (
                  <span className="text-[11px] font-mono text-zinc-500 bg-zinc-800/40 px-2 py-0.5 rounded border border-zinc-700/40 font-bold animate-pulse">
                    EMPTY SLOT
                  </span>
                )}
              </div>

              {match?.player2?.userId ? (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-base text-zinc-200 overflow-hidden">
                    {match.player2.avatar ? (
                      <img src={match.player2.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>{(match.player2.name || 'C')[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-zinc-100 truncate">{match.player2.name || 'Challenger'}</h3>
                      <GladiatorBadge elo={match.player2.newRating || 1200} size="xs" />
                    </div>
                    <p className="text-xs text-zinc-400 truncate font-mono">{match.player2.collegeName || 'Challenger'}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 py-1">
                  <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-dashed border-zinc-700 flex items-center justify-center text-zinc-600">
                    <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-300">Awaiting Challenger...</h4>
                    <p className="text-[11px] text-zinc-500 font-mono">Share room code or invite on WhatsApp</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Share Deck */}
          <div className="flex gap-2 w-full max-w-md">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Invite</span>
            </a>
            <button
              onClick={handleCopyLink}
              className="flex-1 py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-medium border border-zinc-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
              <span>{copied ? 'Copied Link' : 'Copy Link'}</span>
            </button>
          </div>

          {/* Action / Ready Button */}
          <div className="w-full max-w-md">
            {isCompetitor ? (
              (isP1 && match?.player1?.checkedIn) || (isP2 && match?.player2?.checkedIn) ? (
                <div className="w-full py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono text-center flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>You Are Ready · Waiting for Opponent</span>
                </div>
              ) : (
                <button
                  onClick={handleCheckIn}
                  className="w-full py-3 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-lg"
                >
                  Confirm Ready &amp; Check In
                </button>
              )
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
                className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                {isAuthenticated ? 'Join as Challenger (Player 2)' : 'Sign In to Join Duel'}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Live Split Duel Workspace */
        <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3">
          
          {/* Left Column (5 cols): Problem Statement & Test Case Deck */}
          <div className="lg:col-span-5 flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-100px)]">
            
            {/* Problem Card with KaTeX Math Rendering */}
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
              
              {/* KaTeX Math Renderer */}
              <MathRenderer content={problem?.description || ''} className="opacity-95" />
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

          {/* Right Column (7 cols): Monaco Code Editor Deck */}
          <div className="lg:col-span-7 flex flex-col min-h-[460px] h-[calc(100vh-100px)]">
            <CodeEditor
              code={code}
              onChange={(newCode) => setCode(newCode || '')}
              language={language}
              onLanguageChange={(newLang) => {
                setLanguage(newLang);
                if (problem?.starterCode?.[newLang]) {
                  setCode(problem.starterCode[newLang]);
                }
              }}
              onRun={handleRunTests}
              onSubmit={handleSubmit}
              isExecuting={isExecuting}
              isSubmitting={isSubmitting}
              onTabBlurViolation={(count) => setTabBlurViolations(count)}
            />
          </div>

        </div>
      )}

      {/* Victory & Post-Match Results Modal */}
      <VictoryModal
        isOpen={isVictoryModalOpen}
        onClose={() => setIsVictoryModalOpen(false)}
        isWinner={isWinner}
        winReason={winReason}
        match={match}
        ratingChange={ratingChange}
        newRating={newRating}
      />
    </div>
  );
}

export default BattleRoomPage;

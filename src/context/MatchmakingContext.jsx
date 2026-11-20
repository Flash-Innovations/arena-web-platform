import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { arenaApi } from '../api/arenaApi';
import { useAuth } from './AuthContext';
import arenaSound from '../services/arenaSoundService';

const MatchmakingContext = createContext(null);

export function MatchmakingProvider({ children }) {
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal } = useAuth();

  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [matchmakingQueueType, setMatchmakingQueueType] = useState('RANKED');
  const [searchTimer, setSearchTimer] = useState(0);
  const [activeWaitingRoomCode, setActiveWaitingRoomCode] = useState(null);
  const [isSparringAiInBackground, setIsSparringAiInBackground] = useState(false);
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [foundMatch, setFoundMatch] = useState(null);
  const [matchmakingError, setMatchmakingError] = useState(null);

  const searchIntervalRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const activeRoomCodeRef = useRef(null);

  // Keep ref synchronized with state for callbacks
  useEffect(() => {
    activeRoomCodeRef.current = activeWaitingRoomCode;
  }, [activeWaitingRoomCode]);

  // Clean up any remaining intervals on window unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeRoomCodeRef.current) {
        arenaApi.cancelMatchmake(activeRoomCodeRef.current).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const clearTimers = useCallback(() => {
    if (searchIntervalRef.current) {
      clearInterval(searchIntervalRef.current);
      searchIntervalRef.current = null;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const cancelMatchmaking = useCallback(() => {
    setIsMatchmaking(false);
    setIsSparringAiInBackground(false);
    setShowAiPrompt(false);
    setSearchTimer(0);
    setFoundMatch(null);
    clearTimers();

    const codeToCancel = activeRoomCodeRef.current;
    if (codeToCancel) {
      arenaApi.cancelMatchmake(codeToCancel).catch(() => {});
      activeRoomCodeRef.current = null;
      setActiveWaitingRoomCode(null);
    }
  }, [clearTimers]);

  const startMatchmaking = useCallback(async (queueType = 'RANKED') => {
    if (!isAuthenticated) {
      openAuthModal({
        mode: 'signin',
        title: 'Sign In to Enter Arena Queue',
        message: 'Sign in with your student account to record match statistics and Gladiator Tier rankings.'
      });
      return;
    }

    // Cancel existing search/lobby if one is already active
    if (activeRoomCodeRef.current) {
      arenaApi.cancelMatchmake(activeRoomCodeRef.current).catch(() => {});
      activeRoomCodeRef.current = null;
    }
    clearTimers();

    setIsMatchmaking(true);
    setMatchmakingQueueType(queueType);
    setSearchTimer(0);
    setShowAiPrompt(false);
    setFoundMatch(null);
    setMatchmakingError(null);
    setIsSparringAiInBackground(false);

    // 1-second search counter: triggers 1-minute (60s) AI sparring offer
    searchIntervalRef.current = setInterval(() => {
      setSearchTimer((prev) => {
        const next = prev + 1;
        if (next === 60) {
          setShowAiPrompt(true);
        }
        return next;
      });
    }, 1000);

    try {
      const res = await arenaApi.matchmake({
        queueType,
        gameMode: 'SPEED_DSA',
        difficulty: 'MEDIUM'
      });

      if (res.success && res.roomCode) {
        if (res.matched) {
          // Immediately paired with live waiting contender
          clearTimers();
          arenaSound.playMatchFound();
          setFoundMatch({
            roomCode: res.roomCode,
            match: res.match,
            opponent: res.match?.player2,
            queueType
          });
        } else {
          // Enter queue & poll room status
          setActiveWaitingRoomCode(res.roomCode);
          activeRoomCodeRef.current = res.roomCode;

          pollIntervalRef.current = setInterval(async () => {
            try {
              const checkRes = await arenaApi.getMatch(res.roomCode);
              if (
                checkRes.success &&
                checkRes.match &&
                checkRes.match.status !== 'WAITING_FOR_OPPONENT' &&
                !['CANCELLED', 'EXPIRED'].includes(checkRes.match.status)
              ) {
                // Opponent matched!
                clearTimers();
                arenaSound.playMatchFound();
                setFoundMatch({
                  roomCode: res.roomCode,
                  match: checkRes.match,
                  opponent: checkRes.match?.player2,
                  queueType
                });
              }
            } catch (err) {
              // Ignore transient poll error
            }
          }, 2200);
        }
      }
    } catch (err) {
      const msg = err.message || '';
      if (err.status === 401 || msg.toLowerCase().includes('auth')) {
        openAuthModal({
          mode: 'signin',
          title: 'Sign In to Enter Arena Queue',
          message: 'Your session has expired. Please sign in to enter matchmaking.'
        });
      } else {
        setMatchmakingError(msg || 'Matchmaking error. Please retry.');
      }
      cancelMatchmaking();
    }
  }, [isAuthenticated, openAuthModal, clearTimers, cancelMatchmaking]);

  // Accept AI sparring while continuing to search for real human match in background
  const acceptAiSparring = useCallback(async () => {
    setShowAiPrompt(false);
    setIsSparringAiInBackground(true);

    try {
      const res = await arenaApi.createAiRivalMatch({
        gameMode: 'SPEED_DSA',
        difficulty: 'MEDIUM'
      });

      if (res.success && res.roomCode) {
        navigate(`/battle/${res.roomCode}`);
      }
    } catch (err) {
      setMatchmakingError('Failed to initialize AI Rival sparring session.');
    }
  }, [navigate]);

  const dismissAiPrompt = useCallback(() => {
    setShowAiPrompt(false);
  }, []);

  // Connect to the human match when found
  const acceptFoundMatch = useCallback(() => {
    if (!foundMatch) return;
    const targetRoomCode = foundMatch.roomCode;

    setIsMatchmaking(false);
    setIsSparringAiInBackground(false);
    setShowAiPrompt(false);
    setActiveWaitingRoomCode(null);
    activeRoomCodeRef.current = null;
    setFoundMatch(null);
    setSearchTimer(0);
    clearTimers();

    navigate(`/battle/${targetRoomCode}`);
  }, [foundMatch, clearTimers, navigate]);

  const declineFoundMatch = useCallback(() => {
    cancelMatchmaking();
  }, [cancelMatchmaking]);

  const value = {
    isMatchmaking,
    matchmakingQueueType,
    searchTimer,
    activeWaitingRoomCode,
    isSparringAiInBackground,
    showAiPrompt,
    foundMatch,
    matchmakingError,
    startMatchmaking,
    cancelMatchmaking,
    acceptAiSparring,
    dismissAiPrompt,
    acceptFoundMatch,
    declineFoundMatch
  };

  return (
    <MatchmakingContext.Provider value={value}>
      {children}
    </MatchmakingContext.Provider>
  );
}

export function useMatchmaking() {
  const context = useContext(MatchmakingContext);
  if (!context) {
    throw new Error('useMatchmaking must be used within a MatchmakingProvider');
  }
  return context;
}

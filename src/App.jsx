import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { ArenaNavbar } from './components/layout/ArenaNavbar';
import { ArenaLobbyPage } from './pages/ArenaLobbyPage';
import { BattleRoomPage } from './pages/BattleRoomPage';
import { ContestStudioPage } from './pages/ContestStudioPage';
import { ContestViewPage } from './pages/ContestViewPage';
import { ContestHostDeckPage } from './pages/ContestHostDeckPage';
import { TournamentHubPage } from './pages/TournamentHubPage';
import { TournamentQuizPage } from './pages/TournamentQuizPage';
import { TournamentBracketPage } from './pages/TournamentBracketPage';

export function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
        <Routes>
        {/* Main Lobby */}
        <Route
          path="/"
          element={
            <>
              <ArenaNavbar />
              <main className="flex-1">
                <ArenaLobbyPage />
              </main>
            </>
          }
        />

        {/* 1v1 Battle Arena Duel Room */}
        <Route path="/battle/:roomCode" element={<BattleRoomPage />} />

        {/* Student Contest Studio & Contests */}
        <Route
          path="/contest/studio"
          element={
            <>
              <ArenaNavbar />
              <main className="flex-1">
                <ContestStudioPage />
              </main>
            </>
          }
        />

        <Route
          path="/contest/:slug"
          element={
            <>
              <ArenaNavbar />
              <main className="flex-1">
                <ContestViewPage />
              </main>
            </>
          }
        />

        <Route
          path="/contest/:slug/host"
          element={
            <>
              <ArenaNavbar />
              <main className="flex-1">
                <ContestHostDeckPage />
              </main>
            </>
          }
        />

        {/* Flagship Flash Coding Series 2026 */}
        <Route
          path="/series"
          element={
            <>
              <ArenaNavbar />
              <main className="flex-1">
                <TournamentHubPage />
              </main>
            </>
          }
        />

        <Route
          path="/series/quiz"
          element={
            <>
              <ArenaNavbar />
              <main className="flex-1">
                <TournamentQuizPage />
              </main>
            </>
          }
        />

        <Route
          path="/series/bracket"
          element={
            <>
              <ArenaNavbar />
              <main className="flex-1">
                <TournamentBracketPage />
              </main>
            </>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AuthModal />
    </div>
  </AuthProvider>
  );
}

export default App;

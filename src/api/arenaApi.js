const API_BASE = (import.meta.env.VITE_ARENA_API_URL || 'http://localhost:5050').replace(/\/+$/, '');

async function arenaRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include' // Sends shared .flashedu.in SSO auth cookie
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Arena API Error: ${response.status}`);
  }

  return data;
}

export const arenaApi = {
  // Authentication & Session
  login: (credentials) =>
    arenaRequest('/api/arena/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),

  register: (userData) =>
    arenaRequest('/api/arena/auth/register', { method: 'POST', body: JSON.stringify(userData) }),

  googleSignIn: (payload) =>
    arenaRequest('/api/arena/auth/google/signin', { method: 'POST', body: JSON.stringify(payload) }),

  googleRegister: (payload) =>
    arenaRequest('/api/arena/auth/google/register', { method: 'POST', body: JSON.stringify(payload) }),

  getMe: () =>
    arenaRequest('/api/arena/auth/me', { method: 'GET' }),

  logout: () =>
    arenaRequest('/api/arena/auth/logout', { method: 'POST' }),

  // 1v1 Battle Rooms
  createFriendlyRoom: (payload) =>
    arenaRequest('/api/arena/battle/create', { method: 'POST', body: JSON.stringify(payload) }),

  getOpenBattles: () =>
    arenaRequest('/api/arena/battle/open', { method: 'GET' }),

  getProblemCatalog: () =>
    arenaRequest('/api/arena/battle/problems', { method: 'GET' }),

  getMatch: (roomCode) =>
    arenaRequest(`/api/arena/battle/${roomCode}`, { method: 'GET' }),

  checkIn: (roomCode) =>
    arenaRequest(`/api/arena/battle/${roomCode}/checkin`, { method: 'POST' }),

  sendHeartbeat: (roomCode, tabBlurCount = 0) =>
    arenaRequest(`/api/arena/battle/${roomCode}/heartbeat`, {
      method: 'POST',
      body: JSON.stringify({ tabBlurCount })
    }),

  submitCode: (roomCode, payload) =>
    arenaRequest(`/api/arena/battle/${roomCode}/submit`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  requestRematch: (roomCode) =>
    arenaRequest(`/api/arena/battle/${roomCode}/rematch`, { method: 'POST' }),

  // Flash Coding Series Tournament
  getTournamentOverview: () =>
    arenaRequest('/api/arena/tournament/overview', { method: 'GET' }),

  registerTournament: () =>
    arenaRequest('/api/arena/tournament/register', { method: 'POST' }),

  getTournamentQuizQuestions: (count = 15) =>
    arenaRequest(`/api/arena/tournament/quiz/questions?count=${count}`, { method: 'GET' }),

  getTournamentBracket: () =>
    arenaRequest('/api/arena/tournament/bracket', { method: 'GET' }),

  submitTournamentQuiz: (payload) =>
    arenaRequest('/api/arena/tournament/quiz/submit', { method: 'POST', body: JSON.stringify(payload) }),

  // Student Contest Studio
  createContest: (payload) =>
    arenaRequest('/api/arena/contest/create', { method: 'POST', body: JSON.stringify(payload) }),

  getPublicContests: () =>
    arenaRequest('/api/arena/contest/public', { method: 'GET' }),

  getContestBySlug: (slug) =>
    arenaRequest(`/api/arena/contest/${slug}`, { method: 'GET' }),

  registerContest: (slug, passcode = '') =>
    arenaRequest(`/api/arena/contest/${slug}/register`, {
      method: 'POST',
      body: JSON.stringify({ passcode })
    }),

  startContestStage: (slug, stageIndex) =>
    arenaRequest(`/api/arena/contest/${slug}/start-stage`, {
      method: 'POST',
      body: JSON.stringify({ stageIndex })
    }),

  advanceContestQualifiers: (slug, stageIndex) =>
    arenaRequest(`/api/arena/contest/${slug}/advance-qualifiers`, {
      method: 'POST',
      body: JSON.stringify({ stageIndex })
    }),

  broadcastContestAnnouncement: (slug, message) =>
    arenaRequest(`/api/arena/contest/${slug}/announcement`, {
      method: 'POST',
      body: JSON.stringify({ message })
    }),

  getContestLeaderboard: (slug) =>
    arenaRequest(`/api/arena/contest/${slug}/leaderboard`, { method: 'GET' })
};

export default arenaApi;

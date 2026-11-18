const API_BASE = (import.meta.env.VITE_ARENA_API_URL || 'http://localhost:5050').replace(/\/+$/, '');

export const getArenaToken = () => {
  try {
    // 1. Check URL parameters for cross-domain redirect handshakes
    if (typeof window !== 'undefined' && window.location?.search) {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token') || params.get('auth_token');
      if (urlToken) {
        localStorage.setItem('arena_token', urlToken);
        localStorage.setItem('flash_token', urlToken);
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('token');
        cleanUrl.searchParams.delete('auth_token');
        window.history.replaceState({}, document.title, cleanUrl.toString());
        return urlToken;
      }
    }

    // 2. Check localStorage across all common FLASH token keys
    const localToken =
      localStorage.getItem('arena_token') ||
      localStorage.getItem('flash_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('b2c_token') ||
      localStorage.getItem('auth_token');

    if (localToken) return localToken;

    // 3. Check document.cookie if available (.flashedu.in shared domain)
    if (typeof document !== 'undefined' && document.cookie) {
      const match = document.cookie.match(/(?:arena_token|flash_token|b2c_token|token)=([^;]+)/);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  } catch (e) {
    return null;
  }
};

export const setArenaToken = (token) => {
  try {
    if (token) {
      localStorage.setItem('arena_token', token);
      localStorage.setItem('flash_token', token);
    } else {
      localStorage.removeItem('arena_token');
      localStorage.removeItem('flash_token');
      localStorage.removeItem('token');
      localStorage.removeItem('b2c_token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('arena_user');
    }
  } catch (e) {}
};

async function arenaRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = getArenaToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include' // Sends shared .flashedu.in SSO auth cookie
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Arena API Error: ${response.status}`);
    error.status = response.status;
    error.code = data.code || 'API_ERROR';
    error.data = data;
    throw error;
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

  matchmake: (payload) =>
    arenaRequest('/api/arena/battle/matchmake', { method: 'POST', body: JSON.stringify(payload) }),

  createAiRivalMatch: (payload) =>
    arenaRequest('/api/arena/battle/ai-rival', { method: 'POST', body: JSON.stringify(payload) }),

  getOpenBattles: (queueType) =>
    arenaRequest(`/api/arena/battle/open${queueType ? `?queueType=${queueType}` : ''}`, { method: 'GET' }),

  getProblemCatalog: () =>
    arenaRequest('/api/arena/battle/problems', { method: 'GET' }),

  getMatch: (roomCode) =>
    arenaRequest(`/api/arena/battle/${roomCode}`, { method: 'GET' }),

  getMatchReview: (roomCode) =>
    arenaRequest(`/api/arena/battle/${roomCode}/review`, { method: 'GET' }),

  reportAntiCheat: (roomCode, payload) =>
    arenaRequest(`/api/arena/battle/${roomCode}/telemetry`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

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

  forfeitMatch: (roomCode) =>
    arenaRequest(`/api/arena/battle/${roomCode}/forfeit`, { method: 'POST' }),

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
  getFeaturedContest: () =>
    arenaRequest('/api/arena/contest/featured', { method: 'GET' }),

  createContest: (payload) =>
    arenaRequest('/api/arena/contest/create', { method: 'POST', body: JSON.stringify(payload) }),

  updateContest: (slug, payload) =>
    arenaRequest(`/api/arena/contest/${slug}`, { method: 'PUT', body: JSON.stringify(payload) }),

  extendContestStageTime: (slug, minutes = 5) =>
    arenaRequest(`/api/arena/contest/${slug}/extend-time`, { method: 'POST', body: JSON.stringify({ minutes }) }),

  getPublicContests: () =>
    arenaRequest('/api/arena/contest/public', { method: 'GET' }),

  getContestBySlug: (slug) =>
    arenaRequest(`/api/arena/contest/${slug}`, { method: 'GET' }),

  getProjectorData: (slug) =>
    arenaRequest(`/api/arena/contest/${slug}/projector`, { method: 'GET' }),

  searchQuestions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return arenaRequest(`/api/arena/contest/questions/search${query ? `?${query}` : ''}`, { method: 'GET' });
  },

  getStageQuestions: (slug, stageId) =>
    arenaRequest(`/api/arena/contest/${slug}/stages/${stageId}/questions`, { method: 'GET' }),

  updateStageQuestions: (slug, stageId, payload) =>
    arenaRequest(`/api/arena/contest/${slug}/stages/${stageId}/questions`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  shuffleStageQuestions: (slug, stageId, payload = {}) =>
    arenaRequest(`/api/arena/contest/${slug}/stages/${stageId}/shuffle`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

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
    arenaRequest(`/api/arena/contest/${slug}/leaderboard`, { method: 'GET' }),

  // Gladiator Esports Profile & Recruiter Passport
  getGladiatorProfile: (identifier) =>
    arenaRequest(`/api/arena/profile/${encodeURIComponent(identifier)}`, { method: 'GET' }),

  updateProfileUsername: (username) =>
    arenaRequest('/api/arena/profile/username', {
      method: 'PATCH',
      body: JSON.stringify({ username })
    })
};

export default arenaApi;

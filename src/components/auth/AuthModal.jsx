import React, { useState } from 'react';
import { X, Lock, CheckCircle2, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GoogleAuthButton } from '../common/GoogleAuthButton';

export function AuthModal() {
  const { authModal, closeAuthModal, login, register, googleSignIn, googleRegister } = useAuth();
  const [tab, setTab] = useState(authModal.mode || 'signin');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [googleNewUser, setGoogleNewUser] = useState(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [graduationYear, setGraduationYear] = useState('2026');

  if (!authModal.isOpen) return null;

  const handleTabSwitch = (newTab) => {
    setTab(newTab);
    setErrorMsg('');
    setGoogleNewUser(null);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (tab === 'signin') {
        if (!email.trim() || !password) {
          setErrorMsg('Email and password are required.');
          setLoading(false);
          return;
        }
        await login(email.trim(), password);
      } else {
        if (!name.trim() || !email.trim() || !password) {
          setErrorMsg('Name, email, and password are required.');
          setLoading(false);
          return;
        }
        await register({
          name: name.trim(),
          email: email.trim(),
          password,
          collegeName: collegeName.trim() || 'Arena Gladiator',
          graduationYear: String(graduationYear || '2026')
        });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential) => {
    setErrorMsg('');
    setLoading(true);

    try {
      if (googleNewUser) {
        // Complete registration for new Google user
        await googleRegister({
          credential,
          name: googleNewUser.name,
          email: googleNewUser.email,
          collegeName: collegeName.trim() || 'Arena Gladiator',
          graduationYear: String(graduationYear || '2026')
        });
        return;
      }

      const res = await googleSignIn(credential);
      if (res && res.isNewUser) {
        // New Google user detected: switch to profile completion
        setGoogleNewUser({
          ...res.googleUser,
          credential
        });
        setName(res.googleUser?.name || '');
        setEmail(res.googleUser?.email || '');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md rounded-xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl text-zinc-100 space-y-5"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Flash / Arena SSO
            </span>
          </div>
          <h2 className="text-lg font-bold text-zinc-100 tracking-tight">
            {authModal.title || (tab === 'signin' ? 'Sign in to Arena' : 'Join Arena')}
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {authModal.message || (tab === 'signin'
              ? 'Enter your credentials or use Google to access 1v1 duels and tournaments.'
              : 'Create a competitor profile to play rated matches and track your rating.')}
          </p>
        </div>

        {/* Error banner */}
        {errorMsg && (
          <div className="p-2.5 rounded bg-red-950/40 border border-red-800/60 text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        {/* Mode switcher tabs (only when not in Google new-user step) */}
        {!googleNewUser && (
          <div className="grid grid-cols-2 p-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-medium">
            <button
              type="button"
              onClick={() => handleTabSwitch('signin')}
              className={`py-1.5 rounded-md transition-colors ${
                tab === 'signin'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('signup')}
              className={`py-1.5 rounded-md transition-colors ${
                tab === 'signup'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Google OAuth Section */}
        {googleNewUser ? (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Google Account Verified</span>
              </div>
              <p className="text-xs text-zinc-300 font-medium">{googleNewUser.name}</p>
              <p className="text-[11px] text-zinc-500 font-mono">{googleNewUser.email}</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGoogleSuccess(googleNewUser.credential);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                  College or Institution
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Delhi Technological University"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  className="w-full h-9 px-3 rounded-md bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-xs outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                  Graduation Batch
                </label>
                <select
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  className="w-full h-9 px-3 rounded-md bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-xs outline-none focus:border-zinc-500"
                >
                  <option value="2025">Class of 2025</option>
                  <option value="2026">Class of 2026</option>
                  <option value="2027">Class of 2027</option>
                  <option value="2028">Class of 2028</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-9 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Complete Arena Profile</span>
                )}
              </button>
            </form>
          </div>
        ) : (
          <>
            <GoogleAuthButton
              mode={tab === 'signup' ? 'signup' : 'signin'}
              onSuccess={handleGoogleSuccess}
              onError={(err) => setErrorMsg(err.message)}
              disabled={loading}
            />

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <span className="relative px-2 bg-zinc-950 text-[10px] font-mono uppercase text-zinc-500">
                Or with email
              </span>
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {tab === 'signup' && (
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arjun Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-9 px-3 rounded-md bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-xs outline-none focus:border-zinc-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-9 px-3 rounded-md bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-xs outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-9 px-3 rounded-md bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-xs outline-none focus:border-zinc-500"
                />
              </div>

              {tab === 'signup' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                      College
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. DTU / IIT"
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      className="w-full h-9 px-3 rounded-md bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-xs outline-none focus:border-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                      Graduation
                    </label>
                    <select
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      className="w-full h-9 px-3 rounded-md bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-xs outline-none focus:border-zinc-500"
                    >
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                      <option value="2028">2028</option>
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-9 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer mt-1"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>{tab === 'signin' ? 'Sign In to Arena' : 'Create Arena Account'}</span>
                )}
              </button>
            </form>
          </>
        )}

        {/* Cross-Platform SSO Footer Note */}
        <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-zinc-600" />
            <span>Shared SSO (.flashedu.in)</span>
          </span>
          <span>Zero Double-Login</span>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;


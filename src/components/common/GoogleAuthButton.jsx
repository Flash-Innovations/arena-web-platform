import React, { useEffect, useRef, useState } from 'react';

export function GoogleIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function GoogleAuthButton({
  onSuccess,
  onError,
  mode = 'signin',
  disabled = false,
  className = ''
}) {
  const buttonRef = useRef(null);
  const [gisRendered, setGisRendered] = useState(false);
  const [demoEmail, setDemoEmail] = useState('gladiator@arena.flashedu.in');
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  const clientId =
    (typeof import.meta !== 'undefined' &&
      (import.meta.env?.VITE_GOOGLE_CLIENT_ID ||
        import.meta.env?.VITE_PUBLIC_GOOGLE_CLIENT_ID ||
        import.meta.env?.GOOGLE_CLIENT_ID)) ||
    '';

  useEffect(() => {
    let checkInterval = null;

    const setupGis = () => {
      if (!clientId || !window.google?.accounts?.id || !buttonRef.current) return false;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response && response.credential) {
              onSuccess?.(response.credential);
            } else {
              onError?.(new Error('No credential received from Google.'));
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true
        });

        buttonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'filled_black',
          size: 'large',
          type: 'standard',
          text: mode === 'signup' ? 'signup_with' : 'signin_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: Math.max(240, Math.min(380, buttonRef.current.offsetWidth || 340))
        });

        setGisRendered(true);
        return true;
      } catch (err) {
        console.warn('Failed to render Google Identity Services button on Arena:', err);
        return false;
      }
    };

    if (clientId) {
      if (!setupGis()) {
        let attempts = 0;
        checkInterval = setInterval(() => {
          attempts++;
          if (setupGis() || attempts > 20) {
            clearInterval(checkInterval);
          }
        }, 150);
      }
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [clientId, mode, onSuccess, onError]);

  const handleCustomClick = () => {
    if (clientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            const mockToken = `demo_google_token_${demoEmail.trim()}`;
            onSuccess?.(mockToken);
          }
        });
        return;
      } catch (e) {
        // Fallback to demo
      }
    }

    const mockToken = `demo_google_token_${demoEmail.trim()}`;
    onSuccess?.(mockToken);
  };

  return (
    <div className={`w-full relative ${className}`}>
      {/* 1. Official Google GIS Button Container */}
      <div
        ref={buttonRef}
        className={`w-full flex justify-center min-h-[42px] ${gisRendered ? 'block' : 'hidden'}`}
      />

      {/* 2. Resilient Precision Engineering Styled Button */}
      {!gisRendered && (
        <div>
          <button
            type="button"
            disabled={disabled}
            onClick={handleCustomClick}
            className="w-full h-10 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 text-xs font-medium flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
          >
            <GoogleIcon className="w-4 h-4 shrink-0" />
            <span>{mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}</span>
          </button>

          {/* Dev helper toggle if clientId not set */}
          {!clientId && (
            <div className="mt-1 text-right">
              <button
                type="button"
                onClick={() => setIsDemoOpen(!isDemoOpen)}
                className="text-[10px] font-mono text-zinc-500 hover:text-zinc-400 underline"
              >
                {isDemoOpen ? 'Hide dev options' : 'Configure dev email'}
              </button>
              {isDemoOpen && (
                <div className="mt-1.5 p-2 rounded bg-zinc-950 border border-zinc-800 text-left space-y-1">
                  <span className="text-[10px] font-mono text-zinc-400">Mock Google Account Email:</span>
                  <input
                    type="email"
                    value={demoEmail}
                    onChange={(e) => setDemoEmail(e.target.value)}
                    className="w-full h-7 px-2 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 text-[11px] font-mono outline-none focus:border-zinc-500"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GoogleAuthButton;

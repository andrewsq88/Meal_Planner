import { useState, useEffect } from 'react';
import { X, Mail, Lock, Eye, EyeOff, Loader2, UtensilsCrossed } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  OAUTH_MODE_KEY,
  OAUTH_SEARCH_KEY,
  friendlyGoogleAuthError,
  googleRedirectTo,
  preservedAuthSearch,
} from '../lib/google-auth';

type Mode = 'signin' | 'signup' | 'forgot';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  /** Optional headline shown above the form explaining why sign-in is needed */
  prompt?: string;
  /** Tab selected when the dialog opens. Defaults to the existing sign-in tab. */
  initialMode?: 'signin' | 'signup';
  /** True after Supabase emits PASSWORD_RECOVERY. */
  passwordRecovery?: boolean;
  /** Shown when Google redirects back with an error, or the provider rejects the start. */
  externalError?: string | null;
  onClearExternalError?: () => void;
}

function friendlyAuthError(err: unknown): string {
  const msg = (err instanceof Error ? err.message : '').toLowerCase();
  if (msg.includes('already registered') || msg.includes('user already exists')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (msg.includes('password')) {
    return 'Password must be at least 6 characters.';
  }
  if (msg.includes('rate') || msg.includes('too many') || msg.includes('once every')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (msg.includes('email') || msg.includes('invalid')) {
    return 'Check the email address and try again.';
  }
  return 'Something went wrong. Please try again.';
}

export function AuthModal({
  open,
  onClose,
  prompt,
  initialMode = 'signin',
  passwordRecovery = false,
  externalError = null,
  onClearExternalError,
}: AuthModalProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [recoveryDone, setRecoveryDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMode(initialMode);
    setEmail('');
    setPassword('');
    setNextPassword('');
    setShowPassword(false);
    setError(null);
    setGoogleError(null);
    setNotice(null);
    setRecoveryDone(false);
    setLoading(false);
    setGoogleLoading(false);
  }, [open, initialMode, passwordRecovery]);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setGoogleError(null);
    setNotice(null);
    onClearExternalError?.();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGoogleError(null);
    setNotice(null);
    onClearExternalError?.();
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        onClose();
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        onClose();
      }
    } catch (err: unknown) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      if (err) throw err;
      setNotice('If an account exists for that email, we sent a link to reset your password.');
    } catch (err: unknown) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleRecovery(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password: nextPassword });
      if (err) throw err;
      setRecoveryDone(true);
      setNotice('Your password has been updated. You are signed in.');
    } catch (err: unknown) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setGoogleError(null);
    setNotice(null);
    onClearExternalError?.();
    setGoogleLoading(true);
    try {
      const modeName = mode === 'signup' ? 'signup' : 'signin';
      sessionStorage.setItem(OAUTH_MODE_KEY, modeName);
      sessionStorage.setItem(OAUTH_SEARCH_KEY, preservedAuthSearch(window.location.search));
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: googleRedirectTo(window.location.origin, window.location.search),
        },
      });
      if (err) throw err;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      setGoogleError(friendlyGoogleAuthError(message, message));
      setGoogleLoading(false);
      try {
        sessionStorage.removeItem(OAUTH_MODE_KEY);
        sessionStorage.removeItem(OAUTH_SEARCH_KEY);
      } catch {
        // Storage can be blocked. The button error still explains what happened.
      }
    }
  }

  if (!open) return null;

  const showGoogle = !passwordRecovery && mode !== 'forgot';
  const googleMessage = googleError || externalError;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[420px] bg-white dark:bg-stone-800 rounded-3xl shadow-2xl shadow-stone-300/40 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center text-stone-600 hover:text-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 transition-all z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="bg-gradient-to-br from-amber-700 to-orange-700 px-8 pt-8 pb-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
            <UtensilsCrossed className="w-6 h-6 text-white" />
          </div>
          {passwordRecovery ? (
            <>
              <p id="auth-modal-title" className="text-white font-extrabold text-lg">Choose a new password</p>
              <p className="text-white/90 text-xs mt-1">Use at least 6 characters.</p>
            </>
          ) : prompt ? (
            <>
              <p className="text-white/90 text-xs font-semibold uppercase tracking-widest mb-1">Sign in to continue</p>
              <p id="auth-modal-title" className="text-white font-bold text-sm leading-snug">{prompt}</p>
            </>
          ) : (
            <>
              <p id="auth-modal-title" className="text-white font-extrabold text-lg">Welcome to Weekly Menu</p>
              <p className="text-white/90 text-xs mt-1">Sign in to save your meals and favorites</p>
            </>
          )}
        </div>

        <div className="px-7 py-6">
          {passwordRecovery ? (
            recoveryDone ? (
              <div className="space-y-4">
                <p className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 text-sm text-amber-950" role="status">
                  {notice}
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-800 to-orange-700 text-white font-bold text-sm"
                >
                  Continue
                </button>
              </div>
            ) : (
              <form onSubmit={handleRecovery} className="space-y-3">
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-200 mb-1.5 uppercase tracking-wide">
                  New password
                </label>
                <PasswordField
                  value={nextPassword}
                  onChange={setNextPassword}
                  show={showPassword}
                  onToggle={() => setShowPassword(v => !v)}
                  placeholder="At least 6 characters"
                />
                <FormMessages error={error} notice={notice} />
                <SubmitButton loading={loading} label="Update password" />
              </form>
            )
          ) : mode === 'forgot' ? (
            <form onSubmit={handleForgot} className="space-y-3">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-200 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-500 dark:border-stone-400 bg-stone-50 dark:bg-stone-700 text-stone-800 dark:text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-amber-700 transition-all"
                />
              </div>
              <FormMessages error={error} notice={notice} />
              <SubmitButton loading={loading} label="Send reset link" />
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="w-full text-center text-sm font-semibold text-amber-900 dark:text-amber-200 hover:underline"
              >
                Back to sign in
              </button>
            </form>
          ) : (
            <>
              <div className="flex bg-stone-100 dark:bg-stone-700 rounded-2xl p-1 mb-5">
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    mode === 'signin'
                      ? 'bg-white dark:bg-stone-600 text-stone-800 dark:text-stone-100 shadow-sm'
                      : 'text-stone-700 dark:text-stone-200 hover:text-stone-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    mode === 'signup'
                      ? 'bg-white dark:bg-stone-600 text-stone-800 dark:text-stone-100 shadow-sm'
                      : 'text-stone-700 dark:text-stone-200 hover:text-stone-900'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {showGoogle && (
                <>
                  <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={googleLoading || loading}
                    aria-busy={googleLoading}
                    className="w-full flex items-center justify-center gap-3 h-10 px-4 rounded-md border border-[#747775] bg-white text-[#1f1f1f] text-sm font-medium hover:bg-[#f8f9fa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f1f1f] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <GoogleLogo />
                    <span>Continue with Google</span>
                    {googleLoading && <Loader2 className="w-4 h-4 animate-spin text-[#1f1f1f]" />}
                  </button>
                  {googleMessage && (
                    <div className="mt-3">
                      <FormMessages error={googleMessage} notice={null} />
                    </div>
                  )}
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-stone-300 dark:bg-stone-600" />
                    <span className="text-xs text-stone-600 dark:text-stone-300 font-medium">or</span>
                    <div className="flex-1 h-px bg-stone-300 dark:bg-stone-600" />
                  </div>
                </>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-200 mb-1.5 uppercase tracking-wide">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-500 dark:border-stone-400 bg-stone-50 dark:bg-stone-700 text-stone-800 dark:text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-amber-700 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-200 mb-1.5 uppercase tracking-wide">Password</label>
                  <PasswordField
                    value={password}
                    onChange={setPassword}
                    show={showPassword}
                    onToggle={() => setShowPassword(v => !v)}
                    placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  />
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="mt-2 text-xs font-semibold text-amber-900 dark:text-amber-200 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                <FormMessages error={error} notice={notice} />

                <SubmitButton
                  loading={loading || googleLoading}
                  label={mode === 'signin' ? 'Sign In' : 'Create Account'}
                />
              </form>

              <p className="text-center text-xs text-stone-600 dark:text-stone-300 mt-5">
                {mode === 'signin' ? (
                  <>No account?{' '}
                    <button type="button" onClick={() => switchMode('signup')} className="text-amber-900 dark:text-amber-200 font-semibold hover:underline">
                      Create one free
                    </button>
                  </>
                ) : (
                  <>Already have an account?{' '}
                    <button type="button" onClick={() => switchMode('signin')} className="text-amber-900 dark:text-amber-200 font-semibold hover:underline">
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Official four-color G mark from Google's sign-in button. */
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function PasswordField({
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  autoComplete,
}: {
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
  autoComplete?: string;
}) {
  return (
    <div className="relative">
      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        placeholder={placeholder}
        minLength={6}
        autoComplete={autoComplete}
        className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-stone-500 dark:border-stone-400 bg-stone-50 dark:bg-stone-700 text-stone-800 dark:text-stone-100 placeholder-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-amber-700 transition-all"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-600 hover:text-stone-800 transition-colors"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function FormMessages({ error, notice }: { error: string | null; notice: string | null }) {
  return (
    <>
      {notice && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-xl px-4 py-3 text-xs text-amber-950 dark:text-amber-100" role="status">
          {notice}
        </div>
      )}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-300 dark:border-rose-800/30 rounded-xl px-4 py-3 text-xs text-rose-800 dark:text-rose-200" role="alert">
          {error}
        </div>
      )}
    </>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-800 to-orange-700 hover:from-amber-900 hover:to-orange-800 text-white font-bold text-sm shadow-lg shadow-amber-200 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {label}
    </button>
  );
}

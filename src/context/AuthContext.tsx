import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { OAUTH_MODE_KEY, googleProfileNamePatch, readOAuthReturn } from '../lib/google-auth';
import { isAuthCallbackPath } from '../lib/routes';
import { supabase } from '../lib/supabase';

function callbackAwaitingSession(): boolean {
  if (typeof window === 'undefined') return false;
  if (!isAuthCallbackPath(window.location.pathname)) return false;
  const returned = readOAuthReturn(window.location.search, window.location.hash);
  if (returned.status === 'error') return false;
  if (returned.status === 'pending') return true;
  try {
    return sessionStorage.getItem(OAUTH_MODE_KEY) != null;
  } catch {
    return false;
  }
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** True after Supabase emits PASSWORD_RECOVERY for a reset link. */
  passwordRecovery: boolean;
  /** True after the first getSession call, including any OAuth code exchange. */
  sessionChecked: boolean;
  clearPasswordRecovery: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  passwordRecovery: false,
  sessionChecked: false,
  clearPasswordRecovery: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  // Start logged-out so the prerender and the first client paint include the
  // planner. The callback route is the exception: stay on the spinner until
  // the OAuth session has been read.
  const [loading, setLoading] = useState(callbackAwaitingSession);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const patchedNameFor = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data, error }) => {
      let session = data.session;
      try {
        if (!session && !error && typeof window !== 'undefined' && isAuthCallbackPath(window.location.pathname)) {
          const returned = readOAuthReturn(window.location.search, window.location.hash);
          const code = new URLSearchParams(window.location.search).get('code');
          // Implicit returns are consumed by detectSessionInUrl. Exchange only a
          // PKCE code that is still in the URL after that pickup.
          if (code && returned.status !== 'error') {
            const exchanged = await supabase.auth.exchangeCodeForSession(code);
            if (!exchanged.error && exchanged.data.session) session = exchanged.data.session;
          }
        }
      } catch {
        // A failed code exchange still ends the return trip so the screen can show an error.
      }
      if (cancelled) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setSessionChecked(true);
    }).catch(() => {
      if (cancelled) return;
      setLoading(false);
      setSessionChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const patch = googleProfileNamePatch(user);
    if (!patch || patchedNameFor.current === user.id) return;
    patchedNameFor.current = user.id;
    void supabase.auth.updateUser({ data: patch });
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        passwordRecovery,
        sessionChecked,
        clearPasswordRecovery: () => setPasswordRecovery(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

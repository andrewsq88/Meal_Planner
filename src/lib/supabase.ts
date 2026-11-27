import { createClient } from '@supabase/supabase-js';

// Placeholder values let the post-build prerender import the client when the
// public env vars are unset. A production build inlines the real values.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'public-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // auth-js defaults to the implicit grant. detectSessionInUrl reads the
    // OAuth hash on /auth/callback. flowType stays at that default so
    // password-reset links keep working the way they do today. A PKCE `code`
    // is exchanged in AuthProvider when one is present.
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});

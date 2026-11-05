import { createClient } from '@supabase/supabase-js';

// Placeholder values let the post-build prerender import the client when the
// public env vars are unset. A production build inlines the real values.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'public-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

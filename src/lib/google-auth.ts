/**
 * Google OAuth helpers. Email/password sign-in is unchanged.
 * The Supabase client uses the implicit grant (auth-js default) with
 * detectSessionInUrl, so the return lands on /auth/callback and the session
 * is read from the URL. If the client is later switched to PKCE, the callback
 * still exchanges `?code=` once.
 */

import { AUTH_CALLBACK_PATH } from './routes.ts';

export const OAUTH_MODE_KEY = 'mealplan.oauth.mode';
export const OAUTH_SEARCH_KEY = 'mealplan.oauth.search';

const PASSTHROUGH_PARAMS = ['plan', 'next', 'redirect'] as const;

export type OAuthReturn =
  | { status: 'none' }
  | { status: 'pending' }
  | { status: 'error'; message: string };

function searchParams(search: string): URLSearchParams {
  const raw = search.startsWith('?') ? search.slice(1) : search;
  return new URLSearchParams(raw);
}

function hasControlChar(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    if (value.charCodeAt(i) <= 31) return true;
  }
  return false;
}

function textField(meta: Record<string, unknown> | null | undefined, key: string): string {
  const value = meta?.[key];
  return typeof value === 'string' ? value.trim() : '';
}

/** Same-origin path only. Rejects protocol-relative and encoded off-site targets. */
export function safeInternalPath(value: string | null | undefined): string | null {
  if (!value) return null;
  let decoded = value.trim();
  if (!decoded || decoded.length > 500) return null;
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    return null;
  }
  if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.startsWith('/\\')) return null;
  if (decoded.includes('\\') || decoded.includes('://') || hasControlChar(decoded)) return null;
  return decoded;
}

/** Query string of plan / next / redirect values worth keeping across the provider round trip. */
export function preservedAuthSearch(search: string): string {
  const incoming = searchParams(search);
  const kept = new URLSearchParams();
  for (const key of PASSTHROUGH_PARAMS) {
    const value = incoming.get(key);
    if (value && value.length <= 500) kept.set(key, value);
  }
  const qs = kept.toString();
  return qs ? `?${qs}` : '';
}

export function googleRedirectTo(origin: string, search: string): string {
  const base = origin.replace(/\/$/, '');
  return `${base}${AUTH_CALLBACK_PATH}${preservedAuthSearch(search)}`;
}

/**
 * Where to send a signed-in Google user. `next` or `redirect` wins when it is
 * a local path; otherwise the planner (`/`), keeping `plan` when it was present.
 */
export function postLoginLocation(search: string): string {
  const params = searchParams(search);
  const candidate = safeInternalPath(params.get('next')) ?? safeInternalPath(params.get('redirect'));
  const next = candidate && !candidate.startsWith(AUTH_CALLBACK_PATH) ? candidate : null;
  const plan = params.get('plan');
  if (next) {
    if (!plan || next.includes('plan=')) return next;
    const join = next.includes('?') ? '&' : '?';
    return `${next}${join}plan=${encodeURIComponent(plan)}`;
  }
  if (plan) return `/?plan=${encodeURIComponent(plan)}`;
  return '/';
}

export function friendlyGoogleAuthError(error: string, description = ''): string {
  const blob = `${error} ${description}`.replace(/\+/g, ' ').toLowerCase();
  if (
    blob.includes('access_denied')
    || blob.includes('cancel')
    || blob.includes('popup closed')
    || blob.includes('user closed')
  ) {
    return 'Google sign-in was cancelled. You can try again, or continue with email.';
  }
  if (
    blob.includes('not enabled')
    || blob.includes('unsupported provider')
    || blob.includes('provider is disabled')
    || blob.includes('validation_failed')
    || (blob.includes('provider') && blob.includes('disabled'))
  ) {
    return 'Google sign-in is not available right now. Continue with email, or try again later.';
  }
  return 'Google sign-in did not finish. Please try again, or continue with email.';
}

export function readOAuthReturn(search: string, hash: string): OAuthReturn {
  const query = searchParams(search);
  const fragment = searchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  const error = query.get('error') || query.get('error_code') || fragment.get('error') || fragment.get('error_code') || '';
  const description = query.get('error_description') || fragment.get('error_description') || '';
  if (error || description) {
    return { status: 'error', message: friendlyGoogleAuthError(error, description) };
  }
  if (query.get('code') || fragment.get('access_token')) return { status: 'pending' };
  return { status: 'none' };
}

export function accountLabel(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): string {
  const full = textField(user.user_metadata, 'full_name');
  if (full) return full;
  const name = textField(user.user_metadata, 'name');
  if (name) return name;
  return user.email?.trim() || '';
}

/**
 * Google sometimes sends `name` and omits `full_name`. Copy `name` so anything
 * that reads `full_name` still has a value. Email accounts are left alone.
 * There is no profiles table; this only updates auth user metadata.
 */
export function googleProfileNamePatch(user: {
  app_metadata?: { provider?: unknown; providers?: unknown } | null;
  user_metadata?: Record<string, unknown> | null;
}): { full_name: string } | null {
  const provider = user.app_metadata?.provider;
  const providers = user.app_metadata?.providers;
  const google = provider === 'google' || (Array.isArray(providers) && providers.includes('google'));
  if (!google) return null;
  if (textField(user.user_metadata, 'full_name')) return null;
  const name = textField(user.user_metadata, 'name');
  if (!name) return null;
  return { full_name: name };
}

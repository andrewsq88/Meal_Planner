/**
 * Build-time switches. Both default off when the variable is unset, so a Bolt
 * build without these flags does not call Google or the suggestion function.
 * Set the value to `true` to turn a feature on.
 */

function enabled(raw: unknown): boolean {
  const value = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  return value === 'true' || value === '1' || value === 'on' || value === 'yes';
}

/** Google sign-in button. Default off. */
export function googleAuthEnabled(): boolean {
  return enabled(import.meta.env.VITE_GOOGLE_AUTH_ENABLED);
}

/** AI meal-detail suggestions. Default off. */
export function aiSuggestionsEnabled(): boolean {
  return enabled(import.meta.env.VITE_AI_SUGGESTIONS_ENABLED);
}

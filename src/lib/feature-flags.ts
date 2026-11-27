/**
 * Build-time switch. Defaults off when the variable is unset, so a Bolt
 * build without this flag does not call the suggestion function.
 * Set the value to `true` to turn the feature on.
 */

function enabled(raw: unknown): boolean {
  const value = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  return value === 'true' || value === '1' || value === 'on' || value === 'yes';
}

/** AI meal-detail suggestions. Default off. */
export function aiSuggestionsEnabled(): boolean {
  return enabled(import.meta.env.VITE_AI_SUGGESTIONS_ENABLED);
}

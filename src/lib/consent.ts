/** Advertising-cookie consent. Stored locally so the choice is remembered. */

export type AdConsent = 'pending' | 'accepted' | 'rejected';

export const AD_CONSENT_KEY = 'mealplan-ad-consent';
export const AD_CONSENT_EVENT = 'mealplan-ad-consent';

export function getAdConsent(): AdConsent {
  if (typeof window === 'undefined') return 'pending';
  try {
    const value = window.localStorage.getItem(AD_CONSENT_KEY);
    if (value === 'accepted' || value === 'rejected') return value;
  } catch {
    // Private mode can block localStorage. Treat as pending.
  }
  return 'pending';
}

export function setAdConsent(value: 'accepted' | 'rejected'): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(AD_CONSENT_KEY, value);
  } catch {
    // Ignore quota / privacy errors; the in-memory event still updates this session.
  }
  window.dispatchEvent(new Event(AD_CONSENT_EVENT));
}

export function subscribeAdConsent(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(AD_CONSENT_EVENT, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(AD_CONSENT_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
}

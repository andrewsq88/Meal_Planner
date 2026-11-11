import { useEffect } from 'react';
import { startCookielessAnalytics } from '../lib/cookieless-analytics';

/** Mount once at the app root. Loads GoatCounter only when VITE_GOATCOUNTER_CODE is set. */
export function CookielessAnalytics() {
  useEffect(() => startCookielessAnalytics(), []);
  return null;
}

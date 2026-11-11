import { useEffect } from 'react';
import { startCookielessAnalytics } from '../lib/cookieless-analytics';

/** Mount once at the app root. Analytics is cookieless and does not wait for ad consent. */
export function CookielessAnalytics() {
  useEffect(() => startCookielessAnalytics(), []);
  return null;
}

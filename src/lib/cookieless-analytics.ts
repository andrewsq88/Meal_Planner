/**
 * Optional GoatCounter hook.
 *
 * GoatCounter.com is a donation-supported hosted service, free for reasonable
 * public use including small-to-medium businesses, with no card required.
 * Automated signup is not allowed, so this code only loads GoatCounter when
 * VITE_GOATCOUNTER_CODE is provided at build time.
 *
 * There is no first-party /collect beacon. Until the site code is set, no
 * analytics requests are made.
 */

function goatCounterCode(): string {
  const code = (import.meta.env.VITE_GOATCOUNTER_CODE as string | undefined)?.trim() ?? '';
  if (!/^[a-z0-9-]+$/i.test(code)) return '';
  return code;
}

function loadGoatCounter(code: string): void {
  if (document.querySelector('script[data-cookieless-analytics="goatcounter"]')) return;
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://gc.zgo.at/count.js';
  script.dataset.goatcounter = `https://${code}.goatcounter.com/count`;
  script.dataset.cookielessAnalytics = 'goatcounter';
  document.head.appendChild(script);
}

/** Start optional GoatCounter once on the client. Safe to call from useEffect. */
export function startCookielessAnalytics(): () => void {
  if (typeof window === 'undefined') return () => {};

  const code = goatCounterCode();
  if (!code) return () => {};

  loadGoatCounter(code);

  const onRoute = () => {
    const gc = (window as Window & { goatcounter?: { count?: () => void } }).goatcounter;
    if (gc && typeof gc.count === 'function') gc.count();
  };

  window.addEventListener('popstate', onRoute);
  window.addEventListener('mealplan-ad-route', onRoute);
  return () => {
    window.removeEventListener('popstate', onRoute);
    window.removeEventListener('mealplan-ad-route', onRoute);
  };
}

/**
 * Cookieless, first-party pageview beacon plus an optional GoatCounter forwarder.
 *
 * GoatCounter.com is a donation-supported hosted service, free for reasonable
 * public use including small-to-medium businesses, with no card required.
 * Automated signup is not allowed, so this code only loads GoatCounter when
 * VITE_GOATCOUNTER_CODE is provided at build time.
 *
 * The first-party beacon never sets cookies or localStorage and does not
 * include a persistent identifier. In `vite preview` it posts to /collect
 * (handled by the preview plugin). On the production static host that path
 * is a no-op unless a later collect endpoint is added.
 */

const COLLECT_PATH = '/collect';

function goatCounterCode(): string {
  const code = (import.meta.env.VITE_GOATCOUNTER_CODE as string | undefined)?.trim() ?? '';
  if (!/^[a-z0-9-]+$/i.test(code)) return '';
  return code;
}

function pageviewPayload() {
  if (typeof window === 'undefined') return null;
  return {
    path: window.location.pathname + window.location.search,
    referrer: document.referrer || '',
    ts: new Date().toISOString(),
    viewport: `${window.innerWidth}x${window.innerHeight}`,
  };
}

function sendFirstParty(payload: NonNullable<ReturnType<typeof pageviewPayload>>): void {
  const body = JSON.stringify(payload);
  const url = COLLECT_PATH;
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon(url, blob)) return;
    }
  } catch {
    // Fall through to fetch.
  }
  void fetch(url, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    credentials: 'omit',
  }).catch(() => {
    // Production static hosting may not provide /collect. That is expected.
  });
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

/** Start cookieless analytics once on the client. Safe to call from useEffect. */
export function startCookielessAnalytics(): () => void {
  if (typeof window === 'undefined') return () => {};

  const send = () => {
    const payload = pageviewPayload();
    if (payload) sendFirstParty(payload);
  };

  const code = goatCounterCode();
  if (code) loadGoatCounter(code);
  send();

  if (!window.__mealplanHistoryWrapped) {
    const push = history.pushState.bind(history);
    const replace = history.replaceState.bind(history);
    history.pushState = (...args: Parameters<History['pushState']>) => {
      push(...args);
      window.dispatchEvent(new Event('mealplan-ad-route'));
    };
    history.replaceState = (...args: Parameters<History['replaceState']>) => {
      replace(...args);
      window.dispatchEvent(new Event('mealplan-ad-route'));
    };
    window.__mealplanHistoryWrapped = true;
  }

  const onRoute = () => send();
  window.addEventListener('popstate', onRoute);
  window.addEventListener('mealplan-ad-route', onRoute);
  return () => {
    window.removeEventListener('popstate', onRoute);
    window.removeEventListener('mealplan-ad-route', onRoute);
  };
}

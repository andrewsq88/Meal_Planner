/** Pathname helpers for the ad-free landing page and the existing auth dialog. */

/**
 * Canonical site origin. The live apex host redirects here, and the homepage
 * URL is this origin plus a trailing slash.
 */
export const CANONICAL_ORIGIN = 'https://www.weeklymealplan.space';

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
  return pathname;
}

export function isStartPath(pathname: string): boolean {
  return normalizePath(pathname) === '/start';
}

export function isSignupPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  return path === '/signup' || path === '/sign-up';
}

/** Paths that open the existing sign-in dialog. Ads stay blocked on these routes. */
export function isSignInPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  return path === '/login' || path === '/signin' || path === '/sign-in';
}

/**
 * Auth, payment, and checkout paths. The public planner and /start are not included.
 * Mirrors the ad-route list without /start.
 */
const AUTH_OR_PAYMENT_ROUTE =
  /\/checkout|\/pay|\/billing|stripe|\/auth(?:\/|$|\?|#)|\/login(?:\/|$|\?|#)|\/signin(?:\/|$|\?|#)|\/sign-in(?:\/|$|\?|#)|\/signup(?:\/|$|\?|#)|\/sign-up(?:\/|$|\?|#)|\/register(?:\/|$|\?|#)|\/account(?:\/|$|\?|#)/i;

export function isAuthOrPaymentPath(pathname: string): boolean {
  return AUTH_OR_PAYMENT_ROUTE.test(pathname);
}

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

/**
 * Public content paths. Kept here as strings so this module can load under
 * Node during prerender without a second import graph. prerender.mjs checks
 * that every public route is in this set.
 */
const PUBLIC_CONTENT = new Set([
  '/start',
  '/privacy',
  '/terms',
  '/cookies',
  '/cheap-weekly-meal-plan',
  '/family-of-4-meal-plan',
  '/meal-prep-shopping-list',
  '/7-day-dinner-plan',
  '/weekly-breakfast-ideas',
  '/printable-weekly-meal-planner',
]);

/** Public pages, auth shells, and payment shells. Everything else is a 404. */
export function isKnownPath(pathname: string): boolean {
  const path = normalizePath(pathname.split('?')[0].split('#')[0]);
  if (path === '/' || path === '') return true;
  if (isStartPath(path) || isSignupPath(path) || isSignInPath(path)) return true;
  if (PUBLIC_CONTENT.has(path) || isAuthOrPaymentPath(path)) return true;
  return false;
}

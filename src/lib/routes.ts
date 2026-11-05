/** Pathname helpers for the ad-free landing page and the existing auth dialog. */

/** Canonical site origin. The homepage URL is this origin plus a trailing slash. */
export const CANONICAL_ORIGIN = 'https://weeklymealplan.space';

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

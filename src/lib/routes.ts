/** Pathname helpers for the ad-free landing page and the existing auth dialog. */

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

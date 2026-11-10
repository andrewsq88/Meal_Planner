import { GUIDE_PAGES } from '../content/guides';
import { isAuthOrPaymentPath } from '../lib/routes';

const OTHER_SITES = [
  {
    label: 'Lushlands Management',
    href: 'https://www.lushlandsmanagement.com/?utm_source=mealplan&utm_medium=crosslink&utm_campaign=footer-2026-11',
  },
  {
    label: 'The Daily Pulse',
    href: 'https://thedailypulse.space/?utm_source=mealplan&utm_medium=crosslink&utm_campaign=footer-2026-11',
  },
] as const;

interface SiteFooterProps {
  pathname: string;
  className: string;
}

export function SiteFooter({ pathname, className }: SiteFooterProps) {
  const showOtherSites = !isAuthOrPaymentPath(pathname);
  const showGuides = pathname === '/' || pathname === '';

  return (
    <footer className={className}>
      {showGuides ? (
        <nav aria-labelledby="meal-planning-guides" className="mb-4 px-4">
          <h2
            id="meal-planning-guides"
            className="text-center text-xs font-semibold text-stone-500 dark:text-stone-400"
          >
            Meal planning guides
          </h2>
          <ul className="mt-1 flex flex-col items-center">
            {GUIDE_PAGES.map((page) => (
              <li key={page.path}>
                <a
                  href={page.path}
                  className="inline-flex min-h-11 items-center justify-center px-3 text-center text-xs text-stone-600 underline decoration-stone-300 underline-offset-2 hover:text-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 dark:text-stone-300 dark:decoration-stone-600 dark:hover:text-stone-100"
                >
                  {page.h1}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
      {showOtherSites ? (
        <nav aria-labelledby="explore-other-sites" className="mb-3 px-4">
          <h2
            id="explore-other-sites"
            className="text-center text-xs font-semibold text-stone-500 dark:text-stone-400"
          >
            Explore our other sites
          </h2>
          <ul className="mt-1 flex flex-col items-center sm:flex-row sm:flex-wrap sm:justify-center">
            {OTHER_SITES.map((site) => (
              <li key={site.href}>
                <a
                  href={site.href}
                  className="inline-flex min-h-11 items-center justify-center px-3 text-center text-xs text-stone-600 underline decoration-stone-300 underline-offset-2 hover:text-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 dark:text-stone-300 dark:decoration-stone-600 dark:hover:text-stone-100"
                >
                  {site.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
      <p className="text-center text-xs text-stone-400 dark:text-stone-500">
        &copy; {new Date().getFullYear()} SQ Consultancy. All rights reserved.
      </p>
    </footer>
  );
}

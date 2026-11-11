/** Legal copy for the public privacy, terms, and cookie pages. */

export const OPERATOR_NAME = 'SQ Consulting';
export const PRODUCT_NAME = 'Weekly Meal Planner';
export const SITE_HOST = 'www.weeklymealplan.space';
export const SITE_URL = 'https://www.weeklymealplan.space/';
export const LEGAL_UPDATED = '11 November 2026';

/** Operator contact, for page source only. */
export const OPERATOR_CONTACT = 'andrewsq88@gmail.com';

export type LegalSlug = 'privacy' | 'terms' | 'cookies';

export interface LegalPageSpec {
  slug: LegalSlug;
  path: `/${LegalSlug}`;
  title: string;
  description: string;
  heading: string;
}

export const LEGAL_PAGES: readonly LegalPageSpec[] = [
  {
    slug: 'privacy',
    path: '/privacy',
    title: 'Privacy Policy | Weekly Meal Planner',
    description:
      'How SQ Consulting handles information on Weekly Meal Planner, including accounts, cookies, advertising, and optional GoatCounter analytics.',
    heading: 'Privacy Policy',
  },
  {
    slug: 'terms',
    path: '/terms',
    title: 'Terms of Use | Weekly Meal Planner',
    description:
      'Terms for using Weekly Meal Planner, a free family meal-planning website operated by SQ Consulting.',
    heading: 'Terms of Use',
  },
  {
    slug: 'cookies',
    path: '/cookies',
    title: 'Cookie Policy | Weekly Meal Planner',
    description:
      'Cookies and similar storage used on Weekly Meal Planner, including the consent choice and advertising cookies.',
    heading: 'Cookie Policy',
  },
];

export function findLegalPage(pathname: string): LegalPageSpec | undefined {
  const path = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  return LEGAL_PAGES.find((page) => page.path === path);
}

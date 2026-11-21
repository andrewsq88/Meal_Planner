/** Facts already published on the site: the product name, its description, and the copyright holder. */

export const HOME_TITLE = 'Weekly Meal Planner - Plan Your Family Meals for the Week';

export const HOME_DESCRIPTION =
  "Plan your family's weekly meals with ease. Browse recipe suggestions, save favorites, and organize breakfast, lunch, and dinner for the whole week. Open a meal to see its ingredients.";

export const START_TITLE = "Plan Your Family's Meals for the Week";

export const START_DESCRIPTION =
  'Lay out breakfast, lunch, and dinner across all seven days. Save meals you love and drop them onto the week in one click.';

export function siteGraph(origin: string) {
  return [
    {
      '@type': 'Organization',
      '@id': `${origin}/#organization`,
      name: 'Weekly Meal Planner',
    },
    {
      '@type': 'WebSite',
      '@id': `${origin}/#website`,
      name: 'Weekly Meal Planner',
      url: `${origin}/`,
      description: HOME_DESCRIPTION,
      publisher: { '@id': `${origin}/#organization` },
    },
  ];
}

export function webApplicationNode(origin: string) {
  return {
    '@type': 'WebApplication',
    '@id': `${origin}/#webapp`,
    name: 'Weekly Meal Planner',
    url: `${origin}/`,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: HOME_DESCRIPTION,
    isPartOf: { '@id': `${origin}/#website` },
  };
}

export function webPageNode(origin: string, path: string, name: string, description: string) {
  const url = path === '/' ? `${origin}/` : `${origin}${path}`;
  return {
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: 'en',
    isPartOf: { '@id': `${origin}/#website` },
  };
}

export const ADVERTISE_PATH = '/advertise';

export const ADVERTISE_HEADING = 'Partner / Advertise with us';

export const ADVERTISE_TITLE = 'Partner and Advertise | Weekly Meal Planner';

export const ADVERTISE_DESCRIPTION =
  'Weekly Meal Planner is a free weekly meal planner. Food and cooking brands, caterers, restaurants, and affiliate or sponsorship partners can send a partnership enquiry.';

/** Public partnership address. The only address published for this page. */
export const ADVERTISE_EMAIL = 'advertisers@weeklymealplan.space';

export const ADVERTISE_MAILTO = `mailto:${ADVERTISE_EMAIL}?subject=Partnership%20enquiry`;

/** Contact page for partnership enquiries. No audience, traffic, or pricing fields. */
export function contactPageNode(origin: string) {
  const url = `${origin}${ADVERTISE_PATH}`;
  return {
    '@type': 'ContactPage',
    '@id': `${url}#webpage`,
    url,
    name: ADVERTISE_TITLE,
    description: ADVERTISE_DESCRIPTION,
    inLanguage: 'en',
    isPartOf: { '@id': `${origin}/#website` },
    mainEntity: {
      '@type': 'ContactPoint',
      contactType: 'partnerships',
      email: ADVERTISE_EMAIL,
      url,
    },
  };
}

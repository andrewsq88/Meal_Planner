import { isAuthOrPaymentPath } from '../lib/routes';

/**
 * ClickBank offers for weeklymealplan.space.
 * Hop links use the unencrypted form from ClickBank's HopLinks Guide so a
 * later swap to encrypted HopLinks happens in this file only.
 * https://hop.clickbank.net/?affiliate=asq88&vendor=VENDORID&tid=PLACEMENT
 */
export const CLICKBANK_AFFILIATE = 'asq88';

export const AFFILIATE_LABEL = 'Partner pick · affiliate link';

export const AFFILIATE_DISCLOSURE =
  'Partner link. If you buy through it, we may earn a commission. The price you pay does not change.';

/** Shown on the shared footer of pages that can render an affiliate unit. */
export const AFFILIATE_FOOTER_DISCLOSURE =
  'Some links and boxes on this site are advertisements. If you follow a labelled affiliate link and buy, we may earn a commission, at no extra cost to you.';

/** Exact inline label for the cheap-plan card. Sentence case, not the short badge. */
export const CHEAP_PLAN_AFFILIATE_LABEL =
  'Advertisement — affiliate link. We may earn a commission if you buy.';

export const CHEAP_PLAN_AFFILIATE_BLURB =
  'Recipes, a 30-day meal plan and shopping lists, as a paid digital download.';

export const CHEAP_PLAN_AFFILIATE_CTA = 'See the cookbook';

export type AffiliateId = 'jmrosa2' | 'plantbc';

export type AffiliatePlacement =
  | 'planner'
  | 'start'
  | 'meal-prep'
  | 'printable'
  | 'dinner-plan'
  | 'wmp-cheap'
  | 'suggestions-vegan';

export interface AffiliateImage {
  src: string;
  width: number;
  height: number;
  alt: string;
}

export interface AffiliateOffer {
  vendorId: AffiliateId;
  name: string;
  blurb: string;
  image: AffiliateImage;
}

/**
 * Product images are the vendors' own graphics from their public affiliate
 * pages, saved in this repo. They are not hotlinked.
 * jmrosa2: https://simpleslimkitchen.com/affiliates/
 * plantbc: https://plantbasedresource.com/vegan-affiliate-program-promote-our-plant-based-ebooks-earn-high-commissions/
 */
export const AFFILIATE_OFFERS: Record<AffiliateId, AffiliateOffer> = {
  jmrosa2: {
    vendorId: 'jmrosa2',
    name: 'The Simple Slim Kitchen',
    blurb: 'A 30-day meal plan with recipes, shopping lists and prep routines.',
    image: {
      src: '/affiliates/simple-slim-kitchen.webp',
      width: 1122,
      height: 1402,
      alt: 'The Simple Slim Kitchen product image: a cookbook cover, a sample week meal plan, and a grocery list.',
    },
  },
  plantbc: {
    vendorId: 'plantbc',
    name: 'The Complete Plant-Based Recipe Cookbook',
    blurb: '200+ plant-based recipes and a 30-day meal plan.',
    image: {
      src: '/affiliates/plant-based-recipe-cookbook.webp',
      width: 700,
      height: 382,
      alt: 'The Complete Plant-Based Recipe Cookbook on a tablet, next to a 30-day vegan meal plan and smoothie recipes.',
    },
  },
};

export interface GuideAffiliatePlacement {
  offerId: AffiliateId;
  placement: AffiliatePlacement;
  /** Insert the card immediately before this heading. */
  beforeHeading?: string;
  /** Insert the card after this section's content and before the next heading. */
  afterHeading?: string;
  label?: string;
  blurb?: string;
  cta?: string;
  showImage?: boolean;
  showDisclosure?: boolean;
  /** Keep the label in sentence case. The short badge stays uppercase. */
  exactLabel?: boolean;
  rel?: string;
}

/**
 * One in-content unit per guide, outside the ad slots.
 * The cheap-plan card sits after "Budget-friendly shopping habits" and before
 * the FAQ, which is also below the mid-article banner (data-guide-ad="2").
 */
export const GUIDE_AFFILIATE_PLACEMENTS: Partial<Record<string, GuideAffiliatePlacement>> = {
  '/meal-prep-shopping-list': {
    offerId: 'jmrosa2',
    placement: 'meal-prep',
    beforeHeading: 'Meal prep tips that save time',
  },
  '/printable-weekly-meal-planner': {
    offerId: 'jmrosa2',
    placement: 'printable',
    beforeHeading: 'Tips for keeping the habit going',
  },
  '/7-day-dinner-plan': {
    offerId: 'jmrosa2',
    placement: 'dinner-plan',
    beforeHeading: 'Tips for sticking to your dinner plan',
  },
  '/cheap-weekly-meal-plan': {
    offerId: 'plantbc',
    placement: 'wmp-cheap',
    afterHeading: 'Budget-friendly shopping habits',
    label: CHEAP_PLAN_AFFILIATE_LABEL,
    blurb: CHEAP_PLAN_AFFILIATE_BLURB,
    cta: CHEAP_PLAN_AFFILIATE_CTA,
    showImage: false,
    showDisclosure: false,
    exactLabel: true,
    rel: 'sponsored nofollow',
  },
};

const UPGRADE_ROUTE = /\/upgrade(?:\/|$|\?|#)/i;

/** Auth, account, payment, checkout, and upgrade routes stay free of units. */
export function affiliateUnitsAllowed(pathname: string): boolean {
  return !isAuthOrPaymentPath(pathname) && !UPGRADE_ROUTE.test(pathname);
}

export function affiliateHopLink(vendorId: string, placement: string): string {
  const params = new URLSearchParams();
  params.set('affiliate', CLICKBANK_AFFILIATE);
  params.set('vendor', vendorId);
  params.set('tid', placement);
  return `https://hop.clickbank.net/?${params.toString()}`;
}

/** Vegan or plant-based recipe search, not a mixed suggestion list. */
export function isVeganSuggestionQuery(query: string): boolean {
  return /\b(vegan|plant[-\s]?based)\b/i.test(query);
}

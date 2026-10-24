/**
 * In-flow Adsterra slots for the public planner.
 * At most three units: the native slot, a 300x250, and either a 320x50
 * (viewport under 768px) or a 728x90. Never both leaderboard sizes.
 */

export const AD_ROUTE_BLOCK =
  /\/checkout|\/pay|\/billing|stripe|\/auth(?:\/|$|\?|#)|\/login(?:\/|$|\?|#)|\/signin(?:\/|$|\?|#)|\/sign-in(?:\/|$|\?|#)|\/signup(?:\/|$|\?|#)|\/sign-up(?:\/|$|\?|#)|\/register(?:\/|$|\?|#)|\/account(?:\/|$|\?|#)/i;

export function locationKey(loc: Pick<Location, 'pathname' | 'hash'> = location): string {
  return loc.pathname + loc.hash;
}

export function isAdRouteBlocked(path = locationKey()): boolean {
  return AD_ROUTE_BLOCK.test(path);
}

/** Native banner, layout 4:1, below the planner. 728 / 4 = 182. */
export const NATIVE_SLOT = {
  slot: 'mp-native-below',
  containerId: 'container-a7e9174df967c6cbfe2fac56776ae229',
  scriptSrc: 'https://bicea.org/21/a7e9174df967c6cbfe2fac56776ae229',
  frameHeight: 182,
} as const;

export const AD_LABEL_HEIGHT = 16;
export const AD_LABEL_GAP = 4;

/** Mobile leaderboard is used below the Tailwind `md` breakpoint. */
export const MOBILE_BANNER_QUERY = '(max-width: 767px)';

export function reservedSlotHeight(frameHeight: number): number {
  return AD_LABEL_HEIGHT + AD_LABEL_GAP + frameHeight;
}

export type BannerSize = '300x250' | '320x50' | '728x90';

export interface BannerPlacement {
  slot: string;
  /** Adsterra unit id from the publisher export. */
  unitId: string;
  size: BannerSize;
  key: string;
  width: number;
  height: number;
}

export interface AtOptions {
  key: string;
  format: 'iframe';
  height: number;
  width: number;
  params: Record<string, string>;
}

/** Banner 300x250, unit 31892842. Shown on every viewport. */
export const BANNER_300X250: BannerPlacement = {
  slot: 'mp-300x250',
  unitId: '31892842',
  size: '300x250',
  key: '34e44129251709530029981c3e745180',
  width: 300,
  height: 250,
};

/** Banner 320x50, unit 31892843. Mobile only. */
export const BANNER_320X50: BannerPlacement = {
  slot: 'mp-320x50',
  unitId: '31892843',
  size: '320x50',
  key: 'fa50c1f9cb5dc4192c4b02fe37c56461',
  width: 320,
  height: 50,
};

/** Banner 728x90, unit 31892844. Desktop only (768px and up). */
export const BANNER_728X90: BannerPlacement = {
  slot: 'mp-728x90',
  unitId: '31892844',
  size: '728x90',
  key: 'd61b3b0f54ad245ef88499d87e516a9a',
  width: 728,
  height: 90,
};

/**
 * 300x250, then the single leaderboard that matches the viewport.
 * The two leaderboards are never returned together.
 */
export function bannersForViewport(isMobile: boolean): readonly BannerPlacement[] {
  return [BANNER_300X250, isMobile ? BANNER_320X50 : BANNER_728X90];
}

/** Native plus the banners for this viewport. Always three, never four. */
export function slotsForViewport(isMobile: boolean): readonly string[] {
  return [NATIVE_SLOT.slot, ...bannersForViewport(isMobile).map((banner) => banner.slot)];
}

export function bannerAtOptions(banner: BannerPlacement): AtOptions {
  return {
    key: banner.key,
    format: 'iframe',
    height: banner.height,
    width: banner.width,
    params: {},
  };
}

/**
 * Adsterra iframe invoke script for these units.
 * Standard placement sets `atOptions`, then loads this URL.
 */
export function bannerInvokeSrc(key: string): string {
  return `https://bicea.org/22/${key}`;
}

/** Banners share the page-global atOptions, so each mount must finish before the next starts. */
export async function mountBannersInOrder(
  banners: readonly BannerPlacement[],
  mount: (banner: BannerPlacement) => Promise<void>,
): Promise<void> {
  for (const banner of banners) {
    await mount(banner);
  }
}

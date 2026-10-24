/**
 * In-flow Adsterra slots for the public planner.
 * Banner sizes 300x250, 320x50, and 728x90 have no invoke key in the
 * publisher export, so they are omitted. Do not invent keys.
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

export function reservedSlotHeight(frameHeight: number): number {
  return AD_LABEL_HEIGHT + AD_LABEL_GAP + frameHeight;
}

export const MISSING_BANNER_SIZES = ['300x250', '320x50', '728x90'] as const;

export type BannerSize = (typeof MISSING_BANNER_SIZES)[number];

export interface BannerPlacement {
  slot: string;
  size: BannerSize;
  key: string;
  width: number;
  height: number;
  /** CSS visibility (media query). Not a JS show/hide swap. */
  frameClassName: string;
}

export interface AtOptions {
  key: string;
  format: 'iframe';
  height: number;
  width: number;
  params: Record<string, string>;
}

/**
 * No banner invoke keys were supplied. Leave the list empty.
 * Slots would be, in order: 300x250, then 320x50 (mobile) or 728x90 (desktop).
 */
export const BANNER_PLACEMENTS: readonly BannerPlacement[] = [];

export function bannerAtOptions(banner: BannerPlacement): AtOptions {
  return {
    key: banner.key,
    format: 'iframe',
    height: banner.height,
    width: banner.width,
    params: {},
  };
}

/** Standard Adsterra banner invoke URL. Only called for a real placement key. */
export function bannerInvokeSrc(key: string): string {
  return `https://www.highperformanceformat.com/${key}/invoke.js`;
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

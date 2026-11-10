import { useEffect, useState } from 'react';
import {
  AD_LABEL_GAP,
  AD_LABEL_HEIGHT,
  BANNER_300X250,
  BANNER_728X90,
  MOBILE_BANNER_QUERY,
  bannerAtOptions,
  bannerInvokeSrc,
  isAdRouteBlocked,
  mountBannersInOrder,
  reservedSlotHeight,
  type BannerPlacement,
} from '../lib/adsterra';

const NEAR_VIEWPORT = '200px 0px';

function useNarrowViewport(): boolean {
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_BANNER_QUERY).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(MOBILE_BANNER_QUERY);
    const sync = () => setNarrow(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  return narrow;
}

function whenNearViewport(element: Element): Promise<void> {
  const rect = element.getBoundingClientRect();
  if (rect.top < window.innerHeight + 200 && rect.bottom > -200) return Promise.resolve();
  return new Promise((resolve) => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        resolve();
      },
      { root: null, rootMargin: NEAR_VIEWPORT, threshold: 0 },
    );
    observer.observe(element);
  });
}

function guideBanners(narrow: boolean): readonly BannerPlacement[] {
  return narrow ? [BANNER_300X250, BANNER_300X250] : [BANNER_300X250, BANNER_728X90];
}

function mountBanner(banner: BannerPlacement, index: number): Promise<void> {
  const frame = document.querySelector(`[data-guide-ad="${index + 1}"] [data-ad-frame]`);
  if (!(frame instanceof HTMLElement) || frame.querySelector('script')) return Promise.resolve();
  window.atOptions = bannerAtOptions(banner);
  const script = document.createElement('script');
  script.src = bannerInvokeSrc(banner.key);
  script.async = false;
  script.setAttribute('data-cfasync', 'false');
  return new Promise((resolve) => {
    script.onload = () => resolve();
    script.onerror = () => resolve();
    frame.appendChild(script);
  });
}

/** Two mainstream banners, the same pair the planner uses for the current viewport. */
export function useGuideBanners(pathname: string): boolean {
  const narrow = useNarrowViewport();

  useEffect(() => {
    if (isAdRouteBlocked(pathname)) return;
    let cancelled = false;
    const banners = guideBanners(narrow);

    const mount = () => {
      if (cancelled) return;
      let index = 0;
      void mountBannersInOrder(banners, async (banner) => {
        const slotIndex = index;
        index += 1;
        if (cancelled) return;
        const slot = document.querySelector(`[data-guide-ad="${slotIndex + 1}"]`);
        if (!(slot instanceof HTMLElement)) return;
        await whenNearViewport(slot);
        if (cancelled) return;
        await mountBanner(banner, slotIndex);
      });
    };

    if (document.readyState === 'complete') mount();
    else window.addEventListener('load', mount, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener('load', mount);
    };
  }, [pathname, narrow]);

  return narrow;
}

export function GuideBanner({ index, narrow, pathname }: { index: 0 | 1; narrow: boolean; pathname: string }) {
  if (isAdRouteBlocked(pathname)) return null;
  const banner = guideBanners(narrow)[index];

  return (
    <section
      data-ad-slot={banner.slot}
      data-ad-unit={banner.unitId}
      data-guide-ad={String(index + 1)}
      style={{
        position: 'relative',
        zIndex: 0,
        height: reservedSlotHeight(banner.height),
        overflow: 'hidden',
        marginTop: 24,
        marginBottom: 24,
      }}
    >
      <p
        className="text-stone-500 dark:text-stone-400"
        style={{
          height: AD_LABEL_HEIGHT,
          lineHeight: `${AD_LABEL_HEIGHT}px`,
          margin: `0 0 ${AD_LABEL_GAP}px`,
          textAlign: 'center',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.04em',
        }}
      >
        Advertisement
      </p>
      <div
        data-ad-frame
        style={{
          width: banner.width,
          maxWidth: '100%',
          height: banner.height,
          margin: '0 auto',
          overflow: 'hidden',
        }}
      />
    </section>
  );
}

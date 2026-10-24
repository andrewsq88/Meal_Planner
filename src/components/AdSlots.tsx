import { useEffect, useState } from 'react';
import {
  AD_LABEL_GAP,
  AD_LABEL_HEIGHT,
  BANNER_PLACEMENTS,
  NATIVE_SLOT,
  bannerAtOptions,
  bannerInvokeSrc,
  isAdRouteBlocked,
  locationKey,
  mountBannersInOrder,
  reservedSlotHeight,
  type BannerPlacement,
} from '../lib/adsterra';

const NEAR_VIEWPORT = '200px 0px';

function AdvertisementLabel() {
  return (
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
  );
}

function useAdsAllowed(): boolean {
  const [allowed, setAllowed] = useState(() => !isAdRouteBlocked());

  useEffect(() => {
    const sync = () => setAllowed(!isAdRouteBlocked(locationKey()));
    window.addEventListener('mealplan-ad-route', sync);
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);

    if (!window.__mealplanHistoryWrapped) {
      const push = history.pushState.bind(history);
      const replace = history.replaceState.bind(history);
      history.pushState = (...args: Parameters<History['pushState']>) => {
        push(...args);
        window.dispatchEvent(new Event('mealplan-ad-route'));
      };
      history.replaceState = (...args: Parameters<History['replaceState']>) => {
        replace(...args);
        window.dispatchEvent(new Event('mealplan-ad-route'));
      };
      window.__mealplanHistoryWrapped = true;
    }

    sync();
    return () => {
      window.removeEventListener('mealplan-ad-route', sync);
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, []);

  return allowed;
}

function afterPageLoad(run: () => void): () => void {
  if (document.readyState === 'complete') {
    run();
    return () => {};
  }
  window.addEventListener('load', run, { once: true });
  return () => window.removeEventListener('load', run);
}

function boxIsHidden(el: Element): boolean {
  return getComputedStyle(el).display === 'none';
}

function whenNearViewport(el: Element): { done: Promise<void>; cancel: () => void } {
  let observer: IntersectionObserver | null = null;
  const done = new Promise<void>((resolve) => {
    observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer?.disconnect();
        resolve();
      },
      { root: null, rootMargin: NEAR_VIEWPORT, threshold: 0 },
    );
    observer.observe(el);
  });
  return { done, cancel: () => observer?.disconnect() };
}

function injectNativeScript() {
  const container = document.getElementById(NATIVE_SLOT.containerId);
  if (!container || document.querySelector(`script[src="${NATIVE_SLOT.scriptSrc}"]`)) return;
  const script = document.createElement('script');
  script.src = NATIVE_SLOT.scriptSrc;
  script.async = true;
  script.setAttribute('data-cfasync', 'false');
  container.insertAdjacentElement('beforebegin', script);
}

function mountBanner(banner: BannerPlacement): Promise<void> {
  const frame = document.querySelector(`[data-ad-slot="${banner.slot}"] [data-ad-frame]`);
  if (!(frame instanceof HTMLElement) || frame.querySelector('script') || boxIsHidden(frame)) {
    return Promise.resolve();
  }
  // Set the shared global, then load invoke.js, before any later banner can overwrite it.
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

/**
 * Native sits under the planner. 300x250, then 320x50 (mobile) or 728x90 (desktop),
 * mount one after another when a real invoke key exists. Missing sizes are not rendered.
 */
export function AdSlots() {
  const allowed = useAdsAllowed();

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;

    const cancels: Array<() => void> = [];
    const stopLoad = afterPageLoad(() => {
      if (cancelled) return;
      const native = document.querySelector(`[data-ad-slot="${NATIVE_SLOT.slot}"]`);
      if (native) {
        const watch = whenNearViewport(native);
        cancels.push(watch.cancel);
        void watch.done.then(() => {
          if (!cancelled) injectNativeScript();
        });
      }

      void mountBannersInOrder(BANNER_PLACEMENTS, async (banner) => {
        if (cancelled) return;
        const slot = document.querySelector(`[data-ad-slot="${banner.slot}"]`);
        if (!(slot instanceof HTMLElement) || boxIsHidden(slot)) return;
        const watch = whenNearViewport(slot);
        cancels.push(watch.cancel);
        await watch.done;
        if (cancelled) return;
        await mountBanner(banner);
      });
    });

    return () => {
      cancelled = true;
      stopLoad();
      for (const cancel of cancels) cancel();
    };
  }, [allowed]);

  if (!allowed) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6" style={{ marginTop: 32 }}>
      <section
        data-ad-slot={NATIVE_SLOT.slot}
        style={{
          position: 'relative',
          zIndex: 0,
          height: reservedSlotHeight(NATIVE_SLOT.frameHeight),
          overflow: 'hidden',
        }}
      >
        <AdvertisementLabel />
        <div
          data-ad-frame
          style={{
            width: '100%',
            maxWidth: 728,
            height: NATIVE_SLOT.frameHeight,
            margin: '0 auto',
            overflow: 'hidden',
          }}
        >
          <div id={NATIVE_SLOT.containerId} />
        </div>
      </section>

      {BANNER_PLACEMENTS.map((banner) => (
        <section
          key={banner.slot}
          data-ad-slot={banner.slot}
          className={banner.frameClassName}
          style={{
            position: 'relative',
            zIndex: 0,
            height: reservedSlotHeight(banner.height),
            overflow: 'hidden',
            marginTop: 16,
          }}
        >
          <AdvertisementLabel />
          <div
            data-ad-frame
            style={{
              width: banner.width,
              height: banner.height,
              margin: '0 auto',
              overflow: 'hidden',
            }}
          />
        </section>
      ))}
    </div>
  );
}

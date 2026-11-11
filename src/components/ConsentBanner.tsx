import { useEffect, useState } from 'react';
import { getAdConsent, setAdConsent, subscribeAdConsent, type AdConsent } from '../lib/consent';
import { isAuthOrPaymentPath } from '../lib/routes';

export function ConsentBanner() {
  const [consent, setConsent] = useState<AdConsent>('pending');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setConsent(getAdConsent());
    sync();
    setReady(true);
    return subscribeAdConsent(sync);
  }, []);

  if (!ready || consent !== 'pending') return null;
  if (typeof window !== 'undefined' && isAuthOrPaymentPath(window.location.pathname)) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="ad-consent-title"
      aria-describedby="ad-consent-body"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-amber-200 bg-white/95 p-4 shadow-lg shadow-stone-900/10 backdrop-blur-sm dark:border-stone-700 dark:bg-stone-900/95"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="sm:pr-4">
          <h2 id="ad-consent-title" className="text-sm font-semibold text-stone-800 dark:text-stone-100">
            Advertising cookies
          </h2>
          <p id="ad-consent-body" className="mt-1 text-xs leading-relaxed text-stone-600 dark:text-stone-300">
            We use third-party display ads that may set cookies. Ads load only if you accept.
            Cookieless analytics does not use advertising cookies and is described in the{' '}
            <a href="/privacy" className="underline decoration-stone-300 underline-offset-2">
              privacy policy
            </a>
            . You can change this later on the{' '}
            <a href="/cookies" className="underline decoration-stone-300 underline-offset-2">
              cookie policy
            </a>
            .
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 px-4 text-sm font-semibold text-stone-700 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800"
            onClick={() => setAdConsent('rejected')}
          >
            Reject ads
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 text-sm font-semibold text-white shadow-sm hover:from-amber-600 hover:to-orange-600"
            onClick={() => setAdConsent('accepted')}
          >
            Accept ads
          </button>
        </div>
      </div>
    </div>
  );
}

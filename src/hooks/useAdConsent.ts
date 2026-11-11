import { useEffect, useState } from 'react';
import { getAdConsent, subscribeAdConsent, type AdConsent } from '../lib/consent';

/** Client-only advertising-cookie choice. SSR and the first paint stay pending. */
export function useAdConsent(): AdConsent {
  const [consent, setConsent] = useState<AdConsent>('pending');

  useEffect(() => {
    const sync = () => setConsent(getAdConsent());
    sync();
    return subscribeAdConsent(sync);
  }, []);

  return consent;
}

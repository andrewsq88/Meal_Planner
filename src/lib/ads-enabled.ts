/** Build-time switch for every Adsterra slot and script. Defaults to on. */

/**
 * When `VITE_ADS_ENABLED` is `false`, `0`, `off`, or `no` (any casing),
 * no ad slots are rendered and no ad scripts are requested.
 * Unset or any other value leaves ads enabled.
 */
export function adsEnabled(): boolean {
  const raw = import.meta.env.VITE_ADS_ENABLED;
  const value = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (!value) return true;
  return value !== 'false' && value !== '0' && value !== 'off' && value !== 'no';
}

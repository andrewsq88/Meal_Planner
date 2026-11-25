import {
  AFFILIATE_DISCLOSURE,
  AFFILIATE_LABEL,
  AFFILIATE_OFFERS,
  affiliateHopLink,
  affiliateUnitsAllowed,
  type AffiliateId,
  type AffiliatePlacement,
} from '../config/affiliates';

interface AffiliateUnitProps {
  offerId: AffiliateId;
  placement: AffiliatePlacement;
  pathname: string;
  className?: string;
}

/**
 * In-content partner card. Reads the offer from the affiliate config.
 * Renders nothing on auth, account, payment, checkout, or upgrade routes.
 */
export function AffiliateUnit({ offerId, placement, pathname, className = '' }: AffiliateUnitProps) {
  if (!affiliateUnitsAllowed(pathname)) return null;
  const offer = AFFILIATE_OFFERS[offerId];
  const href = affiliateHopLink(offer.vendorId, placement);
  const landscape = offer.image.width >= offer.image.height;

  return (
    <aside
      className={`${className} rounded-3xl border border-amber-200 bg-white p-5 shadow-sm dark:border-stone-600 dark:bg-stone-800`}
      data-affiliate-unit={offer.vendorId}
      data-affiliate-placement={placement}
      aria-label={AFFILIATE_LABEL}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-200">
        {AFFILIATE_LABEL}
      </p>
      <a
        href={href}
        target="_blank"
        rel="sponsored nofollow noopener"
        className="mt-3 flex flex-col gap-4 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 sm:flex-row sm:items-start"
      >
        <img
          src={offer.image.src}
          width={offer.image.width}
          height={offer.image.height}
          alt={offer.image.alt}
          loading="lazy"
          decoding="async"
          className={`h-auto shrink-0 rounded-2xl border border-amber-100 dark:border-stone-600 ${
            landscape ? 'w-full max-w-sm' : 'w-full max-w-[14rem]'
          }`}
        />
        <span className="min-w-0">
          <span className="block text-base font-extrabold text-stone-800 underline decoration-amber-300 underline-offset-2 dark:text-stone-100">
            {offer.name}
          </span>
          <span className="mt-1 block text-sm leading-relaxed text-stone-700 dark:text-stone-300">
            {offer.blurb}
          </span>
          <span className="sr-only">Opens in a new tab.</span>
        </span>
      </a>
      <p className="mt-3 text-xs leading-relaxed text-stone-600 dark:text-stone-300">{AFFILIATE_DISCLOSURE}</p>
    </aside>
  );
}

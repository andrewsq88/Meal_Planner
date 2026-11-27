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
  label?: string;
  blurb?: string;
  cta?: string;
  showImage?: boolean;
  showDisclosure?: boolean;
  exactLabel?: boolean;
  rel?: string;
}

/**
 * In-content partner card. Reads the offer from the affiliate config.
 * Renders nothing on auth, account, payment, checkout, or upgrade routes.
 */
export function AffiliateUnit({
  offerId,
  placement,
  pathname,
  className = '',
  label = AFFILIATE_LABEL,
  blurb,
  cta,
  showImage = true,
  showDisclosure = true,
  exactLabel = false,
  rel = 'sponsored nofollow noopener',
}: AffiliateUnitProps) {
  if (!affiliateUnitsAllowed(pathname)) return null;
  const offer = AFFILIATE_OFFERS[offerId];
  const href = affiliateHopLink(offer.vendorId, placement);
  const landscape = offer.image.width >= offer.image.height;
  const summary = blurb ?? offer.blurb;

  return (
    <aside
      className={`${className} rounded-3xl border border-amber-200 bg-white p-5 shadow-sm dark:border-stone-600 dark:bg-stone-800`}
      data-affiliate-unit={offer.vendorId}
      data-affiliate-placement={placement}
      aria-label={label}
    >
      <p
        className={
          exactLabel
            ? 'text-xs font-bold leading-relaxed text-amber-800 dark:text-amber-200'
            : 'text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-200'
        }
      >
        {label}
      </p>
      <a
        href={href}
        target="_blank"
        rel={rel}
        className={
          showImage
            ? 'mt-3 flex flex-col gap-4 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 sm:flex-row sm:items-start'
            : 'mt-3 block rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600'
        }
      >
        {showImage ? (
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
        ) : null}
        <span className="min-w-0">
          <span className="block text-base font-extrabold text-stone-800 underline decoration-amber-300 underline-offset-2 dark:text-stone-100">
            {offer.name}
          </span>
          <span className="mt-1 block text-sm leading-relaxed text-stone-700 dark:text-stone-300">
            {summary}
          </span>
          {cta ? (
            <span className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-amber-50 px-4 text-sm font-bold text-amber-900 dark:bg-stone-700 dark:text-amber-100">
              {cta}
            </span>
          ) : null}
          <span className="sr-only">Opens in a new tab.</span>
        </span>
      </a>
      {showDisclosure ? (
        <p className="mt-3 text-xs leading-relaxed text-stone-600 dark:text-stone-300">{AFFILIATE_DISCLOSURE}</p>
      ) : null}
    </aside>
  );
}

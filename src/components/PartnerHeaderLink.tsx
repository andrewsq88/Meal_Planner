/**
 * Desktop header link to the partnership page.
 * `hidden` keeps it out of the mobile header (including 390px) so the
 * existing week-switcher row does not move. It appears from the `lg` breakpoint.
 */
export function PartnerHeaderLink() {
  return (
    <a
      href="/advertise"
      className="hidden lg:inline-flex items-center whitespace-nowrap px-1 text-xs font-semibold text-stone-600 underline decoration-stone-300 underline-offset-2 hover:text-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 dark:text-stone-300 dark:decoration-stone-600 dark:hover:text-stone-100"
    >Partner with us</a>
  );
}

import { Moon, Sun, UtensilsCrossed } from 'lucide-react';
import {
  ADVERTISE_DESCRIPTION,
  ADVERTISE_EMAIL,
  ADVERTISE_HEADING,
  ADVERTISE_MAILTO,
} from '../content/site-schema';
import { PartnerHeaderLink } from './PartnerHeaderLink';
import { SiteFooter } from './SiteFooter';

interface AdvertisePageProps {
  pathname: string;
  dark: boolean;
  onToggleDark: () => void;
}

const PARTNERSHIP_KINDS = [
  'Food and cooking brands',
  'Caterers',
  'Restaurants',
  'Affiliate partners',
  'Sponsorship partners',
] as const;

/**
 * Public partnership page. No ad slots: this is a contact page, same idea as
 * the legal pages. The consent banner still mounts from the app shell.
 */
export function AdvertisePage({ pathname, dark, onToggleDark }: AdvertisePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/30 to-rose-50/20 dark:from-stone-900 dark:via-stone-900 dark:to-stone-900 transition-colors duration-300 flex flex-col">
      <header className="bg-white/80 dark:bg-stone-900/90 backdrop-blur-sm border-b border-amber-100 dark:border-stone-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <a href="/" className="flex items-center gap-2 min-w-0">
            <span className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
              <UtensilsCrossed className="w-5 h-5 text-white" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-base sm:text-xl font-extrabold text-stone-800 dark:text-stone-100 leading-tight truncate">Weekly Menu</span>
              <span className="hidden sm:block text-xs text-stone-600 dark:text-stone-400 font-medium">Weekly meal planner</span>
            </span>
          </a>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <PartnerHeaderLink />
            <button
              type="button"
              onClick={onToggleDark}
              className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-stone-600 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-stone-700 border border-amber-200 dark:border-stone-600 bg-amber-50 dark:bg-stone-800 transition-all duration-200"
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-800 dark:text-stone-100 sm:text-4xl">
            {ADVERTISE_HEADING}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-stone-700 dark:text-stone-300">
            {ADVERTISE_DESCRIPTION}
          </p>
          <h2 className="mt-8 text-xl font-bold text-stone-800 dark:text-stone-100">
            Partnerships we welcome
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-relaxed text-stone-700 dark:text-stone-300">
            {PARTNERSHIP_KINDS.map((kind) => (
              <li key={kind}>{kind}</li>
            ))}
          </ul>
          <p className="mt-6 text-base leading-relaxed text-stone-700 dark:text-stone-300">
            Send a short note about who you are and the partnership you have in mind.
          </p>
          <a
            href={ADVERTISE_MAILTO}
            className="mt-8 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-amber-800 to-orange-700 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-amber-200 transition-all duration-200 hover:from-amber-900 hover:to-orange-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 sm:w-auto"
          >
            Contact us
          </a>
          <p className="mt-4 text-base text-stone-700 dark:text-stone-200">
            <a
              href={ADVERTISE_MAILTO}
              className="font-semibold underline decoration-stone-300 underline-offset-2 hover:text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 dark:hover:text-stone-50"
            >
              {ADVERTISE_EMAIL}
            </a>
          </p>
        </article>
      </main>

      <SiteFooter
        pathname={pathname}
        className="border-t border-amber-100 dark:border-stone-700 py-5"
      />
    </div>
  );
}

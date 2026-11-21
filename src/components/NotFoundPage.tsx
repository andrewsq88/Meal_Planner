import { Sun, Moon, UtensilsCrossed } from 'lucide-react';
import { PartnerHeaderLink } from './PartnerHeaderLink';
import { SiteFooter } from './SiteFooter';

interface NotFoundPageProps {
  dark: boolean;
  onToggleDark: () => void;
  pathname: string;
}

export function NotFoundPage({ dark, onToggleDark, pathname }: NotFoundPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/30 to-rose-50/20 dark:from-stone-900 dark:via-stone-900 dark:to-stone-900 transition-colors duration-300 flex flex-col">
      <header className="bg-white/80 dark:bg-stone-900/90 backdrop-blur-sm border-b border-amber-100 dark:border-stone-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <a href="/" className="flex items-center gap-2 min-w-0">
            <span className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
              <UtensilsCrossed className="w-5 h-5 text-white" aria-hidden="true" />
            </span>
            <span className="text-base sm:text-xl font-extrabold text-stone-800 dark:text-stone-100 leading-tight truncate">Weekly Menu</span>
          </a>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <PartnerHeaderLink />
            <button
              type="button"
              onClick={onToggleDark}
              className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-stone-600 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-stone-700 border border-amber-200 dark:border-stone-600 bg-amber-50 dark:bg-stone-800 transition-all duration-200"
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center">
        <div className="max-w-xl mx-auto w-full px-4 sm:px-6 py-16">
          <p className="text-sm font-bold uppercase tracking-wide text-amber-900 dark:text-amber-200">404</p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-extrabold text-stone-800 dark:text-stone-100 leading-tight">Page not found</h1>
          <p className="mt-4 text-base text-stone-700 dark:text-stone-200 leading-relaxed">
            That page is not on Weekly Meal Planner.
          </p>
          <a
            href="/"
            className="mt-8 inline-flex w-full sm:w-auto items-center justify-center px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-800 to-orange-700 hover:from-amber-900 hover:to-orange-800 text-white text-base font-bold shadow-lg shadow-amber-200 transition-all duration-200"
          >
            Back to the weekly planner
          </a>
        </div>
      </main>

      <SiteFooter
        pathname={pathname}
        className="border-t border-amber-100 dark:border-stone-700 py-5"
      />
    </div>
  );
}

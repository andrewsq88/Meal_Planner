import { useEffect } from 'react';
import { CalendarDays, Heart, ShoppingBasket, Sun, Moon, UtensilsCrossed } from 'lucide-react';

interface StartPageProps {
  dark: boolean;
  onToggleDark: () => void;
}

/**
 * Adds the /start-only robots meta if the head script has not already,
 * and removes it when this page unmounts.
 */
function useStartNoIndex() {
  useEffect(() => {
    const selector = 'meta[name="robots"][data-route-robots="start"]';
    let meta = document.head.querySelector(selector);
    if (!(meta instanceof HTMLMetaElement)) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'robots');
      meta.setAttribute('data-route-robots', 'start');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'noindex');
    return () => {
      meta.remove();
    };
  }, []);
}

const BENEFITS = [
  {
    icon: CalendarDays,
    text: 'Lay out breakfast, lunch, and dinner across all seven days.',
  },
  {
    icon: Heart,
    text: 'Save meals you love and drop them onto the week in one click.',
  },
  {
    icon: ShoppingBasket,
    text: 'See the ingredients for your plan in a single shopping list.',
  },
] as const;

export function StartPage({ dark, onToggleDark }: StartPageProps) {
  useStartNoIndex();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/30 to-rose-50/20 dark:from-stone-900 dark:via-stone-900 dark:to-stone-900 transition-colors duration-300 flex flex-col">
      <header className="bg-white/80 dark:bg-stone-900/90 backdrop-blur-sm border-b border-amber-100 dark:border-stone-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-stone-800 dark:text-stone-100 leading-tight">Weekly Menu</p>
              <p className="text-xs text-stone-400 dark:text-stone-500 font-medium">Weekly meal planner</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleDark}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-500 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-stone-700 border border-amber-100 dark:border-stone-700 bg-amber-50 dark:bg-stone-800 transition-all duration-200"
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center">
        <div className="max-w-xl mx-auto w-full px-4 sm:px-6 py-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-stone-800 dark:text-stone-100 leading-tight tracking-tight text-balance">
            Plan your family's meals for the week
          </h1>
          <ul className="mt-8 space-y-4">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-base text-stone-600 dark:text-stone-300 leading-snug">
                <Icon className="w-5 h-5 mt-0.5 text-amber-500 shrink-0" aria-hidden="true" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
          <a
            href="/signup"
            className="mt-10 inline-flex w-full sm:w-auto items-center justify-center px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-base font-bold shadow-lg shadow-amber-200 transition-all duration-200"
          >
            Create your free account
          </a>
        </div>
      </main>

      <footer className="border-t border-amber-100 dark:border-stone-700 py-5">
        <p className="text-center text-xs text-stone-400 dark:text-stone-500">
          &copy; {new Date().getFullYear()} SQ Consultancy. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

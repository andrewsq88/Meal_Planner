import { ChevronLeft, ChevronRight, UtensilsCrossed, LogOut, LogIn, Save, Sun, Moon } from 'lucide-react';
import { formatWeekRange } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { clearGuestItems } from '../hooks/useMenuItems';
import { accountLabel } from '../lib/google-auth';

interface HeaderProps {
  weekStart: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onSignInClick: () => void;
  guestMealCount: number;
  dark: boolean;
  onToggleDark: () => void;
}

function WeekSwitcher({
  weekStart,
  onPrevWeek,
  onNextWeek,
  compact,
}: {
  weekStart: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1 bg-amber-50 dark:bg-stone-800 rounded-2xl border border-amber-100 dark:border-stone-700 transition-colors duration-300 ${
        compact ? 'w-full px-1.5 py-1' : 'px-2 py-1.5'
      }`}
    >
      <button
        onClick={onPrevWeek}
        className="w-8 h-8 shrink-0 rounded-xl flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-amber-200 dark:hover:bg-stone-700 hover:text-amber-900 dark:hover:text-amber-300 transition-all"
        aria-label="Previous week"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span
        className={`text-xs sm:text-sm font-semibold text-stone-700 dark:text-stone-200 text-center ${
          compact ? 'min-w-0 flex-1 truncate' : 'min-w-[9.5rem] px-1'
        }`}
      >
        {formatWeekRange(weekStart)}
      </span>
      <button
        onClick={onNextWeek}
        className="w-8 h-8 shrink-0 rounded-xl flex items-center justify-center text-stone-600 dark:text-stone-300 hover:bg-amber-200 dark:hover:bg-stone-700 hover:text-amber-900 dark:hover:text-amber-300 transition-all"
        aria-label="Next week"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export function Header({ weekStart, onPrevWeek, onNextWeek, onSignInClick, guestMealCount, dark, onToggleDark }: HeaderProps) {
  const { user } = useAuth();
  const label = user ? accountLabel(user) : '';
  const initial = label[0]?.toUpperCase() ?? '?';

  async function handleSignOut() {
    clearGuestItems();
    await supabase.auth.signOut();
  }

  const hasUnsaved = !user && guestMealCount > 0;

  return (
    <header className="bg-white/80 dark:bg-stone-900/90 backdrop-blur-sm border-b border-amber-100 dark:border-stone-700 sticky top-0 z-30 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-extrabold text-stone-800 dark:text-stone-100 leading-tight truncate">Weekly Menu</h1>
              <p className="hidden sm:block text-xs text-stone-600 dark:text-stone-400 font-medium">Weekly meal planner</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <div className="hidden sm:block">
              <WeekSwitcher weekStart={weekStart} onPrevWeek={onPrevWeek} onNextWeek={onNextWeek} />
            </div>

            <button
              onClick={onToggleDark}
              className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-stone-600 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-stone-700 border border-amber-200 dark:border-stone-600 bg-amber-50 dark:bg-stone-800 transition-all duration-200"
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={dark ? 'Light mode' : 'Dark mode'}
            >
              {dark
                ? <Sun className="w-4 h-4" />
                : <Moon className="w-4 h-4" />
              }
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-sm"
                  title={label}
                >
                  {initial}
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-600 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : hasUnsaved ? (
              <button
                onClick={onSignInClick}
                aria-label={`Save your plan, ${guestMealCount} unsaved`}
                className="flex items-center gap-2 px-2.5 sm:px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-800 to-orange-700 hover:from-amber-900 hover:to-orange-800 text-white text-sm font-bold shadow-md shadow-amber-200 transition-all duration-200"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save your plan</span>
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/30 text-white text-xs font-bold">
                  {guestMealCount}
                </span>
              </button>
            ) : (
              <button
                onClick={onSignInClick}
                aria-label="Sign In"
                className="flex items-center gap-2 px-2.5 sm:px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-800 to-orange-700 hover:from-amber-900 hover:to-orange-800 text-white text-sm font-bold shadow-md shadow-amber-200 transition-all duration-200"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-2 sm:hidden">
          <WeekSwitcher weekStart={weekStart} onPrevWeek={onPrevWeek} onNextWeek={onNextWeek} compact />
        </div>
      </div>
    </header>
  );
}

import { ChevronLeft, ChevronRight, UtensilsCrossed, LogOut, LogIn, Save } from 'lucide-react';
import { formatWeekRange } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { clearGuestItems } from '../hooks/useMenuItems';

interface HeaderProps {
  weekStart: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onSignInClick: () => void;
  guestMealCount: number;
}

export function Header({ weekStart, onPrevWeek, onNextWeek, onSignInClick, guestMealCount }: HeaderProps) {
  const { user } = useAuth();
  const initial = user?.email?.[0]?.toUpperCase() ?? '?';

  async function handleSignOut() {
    clearGuestItems();
    await supabase.auth.signOut();
  }

  const hasUnsaved = !user && guestMealCount > 0;

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-amber-100 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-stone-800 leading-tight">Family Menu</h1>
              <p className="text-xs text-stone-400 font-medium">Weekly meal planner</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-amber-50 rounded-2xl px-3 py-2 border border-amber-100">
              <button
                onClick={onPrevWeek}
                className="w-7 h-7 rounded-xl flex items-center justify-center text-stone-500 hover:bg-amber-200 hover:text-amber-800 transition-all"
                aria-label="Previous week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-stone-700 min-w-[160px] text-center">
                {formatWeekRange(weekStart)}
              </span>
              <button
                onClick={onNextWeek}
                className="w-7 h-7 rounded-xl flex items-center justify-center text-stone-500 hover:bg-amber-200 hover:text-amber-800 transition-all"
                aria-label="Next week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Auth controls */}
            {user ? (
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-sm"
                  title={user.email ?? ''}
                >
                  {initial}
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : hasUnsaved ? (
              <button
                onClick={onSignInClick}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-bold shadow-md shadow-amber-200 transition-all duration-200"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save your plan</span>
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/30 text-white text-xs font-bold sm:flex">
                  {guestMealCount}
                </span>
              </button>
            ) : (
              <button
                onClick={onSignInClick}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-bold shadow-md shadow-amber-200 transition-all duration-200"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

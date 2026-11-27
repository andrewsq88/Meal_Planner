import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { MealTypeNav } from './components/MealTypeNav';
import { WeekGrid } from './components/WeekGrid';
import { MealModal } from './components/MealModal';
import { IngredientsPanel } from './components/IngredientsPanel';
import { FavoritesSection } from './components/FavoritesSection';
import { SuggestionsSection } from './components/SuggestionsSection';
import { AddToMenuModal } from './components/AddToMenuModal';
import { AuthModal } from './components/AuthModal';
import { AuthProvider } from './context/AuthContext';
import { useMenuItems } from './hooks/useMenuItems';
import { useFavorites } from './hooks/useFavorites';
import { useDarkMode } from './hooks/useDarkMode';
import { useAuth } from './context/AuthContext';
import { getWeekStart, addDays } from './types';
import type { MenuItem, MealType, MealSuggestion, Favorite, RssRecipe } from './types';
import { UtensilsCrossed } from 'lucide-react';
import { AdSlots } from './components/AdSlots';
import { AffiliateUnit } from './components/AffiliateUnit';
import { StartPage } from './components/StartPage';
import { SiteFooter } from './components/SiteFooter';
import { GuidePage } from './components/GuidePage';
import { findGuidePage } from './content/guides';
import { findLegalPage } from './content/legal';
import { ConsentBanner } from './components/ConsentBanner';
import { CookielessAnalytics } from './components/CookielessAnalytics';
import { LegalPage } from './components/LegalPage';
import { NotFoundPage } from './components/NotFoundPage';
import { isAdRouteBlocked, locationKey } from './lib/adsterra';
import { CANONICAL_ORIGIN, isAuthCallbackPath, isKnownPath, isSignInPath, isSignupPath, isStartPath } from './lib/routes';
import {
  OAUTH_MODE_KEY,
  OAUTH_SEARCH_KEY,
  postLoginLocation,
  readOAuthReturn,
} from './lib/google-auth';

const SHELL_ROBOTS_SELECTOR = 'meta[name="robots"][data-route-robots="shell"]';

function readPathname(initialPath?: string): string {
  if (initialPath) return initialPath;
  if (typeof window === 'undefined') return '/';
  return window.location.pathname;
}

const NOT_FOUND_ROBOTS_SELECTOR = 'meta[name="robots"][data-route-robots="not-found"]';

/**
 * Auth and payment documents ship with a noindex shell meta.
 * Unknown routes keep noindex and must not adopt the homepage canonical.
 * Drop the shell tag when the visitor reaches a public page without a full reload.
 */
function useShellNoIndex(pathname: string) {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const sync = () => {
      const path = window.location.pathname;
      if (!isKnownPath(path)) {
        let meta = document.head.querySelector('meta[name="robots"]');
        if (!(meta instanceof HTMLMetaElement)) {
          meta = document.createElement('meta');
          meta.setAttribute('name', 'robots');
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', 'noindex');
        if (!meta.getAttribute('data-route-robots')) {
          meta.setAttribute('data-route-robots', 'not-found');
        }
        document.head.querySelectorAll('link[rel="canonical"]').forEach((node) => {
          const href = node.getAttribute('href') ?? '';
          if (href === `${CANONICAL_ORIGIN}/` || href === CANONICAL_ORIGIN) node.remove();
        });
        return;
      }
      document.head.querySelector(NOT_FOUND_ROBOTS_SELECTOR)?.remove();
      const privateRoute = isAdRouteBlocked(locationKey()) && !isStartPath(path);
      const meta = document.head.querySelector(SHELL_ROBOTS_SELECTOR);
      if (!privateRoute) {
        meta?.remove();
        return;
      }
      const robots = meta instanceof HTMLMetaElement ? meta : document.createElement('meta');
      robots.setAttribute('name', 'robots');
      robots.setAttribute('data-route-robots', 'shell');
      robots.setAttribute('content', 'noindex');
      if (!meta) document.head.appendChild(robots);
    };
    sync();
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    window.addEventListener('mealplan-ad-route', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
      window.removeEventListener('mealplan-ad-route', sync);
    };
  }, [pathname]);
}

function LoadingScreen({ label }: { label?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-stone-900 dark:via-stone-900 dark:to-stone-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg animate-pulse">
          <UtensilsCrossed className="w-7 h-7 text-white" />
        </div>
        {label ? <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">{label}</p> : null}
      </div>
    </div>
  );
}

function storedOAuthMode(): string | null {
  try {
    return sessionStorage.getItem(OAUTH_MODE_KEY);
  } catch {
    return null;
  }
}

function storedOAuthSearch(): string {
  try {
    return sessionStorage.getItem(OAUTH_SEARCH_KEY) || '';
  } catch {
    return '';
  }
}

function clearStoredOAuth(): void {
  try {
    sessionStorage.removeItem(OAUTH_MODE_KEY);
    sessionStorage.removeItem(OAUTH_SEARCH_KEY);
  } catch {
    // Ignore storage failures. The address bar is still replaced.
  }
}

function AppContent({ initialPath }: { initialPath?: string }) {
  const { user, loading, sessionChecked, passwordRecovery, clearPasswordRecovery } = useAuth();
  const { dark, toggle: toggleDark } = useDarkMode();
  const [pathname, setPathname] = useState(() => readPathname(initialPath));
  useShellNoIndex(pathname);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authPrompt, setAuthPrompt] = useState<string | undefined>(undefined);
  const [oauthNotice, setOauthNotice] = useState<string | null>(null);
  const legal = findLegalPage(pathname);
  const guide = findGuidePage(pathname);
  const onStart = isStartPath(pathname);
  const onSignup = isSignupPath(pathname);
  const onSignIn = isSignInPath(pathname);
  const unknown = !isKnownPath(pathname);

  useEffect(() => {
    const sync = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', sync);
    window.addEventListener('mealplan-ad-route', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('mealplan-ad-route', sync);
    };
  }, []);

  useEffect(() => {
    if (!isAuthCallbackPath(pathname) || !sessionChecked) return;

    const returned = readOAuthReturn(window.location.search, window.location.hash);
    const started = storedOAuthMode();
    const attempted = started != null || returned.status !== 'none';
    if (!attempted) return;

    if (returned.status === 'error' || !user) {
      const message = returned.status === 'error'
        ? returned.message
        : 'Google sign-in did not finish. Please try again, or continue with email.';
      const dest = started === 'signup' ? '/signup' : '/login';
      clearStoredOAuth();
      setOauthNotice(message);
      window.history.replaceState(null, '', dest);
      setPathname(dest);
      window.dispatchEvent(new Event('mealplan-ad-route'));
      return;
    }

    const search = storedOAuthSearch() || window.location.search;
    const dest = postLoginLocation(search);
    clearStoredOAuth();
    window.history.replaceState(null, '', dest);
    setPathname(dest.split('?')[0].split('#')[0] || '/');
    window.dispatchEvent(new Event('mealplan-ad-route'));
  }, [pathname, sessionChecked, user]);

  function requireAuth(prompt?: string) {
    setAuthPrompt(prompt);
    setAuthModalOpen(true);
  }

  function closeAuth() {
    setAuthModalOpen(false);
    setOauthNotice(null);
    clearPasswordRecovery();
    const path = window.location.pathname;
    if (!isSignupPath(path) && !isSignInPath(path)) return;
    window.history.pushState(null, '', '/');
    setPathname('/');
    window.dispatchEvent(new Event('mealplan-ad-route'));
  }

  if (legal) {
    return <LegalPage page={legal} pathname={pathname} dark={dark} onToggleDark={toggleDark} />;
  }

  if (guide) {
    return <GuidePage page={guide} pathname={pathname} dark={dark} onToggleDark={toggleDark} />;
  }

  if (onStart) {
    return <StartPage dark={dark} onToggleDark={toggleDark} pathname={pathname} />;
  }

  if (unknown) {
    return <NotFoundPage dark={dark} onToggleDark={toggleDark} pathname={pathname} />;
  }

  const onCallback = isAuthCallbackPath(pathname);
  const callbackReturn = onCallback && typeof window !== 'undefined'
    ? readOAuthReturn(window.location.search, window.location.hash)
    : { status: 'none' as const };
  const callbackError = callbackReturn.status === 'error' ? callbackReturn.message : null;

  if (onCallback && !sessionChecked && callbackReturn.status !== 'error') {
    return <LoadingScreen label="Signing you in…" />;
  }

  if (loading && !onSignup && !onSignIn && !passwordRecovery && !onCallback) {
    return <LoadingScreen />;
  }

  return (
    <>
      {loading && !onSignup && !onSignIn && !onCallback ? <LoadingScreen /> : (
        <Planner onAuthRequired={requireAuth} dark={dark} toggleDark={toggleDark} pathname={pathname} />
      )}
      <AuthModal
        open={authModalOpen || onSignup || onSignIn || passwordRecovery || (onCallback && callbackError != null)}
        onClose={closeAuth}
        prompt={authPrompt}
        initialMode={onSignup || (onCallback && storedOAuthMode() === 'signup') ? 'signup' : 'signin'}
        passwordRecovery={passwordRecovery}
        externalError={oauthNotice ?? (onCallback ? callbackError : null)}
        onClearExternalError={() => setOauthNotice(null)}
      />
    </>
  );
}

interface PlannerProps {
  onAuthRequired: (prompt?: string) => void;
  dark: boolean;
  toggleDark: () => void;
  pathname: string;
}

function Planner({ onAuthRequired, dark, toggleDark, pathname }: PlannerProps) {
  const { user } = useAuth();
  const [weekStart, setWeekStart] = useState(() => getWeekStart());
  const [mealType, setMealType] = useState<MealType>('dinner');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const [editModal, setEditModal] = useState<{
    dayIndex: number;
    initialName?: string;
    initialDescription?: string;
    initialIngredients?: string[];
    initialCook?: string;
    initialTimeSlot?: string;
  } | null>(null);

  const [addToMenuTarget, setAddToMenuTarget] = useState<{
    name: string;
    description: string;
    ingredients: string[];
    mealType: MealType;
  } | null>(null);

  const { items, upsertItem, deleteItem } = useMenuItems(weekStart);
  const { favorites, addFavorite, removeFavorite } = useFavorites();

  const goToPrevWeek = () => setWeekStart(prev => addDays(prev, -7));
  const goToNextWeek = () => setWeekStart(prev => addDays(prev, 7));

  const handleOpenEditModal = (dayIndex: number) => {
    const existing = items.find(i => i.day_of_week === dayIndex && i.meal_type === mealType);
    setEditModal({
      dayIndex,
      initialName: existing?.name,
      initialDescription: existing?.description,
      initialIngredients: existing?.ingredients,
      initialCook: existing?.cook,
      initialTimeSlot: existing?.time_slot ?? '',
    });
  };

  const handleSaveMeal = async (name: string, description: string, ingredients: string[], cook: string, timeSlot: string) => {
    if (!editModal) return;
    const result = await upsertItem(editModal.dayIndex, mealType, name, description, ingredients, cook, timeSlot);
    if (result) setSelectedItem(result);
  };

  const handleDeleteItem = async (item: MenuItem) => {
    await deleteItem(item.id);
    if (selectedItem?.id === item.id) setSelectedItem(null);
  };

  const handleAddToFavorite = async () => {
    if (!selectedItem) return;
    const result = await addFavorite(selectedItem.name, selectedItem.meal_type as MealType, selectedItem.description, selectedItem.ingredients);
    if (result === 'auth_required') {
      onAuthRequired('Sign in to save meals to your favorites.');
    }
  };

  const handleFavoriteAddToMenu = (fav: Favorite) => {
    setAddToMenuTarget({ name: fav.name, description: fav.description, ingredients: fav.ingredients, mealType: fav.meal_type });
  };

  const handleFavoriteRemove = async (id: string) => {
    const result = await removeFavorite(id);
    if (result === 'auth_required') {
      onAuthRequired('Sign in to manage your favorites.');
    }
  };

  const handleSuggestionUseInMenu = (sug: MealSuggestion | RssRecipe) => {
    const name = 'name' in sug ? sug.name : sug.title;
    const ingredients = 'ingredients' in sug ? sug.ingredients : [];
    setAddToMenuTarget({ name, description: sug.description, ingredients, mealType: sug.meal_type });
  };

  const handleSuggestionAddToFavorites = async (sug: MealSuggestion | RssRecipe) => {
    const name = 'name' in sug ? sug.name : sug.title;
    const ingredients = 'ingredients' in sug ? sug.ingredients : [];
    const result = await addFavorite(name, sug.meal_type, sug.description, ingredients);
    if (result === 'auth_required') {
      onAuthRequired('Sign in to save meals to your favorites.');
    }
  };

  const handleConfirmAddToMenu = async (dayIndex: number, targetMealType: MealType) => {
    if (!addToMenuTarget) return;
    await upsertItem(dayIndex, targetMealType, addToMenuTarget.name, addToMenuTarget.description, addToMenuTarget.ingredients);
    setAddToMenuTarget(null);
  };

  const isFavorited = !!selectedItem && favorites.some(
    f => f.name.toLowerCase() === selectedItem.name.toLowerCase(),
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/30 to-rose-50/20 dark:from-stone-900 dark:via-stone-900 dark:to-stone-900 transition-colors duration-300">
      <Header
        weekStart={weekStart}
        onPrevWeek={goToPrevWeek}
        onNextWeek={goToNextWeek}
        onSignInClick={() => onAuthRequired(
          !user && items.length > 0
            ? 'Sign in to save your meal plan to your account.'
            : undefined
        )}
        guestMealCount={!user ? items.length : 0}
        dark={dark}
        onToggleDark={toggleDark}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <MealTypeNav selected={mealType} onChange={type => { setMealType(type); setSelectedItem(null); }} />
          <p className="text-sm text-stone-400 font-medium hidden sm:block">
            Click a meal to edit it
          </p>
        </div>

        <div className={`transition-all duration-300 ${selectedItem ? 'lg:grid lg:grid-cols-[1fr_280px] lg:gap-5' : ''}`}>
          <div>
            <WeekGrid
              weekStart={weekStart}
              items={items}
              mealType={mealType}
              selectedItemId={selectedItem?.id ?? null}
              onSelect={item => setSelectedItem(item)}
              onAdd={handleOpenEditModal}
              onDelete={handleDeleteItem}
            />
          </div>
          {selectedItem && (
            <div className="mt-4 lg:mt-0">
              <IngredientsPanel
                item={selectedItem}
                isFavorited={isFavorited}
                onClose={() => setSelectedItem(null)}
                onAddFavorite={handleAddToFavorite}
                onAddToDay={(dayIndex, type) => {
                  upsertItem(dayIndex, type, selectedItem.name, selectedItem.description, selectedItem.ingredients);
                }}
              />
            </div>
          )}
        </div>

        <AffiliateUnit offerId="jmrosa2" placement="planner" pathname={pathname} />

        <FavoritesSection
          favorites={favorites}
          onRemove={handleFavoriteRemove}
          onAddToMenu={handleFavoriteAddToMenu}
          onSignIn={() => onAuthRequired('Sign in to save and manage your favorites.')}
        />

        <SuggestionsSection
          pathname={pathname}
          onUseInMenu={handleSuggestionUseInMenu}
          onAddToFavorites={handleSuggestionAddToFavorites}
        />
      </main>

      <AdSlots />

      <SiteFooter
        pathname={pathname}
        className="border-t border-amber-100 dark:border-stone-700 mt-8 py-5 transition-colors duration-300"
      />

      {editModal && (
        <MealModal
          isOpen={!!editModal}
          onClose={() => setEditModal(null)}
          onSave={handleSaveMeal}
          dayIndex={editModal.dayIndex}
          mealType={mealType}
          initialName={editModal.initialName}
          initialDescription={editModal.initialDescription}
          initialIngredients={editModal.initialIngredients}
          initialCook={editModal.initialCook}
          initialTimeSlot={editModal.initialTimeSlot}
        />
      )}

      {addToMenuTarget && (
        <AddToMenuModal
          isOpen={!!addToMenuTarget}
          onClose={() => setAddToMenuTarget(null)}
          onConfirm={handleConfirmAddToMenu}
          defaultMealType={addToMenuTarget.mealType}
          mealName={addToMenuTarget.name}
        />
      )}
    </div>
  );
}

export default function App({ initialPath }: { initialPath?: string } = {}) {
  return (
    <AuthProvider>
      <CookielessAnalytics />
      <AppContent initialPath={initialPath} />
      <ConsentBanner />
    </AuthProvider>
  );
}

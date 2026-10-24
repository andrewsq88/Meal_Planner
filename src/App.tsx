import { useState } from 'react';
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

function AppContent() {
  const { loading } = useAuth();
  const { dark, toggle: toggleDark } = useDarkMode();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authPrompt, setAuthPrompt] = useState<string | undefined>(undefined);

  function requireAuth(prompt?: string) {
    setAuthPrompt(prompt);
    setAuthModalOpen(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-stone-900 dark:via-stone-900 dark:to-stone-900 flex items-center justify-center">
        <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg animate-pulse">
          <UtensilsCrossed className="w-7 h-7 text-white" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Planner onAuthRequired={requireAuth} dark={dark} toggleDark={toggleDark} />
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        prompt={authPrompt}
      />
    </>
  );
}

interface PlannerProps {
  onAuthRequired: (prompt?: string) => void;
  dark: boolean;
  toggleDark: () => void;
}

function Planner({ onAuthRequired, dark, toggleDark }: PlannerProps) {
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

        <FavoritesSection
          favorites={favorites}
          onRemove={handleFavoriteRemove}
          onAddToMenu={handleFavoriteAddToMenu}
          onSignIn={() => onAuthRequired('Sign in to save and manage your favorites.')}
        />

        <SuggestionsSection
          onUseInMenu={handleSuggestionUseInMenu}
          onAddToFavorites={handleSuggestionAddToFavorites}
        />
      </main>

      <AdSlots />

      <footer className="border-t border-amber-100 dark:border-stone-700 mt-8 py-5 transition-colors duration-300">
        <p className="text-center text-xs text-stone-400 dark:text-stone-500">
          &copy; {new Date().getFullYear()} SQ Consultancy. All rights reserved.
        </p>
      </footer>

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

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

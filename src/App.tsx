import { useState } from 'react';
import { Header } from './components/Header';
import { MealTypeNav } from './components/MealTypeNav';
import { WeekGrid } from './components/WeekGrid';
import { MealModal } from './components/MealModal';
import { IngredientsPanel } from './components/IngredientsPanel';
import { FavoritesSection } from './components/FavoritesSection';
import { SuggestionsSection } from './components/SuggestionsSection';
import { AddToMenuModal } from './components/AddToMenuModal';
import { useMenuItems } from './hooks/useMenuItems';
import { useFavorites } from './hooks/useFavorites';
import { getWeekStart, addDays } from './types';
import type { MenuItem, MealType, MealSuggestion, Favorite, RssRecipe } from './types';

export default function App() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart());
  const [mealType, setMealType] = useState<MealType>('dinner');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const [editModal, setEditModal] = useState<{
    dayIndex: number;
    initialName?: string;
    initialDescription?: string;
    initialIngredients?: string[];
    initialCook?: string;
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
    });
  };

  const handleSaveMeal = async (name: string, description: string, ingredients: string[], cook: string) => {
    if (!editModal) return;
    const saved = await upsertItem(editModal.dayIndex, mealType, name, description, ingredients, cook);
    if (saved) setSelectedItem(saved);
  };

  const handleDeleteItem = async (item: MenuItem) => {
    if (selectedItem?.id === item.id) setSelectedItem(null);
    await deleteItem(item.id);
  };

  const handleAddToFavorite = async () => {
    if (!selectedItem) return;
    await addFavorite(selectedItem.name, selectedItem.meal_type as MealType, selectedItem.description, selectedItem.ingredients);
  };

  const handleFavoriteAddToMenu = (fav: Favorite) => {
    setAddToMenuTarget({ name: fav.name, description: fav.description, ingredients: fav.ingredients, mealType: fav.meal_type });
  };

  const handleSuggestionUseInMenu = (sug: MealSuggestion | RssRecipe) => {
    const name = 'name' in sug ? sug.name : sug.title;
    const ingredients = 'ingredients' in sug ? sug.ingredients : [];
    setAddToMenuTarget({ name, description: sug.description, ingredients, mealType: sug.meal_type });
  };

  const handleSuggestionAddToFavorites = async (sug: MealSuggestion | RssRecipe) => {
    const name = 'name' in sug ? sug.name : sug.title;
    const ingredients = 'ingredients' in sug ? sug.ingredients : [];
    await addFavorite(name, sug.meal_type, sug.description, ingredients);
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50/30 to-rose-50/20">
      <Header weekStart={weekStart} onPrevWeek={goToPrevWeek} onNextWeek={goToNextWeek} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <MealTypeNav selected={mealType} onChange={type => { setMealType(type); setSelectedItem(null); }} />
          <p className="text-sm text-stone-400 font-medium hidden sm:block">
            Click a meal to view its ingredients
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
          onRemove={removeFavorite}
          onAddToMenu={handleFavoriteAddToMenu}
        />

        <SuggestionsSection
          onUseInMenu={handleSuggestionUseInMenu}
          onAddToFavorites={handleSuggestionAddToFavorites}
        />
      </main>

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

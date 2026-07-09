import { X, Heart, ShoppingBag, CheckSquare, Square, ChefHat, Clock, ShoppingCart, Truck } from 'lucide-react';
import { useState } from 'react';
import type { MenuItem, MealType } from '../types';
import { DAYS, MEAL_TYPE_CONFIG } from '../types';

interface IngredientsPanelProps {
  item: MenuItem;
  isFavorited: boolean;
  onClose: () => void;
  onAddFavorite: () => void;
  onAddToDay?: (dayIndex: number, mealType: MealType) => void;
}

export function IngredientsPanel({ item, isFavorited, onClose, onAddFavorite }: IngredientsPanelProps) {
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const cfg = MEAL_TYPE_CONFIG[item.meal_type as MealType];

  const toggleCheck = (idx: number) => {
    setCheckedIngredients(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const allChecked = item.ingredients.length > 0 && checkedIngredients.size === item.ingredients.length;

  // Replace these with your affiliate-tagged URLs before going live
  const instacartUrl = `https://www.instacart.com/store/s?k=${encodeURIComponent(item.name)}`;
  const hellofreshUrl = `https://www.hellofresh.com/recipes/search/?q=${encodeURIComponent(item.name)}`;

  return (
    <div className="bg-white dark:bg-stone-800 rounded-3xl border border-stone-100 dark:border-stone-700 shadow-xl overflow-hidden h-fit sticky top-24">
      {/* Header */}
      <div className={`${cfg.bg} dark:bg-opacity-20 border-b ${cfg.border} dark:border-opacity-30 px-5 py-4`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span className={`text-xs font-bold uppercase tracking-wide ${cfg.color}`}>
              {cfg.emoji} {cfg.label} · {DAYS[item.day_of_week]}
            </span>
            <h3 className="text-base font-extrabold text-stone-800 dark:text-stone-100 mt-1 leading-snug">
              {item.name}
            </h3>
            {item.description && (
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">{item.description}</p>
            )}
            {item.time_slot && (
              <p className="flex items-center gap-1.5 text-xs text-stone-400 dark:text-stone-500 mt-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                {item.time_slot}
              </p>
            )}
            {item.cook && (
              <p className="flex items-center gap-1.5 text-xs text-stone-400 dark:text-stone-500 mt-1 font-medium">
                <ChefHat className="w-3.5 h-3.5 flex-shrink-0" />
                {item.cook}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/70 dark:bg-stone-700/70 flex items-center justify-center text-stone-400 hover:text-stone-600 transition-colors flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Ingredients */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
              Ingredients
            </span>
          </div>
          {item.ingredients.length > 0 && (
            <span className="text-xs text-stone-400 dark:text-stone-500">
              {checkedIngredients.size}/{item.ingredients.length}
            </span>
          )}
        </div>

        {item.ingredients.length === 0 ? (
          <p className="text-sm text-stone-400 italic text-center py-4">No ingredients listed yet.</p>
        ) : (
          <ul className="space-y-2">
            {item.ingredients.map((ing, idx) => {
              const checked = checkedIngredients.has(idx);
              return (
                <li key={idx}>
                  <button
                    onClick={() => toggleCheck(idx)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all ${
                      checked ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'hover:bg-stone-50 dark:hover:bg-stone-700/50'
                    }`}
                  >
                    {checked
                      ? <CheckSquare className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      : <Square className="w-4 h-4 text-stone-300 dark:text-stone-600 flex-shrink-0" />
                    }
                    <span className={`text-sm font-medium transition-all ${checked ? 'text-stone-400 line-through' : 'text-stone-700 dark:text-stone-200'}`}>
                      {ing}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {allChecked && item.ingredients.length > 0 && (
          <div className="mt-3 text-center bg-emerald-50 dark:bg-emerald-900/20 rounded-xl py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            All ingredients checked! Ready to cook!
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 flex flex-col gap-2">
        <button
          onClick={onAddFavorite}
          disabled={isFavorited}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            isFavorited
              ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-400 cursor-default'
              : 'bg-rose-500 text-white hover:bg-rose-600 shadow-md hover:shadow-lg'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-400' : ''}`} />
          {isFavorited ? 'In your favorites' : 'Add to Favorites'}
        </button>

        {/* Affiliate: shop ingredients */}
        <div className="border-t border-stone-100 dark:border-stone-700 pt-2 flex flex-col gap-2">
          <a
            href={instacartUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm hover:shadow-md transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            Shop Ingredients on Instacart
          </a>

          {/* Meal kit deep link */}
          <a
            href={hellofreshUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm border border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-all"
          >
            <Truck className="w-4 h-4" />
            Get Kit Delivered via HelloFresh
          </a>
          <p className="text-center text-xs text-stone-400 dark:text-stone-500">
            Affiliate links — we may earn a commission
          </p>
        </div>
      </div>
    </div>
  );
}

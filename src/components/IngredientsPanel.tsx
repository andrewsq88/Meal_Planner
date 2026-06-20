import { X, Heart, ShoppingBag, CheckSquare, Square } from 'lucide-react';
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

  return (
    <div className="bg-white rounded-3xl border border-stone-100 shadow-xl overflow-hidden h-fit sticky top-24">
      {/* Header */}
      <div className={`${cfg.bg} border-b ${cfg.border} px-5 py-4`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span className={`text-xs font-bold uppercase tracking-wide ${cfg.color}`}>
              {cfg.emoji} {cfg.label} · {DAYS[item.day_of_week]}
            </span>
            <h3 className="text-base font-extrabold text-stone-800 mt-1 leading-snug">
              {item.name}
            </h3>
            {item.description && (
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">{item.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/70 flex items-center justify-center text-stone-400 hover:text-stone-600 transition-colors flex-shrink-0"
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
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">
              Ingredients
            </span>
          </div>
          {item.ingredients.length > 0 && (
            <span className="text-xs text-stone-400">
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
                      checked ? 'bg-emerald-50' : 'hover:bg-stone-50'
                    }`}
                  >
                    {checked
                      ? <CheckSquare className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      : <Square className="w-4 h-4 text-stone-300 flex-shrink-0" />
                    }
                    <span className={`text-sm font-medium transition-all ${checked ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                      {ing}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {allChecked && item.ingredients.length > 0 && (
          <div className="mt-3 text-center bg-emerald-50 rounded-xl py-2 text-xs font-semibold text-emerald-600">
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
              ? 'bg-rose-50 text-rose-400 cursor-default'
              : 'bg-rose-500 text-white hover:bg-rose-600 shadow-md hover:shadow-lg'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-400' : ''}`} />
          {isFavorited ? 'In your favorites' : 'Add to Favorites'}
        </button>
      </div>
    </div>
  );
}

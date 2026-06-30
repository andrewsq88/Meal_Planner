import { Plus, Pencil, Trash2, Clock } from 'lucide-react';
import type { MenuItem, MealType } from '../types';
import { DAYS, DAYS_SHORT, MEAL_TYPE_CONFIG, formatDisplayDate } from '../types';

interface WeekGridProps {
  weekStart: string;
  items: MenuItem[];
  mealType: MealType;
  selectedItemId: string | null;
  onSelect: (item: MenuItem | null) => void;
  onAdd: (dayIndex: number) => void;
  onDelete: (item: MenuItem) => void;
}

export function WeekGrid({ weekStart, items, mealType, selectedItemId, onSelect, onAdd, onDelete }: WeekGridProps) {
  const cfg = MEAL_TYPE_CONFIG[mealType];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {DAYS.map((day, idx) => {
        const item = items.find(i => i.day_of_week === idx && i.meal_type === mealType);
        const isSelected = item?.id === selectedItemId;
        const dateLabel = formatDisplayDate(weekStart, idx);
        const isWeekend = idx >= 5;

        return (
          <div
            key={day}
            className={`relative rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
              isSelected
                ? `${cfg.border} shadow-lg scale-[1.02]`
                : 'border-stone-100 hover:border-stone-200 hover:shadow-md'
            } ${isWeekend ? 'bg-amber-50/40' : 'bg-white'}`}
          >
            {/* Day header */}
            <div className={`px-3 pt-3 pb-2 flex items-center justify-between`}>
              <div>
                <span className={`text-xs font-bold uppercase tracking-wide ${isWeekend ? 'text-amber-600' : 'text-stone-400'}`}>
                  {DAYS_SHORT[idx]}
                </span>
                <p className="text-xs text-stone-400 leading-none mt-0.5">{dateLabel}</p>
              </div>
              {isWeekend && <span className="text-xs">🌟</span>}
            </div>

            {/* Meal slot */}
            <div className="px-3 pb-3 min-h-[80px]">
              {item ? (
                <button
                  onClick={() => onAdd(idx)}
                  className={`w-full text-left group`}
                  title="Edit meal"
                >
                  <p className={`text-sm font-semibold leading-snug transition-colors ${
                    isSelected ? cfg.color : 'text-stone-700 group-hover:' + cfg.color
                  }`}>
                    {item.name}
                  </p>
                  {item.time_slot && (
                    <p className="flex items-center gap-1 text-xs text-stone-400 mt-0.5 font-medium">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      {item.time_slot}
                    </p>
                  )}
                  {item.ingredients.length > 0 && (
                    <p className="text-xs text-stone-400 mt-1">
                      {item.ingredients.length} ingredient{item.ingredients.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => onAdd(idx)}
                  className="w-full h-full min-h-[64px] flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-stone-200 text-stone-300 hover:border-amber-300 hover:text-amber-400 transition-all group"
                >
                  <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium">Add meal</span>
                </button>
              )}
            </div>

            {/* Action buttons */}
            {item && (
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  onClick={e => { e.stopPropagation(); onSelect(isSelected ? null : item); }}
                  className={`w-6 h-6 rounded-lg bg-white shadow border flex items-center justify-center transition-all ${
                    isSelected ? `${cfg.border} ${cfg.color}` : 'border-stone-100 text-stone-400 hover:text-amber-600 hover:border-amber-200'
                  }`}
                  title="View ingredients"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); onDelete(item); }}
                  className="w-6 h-6 rounded-lg bg-white shadow border border-stone-100 flex items-center justify-center text-stone-400 hover:text-rose-500 hover:border-rose-200 transition-all"
                  title="Remove meal"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

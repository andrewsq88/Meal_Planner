import type { MealType } from '../types';
import { MEAL_TYPE_CONFIG } from '../types';

interface MealTypeNavProps {
  selected: MealType;
  onChange: (type: MealType) => void;
}

export function MealTypeNav({ selected, onChange }: MealTypeNavProps) {
  const types: MealType[] = ['breakfast', 'lunch', 'dinner'];
  return (
    <div className="flex w-full min-w-0 gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-2xl sm:w-fit sm:gap-2 transition-colors duration-300">
      {types.map(type => {
        const cfg = MEAL_TYPE_CONFIG[type];
        const active = selected === type;
        return (
          <button
            key={type}
            onClick={() => onChange(type)}
            className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-xs font-semibold transition-all duration-200 sm:flex-none sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm ${
              active
                ? `${cfg.activeBg} ${cfg.activeText} shadow-md`
                : 'text-stone-700 dark:text-stone-200 hover:text-stone-900 dark:hover:text-white hover:bg-white dark:hover:bg-stone-700'
            }`}
          >
            <span className="text-base leading-none" aria-hidden="true">{cfg.emoji}</span>
            <span className="truncate">{cfg.label}</span>
          </button>
        );
      })}
    </div>
  );
}

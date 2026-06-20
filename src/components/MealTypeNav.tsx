import type { MealType } from '../types';
import { MEAL_TYPE_CONFIG } from '../types';

interface MealTypeNavProps {
  selected: MealType;
  onChange: (type: MealType) => void;
}

export function MealTypeNav({ selected, onChange }: MealTypeNavProps) {
  const types: MealType[] = ['breakfast', 'lunch', 'dinner'];
  return (
    <div className="flex gap-2 p-1 bg-stone-100 rounded-2xl w-fit">
      {types.map(type => {
        const cfg = MEAL_TYPE_CONFIG[type];
        const active = selected === type;
        return (
          <button
            key={type}
            onClick={() => onChange(type)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
              active
                ? `${cfg.activeBg} ${cfg.activeText} shadow-md`
                : 'text-stone-500 hover:text-stone-700 hover:bg-white'
            }`}
          >
            <span className="text-base leading-none">{cfg.emoji}</span>
            <span>{cfg.label}</span>
          </button>
        );
      })}
    </div>
  );
}

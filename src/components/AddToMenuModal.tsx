import { useState } from 'react';
import { X } from 'lucide-react';
import type { MealType } from '../types';
import { DAYS, MEAL_TYPE_CONFIG } from '../types';

interface AddToMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dayIndex: number, mealType: MealType) => void;
  defaultMealType: MealType;
  mealName: string;
}

export function AddToMenuModal({ isOpen, onClose, onConfirm, defaultMealType, mealName }: AddToMenuModalProps) {
  const [dayIndex, setDayIndex] = useState(0);
  const [mealType, setMealType] = useState<MealType>(defaultMealType);

  if (!isOpen) return null;

  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Add to Weekly Menu</p>
            <h2 className="text-base font-extrabold text-stone-800 mt-0.5">{mealName}</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/70 flex items-center justify-center text-stone-400 hover:text-stone-600 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Day</label>
            <div className="grid grid-cols-4 gap-1.5">
              {DAYS.map((day, idx) => (
                <button
                  key={idx}
                  onClick={() => setDayIndex(idx)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    dayIndex === idx
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-stone-100 text-stone-500 hover:bg-amber-50 hover:text-amber-700'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Meal</label>
            <div className="flex gap-2">
              {mealTypes.map(type => {
                const cfg = MEAL_TYPE_CONFIG[type];
                return (
                  <button
                    key={type}
                    onClick={() => setMealType(type)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      mealType === type
                        ? `${cfg.activeBg} text-white shadow-md`
                        : `bg-stone-100 text-stone-500 hover:${cfg.bg}`
                    }`}
                  >
                    <span>{cfg.emoji}</span>
                    <span className="hidden sm:inline">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-stone-100 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold text-stone-500 hover:bg-stone-100 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(dayIndex, mealType); onClose(); }}
            className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-md transition-all"
          >
            Add to Menu
          </button>
        </div>
      </div>
    </div>
  );
}

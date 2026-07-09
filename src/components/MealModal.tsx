import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Sparkles, ChefHat, Clock, Truck } from 'lucide-react';
import type { MealType } from '../types';
import { DAYS, MEAL_TYPE_CONFIG } from '../types';
import { supabase } from '../lib/supabase';

// Generate all 15-minute timeslots for a 12-hour clock
const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const period = h < 12 ? 'AM' : 'PM';
      const displayHour = h % 12 === 0 ? 12 : h % 12;
      const displayMin = m.toString().padStart(2, '0');
      slots.push(`${displayHour}:${displayMin} ${period}`);
    }
  }
  return slots;
})();

interface MealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string, ingredients: string[], cook: string, timeSlot: string) => Promise<void>;
  dayIndex: number;
  mealType: MealType;
  initialName?: string;
  initialDescription?: string;
  initialIngredients?: string[];
  initialCook?: string;
  initialTimeSlot?: string;
}

export function MealModal({
  isOpen, onClose, onSave, dayIndex, mealType,
  initialName = '', initialDescription = '', initialIngredients = [], initialCook = '', initialTimeSlot = '',
}: MealModalProps) {
  const [name, setName] = useState(initialName);
  const [cook, setCook] = useState(initialCook);
  const [description, setDescription] = useState(initialDescription);
  const [ingredients, setIngredients] = useState<string[]>(initialIngredients.length ? initialIngredients : ['']);
  const [timeSlot, setTimeSlot] = useState(initialTimeSlot);
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);
  const descEditedRef = useRef(false);
  const ingEditedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setCook(initialCook);
      setDescription(initialDescription);
      setIngredients(initialIngredients.length ? initialIngredients : ['']);
      setTimeSlot(initialTimeSlot);
      setAiSuggested(false);
      setSuggesting(false);
      descEditedRef.current = false;
      ingEditedRef.current = false;
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced AI suggestion when name changes
  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    const trimmed = name.trim();
    if (trimmed.length < 3) {
      setSuggesting(false);
      return;
    }

    setSuggesting(true);
    debounceRef.current = setTimeout(async () => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const { data, error } = await supabase.functions.invoke('suggest-meal-details', {
          body: { name: trimmed, mealType },
        });

        if (ctrl.signal.aborted || error) return;

        const desc: string = data?.description ?? '';
        const ings: string[] = Array.isArray(data?.ingredients) ? data.ingredients : [];

        if (desc && !descEditedRef.current) setDescription(desc);
        if (ings.length > 0 && !ingEditedRef.current) setIngredients(ings);
        if (desc || ings.length > 0) setAiSuggested(true);
      } catch {
        // silently ignore
      } finally {
        if (!ctrl.signal.aborted) setSuggesting(false);
      }
    }, 700);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [name, isOpen, mealType]);

  if (!isOpen) return null;

  const cfg = MEAL_TYPE_CONFIG[mealType];
  const isEditing = !!initialName;

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim(), description.trim(), ingredients.filter(i => i.trim()), cook.trim(), timeSlot);
    setSaving(false);
    onClose();
  };

  const handleDescriptionChange = (val: string) => {
    descEditedRef.current = true;
    setAiSuggested(false);
    setDescription(val);
  };

  const updateIngredient = (idx: number, val: string) => {
    ingEditedRef.current = true;
    setAiSuggested(false);
    setIngredients(prev => prev.map((ing, i) => (i === idx ? val : ing)));
  };

  const addIngredient = () => setIngredients(prev => [...prev, '']);

  const removeIngredient = (idx: number) => {
    ingEditedRef.current = true;
    setIngredients(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-stone-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in">
        {/* Header */}
        <div className={`${cfg.bg} dark:bg-opacity-20 border-b ${cfg.border} dark:border-opacity-30 px-6 py-4 flex items-center justify-between`}>
          <div>
            <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
              {cfg.emoji} {cfg.label} · {DAYS[dayIndex]}
            </p>
            <h2 className="text-lg font-extrabold text-stone-800 dark:text-stone-100 mt-0.5">
              {isEditing ? 'Edit Meal' : 'Add a Meal'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/70 dark:bg-stone-700/70 flex items-center justify-center text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Meal name */}
          <div>
            <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1.5">
              Meal Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value.slice(0, 150))}
              placeholder="e.g. Spaghetti Bolognese"
              maxLength={150}
              autoFocus
              className="w-full rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-700 px-4 py-2.5 text-stone-800 dark:text-stone-100 font-semibold placeholder:text-stone-300 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all"
            />
          </div>

          {/* Time slot + Chef row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Time Slot */}
            <div>
              <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1.5">
                Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300 dark:text-stone-500 pointer-events-none" />
                <select
                  value={timeSlot}
                  onChange={e => setTimeSlot(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-700 pl-9 pr-3 py-2.5 text-stone-700 dark:text-stone-200 appearance-none focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all text-sm cursor-pointer"
                >
                  <option value="">No time</option>
                  {TIME_SLOTS.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Chef / Cook */}
            <div>
              <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1.5">
                Chef / Cook
              </label>
              <div className="relative">
                <ChefHat className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300 dark:text-stone-500 pointer-events-none" />
                <input
                  type="text"
                  value={cook}
                  onChange={e => setCook(e.target.value.slice(0, 80))}
                  placeholder="Who's cooking?"
                  maxLength={80}
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-700 pl-9 pr-4 py-2.5 text-stone-700 dark:text-stone-200 placeholder:text-stone-300 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all text-sm"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                Description
              </label>
              {suggesting && (
                <span className="flex items-center gap-1 text-xs text-amber-500 font-medium animate-pulse">
                  <Sparkles className="w-3 h-3" /> Suggesting…
                </span>
              )}
              {!suggesting && aiSuggested && (
                <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                  <Sparkles className="w-3 h-3" /> AI suggested
                </span>
              )}
            </div>
            <div className="relative">
              <textarea
                value={description}
                onChange={e => handleDescriptionChange(e.target.value.slice(0, 300))}
                placeholder="A short note about the meal..."
                rows={2}
                maxLength={300}
                className={`w-full rounded-xl border px-4 py-2.5 text-stone-700 dark:text-stone-200 bg-white dark:bg-stone-700 placeholder:text-stone-300 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all resize-none text-sm ${
                  suggesting ? 'border-amber-200 bg-amber-50/50 dark:border-amber-700' : 'border-stone-200 dark:border-stone-600'
                }`}
              />
              {suggesting && (
                <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden">
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-shimmer" />
                </div>
              )}
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-1.5">
              Ingredients
            </label>
            <div className={`space-y-2 rounded-xl transition-colors ${suggesting ? 'bg-amber-50/40 dark:bg-amber-900/10 p-2 -m-2' : ''}`}>
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-0.5" />
                  <input
                    type="text"
                    value={ing}
                    onChange={e => updateIngredient(idx, e.target.value.slice(0, 100))}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addIngredient(); } }}
                    placeholder={`Ingredient ${idx + 1}`}
                    maxLength={100}
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm text-stone-700 dark:text-stone-200 bg-white dark:bg-stone-700 placeholder:text-stone-300 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all ${
                      suggesting ? 'border-amber-200 dark:border-amber-700 bg-white/80' : 'border-stone-200 dark:border-stone-600'
                    }`}
                  />
                  {ingredients.length > 1 && (
                    <button
                      onClick={() => removeIngredient(idx)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-300 dark:text-stone-600 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addIngredient}
                className="flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors mt-1"
              >
                <Plus className="w-4 h-4" /> Add ingredient
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-100 dark:border-stone-700 space-y-3">
          {name.trim() && (
            <a
              href={`https://www.hellofresh.com/recipes/search/?q=${encodeURIComponent(name.trim())}`}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold border border-stone-200 dark:border-stone-600 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
            >
              <Truck className="w-3.5 h-3.5" />
              Get ingredients delivered via HelloFresh
            </a>
          )}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || saving}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all ${
                name.trim() && !saving
                  ? `${cfg.activeBg} hover:opacity-90 shadow-md`
                  : 'bg-stone-200 dark:bg-stone-600 cursor-not-allowed'
              }`}
            >
              {saving ? 'Saving…' : isEditing ? 'Update' : 'Add Meal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


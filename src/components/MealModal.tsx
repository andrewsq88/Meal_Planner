import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Sparkles, ChefHat, Loader2 } from 'lucide-react';
import type { MealType } from '../types';
import { DAYS, MEAL_TYPE_CONFIG } from '../types';
import { supabase } from '../lib/supabase';

type Phase = 'idle' | 'debouncing' | 'loading' | 'suggested' | 'error';

interface MealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string, ingredients: string[], cook: string) => Promise<void>;
  dayIndex: number;
  mealType: MealType;
  initialName?: string;
  initialDescription?: string;
  initialIngredients?: string[];
  initialCook?: string;
}

const SKELETON_WIDTHS = ['w-3/4', 'w-2/3', 'w-5/6', 'w-1/2', 'w-4/5', 'w-3/5'];

export function MealModal({
  isOpen, onClose, onSave, dayIndex, mealType,
  initialName = '', initialDescription = '', initialIngredients = [], initialCook = '',
}: MealModalProps) {
  const [name, setName] = useState(initialName);
  const [cook, setCook] = useState(initialCook);
  const [description, setDescription] = useState(initialDescription);
  const [ingredients, setIngredients] = useState<string[]>(initialIngredients.length ? initialIngredients : ['']);
  const [saving, setSaving] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [showAiBadge, setShowAiBadge] = useState(false);

  const descEditedRef = useRef(false);
  const ingEditedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const badgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setCook(initialCook);
      setDescription(initialDescription);
      setIngredients(initialIngredients.length ? initialIngredients : ['']);
      setPhase('idle');
      setShowAiBadge(false);
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
      setPhase('idle');
      return;
    }

    setPhase('debouncing');
    debounceRef.current = setTimeout(async () => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setPhase('loading');

      try {
        const { data, error } = await supabase.functions.invoke('suggest-meal-details', {
          body: { name: trimmed, mealType },
        });

        if (ctrl.signal.aborted) return;

        if (error) {
          setPhase('error');
          return;
        }

        const desc: string = data?.description ?? '';
        const ings: string[] = Array.isArray(data?.ingredients) ? data.ingredients : [];

        if (desc && !descEditedRef.current) setDescription(desc);
        if (ings.length > 0 && !ingEditedRef.current) setIngredients(ings);

        if (desc || ings.length > 0) {
          setPhase('suggested');
          setShowAiBadge(true);
          if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);
          badgeTimerRef.current = setTimeout(() => {
            setShowAiBadge(false);
            setPhase('idle');
          }, 3500);
        } else {
          setPhase('error');
        }
      } catch {
        if (!ctrl.signal.aborted) setPhase('error');
      }
    }, 700);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [name, isOpen, mealType]);

  if (!isOpen) return null;

  const cfg = MEAL_TYPE_CONFIG[mealType];
  const isEditing = !!initialName;
  const isAiActive = phase === 'debouncing' || phase === 'loading';
  const showSkeleton = isAiActive && !ingEditedRef.current;

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim(), description.trim(), ingredients.filter(i => i.trim()), cook.trim());
    setSaving(false);
    onClose();
  };

  const handleDescriptionChange = (val: string) => {
    descEditedRef.current = true;
    setDescription(val);
  };

  const updateIngredient = (idx: number, val: string) => {
    ingEditedRef.current = true;
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
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in">
        {/* Header */}
        <div className={`${cfg.bg} border-b ${cfg.border} px-6 py-4 flex items-center justify-between`}>
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              {cfg.emoji} {cfg.label} · {DAYS[dayIndex]}
            </p>
            <h2 className="text-lg font-extrabold text-stone-800 mt-0.5">
              {isEditing ? 'Edit Meal' : 'Add a Meal'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Meal name */}
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-1.5">
              Meal Name *
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Spaghetti Bolognese"
                autoFocus
                className={`w-full rounded-xl border px-4 py-2.5 pr-28 text-stone-800 font-semibold placeholder:text-stone-300 focus:outline-none transition-all ${
                  isAiActive
                    ? 'border-amber-300 ring-2 ring-amber-100 focus:ring-2 focus:ring-amber-300 focus:border-amber-400'
                    : 'border-stone-200 focus:ring-2 focus:ring-amber-300 focus:border-amber-400'
                }`}
              />

              {/* Spinner shown while AI is active */}
              {isAiActive && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-amber-500 pointer-events-none">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="text-xs font-semibold">
                    {phase === 'debouncing' ? 'Thinking…' : 'Filling…'}
                  </span>
                </div>
              )}

              {/* AI filled badge — fades in after AI responds */}
              {showAiBadge && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-amber-100 text-amber-600 px-2.5 py-1 rounded-full pointer-events-none animate-badge-in">
                  <Sparkles className="w-3 h-3" />
                  <span className="text-xs font-bold">AI filled</span>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className={`mt-1.5 h-0.5 w-full rounded-full overflow-hidden transition-opacity duration-300 ${isAiActive ? 'opacity-100' : 'opacity-0'}`}>
              <div className={`h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 ${
                phase === 'debouncing' ? 'animate-progress-fill' : 'w-[88%] animate-pulse'
              }`} />
            </div>
          </div>

          {/* AI status banner — visible while loading */}
          {isAiActive && (
            <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5 animate-badge-in">
              <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 animate-pulse" />
              <p className="text-xs text-amber-700 font-semibold">
                {phase === 'debouncing'
                  ? 'Recognising meal…'
                  : 'Fetching description & ingredients…'}
              </p>
            </div>
          )}

          {/* Chef / Cook */}
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-1.5">
              Chef / Cook
            </label>
            <div className="relative">
              <ChefHat className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300 pointer-events-none" />
              <input
                type="text"
                value={cook}
                onChange={e => setCook(e.target.value)}
                placeholder="Who's cooking this?"
                className="w-full rounded-xl border border-stone-200 pl-9 pr-4 py-2.5 text-stone-700 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide">
                Description
              </label>
              {phase === 'error' && (
                <span className="text-xs text-stone-400 italic">Couldn't auto-fill</span>
              )}
            </div>
            <div className="relative">
              <textarea
                value={description}
                onChange={e => handleDescriptionChange(e.target.value)}
                placeholder="A short note about the meal..."
                rows={2}
                className={`w-full rounded-xl border px-4 py-2.5 text-stone-700 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all resize-none text-sm ${
                  isAiActive ? 'border-amber-200 bg-amber-50/50' : 'border-stone-200'
                }`}
              />
              {isAiActive && (
                <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden">
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-shimmer" />
                </div>
              )}
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide">
                Ingredients
              </label>
              {phase === 'error' && !ingEditedRef.current && (
                <span className="text-xs text-stone-400 italic">Add manually below</span>
              )}
            </div>

            {showSkeleton ? (
              /* Skeleton rows while AI fetches */
              <div className="space-y-2">
                {SKELETON_WIDTHS.map((w, idx) => (
                  <div key={idx} className="flex gap-2 items-center" style={{ animationDelay: `${idx * 60}ms` }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-200 flex-shrink-0" />
                    <div className={`h-9 ${w} rounded-xl animate-skeleton`} />
                  </div>
                ))}
              </div>
            ) : (
              /* Real ingredient inputs */
              <div className="space-y-2 animate-in">
                {ingredients.map((ing, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-0.5" />
                    <input
                      type="text"
                      value={ing}
                      onChange={e => updateIngredient(idx, e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addIngredient(); } }}
                      placeholder={`Ingredient ${idx + 1}`}
                      className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all"
                    />
                    {ingredients.length > 1 && (
                      <button
                        onClick={() => removeIngredient(idx)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-300 hover:text-rose-400 transition-colors"
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
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-100 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-stone-500 hover:bg-stone-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all ${
              name.trim() && !saving
                ? `${cfg.activeBg} hover:opacity-90 shadow-md`
                : 'bg-stone-200 cursor-not-allowed'
            }`}
          >
            {saving ? 'Saving…' : isEditing ? 'Update' : 'Add Meal'}
          </button>
        </div>
      </div>
    </div>
  );
}

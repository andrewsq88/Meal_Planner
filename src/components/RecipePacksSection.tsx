import { useState } from 'react';
import { X, Lock, Unlock, ChevronRight, Star, Loader2, ExternalLink, UtensilsCrossed } from 'lucide-react';
import type { RecipePack, PackMeal } from '../hooks/useRecipePacks';
import { useRecipePacks } from '../hooks/useRecipePacks';
import { MEAL_TYPE_CONFIG } from '../types';
import type { MealType } from '../types';

const TAG_STYLES: Record<string, { badge: string; button: string; ring: string }> = {
  amber: {
    badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
    button: 'bg-amber-500 hover:bg-amber-600',
    ring: 'ring-amber-300',
  },
  green: {
    badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
    button: 'bg-emerald-500 hover:bg-emerald-600',
    ring: 'ring-emerald-300',
  },
  blue: {
    badge: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800/40',
    button: 'bg-sky-500 hover:bg-sky-600',
    ring: 'ring-sky-300',
  },
  rose: {
    badge: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/40',
    button: 'bg-rose-500 hover:bg-rose-600',
    ring: 'ring-rose-300',
  },
};

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

interface PackPreviewModalProps {
  pack: RecipePack;
  meals: PackMeal[];
  isOwned: boolean;
  unlocking: boolean;
  onClose: () => void;
  onUnlock: () => void;
  onUseInMenu: (meal: PackMeal) => void;
}

function PackPreviewModal({ pack, meals, isOwned, unlocking, onClose, onUnlock, onUseInMenu }: PackPreviewModalProps) {
  const style = TAG_STYLES[pack.tag_color] ?? TAG_STYLES.amber;
  const previewMeals = isOwned ? meals : meals.slice(0, 3);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-stone-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in">
        {/* Cover */}
        {pack.thumbnail_url && (
          <div className="h-40 overflow-hidden relative">
            <img
              src={pack.thumbnail_url}
              alt={pack.name}
              className="w-full h-full object-cover"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${style.badge}`}>
                {pack.meal_count} meals
              </span>
              {isOwned ? (
                <span className="flex items-center gap-1 text-xs font-bold text-white bg-emerald-500/90 px-2.5 py-1 rounded-full">
                  <Unlock className="w-3 h-3" /> Owned
                </span>
              ) : (
                <span className="text-base font-extrabold text-white drop-shadow">
                  {formatPrice(pack.price_cents)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-stone-100 dark:border-stone-700 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-stone-800 dark:text-stone-100 leading-snug">{pack.name}</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">{pack.description}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-700 flex items-center justify-center text-stone-400 hover:text-stone-600 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Meals list */}
        <div className="px-6 py-4 max-h-72 overflow-y-auto space-y-2">
          <p className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wide mb-3">
            {isOwned ? `All ${meals.length} meals` : `Preview — ${previewMeals.length} of ${pack.meal_count} meals`}
          </p>

          {previewMeals.map(meal => {
            const cfg = MEAL_TYPE_CONFIG[meal.meal_type as MealType];
            return (
              <div key={meal.id} className={`flex items-center gap-3 p-3 rounded-xl ${cfg.bg} dark:bg-opacity-10 border ${cfg.border} dark:border-opacity-20`}>
                <span className="text-base">{cfg.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-stone-800 dark:text-stone-100 truncate">{meal.name}</p>
                  {meal.description && (
                    <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1">{meal.description}</p>
                  )}
                </div>
                {isOwned && (
                  <button
                    onClick={() => onUseInMenu(meal)}
                    className={`text-xs font-bold text-white px-2.5 py-1 rounded-lg ${style.button} transition-opacity hover:opacity-90 flex-shrink-0`}
                  >
                    Use
                  </button>
                )}
              </div>
            );
          })}

          {!isOwned && meals.length > 3 && (
            <div className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-stone-200 dark:border-stone-600">
              <Lock className="w-4 h-4 text-stone-400" />
              <span className="text-xs font-semibold text-stone-400 dark:text-stone-500">
                +{meals.length - 3} more meals unlocked with purchase
              </span>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="px-6 py-4 border-t border-stone-100 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50">
          {isOwned ? (
            <p className="text-center text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2">
              <Unlock className="w-4 h-4" /> You own this pack — use any meal above!
            </p>
          ) : (
            <div className="space-y-2">
              <button
                onClick={onUnlock}
                disabled={unlocking}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white shadow-md transition-all ${style.button} disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {unlocking ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                ) : (
                  <><Unlock className="w-4 h-4" /> Unlock Pack — {formatPrice(pack.price_cents)}</>
                )}
              </button>
              <p className="text-center text-xs text-stone-400 dark:text-stone-500">
                Stripe payment integration required to charge.{' '}
                <span className="font-semibold text-stone-500 dark:text-stone-400">Currently unlocks free for demo.</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface RecipePacksSectionProps {
  onUseInMenu: (name: string, description: string, ingredients: string[], mealType: MealType) => void;
  onAuthRequired: () => void;
}

export function RecipePacksSection({ onUseInMenu, onAuthRequired }: RecipePacksSectionProps) {
  const { packs, purchasedPackIds, loading, fetchPackMeals, unlockPack } = useRecipePacks();
  const [previewPack, setPreviewPack] = useState<RecipePack | null>(null);
  const [previewMeals, setPreviewMeals] = useState<PackMeal[]>([]);
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  const handleOpenPack = async (pack: RecipePack) => {
    setPreviewPack(pack);
    setLoadingMeals(true);
    const meals = await fetchPackMeals(pack.id);
    setPreviewMeals(meals);
    setLoadingMeals(false);
  };

  const handleUnlock = async () => {
    if (!previewPack) return;
    setUnlocking(true);
    const result = await unlockPack(previewPack.id);
    setUnlocking(false);
    if (result === 'auth_required') {
      setPreviewPack(null);
      onAuthRequired();
    }
  };

  const handleUseInMenu = (meal: PackMeal) => {
    onUseInMenu(meal.name, meal.description, meal.ingredients, meal.meal_type as MealType);
    setPreviewPack(null);
  };

  if (loading) {
    return (
      <div className="py-10 flex items-center justify-center gap-3 text-stone-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading packs…</span>
      </div>
    );
  }

  if (packs.length === 0) {
    return (
      <div className="py-12 text-center">
        <UtensilsCrossed className="w-10 h-10 text-stone-300 mx-auto mb-3" />
        <p className="text-stone-500 dark:text-stone-400 font-medium text-sm">No recipe packs available yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
        {packs.map(pack => {
          const isOwned = purchasedPackIds.has(pack.id);
          const style = TAG_STYLES[pack.tag_color] ?? TAG_STYLES.amber;

          return (
            <button
              key={pack.id}
              onClick={() => handleOpenPack(pack)}
              className={`group text-left rounded-2xl border border-stone-100 dark:border-stone-700 bg-white dark:bg-stone-800 overflow-hidden hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 ${style.ring} focus:ring-offset-2`}
            >
              {/* Thumbnail */}
              {pack.thumbnail_url && (
                <div className="h-32 overflow-hidden relative">
                  <img
                    src={pack.thumbnail_url}
                    alt={pack.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute top-2.5 left-2.5">
                    {isOwned ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-white bg-emerald-500/90 px-2 py-0.5 rounded-full shadow-sm">
                        <Unlock className="w-3 h-3" /> Owned
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-white bg-black/50 px-2 py-0.5 rounded-full">
                        <Lock className="w-3 h-3" /> {formatPrice(pack.price_cents)}
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-2.5 right-2.5">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${style.badge}`}>
                      {pack.meal_count} meals
                    </span>
                  </div>
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-extrabold text-stone-800 dark:text-stone-100 leading-snug">{pack.name}</h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed line-clamp-2">{pack.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-xs text-stone-400 font-medium">Curated by our chefs</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {previewPack && (
        loadingMeals ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white dark:bg-stone-800 rounded-3xl p-10 flex flex-col items-center gap-3 shadow-2xl">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              <p className="text-sm text-stone-500 font-medium">Loading pack…</p>
            </div>
          </div>
        ) : (
          <PackPreviewModal
            pack={previewPack}
            meals={previewMeals}
            isOwned={purchasedPackIds.has(previewPack.id)}
            unlocking={unlocking}
            onClose={() => setPreviewPack(null)}
            onUnlock={handleUnlock}
            onUseInMenu={handleUseInMenu}
          />
        )
      )}
    </>
  );
}

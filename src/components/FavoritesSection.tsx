import { Heart, Trash2, ChevronDown, ChevronUp, LogIn } from 'lucide-react';
import { useState } from 'react';
import type { Favorite, MealType } from '../types';
import { MEAL_TYPE_CONFIG } from '../types';
import { useAuth } from '../context/AuthContext';

interface FavoritesSectionProps {
  favorites: Favorite[];
  onRemove: (id: string) => void;
  onAddToMenu: (fav: Favorite) => void;
  onSignIn: () => void;
}

const BADGE_COLORS: Record<MealType, string> = {
  breakfast: 'bg-amber-100 text-amber-700',
  lunch: 'bg-orange-100 text-orange-700',
  dinner: 'bg-rose-100 text-rose-700',
};

export function FavoritesSection({ favorites, onRemove, onAddToMenu, onSignIn }: FavoritesSectionProps) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(true);
  const [expandedFav, setExpandedFav] = useState<string | null>(null);

  if (!user) {
    return (
      <section className="bg-white rounded-3xl border border-stone-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-rose-400" />
          <h2 className="text-lg font-extrabold text-stone-800">Favorites</h2>
        </div>
        <div className="text-center py-8">
          <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-3">
            <Heart className="w-7 h-7 text-rose-300" />
          </div>
          <p className="text-stone-600 font-semibold text-sm">Save your favorite meals</p>
          <p className="text-stone-400 text-xs mt-1 max-w-xs mx-auto">
            Create a free account to build your personal collection of go-to recipes.
          </p>
          <button
            onClick={onSignIn}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-bold shadow-md shadow-amber-200 transition-all duration-200"
          >
            <LogIn className="w-4 h-4" />
            Sign In to Save Favorites
          </button>
        </div>
      </section>
    );
  }

  if (favorites.length === 0) {
    return (
      <section className="bg-white rounded-3xl border border-stone-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-rose-400" />
          <h2 className="text-lg font-extrabold text-stone-800">Favorites</h2>
        </div>
        <div className="text-center py-8">
          <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-3">
            <Heart className="w-7 h-7 text-rose-300" />
          </div>
          <p className="text-stone-500 font-medium text-sm">No favorites yet</p>
          <p className="text-stone-400 text-xs mt-1">Click a meal on the weekly grid and hit "Add to Favorites"</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-stone-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
          <h2 className="text-lg font-extrabold text-stone-800">Favorites</h2>
          <span className="text-xs font-bold bg-rose-100 text-rose-500 px-2 py-0.5 rounded-full">
            {favorites.length}
          </span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {favorites.map(fav => {
            const cfg = MEAL_TYPE_CONFIG[fav.meal_type];
            const isExpanded = expandedFav === fav.id;
            return (
              <div
                key={fav.id}
                className={`border rounded-2xl overflow-hidden transition-all ${cfg.border} ${cfg.bg}`}
              >
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${BADGE_COLORS[fav.meal_type]}`}>
                        {cfg.emoji} {cfg.label}
                      </span>
                      <p className="text-sm font-bold text-stone-800 mt-1.5 leading-snug">{fav.name}</p>
                      {fav.description && (
                        <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{fav.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => onRemove(fav.id)}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-stone-300 hover:text-rose-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {fav.ingredients.length > 0 && (
                    <button
                      onClick={() => setExpandedFav(p => p === fav.id ? null : fav.id)}
                      className={`mt-2 text-xs font-semibold transition-colors ${cfg.color} flex items-center gap-1`}
                    >
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {fav.ingredients.length} ingredient{fav.ingredients.length !== 1 ? 's' : ''}
                    </button>
                  )}

                  {isExpanded && fav.ingredients.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {fav.ingredients.map((ing, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-stone-600">
                          <span className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />
                          {ing}
                        </li>
                      ))}
                    </ul>
                  )}

                  <button
                    onClick={() => onAddToMenu(fav)}
                    className={`mt-3 w-full py-1.5 rounded-xl text-xs font-bold text-white ${cfg.activeBg} hover:opacity-90 transition-opacity`}
                  >
                    Add to Menu
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

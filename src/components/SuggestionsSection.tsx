import { Search, Sparkles, Plus, Loader2, Rss, ExternalLink, AlertCircle, Package } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { MealSuggestion, MealType, RssRecipe } from '../types';
import { MEAL_TYPE_CONFIG } from '../types';
import { useSuggestions } from '../hooks/useSuggestions';
import { useRssRecipes } from '../hooks/useRssRecipes';
import { useSponsored } from '../hooks/useSponsored';
import type { SponsoredRecipe } from '../hooks/useSponsored';
import { RecipePacksSection } from './RecipePacksSection';

interface SuggestionsSectionProps {
  onUseInMenu: (suggestion: MealSuggestion | RssRecipe) => void;
  onAddToFavorites: (suggestion: MealSuggestion | RssRecipe) => void;
}

const QUICK_TAGS = ['quick', 'healthy', 'vegan', 'italian', 'comfort', 'kids', 'chicken', 'pasta', 'soup', 'salad'];

type TabId = 'library' | 'live' | 'packs';

const SOURCE_COLORS: Record<string, string> = {
  'Smitten Kitchen': 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
  'The Kitchn': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  'Serious Eats': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  'Simply Recipes': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
};

function formatRelativeDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 31) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function SponsoredCard({ recipe }: { recipe: SponsoredRecipe }) {
  const cfg = MEAL_TYPE_CONFIG[recipe.meal_type];
  return (
    <a
      href={recipe.sponsor_url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 overflow-hidden flex flex-col hover:shadow-md transition-shadow group"
    >
      {recipe.image_url && (
        <div className="h-28 overflow-hidden flex-shrink-0 relative">
          <img
            src={recipe.image_url}
            alt={recipe.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      )}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-800/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            Sponsored
          </span>
          <span className={`text-xs font-bold ${cfg.color}`}>{cfg.emoji} {cfg.label}</span>
        </div>
        <h4 className="text-sm font-extrabold text-stone-800 dark:text-stone-100 leading-snug">{recipe.name}</h4>
        {recipe.description && (
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-2">{recipe.description}</p>
        )}
        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">via {recipe.sponsor_name}</span>
          <ExternalLink className="w-3.5 h-3.5 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </a>
  );
}

type LibraryItem =
  | { kind: 'suggestion'; item: MealSuggestion }
  | { kind: 'sponsored'; item: SponsoredRecipe };

const SPONSORED_POSITIONS = new Set([2, 5]);

export function SuggestionsSection({ onUseInMenu, onAddToFavorites }: SuggestionsSectionProps) {
  const [activeTab, setActiveTab] = useState<TabId>('library');
  const [query, setQuery] = useState('');
  const [mealFilter, setMealFilter] = useState<MealType | 'all'>('all');

  const { suggestions, loading: libLoading } = useSuggestions(query, mealFilter);
  const { recipes: rssRecipes, loading: rssLoading, error: rssError, retry: retryRss } = useRssRecipes(
    activeTab === 'live' ? query : '',
    activeTab === 'live' ? mealFilter : 'all',
  );
  const { sponsored } = useSponsored(activeTab === 'library' ? mealFilter : 'all');

  const loading = activeTab === 'library' ? libLoading : rssLoading;

  const libraryItems = useMemo<LibraryItem[]>(() => {
    const result: LibraryItem[] = [];
    let sIdx = 0;
    let spIdx = 0;
    let pos = 0;
    const maxSponsoredPos = Math.max(...SPONSORED_POSITIONS);

    while (sIdx < suggestions.length || (spIdx < sponsored.length && pos <= maxSponsoredPos)) {
      if (SPONSORED_POSITIONS.has(pos) && spIdx < sponsored.length) {
        result.push({ kind: 'sponsored', item: sponsored[spIdx++] });
      } else if (sIdx < suggestions.length) {
        result.push({ kind: 'suggestion', item: suggestions[sIdx++] });
      } else {
        break;
      }
      pos++;
    }
    while (sIdx < suggestions.length) {
      result.push({ kind: 'suggestion', item: suggestions[sIdx++] });
    }
    return result;
  }, [suggestions, sponsored]);

  const mealTypes: Array<{ value: MealType | 'all'; label: string; emoji: string }> = [
    { value: 'all', label: 'All', emoji: '🍽️' },
    { value: 'breakfast', label: 'Breakfast', emoji: '☀️' },
    { value: 'lunch', label: 'Lunch', emoji: '🌤️' },
    { value: 'dinner', label: 'Dinner', emoji: '🌙' },
  ];

  const handlePackUseInMenu = (name: string, description: string, ingredients: string[], mealType: MealType) => {
    onUseInMenu({ id: '', name, meal_type: mealType, description, ingredients, tags: [], created_at: '' });
  };

  return (
    <section className="bg-white dark:bg-stone-800 rounded-3xl border border-stone-100 dark:border-stone-700 shadow-sm overflow-hidden transition-colors duration-300">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-stone-100 dark:border-stone-700">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-extrabold text-stone-800 dark:text-stone-100">Meal Suggestions</h2>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 p-1 bg-stone-100 dark:bg-stone-700 rounded-2xl">
            <button
              onClick={() => setActiveTab('library')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'library'
                  ? 'bg-white dark:bg-stone-600 text-stone-800 dark:text-stone-100 shadow-sm'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Library
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'live'
                  ? 'bg-white dark:bg-stone-600 text-stone-800 dark:text-stone-100 shadow-sm'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
              }`}
            >
              <Rss className="w-3.5 h-3.5" />
              Live Feed
              {rssLoading && <Loader2 className="w-3 h-3 animate-spin" />}
            </button>
            <button
              onClick={() => setActiveTab('packs')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'packs'
                  ? 'bg-white dark:bg-stone-600 text-stone-800 dark:text-stone-100 shadow-sm'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Packs
            </button>
          </div>
        </div>

        {/* Live feed source attribution */}
        {activeTab === 'live' && (
          <p className="text-xs text-stone-400 mb-3 leading-relaxed">
            Fresh recipes from{' '}
            {['Smitten Kitchen', 'The Kitchn', 'Serious Eats', 'Simply Recipes'].map((src, i, arr) => (
              <span key={src} className="font-semibold text-stone-500 dark:text-stone-400">
                {src}{i < arr.length - 1 ? ', ' : ''}
              </span>
            ))}
          </p>
        )}

        {/* Search + filters — hidden on packs tab */}
        {activeTab !== 'packs' && (
          <>
            <div className="relative mb-3">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={activeTab === 'library' ? 'Search by ingredient, cuisine, style…' : 'Filter live recipes…'}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-700 text-sm text-stone-700 dark:text-stone-200 placeholder:text-stone-300 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all font-medium"
              />
              {loading && (
                <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 animate-spin" />
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              {mealTypes.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  onClick={() => setMealFilter(value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    mealFilter === value
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-700'
                  }`}
                >
                  <span>{emoji}</span>
                  {label}
                </button>
              ))}
            </div>

            {activeTab === 'library' && !query && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {QUICK_TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Results */}
      <div className={activeTab === 'packs' ? '' : 'p-5'}>

        {/* ── LIBRARY TAB ── */}
        {activeTab === 'library' && (
          <>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                <p className="text-stone-400 text-sm mt-2">Looking for ideas…</p>
              </div>
            ) : libraryItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-stone-500 dark:text-stone-400 font-medium text-sm">
                  {query.trim() ? `No results for "${query}"` : 'No suggestions available'}
                </p>
                <p className="text-stone-400 dark:text-stone-500 text-xs mt-1">Try the Live Feed tab for fresh recipes from the web</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {libraryItems.map((entry, i) => {
                  if (entry.kind === 'sponsored') {
                    return <SponsoredCard key={`sponsored-${entry.item.id}`} recipe={entry.item} />;
                  }

                  const sug = entry.item;
                  const cfg = MEAL_TYPE_CONFIG[sug.meal_type];
                  return (
                    <div key={`sug-${sug.id}-${i}`} className={`rounded-2xl border ${cfg.border} ${cfg.bg} dark:bg-opacity-10 dark:border-opacity-30 p-4 flex flex-col gap-2`}>
                      <div className="flex-1">
                        <span className={`text-xs font-bold ${cfg.color}`}>{cfg.emoji} {cfg.label}</span>
                        <h4 className="text-sm font-extrabold text-stone-800 dark:text-stone-100 mt-0.5 leading-snug">{sug.name}</h4>
                        {sug.description && (
                          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">{sug.description}</p>
                        )}
                      </div>
                      {sug.ingredients.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {sug.ingredients.slice(0, 4).map((ing, idx) => (
                            <span key={idx} className="text-xs bg-white/70 dark:bg-stone-700/70 border border-stone-200 dark:border-stone-600 text-stone-500 dark:text-stone-400 px-2 py-0.5 rounded-lg">
                              {ing.replace(/^\d+\s*(cup|tbsp|tsp|g|kg|oz|lb)?\s*/i, '').split(',')[0].trim()}
                            </span>
                          ))}
                          {sug.ingredients.length > 4 && (
                            <span className="text-xs text-stone-400">+{sug.ingredients.length - 4} more</span>
                          )}
                        </div>
                      )}
                      <div className="flex gap-2 mt-auto pt-1">
                        <button
                          onClick={() => onUseInMenu(sug)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold text-white ${cfg.activeBg} hover:opacity-90 transition-opacity`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add to Menu
                        </button>
                        <button
                          onClick={() => onAddToFavorites(sug)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                        >
                          ♥ Save
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── LIVE FEED TAB ── */}
        {activeTab === 'live' && (
          <>
            {rssError ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-6 h-6 text-rose-400" />
                </div>
                <p className="text-stone-500 dark:text-stone-400 font-medium text-sm">Couldn't load live recipes</p>
                <p className="text-stone-400 dark:text-stone-500 text-xs mt-1">{rssError}</p>
                <button
                  onClick={retryRss}
                  className="mt-3 px-4 py-2 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 transition-colors"
                >
                  Try again
                </button>
              </div>
            ) : loading && rssRecipes.length === 0 ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                <p className="text-stone-400 text-sm mt-2">Fetching fresh recipes…</p>
              </div>
            ) : rssRecipes.length === 0 ? (
              <div className="text-center py-8">
                <Rss className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-stone-500 dark:text-stone-400 font-medium text-sm">No recipes found</p>
                <p className="text-stone-400 dark:text-stone-500 text-xs mt-1">Try clearing the filter or search term</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {rssRecipes.map(recipe => {
                  const cfg = MEAL_TYPE_CONFIG[recipe.meal_type];
                  const sourceBadge = SOURCE_COLORS[recipe.source] ?? 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400';
                  return (
                    <div key={recipe.id} className="rounded-2xl border border-stone-100 dark:border-stone-700 bg-white dark:bg-stone-750 overflow-hidden flex flex-col hover:shadow-md transition-shadow" style={{backgroundColor: 'var(--card-bg, transparent)'}}>
                      {recipe.imageUrl && /^https?:\/\//i.test(recipe.imageUrl) && (
                        <div className="h-36 overflow-hidden bg-stone-100 dark:bg-stone-700 flex-shrink-0">
                          <img
                            src={recipe.imageUrl}
                            alt={recipe.title}
                            className="w-full h-full object-cover"
                            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                          />
                        </div>
                      )}
                      <div className="p-4 flex flex-col gap-2 flex-1 bg-white dark:bg-stone-800">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sourceBadge}`}>
                            {recipe.source}
                          </span>
                          <span className={`text-xs font-bold ${cfg.color}`}>{cfg.emoji} {cfg.label}</span>
                          {recipe.pubDate && (
                            <span className="text-xs text-stone-400 ml-auto">{formatRelativeDate(recipe.pubDate)}</span>
                          )}
                        </div>
                        <h4 className="text-sm font-extrabold text-stone-800 dark:text-stone-100 leading-snug">{recipe.title}</h4>
                        {recipe.description && (
                          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-2">{recipe.description}</p>
                        )}
                        <div className="flex gap-2 mt-auto pt-1">
                          <button
                            onClick={() => onUseInMenu(recipe)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold text-white ${cfg.activeBg} hover:opacity-90 transition-opacity`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add to Menu
                          </button>
                          <button
                            onClick={() => onAddToFavorites(recipe)}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                          >
                            ♥
                          </button>
                          <a
                            href={recipe.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-stone-400 bg-stone-50 dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600 hover:text-stone-600 transition-colors flex items-center"
                            title="View recipe"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── PACKS TAB ── */}
        {activeTab === 'packs' && (
          <RecipePacksSection
            onUseInMenu={handlePackUseInMenu}
            onAuthRequired={() => {}}
          />
        )}
      </div>
    </section>
  );
}

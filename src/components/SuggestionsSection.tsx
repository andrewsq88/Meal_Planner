import { Search, Sparkles, Plus, Loader2, Rss, ExternalLink, AlertCircle, ChefHat, Clock, Users } from 'lucide-react';
import { useState } from 'react';
import type { MealSuggestion, MealType, RssRecipe } from '../types';
import { MEAL_TYPE_CONFIG } from '../types';
import { useSuggestions } from '../hooks/useSuggestions';
import { useRssRecipes } from '../hooks/useRssRecipes';
import { useRecipeScrape } from '../hooks/useRecipeScrape';

interface SuggestionsSectionProps {
  onUseInMenu: (suggestion: MealSuggestion | RssRecipe) => void;
  onAddToFavorites: (suggestion: MealSuggestion | RssRecipe) => void;
}

const QUICK_TAGS = ['quick', 'healthy', 'vegan', 'italian', 'comfort', 'kids', 'chicken', 'pasta', 'soup', 'salad'];

type TabId = 'library' | 'live';

const SOURCE_COLORS: Record<string, string> = {
  'Smitten Kitchen': 'bg-rose-100 text-rose-700',
  'The Kitchn': 'bg-orange-100 text-orange-700',
  'Serious Eats': 'bg-amber-100 text-amber-700',
  'Simply Recipes': 'bg-emerald-100 text-emerald-700',
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

export function SuggestionsSection({ onUseInMenu, onAddToFavorites }: SuggestionsSectionProps) {
  const [activeTab, setActiveTab] = useState<TabId>('library');
  const [query, setQuery] = useState('');
  const [mealFilter, setMealFilter] = useState<MealType | 'all'>('all');

  const { suggestions, loading: libLoading } = useSuggestions(query, mealFilter);
  const { recipes: rssRecipes, loading: rssLoading, error: rssError } = useRssRecipes(
    activeTab === 'live' ? query : '',
    activeTab === 'live' ? mealFilter : 'all',
  );
  const { scrape, getState, getResult } = useRecipeScrape();

  const loading = activeTab === 'library' ? libLoading : rssLoading;

  const mealTypes: Array<{ value: MealType | 'all'; label: string; emoji: string }> = [
    { value: 'all', label: 'All', emoji: '🍽️' },
    { value: 'breakfast', label: 'Breakfast', emoji: '☀️' },
    { value: 'lunch', label: 'Lunch', emoji: '🌤️' },
    { value: 'dinner', label: 'Dinner', emoji: '🌙' },
  ];

  const handleAddToMenu = (recipe: RssRecipe) => {
    const scraped = getResult(recipe.id);
    const enriched: RssRecipe = scraped
      ? { ...recipe, ingredients: scraped.ingredients, description: scraped.description || recipe.description }
      : recipe;
    onUseInMenu(enriched);
  };

  return (
    <section className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-stone-100">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-extrabold text-stone-800">Meal Suggestions</h2>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 p-1 bg-stone-100 rounded-2xl">
            <button
              onClick={() => setActiveTab('library')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'library'
                  ? 'bg-white text-stone-800 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Library
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'live'
                  ? 'bg-white text-stone-800 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <Rss className="w-3.5 h-3.5" />
              Live Feed
              {rssLoading && <Loader2 className="w-3 h-3 animate-spin" />}
            </button>
          </div>
        </div>

        {/* Live feed source attribution */}
        {activeTab === 'live' && (
          <p className="text-xs text-stone-400 mb-3 leading-relaxed">
            Fresh recipes from{' '}
            {['Smitten Kitchen', 'The Kitchn', 'Serious Eats', 'Simply Recipes'].map((src, i, arr) => (
              <span key={src} className="font-semibold text-stone-500">
                {src}{i < arr.length - 1 ? ', ' : ''}
              </span>
            ))}
          </p>
        )}

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={activeTab === 'library' ? 'Search by ingredient, cuisine, style…' : 'Filter live recipes…'}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-stone-200 text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all font-medium"
          />
          {loading && (
            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 animate-spin" />
          )}
        </div>

        {/* Meal type filter */}
        <div className="flex gap-2 flex-wrap">
          {mealTypes.map(({ value, label, emoji }) => (
            <button
              key={value}
              onClick={() => setMealFilter(value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                mealFilter === value
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-stone-100 text-stone-500 hover:bg-amber-50 hover:text-amber-700'
              }`}
            >
              <span>{emoji}</span>
              {label}
            </button>
          ))}
        </div>

        {/* Quick tags — library only when no query */}
        {activeTab === 'library' && !query && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {QUICK_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-100 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="p-5">
        {/* ── LIBRARY TAB ── */}
        {activeTab === 'library' && (
          <>
            {!query.trim() ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-7 h-7 text-amber-400" />
                </div>
                <p className="text-stone-500 font-medium text-sm">Type to get meal ideas</p>
                <p className="text-stone-400 text-xs mt-1">Try "quick", "pasta", "healthy", or any ingredient</p>
              </div>
            ) : loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                <p className="text-stone-400 text-sm mt-2">Looking for ideas…</p>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-stone-500 font-medium text-sm">No results for "{query}"</p>
                <p className="text-stone-400 text-xs mt-1">Try the Live Feed tab for fresh recipes from the web</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {suggestions.map(sug => {
                  const cfg = MEAL_TYPE_CONFIG[sug.meal_type];
                  return (
                    <div key={sug.id} className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-4 flex flex-col gap-2`}>
                      <div className="flex-1">
                        <span className={`text-xs font-bold ${cfg.color}`}>{cfg.emoji} {cfg.label}</span>
                        <h4 className="text-sm font-extrabold text-stone-800 mt-0.5 leading-snug">{sug.name}</h4>
                        {sug.description && (
                          <p className="text-xs text-stone-500 mt-1 leading-relaxed">{sug.description}</p>
                        )}
                      </div>
                      {sug.ingredients.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {sug.ingredients.slice(0, 4).map((ing, i) => (
                            <span key={i} className="text-xs bg-white/70 border border-stone-200 text-stone-500 px-2 py-0.5 rounded-lg">
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
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 transition-colors"
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
                <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-6 h-6 text-rose-400" />
                </div>
                <p className="text-stone-500 font-medium text-sm">Couldn't load live recipes</p>
                <p className="text-stone-400 text-xs mt-1">{rssError}</p>
              </div>
            ) : loading && rssRecipes.length === 0 ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                <p className="text-stone-400 text-sm mt-2">Fetching fresh recipes…</p>
              </div>
            ) : rssRecipes.length === 0 ? (
              <div className="text-center py-8">
                <Rss className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-stone-500 font-medium text-sm">No recipes found</p>
                <p className="text-stone-400 text-xs mt-1">Try clearing the filter or search term</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {rssRecipes.map(recipe => {
                  const cfg = MEAL_TYPE_CONFIG[recipe.meal_type];
                  const sourceBadge = SOURCE_COLORS[recipe.source] ?? 'bg-stone-100 text-stone-600';
                  const scrapeState = getState(recipe.id);
                  const scraped = getResult(recipe.id);

                  return (
                    <div key={recipe.id} className="rounded-2xl border border-stone-100 bg-white overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                      {/* Thumbnail */}
                      {(scraped?.image_url || recipe.imageUrl) && (
                        <div className="h-36 overflow-hidden bg-stone-100 flex-shrink-0">
                          <img
                            src={scraped?.image_url || recipe.imageUrl}
                            alt={recipe.title}
                            className="w-full h-full object-cover"
                            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                          />
                        </div>
                      )}

                      <div className="p-4 flex flex-col gap-2 flex-1">
                        {/* Badges row */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sourceBadge}`}>
                            {recipe.source}
                          </span>
                          <span className={`text-xs font-bold ${cfg.color}`}>{cfg.emoji} {cfg.label}</span>
                          {recipe.pubDate && (
                            <span className="text-xs text-stone-400 ml-auto">{formatRelativeDate(recipe.pubDate)}</span>
                          )}
                        </div>

                        <h4 className="text-sm font-extrabold text-stone-800 leading-snug">{recipe.title}</h4>

                        {(scraped?.description || recipe.description) && (
                          <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">
                            {scraped?.description || recipe.description}
                          </p>
                        )}

                        {/* Scraped metadata */}
                        {scraped && (scraped.total_time > 0 || scraped.servings) && (
                          <div className="flex items-center gap-3 text-xs text-stone-400">
                            {scraped.total_time > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {scraped.total_time} min
                              </span>
                            )}
                            {scraped.servings && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {scraped.servings}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Scraped ingredients */}
                        {scraped && scraped.ingredients.length > 0 && (
                          <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2">
                            <p className="text-xs font-bold text-amber-700 flex items-center gap-1 mb-1.5">
                              <ChefHat className="w-3 h-3" /> Ingredients
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {scraped.ingredients.slice(0, 6).map((ing, i) => (
                                <span key={i} className="text-xs bg-white border border-amber-100 text-stone-600 px-2 py-0.5 rounded-lg">
                                  {ing.replace(/^\d[\d/\s]*\s*(cup|tbsp|tsp|g|kg|oz|lb|ml|l)?\s*/i, '').split(',')[0].trim()}
                                </span>
                              ))}
                              {scraped.ingredients.length > 6 && (
                                <span className="text-xs text-amber-600 font-semibold">
                                  +{scraped.ingredients.length - 6} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Error state */}
                        {scrapeState === 'error' && (
                          <p className="text-xs text-rose-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Couldn't extract ingredients from this site
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 mt-auto pt-1">
                          {/* Fetch ingredients button — idle or error */}
                          {scrapeState === 'idle' || scrapeState === 'error' ? (
                            <button
                              onClick={() => scrape(recipe.id, recipe.link)}
                              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
                              title="Fetch full ingredients from the recipe page"
                            >
                              <ChefHat className="w-3.5 h-3.5" />
                              {scrapeState === 'error' ? 'Retry' : 'Get Ingredients'}
                            </button>
                          ) : scrapeState === 'loading' ? (
                            <button disabled className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-500 bg-amber-50 border border-amber-200">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Fetching…
                            </button>
                          ) : null}

                          <button
                            onClick={() => handleAddToMenu(recipe)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold text-white ${cfg.activeBg} hover:opacity-90 transition-opacity`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            {scraped ? 'Add with Ingredients' : 'Add to Menu'}
                          </button>

                          <button
                            onClick={() => onAddToFavorites(recipe)}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 transition-colors"
                          >
                            ♥
                          </button>
                          <a
                            href={recipe.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-stone-400 bg-stone-50 hover:bg-stone-100 hover:text-stone-600 transition-colors flex items-center"
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
      </div>
    </section>
  );
}

import { useState, useEffect, useCallback, useRef } from 'react';
import type { RssRecipe, MealType } from '../types';

const EDGE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-rss-recipes`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const VALID_MEAL_TYPES: ReadonlySet<string> = new Set(['breakfast', 'lunch', 'dinner']);

export function useRssRecipes(query: string, mealTypeFilter: MealType | 'all') {
  const [recipes, setRecipes] = useState<RssRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const retry = useCallback(() => setRetryCount(c => c + 1), []);

  const search = useCallback(async (q: string, typeFilter: MealType | 'all') => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('query', q.trim().slice(0, 100));
      const safeType = VALID_MEAL_TYPES.has(typeFilter) ? typeFilter : 'all';
      if (safeType !== 'all') params.set('meal_type', safeType);

      const res = await fetch(`${EDGE_FN_URL}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Feed unavailable (${res.status})`);
      }

      const json = await res.json();
      if (!Array.isArray(json?.items)) {
        throw new Error('Unexpected response format');
      }
      setRecipes(json.items as RssRecipe[]);
    } catch (err) {
      setError((err as Error).message);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search on query/filter changes; retryCount forces re-run on retry
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query, mealTypeFilter), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // retryCount intentionally included so manual retry re-triggers the fetch
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, mealTypeFilter, search, retryCount]);

  return { recipes, loading, error, retry };
}

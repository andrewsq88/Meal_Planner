import { useState, useEffect, useCallback, useRef } from 'react';
import type { RssRecipe, MealType } from '../types';

const EDGE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-rss-recipes`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export function useRssRecipes(query: string, mealTypeFilter: MealType | 'all') {
  const [recipes, setRecipes] = useState<RssRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string, typeFilter: MealType | 'all') => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('query', q.trim());
      if (typeFilter !== 'all') params.set('meal_type', typeFilter);

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

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query, mealTypeFilter), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, mealTypeFilter, search]);

  // Load latest on mount (no query)
  useEffect(() => {
    search('', 'all');
  }, [search]);

  return { recipes, loading, error };
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { MealSuggestion, MealType } from '../types';

export function useSuggestions(query: string, mealTypeFilter: MealType | 'all') {
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string, typeFilter: MealType | 'all') => {
    setLoading(true);
    const term = q.trim().toLowerCase();
    let queryBuilder = supabase
      .from('meal_suggestions')
      .select('*')
      .limit(12);

    if (term) {
      queryBuilder = queryBuilder.or(`name.ilike.%${term}%,description.ilike.%${term}%,tags.cs.{${term}}`);
    }

    if (typeFilter !== 'all') {
      queryBuilder = queryBuilder.eq('meal_type', typeFilter);
    }

    const { data } = await queryBuilder.order('name');
    setSuggestions(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Only query when blank (show defaults) or at least 2 characters entered
    if (query.trim().length === 1) return;
    debounceRef.current = setTimeout(() => search(query, mealTypeFilter), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, mealTypeFilter, search]);

  return { suggestions, loading };
}

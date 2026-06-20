import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Favorite, MealType } from '../types';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('favorites')
      .select('*')
      .order('created_at', { ascending: false });
    setFavorites(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addFavorite = useCallback(async (
    name: string,
    mealType: MealType,
    description: string,
    ingredients: string[],
  ): Promise<boolean> => {
    const already = favorites.some(f => f.name.toLowerCase() === name.toLowerCase());
    if (already) return false;
    const { data, error } = await supabase
      .from('favorites')
      .insert({ name, meal_type: mealType, description, ingredients })
      .select()
      .single();
    if (error || !data) return false;
    setFavorites(prev => [data, ...prev]);
    return true;
  }, [favorites]);

  const removeFavorite = useCallback(async (id: string) => {
    const { error } = await supabase.from('favorites').delete().eq('id', id);
    if (!error) setFavorites(prev => prev.filter(f => f.id !== id));
  }, []);

  return { favorites, loading, addFavorite, removeFavorite };
}

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Favorite, MealType } from '../types';

export function useFavorites() {
  const { user } = useAuth();
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

  // Re-fetch when auth state changes (sign in/out)
  const userId = user?.id;
  useEffect(() => { fetch(); }, [fetch, userId]);

  const addFavorite = useCallback(async (
    name: string,
    mealType: MealType,
    description: string,
    ingredients: string[],
  ): Promise<boolean | 'auth_required' | 'error'> => {
    if (!user) return 'auth_required';
    const already = favorites.some(f => f.name.toLowerCase() === name.toLowerCase());
    if (already) return false;
    const { data, error } = await supabase
      .from('favorites')
      .insert({ name, meal_type: mealType, description, ingredients })
      .select()
      .single();
    if (error || !data) {
      console.error('Failed to save favorite:', error?.message);
      return 'error';
    }
    setFavorites(prev => [data, ...prev]);
    return true;
  }, [favorites, user]);

  const removeFavorite = useCallback(async (id: string): Promise<'auth_required' | void> => {
    if (!user) return 'auth_required';
    const { error } = await supabase.from('favorites').delete().eq('id', id);
    if (!error) setFavorites(prev => prev.filter(f => f.id !== id));
  }, [user]);

  return { favorites, loading, addFavorite, removeFavorite };
}

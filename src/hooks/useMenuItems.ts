import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { MenuItem, MealType } from '../types';

export function useMenuItems(weekStart: string) {
  const { user } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('menu_items')
      .select('*')
      .eq('week_start', weekStart)
      .order('day_of_week');
    if (err) {
      setError(err.message);
    } else {
      setItems(data ?? []);
    }
    setLoading(false);
  }, [weekStart]);

  // Re-fetch when the week changes or when auth state changes (sign in/out)
  const userId = user?.id;
  useEffect(() => { fetch(); }, [fetch, userId]);

  const upsertItem = useCallback(async (
    dayOfWeek: number,
    mealType: MealType,
    name: string,
    description: string,
    ingredients: string[],
    cook: string = '',
  ): Promise<MenuItem | null | 'auth_required'> => {
    if (!user) return 'auth_required';
    const existing = items.find(
      i => i.day_of_week === dayOfWeek && i.meal_type === mealType,
    );
    if (existing) {
      const { data, error: err } = await supabase
        .from('menu_items')
        .update({ name, description, ingredients, cook, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      if (err) return null;
      setItems(prev => prev.map(i => (i.id === existing.id ? data : i)));
      return data;
    }
    const { data, error: err } = await supabase
      .from('menu_items')
      .insert({ week_start: weekStart, day_of_week: dayOfWeek, meal_type: mealType, name, description, ingredients, cook })
      .select()
      .single();
    if (err) return null;
    setItems(prev => [...prev, data]);
    return data;
  }, [items, weekStart, user]);

  const deleteItem = useCallback(async (id: string): Promise<'auth_required' | void> => {
    if (!user) return 'auth_required';
    const { error: err } = await supabase.from('menu_items').delete().eq('id', id);
    if (!err) setItems(prev => prev.filter(i => i.id !== id));
  }, [user]);

  return { items, loading, error, upsertItem, deleteItem, refetch: fetch };
}

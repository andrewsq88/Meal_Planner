import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { MealType } from '../types';

export interface RecipePack {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  meal_count: number;
  thumbnail_url: string | null;
  tag_color: string;
}

export interface PackMeal {
  id: string;
  pack_id: string;
  name: string;
  meal_type: MealType;
  description: string;
  ingredients: string[];
  tags: string[];
}

export function useRecipePacks() {
  const { user } = useAuth();
  const [packs, setPacks] = useState<RecipePack[]>([]);
  const [purchasedPackIds, setPurchasedPackIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('recipe_packs')
      .select('*')
      .eq('is_active', true)
      .order('price_cents')
      .then(({ data }) => {
        setPacks((data ?? []) as RecipePack[]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!user) {
      setPurchasedPackIds(new Set());
      return;
    }
    supabase
      .from('user_purchases')
      .select('pack_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        setPurchasedPackIds(new Set((data ?? []).map(r => r.pack_id as string)));
      });
  }, [user]);

  const fetchPackMeals = async (packId: string): Promise<PackMeal[]> => {
    const { data } = await supabase
      .from('recipe_pack_meals')
      .select('*')
      .eq('pack_id', packId)
      .order('name');
    return (data ?? []) as PackMeal[];
  };

  const unlockPack = async (packId: string): Promise<'ok' | 'auth_required' | 'error'> => {
    if (!user) return 'auth_required';
    const { error } = await supabase
      .from('user_purchases')
      .insert({ pack_id: packId });
    if (error && error.code !== '23505') return 'error'; // ignore duplicate
    setPurchasedPackIds(prev => new Set([...prev, packId]));
    return 'ok';
  };

  return { packs, purchasedPackIds, loading, fetchPackMeals, unlockPack };
}

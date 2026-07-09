import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { MealType } from '../types';

export interface SponsoredRecipe {
  id: string;
  name: string;
  description: string;
  meal_type: MealType;
  sponsor_name: string;
  sponsor_url: string;
  image_url: string | null;
  display_order: number;
}

export function useSponsored(mealTypeFilter: MealType | 'all') {
  const [sponsored, setSponsored] = useState<SponsoredRecipe[]>([]);

  useEffect(() => {
    let q = supabase
      .from('sponsored_recipes')
      .select('*')
      .eq('is_active', true)
      .order('display_order')
      .limit(3);

    if (mealTypeFilter !== 'all') {
      q = q.eq('meal_type', mealTypeFilter);
    }

    q.then(({ data }) => setSponsored((data ?? []) as SponsoredRecipe[]));
  }, [mealTypeFilter]);

  return { sponsored };
}

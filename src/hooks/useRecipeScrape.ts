import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface ScrapedRecipe {
  url: string;
  title: string;
  description: string;
  ingredients: string[];
  image_url: string;
  total_time: number;
  servings: string;
}

type ScrapeState = 'idle' | 'loading' | 'done' | 'error';

export function useRecipeScrape() {
  const [states, setStates] = useState<Record<string, ScrapeState>>({});
  const [results, setResults] = useState<Record<string, ScrapedRecipe>>({});

  const scrape = useCallback(async (recipeId: string, url: string) => {
    setStates(prev => ({ ...prev, [recipeId]: 'loading' }));

    try {
      const { data, error } = await supabase.functions.invoke('scrape-recipe', {
        body: { url },
      });

      if (error || !data || data.error) {
        setStates(prev => ({ ...prev, [recipeId]: 'error' }));
        return null;
      }

      const scraped = data as ScrapedRecipe;
      setResults(prev => ({ ...prev, [recipeId]: scraped }));
      setStates(prev => ({ ...prev, [recipeId]: 'done' }));
      return scraped;
    } catch {
      setStates(prev => ({ ...prev, [recipeId]: 'error' }));
      return null;
    }
  }, []);

  const getState = useCallback((id: string): ScrapeState => states[id] ?? 'idle', [states]);
  const getResult = useCallback((id: string): ScrapedRecipe | null => results[id] ?? null, [results]);

  return { scrape, getState, getResult };
}

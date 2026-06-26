import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { MenuItem, MealType } from '../types';

const GUEST_STORAGE_KEY = 'family_menu_guest_items';

function loadGuestItems(): MenuItem[] {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGuestItems(items: MenuItem[]) {
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(items));
}

export function clearGuestItems() {
  localStorage.removeItem(GUEST_STORAGE_KEY);
}

function makeGuestId() {
  return `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function useMenuItems(weekStart: string) {
  const { user } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prevUserId = useRef<string | undefined>(undefined);

  const fetchFromDb = useCallback(async () => {
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

  const userId = user?.id;

  // Handle auth state transitions and week changes
  useEffect(() => {
    const wasGuest = prevUserId.current === undefined;
    const isNowAuthed = !!userId;

    if (isNowAuthed && wasGuest) {
      // User just signed in — migrate guest meals then fetch db
      (async () => {
        setLoading(true);
        const guestItems = loadGuestItems().filter(i => i.week_start === weekStart);

        if (guestItems.length > 0) {
          // Fetch existing db items first to avoid conflicts
          const { data: existing } = await supabase
            .from('menu_items')
            .select('day_of_week, meal_type')
            .eq('week_start', weekStart);

          const occupiedSlots = new Set(
            (existing ?? []).map(i => `${i.day_of_week}:${i.meal_type}`)
          );

          const toInsert = guestItems
            .filter(i => !occupiedSlots.has(`${i.day_of_week}:${i.meal_type}`))
            .map(({ id: _id, created_at: _ca, updated_at: _ua, ...rest }) => rest);

          if (toInsert.length > 0) {
            await supabase.from('menu_items').insert(toInsert);
          }
          clearGuestItems();
        }

        prevUserId.current = userId;
        await fetchFromDb();
      })();
    } else if (!isNowAuthed) {
      // Guest mode — load from local storage
      const all = loadGuestItems();
      setItems(all.filter(i => i.week_start === weekStart));
      setLoading(false);
      prevUserId.current = undefined;
    } else {
      // Already authed, week changed or re-render
      prevUserId.current = userId;
      fetchFromDb();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchFromDb, userId]);

  const upsertItem = useCallback(async (
    dayOfWeek: number,
    mealType: MealType,
    name: string,
    description: string,
    ingredients: string[],
    cook: string = '',
  ): Promise<MenuItem | null> => {
    if (!user) {
      // Guest: write to local storage
      const now = new Date().toISOString();
      const all = loadGuestItems();
      const existingIdx = all.findIndex(
        i => i.week_start === weekStart && i.day_of_week === dayOfWeek && i.meal_type === mealType,
      );
      let updated: MenuItem;
      if (existingIdx >= 0) {
        updated = { ...all[existingIdx], name, description, ingredients, cook, updated_at: now };
        all[existingIdx] = updated;
      } else {
        updated = {
          id: makeGuestId(),
          week_start: weekStart,
          day_of_week: dayOfWeek,
          meal_type: mealType,
          name,
          description,
          ingredients,
          cook,
          created_at: now,
          updated_at: now,
        };
        all.push(updated);
      }
      saveGuestItems(all);
      setItems(all.filter(i => i.week_start === weekStart));
      return updated;
    }

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

  const deleteItem = useCallback(async (id: string): Promise<void> => {
    if (!user) {
      const all = loadGuestItems().filter(i => i.id !== id);
      saveGuestItems(all);
      setItems(all.filter(i => i.week_start === weekStart));
      return;
    }
    const { error: err } = await supabase.from('menu_items').delete().eq('id', id);
    if (!err) setItems(prev => prev.filter(i => i.id !== id));
  }, [user, weekStart]);

  return { items, loading, error, upsertItem, deleteItem, refetch: fetchFromDb };
}

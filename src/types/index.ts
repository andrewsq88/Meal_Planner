export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface MenuItem {
  id: string;
  week_start: string;
  day_of_week: number;
  meal_type: MealType;
  name: string;
  description: string;
  ingredients: string[];
  created_at: string;
  updated_at: string;
}

export interface Favorite {
  id: string;
  name: string;
  meal_type: MealType;
  description: string;
  ingredients: string[];
  created_at: string;
}

export interface MealSuggestion {
  id: string;
  name: string;
  meal_type: MealType;
  description: string;
  ingredients: string[];
  tags: string[];
  created_at: string;
}

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
export const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function formatDisplayDate(weekStart: string, dayIndex: number): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + dayIndex);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
}

export interface RssRecipe {
  id: string;
  title: string;
  description: string;
  link: string;
  source: string;
  pubDate: string;
  imageUrl: string;
  meal_type: MealType;
}

export const MEAL_TYPE_CONFIG: Record<MealType, { label: string; emoji: string; color: string; bg: string; border: string; activeBg: string; activeText: string }> = {
  breakfast: {
    label: 'Breakfast',
    emoji: '☀️',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    activeBg: 'bg-amber-500',
    activeText: 'text-white',
  },
  lunch: {
    label: 'Lunch',
    emoji: '🌤️',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    activeBg: 'bg-orange-500',
    activeText: 'text-white',
  },
  dinner: {
    label: 'Dinner',
    emoji: '🌙',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    activeBg: 'bg-rose-500',
    activeText: 'text-white',
  },
};

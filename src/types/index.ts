export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface MenuItem {
  id: string;
  week_start: string;
  day_of_week: number;
  meal_type: MealType;
  name: string;
  description: string;
  ingredients: string[];
  cook: string;
  time_slot: string | null;
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
  // Zero out time in local timezone, then format as YYYY-MM-DD without UTC conversion
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDisplayDate(weekStart: string, dayIndex: number): string {
  const [y, m, d] = weekStart.split('-').map(Number);
  const date = new Date(y, m - 1, d + dayIndex);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatWeekRange(weekStart: string): string {
  const [y, m, d] = weekStart.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(y, m - 1, d + 6);
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

/// <reference types="vite/client" />

interface Window {
  __mealplanHistoryWrapped?: boolean;
  __mealplanAdsAllowed?: boolean;
  atOptions?: {
    key: string;
    format: string;
    height: number;
    width: number;
    params: Record<string, string>;
  };
}

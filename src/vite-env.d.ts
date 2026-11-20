/// <reference types="vite/client" />

interface Window {
  __mealplanHistoryWrapped?: boolean;
  atOptions?: {
    key: string;
    format: string;
    height: number;
    width: number;
    params: Record<string, string>;
  };
}

interface ImportMetaEnv {
  readonly VITE_GOATCOUNTER_CODE?: string;
  readonly VITE_ADS_ENABLED?: string;
  /** Default off. Set to `true` to show Continue with Google. */
  readonly VITE_GOOGLE_AUTH_ENABLED?: string;
  /** Default off. Set to `true` to call the suggest-meal-details function. */
  readonly VITE_AI_SUGGESTIONS_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

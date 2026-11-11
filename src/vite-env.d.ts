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
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale, Translations } from "@/lib/i18n/types";
import { es } from "@/lib/i18n/es";
import { en } from "@/lib/i18n/en";

const dictionaries: Record<Locale, Translations> = { es, en };

interface LocaleStore {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set) => ({
      locale: "es",
      t: es,
      setLocale: (locale) => set({ locale, t: dictionaries[locale] }),
    }),
    {
      name: "agent-hub-locale",
      partialize: (state) => ({ locale: state.locale }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.t = dictionaries[state.locale];
        }
      },
    }
  )
);

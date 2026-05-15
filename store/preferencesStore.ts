import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { AppLanguageCode, defaultLanguageCode } from '@/constants/languages';
import {
  AppCurrencyCode,
  defaultCurrencyCode,
  defaultExchangeRates,
  ExchangeRates,
} from '@/utils/currency';

type PreferencesState = {
  displayCurrency: AppCurrencyCode;
  exchangeRates: ExchangeRates;
  exchangeRatesDate: string | null;
  languageCode: AppLanguageCode;
  notificationsEnabled: boolean;
  setDisplayCurrency: (currencyCode: AppCurrencyCode) => void;
  setExchangeRates: (rates: ExchangeRates, date: string) => void;
  setLanguageCode: (languageCode: AppLanguageCode) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      displayCurrency: defaultCurrencyCode,
      exchangeRates: defaultExchangeRates,
      exchangeRatesDate: null,
      languageCode: defaultLanguageCode,
      notificationsEnabled: false,
      setDisplayCurrency: (displayCurrency) => set({ displayCurrency }),
      setExchangeRates: (exchangeRates, exchangeRatesDate) =>
        set({ exchangeRates, exchangeRatesDate }),
      setLanguageCode: (languageCode) => set({ languageCode }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
    }),
    {
      name: 'preferences-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

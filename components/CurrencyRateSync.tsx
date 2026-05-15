import { useEffect } from 'react';

import { usePreferencesStore } from '@/store/preferencesStore';
import { fetchDailyExchangeRates, getTodayKey } from '@/utils/currency';

export function CurrencyRateSync() {
  const exchangeRatesDate = usePreferencesStore((state) => state.exchangeRatesDate);
  const setExchangeRates = usePreferencesStore((state) => state.setExchangeRates);

  useEffect(() => {
    if (exchangeRatesDate === getTodayKey()) {
      return;
    }

    let isMounted = true;

    fetchDailyExchangeRates()
      .then(({ date, rates }) => {
        if (isMounted) {
          setExchangeRates(rates, date);
        }
      })
      .catch((error) => {
        console.warn('Failed to update exchange rates', error);
      });

    return () => {
      isMounted = false;
    };
  }, [exchangeRatesDate, setExchangeRates]);

  return null;
}

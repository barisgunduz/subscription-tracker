import { useEffect } from 'react';

import { usePreferencesStore } from '@/store/preferencesStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { syncUpcomingPaymentsWidgetAsync } from '@/utils/widgetSync';

export function WidgetSync() {
  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const displayCurrency = usePreferencesStore((state) => state.displayCurrency);
  const exchangeRates = usePreferencesStore((state) => state.exchangeRates);
  const languageCode = usePreferencesStore((state) => state.languageCode);

  useEffect(() => {
    syncUpcomingPaymentsWidgetAsync().catch((error) => {
      console.warn('Failed to sync upcoming payments widget', error);
    });
  }, [displayCurrency, exchangeRates, languageCode, subscriptions]);

  return null;
}

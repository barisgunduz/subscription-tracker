import { useEffect } from 'react';

import { usePreferencesStore } from '@/store/preferencesStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { syncUpcomingPaymentsWidgetAsync } from '@/utils/widgetSync';

const retryDelaysMs = [500, 1500, 4000];

function syncWidget() {
  syncUpcomingPaymentsWidgetAsync().catch((error) => {
    console.warn('Failed to sync upcoming payments widget', error);
  });
}

export function WidgetSync() {
  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const displayCurrency = usePreferencesStore((state) => state.displayCurrency);
  const exchangeRates = usePreferencesStore((state) => state.exchangeRates);
  const languageCode = usePreferencesStore((state) => state.languageCode);

  useEffect(() => {
    syncWidget();
  }, [displayCurrency, exchangeRates, languageCode, subscriptions]);

  useEffect(() => {
    const retryTimeouts = retryDelaysMs.map((delay) => setTimeout(syncWidget, delay));
    const unsubscribers = [
      useSubscriptionStore.persist.onFinishHydration(syncWidget),
      usePreferencesStore.persist.onFinishHydration(syncWidget),
    ];

    return () => {
      retryTimeouts.forEach(clearTimeout);
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  return null;
}

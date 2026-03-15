import { useEffect } from 'react';

import { usePreferencesStore } from '@/store/preferencesStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import {
  disableBillingNotificationsAsync,
  syncBillingNotificationsAsync,
} from '@/utils/notifications';

export function NotificationSync() {
  const notificationsEnabled = usePreferencesStore((state) => state.notificationsEnabled);
  const subscriptions = useSubscriptionStore((state) => state.subscriptions);

  useEffect(() => {
    let cancelled = false;

    async function syncNotifications() {
      try {
        if (!notificationsEnabled) {
          await disableBillingNotificationsAsync();
          return;
        }

        await syncBillingNotificationsAsync(subscriptions);
      } catch (error) {
        if (!cancelled) {
          console.warn('Failed to sync billing notifications', error);
        }
      }
    }

    void syncNotifications();

    return () => {
      cancelled = true;
    };
  }, [notificationsEnabled, subscriptions]);

  return null;
}

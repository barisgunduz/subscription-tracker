import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { Subscription } from '@/types/subscription';

const CHANNEL_ID = 'billing-reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function startOfToday() {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getDaysRemaining(nextBillingDate: string) {
  const today = startOfToday();
  const billingDate = new Date(nextBillingDate);
  const normalizedBillingDate = new Date(
    billingDate.getFullYear(),
    billingDate.getMonth(),
    billingDate.getDate()
  );

  const differenceInMs = normalizedBillingDate.getTime() - today.getTime();

  return Math.max(0, Math.ceil(differenceInMs / (1000 * 60 * 60 * 24)));
}

function buildReminderCopy(subscriptions: Subscription[]) {
  const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === 'active');
  const dueToday = activeSubscriptions.filter(
    (subscription) => getDaysRemaining(subscription.nextBillingDate) === 0
  );
  const dueSoon = activeSubscriptions.filter((subscription) => {
    const daysRemaining = getDaysRemaining(subscription.nextBillingDate);
    return daysRemaining > 0 && daysRemaining <= 3;
  });

  if (dueToday.length > 0) {
    const leadName = dueToday[0]?.name;
    const suffix = dueToday.length > 1 ? ` and ${dueToday.length - 1} more` : '';

    return {
      title: 'Renewals due today',
      body: `${leadName}${suffix} ${dueToday.length > 1 ? 'are' : 'is'} ready for review today.`,
    };
  }

  if (dueSoon.length > 0) {
    const soonest = [...dueSoon].sort(
      (left, right) =>
        new Date(left.nextBillingDate).getTime() - new Date(right.nextBillingDate).getTime()
    )[0];
    const days = getDaysRemaining(soonest.nextBillingDate);

    return {
      title: 'Upcoming billing reminder',
      body: `${soonest.name} renews in ${days} day${days === 1 ? '' : 's'}. Check your upcoming payments.`,
    };
  }

  return {
    title: 'Subscription check-in',
    body:
      activeSubscriptions.length > 0
        ? `You have ${activeSubscriptions.length} active subscriptions. Take a quick look at your spending today.`
        : 'Add your first subscription to start getting reminder insights.',
  };
}

async function ensureChannelAsync() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Billing reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
    vibrationPattern: [0, 150, 80, 150],
    lightColor: '#4E7A6C',
  });
}

export async function requestNotificationPermissionAsync() {
  const existing = await Notifications.getPermissionsAsync();

  if (existing.granted || existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
    },
  });

  return (
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function disableBillingNotificationsAsync() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function syncBillingNotificationsAsync(subscriptions: Subscription[]) {
  await ensureChannelAsync();
  await disableBillingNotificationsAsync();

  const content = buildReminderCopy(subscriptions);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: content.body,
      sound: 'default',
    },
    trigger:
      Platform.OS === 'android'
        ? {
            type: 'daily',
            hour: 9,
            minute: 0,
            channelId: CHANNEL_ID,
          }
        : {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            hour: 9,
            minute: 0,
            repeats: true,
          },
  });
}

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { usePreferencesStore } from '@/store/preferencesStore';
import { Subscription } from '@/types/subscription';
import { translate, TranslationKey } from '@/utils/i18n';

const CHANNEL_ID = 'billing-reminders';
const REMINDER_HOUR = 9;
const REMINDER_MINUTE = 0;
const MAX_SCHEDULED_REMINDERS = 60;
const SCHEDULE_WINDOW_DAYS = 370;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type ReminderKind = 'due' | 'oneDayBefore';

type BillingReminder = {
  date: Date;
  subscription: Subscription;
  kind: ReminderKind;
};

function startOfToday() {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function getDaysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function clampDay(year: number, monthIndex: number, day: number) {
  return Math.max(1, Math.min(day, getDaysInMonth(year, monthIndex)));
}

function addBillingCycle(date: Date, subscription: Subscription) {
  const nextMonthIndex =
    subscription.billingCycle === 'monthly' ? date.getMonth() + 1 : date.getMonth() + 12;
  const nextYear = date.getFullYear() + Math.floor(nextMonthIndex / 12);
  const normalizedMonthIndex = ((nextMonthIndex % 12) + 12) % 12;

  return new Date(
    nextYear,
    normalizedMonthIndex,
    clampDay(nextYear, normalizedMonthIndex, subscription.billingDay)
  );
}

function withReminderTime(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    REMINDER_HOUR,
    REMINDER_MINUTE
  );
}

function buildReminderContent(subscription: Subscription, kind: ReminderKind) {
  const languageCode = usePreferencesStore.getState().languageCode;
  const t = (key: TranslationKey, params?: Record<string, string | number>) =>
    translate(languageCode, key, params);

  if (kind === 'due') {
    return {
      title: t('upcomingPayments'),
      body: `${subscription.name} ${t('due')}`,
    };
  }

  return {
    title: t('upcomingPayments'),
    body: `${subscription.name}: ${t('oneDayLeft')}`,
  };
}

function buildBillingReminders(subscriptions: Subscription[]) {
  const now = new Date();
  const today = startOfToday();
  const scheduleUntil = addDays(today, SCHEDULE_WINDOW_DAYS);
  const reminders: BillingReminder[] = [];

  for (const subscription of subscriptions) {
    if (subscription.status !== 'active') {
      continue;
    }

    let billingDate = parseLocalDate(subscription.nextBillingDate);

    if (!billingDate) {
      continue;
    }

    while (billingDate < today) {
      billingDate = addBillingCycle(billingDate, subscription);
    }

    while (billingDate <= scheduleUntil) {
      const dueReminderDate = withReminderTime(billingDate);
      const beforeReminderDate = withReminderTime(addDays(billingDate, -1));

      if (beforeReminderDate > now) {
        reminders.push({
          date: beforeReminderDate,
          subscription,
          kind: 'oneDayBefore',
        });
      }

      if (dueReminderDate > now) {
        reminders.push({
          date: dueReminderDate,
          subscription,
          kind: 'due',
        });
      }

      billingDate = addBillingCycle(billingDate, subscription);
    }
  }

  return reminders
    .sort((left, right) => left.date.getTime() - right.date.getTime())
    .slice(0, MAX_SCHEDULED_REMINDERS);
}

async function ensureChannelAsync() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Substrack',
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

  const reminders = buildBillingReminders(subscriptions);

  await Promise.all(
    reminders.map((reminder) => {
      const content = buildReminderContent(reminder.subscription, reminder.kind);

      return Notifications.scheduleNotificationAsync({
        content: {
          title: content.title,
          body: content.body,
          sound: 'default',
          data: {
            subscriptionId: reminder.subscription.id,
            reminderKind: reminder.kind,
            scheduledFor: reminder.date.toISOString(),
          },
        },
        trigger:
          Platform.OS === 'android'
            ? {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: reminder.date,
                channelId: CHANNEL_ID,
              }
            : {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: reminder.date,
              },
      });
    })
  );
}

export async function getScheduledBillingNotificationsAsync() {
  return Notifications.getAllScheduledNotificationsAsync();
}

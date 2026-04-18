import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';

import { BillingCycle, Subscription } from '@/types/subscription';

type CreateSubscriptionInput = Omit<Subscription, 'id' | 'nextBillingDate'> & {
  id?: string;
  nextBillingDate?: string;
};

type UpdateSubscriptionInput = Partial<Omit<Subscription, 'id' | 'nextBillingDate'>> & {
  nextBillingDate?: string;
};

type SubscriptionStore = {
  subscriptions: Subscription[];
  addSubscription: (subscription: CreateSubscriptionInput) => void;
  updateSubscription: (id: string, updates: UpdateSubscriptionInput) => void;
  deleteSubscription: (id: string) => void;
  clearAllSubscriptions: () => void;
  pauseSubscription: (id: string) => void;
  restartSubscription: (id: string) => void;
  calculateNextBillingDate: (
    billingCycle: BillingCycle,
    billingDay: number,
    startDate: string,
    fromDate?: string
  ) => string;
};

const STORAGE_KEY = 'subscription-storage';
const memoryStorage = new Map<string, string>();

const safeStorage: StateStorage = {
  getItem: async (name) => {
    try {
      const value = await AsyncStorage.getItem(name);

      return value ?? memoryStorage.get(name) ?? null;
    } catch {
      return memoryStorage.get(name) ?? null;
    }
  },
  setItem: async (name, value) => {
    memoryStorage.set(name, value);

    try {
      await AsyncStorage.setItem(name, value);
    } catch {
      // Fall back to in-memory storage when the native module is unavailable.
    }
  },
  removeItem: async (name) => {
    memoryStorage.delete(name);

    try {
      await AsyncStorage.removeItem(name);
    } catch {
      // Ignore removal errors when the native module is unavailable.
    }
  },
};

function generateSubscriptionId() {
  return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function parseDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date value: ${value}`);
  }

  return date;
}

function toIsoDate(date: Date) {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function getDaysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function clampBillingDay(year: number, monthIndex: number, billingDay: number) {
  return Math.max(1, Math.min(billingDay, getDaysInMonth(year, monthIndex)));
}

function createCandidateDate(year: number, monthIndex: number, billingDay: number) {
  return new Date(year, monthIndex, clampBillingDay(year, monthIndex, billingDay));
}

function calculateNextBillingDateInternal(
  billingCycle: BillingCycle,
  billingDay: number,
  startDate: string,
  fromDate?: string
) {
  const anchorDate = parseDate(startDate);
  const referenceDate = fromDate ? parseDate(fromDate) : new Date();
  const normalizedReference = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  let candidate = createCandidateDate(
    normalizedReference.getFullYear(),
    normalizedReference.getMonth(),
    billingDay
  );

  if (billingCycle === 'monthly') {
    if (candidate < normalizedReference) {
      candidate = createCandidateDate(candidate.getFullYear(), candidate.getMonth() + 1, billingDay);
    }

    if (candidate < anchorDate) {
      candidate = createCandidateDate(anchorDate.getFullYear(), anchorDate.getMonth(), billingDay);

      if (candidate < anchorDate) {
        candidate = createCandidateDate(
          anchorDate.getFullYear(),
          anchorDate.getMonth() + 1,
          billingDay
        );
      }
    }

    return toIsoDate(candidate);
  }

  candidate = createCandidateDate(
    normalizedReference.getFullYear(),
    anchorDate.getMonth(),
    billingDay
  );

  if (candidate < normalizedReference) {
    candidate = createCandidateDate(candidate.getFullYear() + 1, anchorDate.getMonth(), billingDay);
  }

  if (candidate < anchorDate) {
    candidate = createCandidateDate(anchorDate.getFullYear(), anchorDate.getMonth(), billingDay);

    if (candidate < anchorDate) {
      candidate = createCandidateDate(anchorDate.getFullYear() + 1, anchorDate.getMonth(), billingDay);
    }
  }

  return toIsoDate(candidate);
}

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set) => ({
      subscriptions: [],

      addSubscription: (subscription) =>
        set((state) => {
          const renewalDate = subscription.renewalDate ?? subscription.startDate;
          const nextBillingDate =
            subscription.nextBillingDate ??
            calculateNextBillingDateInternal(
              subscription.billingCycle,
              subscription.billingDay,
              renewalDate
            );

          const newSubscription: Subscription = {
            ...subscription,
            id: subscription.id ?? generateSubscriptionId(),
            renewalDate,
            nextBillingDate,
          };

          return {
            subscriptions: [...state.subscriptions, newSubscription],
          };
        }),

      updateSubscription: (id, updates) =>
        set((state) => ({
          subscriptions: state.subscriptions.map((subscription) => {
            if (subscription.id !== id) {
              return subscription;
            }

            const merged = {
              ...subscription,
              ...updates,
            };

            return {
              ...merged,
              nextBillingDate:
                updates.nextBillingDate ??
                calculateNextBillingDateInternal(
                  merged.billingCycle,
                  merged.billingDay,
                  merged.renewalDate
                ),
            };
          }),
        })),

      deleteSubscription: (id) =>
        set((state) => ({
          subscriptions: state.subscriptions.filter((subscription) => subscription.id !== id),
        })),

      clearAllSubscriptions: () =>
        set({
          subscriptions: [],
        }),

      pauseSubscription: (id) =>
        set((state) => ({
          subscriptions: state.subscriptions.map((subscription) =>
            subscription.id === id
              ? {
                  ...subscription,
                  status: 'paused',
                }
              : subscription
          ),
        })),

      restartSubscription: (id) =>
        set((state) => ({
          subscriptions: state.subscriptions.map((subscription) => {
            if (subscription.id !== id) {
              return subscription;
            }

            const restartedAt = new Date();
            const restartedRenewalDate = toIsoDate(restartedAt);
            const restartedBillingDay = restartedAt.getDate();
            const nextReferenceDate = toIsoDate(addDays(restartedAt, 1));

            return {
              ...subscription,
              status: 'active',
              renewalDate: restartedRenewalDate,
              billingDay: restartedBillingDay,
              nextBillingDate: calculateNextBillingDateInternal(
                subscription.billingCycle,
                restartedBillingDay,
                restartedRenewalDate,
                nextReferenceDate
              ),
            };
          }),
        })),

      calculateNextBillingDate: (billingCycle, billingDay, startDate, fromDate) =>
        calculateNextBillingDateInternal(billingCycle, billingDay, startDate, fromDate),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => safeStorage),
      merge: (persistedState, currentState) => {
        const typedState = persistedState as Partial<SubscriptionStore> | undefined;

        if (!typedState?.subscriptions) {
          return currentState;
        }

        return {
          ...currentState,
          ...typedState,
          subscriptions: typedState.subscriptions.map((subscription) => ({
            ...subscription,
            renewalDate: subscription.renewalDate ?? subscription.startDate,
          })),
        };
      },
      partialize: (state) => ({
        subscriptions: state.subscriptions,
      }),
    }
  )
);

import { NativeModules, Platform } from 'react-native';

import { usePreferencesStore } from '@/store/preferencesStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { Subscription } from '@/types/subscription';
import {
  AppCurrencyCode,
  convertCurrency,
  ExchangeRates,
  formatCurrency,
} from '@/utils/currency';

type WidgetPayment = {
  id: string;
  name: string;
  formattedPrice: string;
  nextBillingDate: string;
};

type WidgetPayload = {
  version: number;
  generatedAt: string;
  languageCode: string;
  locale: string;
  monthlyTotal: string;
  payments: WidgetPayment[];
};

type NativeWidgetModule = {
  saveWidgetData?: (payload: string) => Promise<void>;
};

const widgetModule = NativeModules.SubstrackWidget as NativeWidgetModule | undefined;

function getNormalizedMonthlyPrice(
  subscription: Subscription,
  displayCurrency: AppCurrencyCode,
  exchangeRates: ExchangeRates
) {
  const price = convertCurrency(
    subscription.price,
    subscription.currency,
    displayCurrency,
    exchangeRates
  );

  return subscription.billingCycle === 'monthly' ? price : price / 12;
}

function getWidgetLocale(languageCode: string) {
  return languageCode === 'tr' ? 'tr-TR' : 'en-US';
}

function buildWidgetPayload(): WidgetPayload {
  const subscriptions = useSubscriptionStore.getState().subscriptions;
  const { displayCurrency, exchangeRates, languageCode } = usePreferencesStore.getState();
  const locale = getWidgetLocale(languageCode);
  const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === 'active');
  const monthlyTotal = activeSubscriptions.reduce(
    (total, subscription) =>
      total + getNormalizedMonthlyPrice(subscription, displayCurrency, exchangeRates),
    0
  );

  const payments = [...activeSubscriptions]
    .sort(
      (left, right) =>
        new Date(left.nextBillingDate).getTime() - new Date(right.nextBillingDate).getTime()
    )
    .slice(0, 5)
    .map((subscription) => {
      const displayPrice = convertCurrency(
        subscription.price,
        subscription.currency,
        displayCurrency,
        exchangeRates
      );

      return {
        id: subscription.id,
        name: subscription.name,
        formattedPrice: formatCurrency(displayPrice, displayCurrency, locale),
        nextBillingDate: subscription.nextBillingDate,
      };
    });

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    languageCode,
    locale,
    monthlyTotal: formatCurrency(monthlyTotal, displayCurrency, locale),
    payments,
  };
}

export async function syncUpcomingPaymentsWidgetAsync() {
  if (Platform.OS !== 'ios' || !widgetModule?.saveWidgetData) {
    return;
  }

  await widgetModule.saveWidgetData(JSON.stringify(buildWidgetPayload()));
}

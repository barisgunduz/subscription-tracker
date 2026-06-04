import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { HeaderBackButton } from '@react-navigation/elements';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { I18nManager } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import { CurrencyRateSync } from '@/components/CurrencyRateSync';
import { NotificationSync } from '@/components/NotificationSync';
import { WidgetSync } from '@/components/WidgetSync';
import { getAppLanguage } from '@/constants/languages';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useI18n } from '@/utils/i18n';

export const unstable_settings = {
  anchor: '(tabs)',
};

const minimumSplashDurationMs = 2000;
const splashStartedAt = Date.now();

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash can already be hidden during fast refresh or unsupported runtimes.
});

export default function RootLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const languageCode = usePreferencesStore((state) => state.languageCode);
  const tintColor = useThemeColor({}, 'tint');
  const { t } = useI18n();
  const handledNotificationResponseId = useRef<string | null>(null);

  function handleSettingsBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)/settings');
  }

  function handleSubscriptionsBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)/subscriptions');
  }

  const settingsBackButton = () => (
    <HeaderBackButton label={t('settings')} onPress={handleSettingsBack} tintColor={tintColor} />
  );
  const subscriptionsBackButton = () => (
    <HeaderBackButton label={t('back')} onPress={handleSubscriptionsBack} tintColor={tintColor} />
  );

  useEffect(() => {
    const remainingSplashTime = Math.max(
      minimumSplashDurationMs - (Date.now() - splashStartedAt),
      0
    );

    const timeout = setTimeout(() => {
      void SplashScreen.hideAsync().catch(() => {});
    }, remainingSplashTime);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const selectedLanguage = getAppLanguage(languageCode);

    I18nManager.allowRTL(true);
    I18nManager.forceRTL(Boolean(selectedLanguage.isRTL));
  }, [languageCode]);

  useEffect(() => {
    function openSubscriptionFromNotification(
      response: Notifications.NotificationResponse | null
    ) {
      if (!response) {
        return;
      }

      const responseId =
        response.notification.request.identifier ??
        response.notification.date?.toString() ??
        null;

      if (responseId && handledNotificationResponseId.current === responseId) {
        return;
      }

      const subscriptionId = response.notification.request.content.data?.subscriptionId;

      if (typeof subscriptionId !== 'string' || !subscriptionId) {
        return;
      }

      handledNotificationResponseId.current = responseId;
      router.push({
        pathname: '/(tabs)/subscriptions',
        params: { highlightId: subscriptionId },
      });
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(
      openSubscriptionFromNotification
    );

    void Notifications.getLastNotificationResponseAsync().then(openSubscriptionFromNotification);

    return () => {
      subscription.remove();
    };
  }, [router]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <CurrencyRateSync />
      <NotificationSync />
      <WidgetSync />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen
          name="subscription/add"
          options={{ presentation: 'modal', title: t('addSubscription') }}
        />
        <Stack.Screen
          name="subscription/detail"
          options={{
            title: t('subscriptions'),
            headerBackTitle: t('back'),
            headerLeft: subscriptionsBackButton,
          }}
        />
        <Stack.Screen
          name="subscription/edit"
          options={{ presentation: 'modal', title: t('editSubscription') }}
        />
        <Stack.Screen
          name="privacy-policy"
          options={{
            title: t('privacyPolicy'),
            headerBackTitle: t('settings'),
            headerLeft: settingsBackButton,
          }}
        />
        <Stack.Screen
          name="support"
          options={{
            title: t('support'),
            headerBackTitle: t('settings'),
            headerLeft: settingsBackButton,
          }}
        />
        <Stack.Screen
          name="language"
          options={{
            title: t('language'),
            headerBackTitle: t('settings'),
            headerLeft: settingsBackButton,
          }}
        />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

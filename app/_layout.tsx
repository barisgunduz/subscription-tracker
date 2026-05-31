import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { HeaderBackButton } from '@react-navigation/elements';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { I18nManager } from 'react-native';
import 'react-native-reanimated';

import { CurrencyRateSync } from '@/components/CurrencyRateSync';
import { NotificationSync } from '@/components/NotificationSync';
import { getAppLanguage } from '@/constants/languages';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useI18n } from '@/utils/i18n';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const languageCode = usePreferencesStore((state) => state.languageCode);
  const tintColor = useThemeColor({}, 'tint');
  const { t } = useI18n();

  function handleSettingsBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)/settings');
  }

  const settingsBackButton = () => (
    <HeaderBackButton label={t('settings')} onPress={handleSettingsBack} tintColor={tintColor} />
  );

  useEffect(() => {
    const selectedLanguage = getAppLanguage(languageCode);

    I18nManager.allowRTL(true);
    I18nManager.forceRTL(Boolean(selectedLanguage.isRTL));
  }, [languageCode]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <CurrencyRateSync />
      <NotificationSync />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen
          name="subscription/add"
          options={{ presentation: 'modal', title: t('addSubscription') }}
        />
        <Stack.Screen
          name="subscription/detail"
          options={{ title: t('subscriptions'), headerBackTitle: t('back') }}
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
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

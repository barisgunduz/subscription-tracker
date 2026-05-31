import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Switch, View } from 'react-native';
import Constants from 'expo-constants';

import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { AppThemeName } from '@/constants/colors';
import { getAppLanguage } from '@/constants/languages';
import { Spacing, Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { appCurrencies, getAppCurrency } from '@/utils/currency';
import { exportSubscriptions } from '@/utils/exportSubscriptions';
import { useI18n } from '@/utils/i18n';
import {
  disableBillingNotificationsAsync,
  requestNotificationPermissionAsync,
  syncBillingNotificationsAsync,
} from '@/utils/notifications';

type SettingsRowProps = {
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  trailing?: React.ReactNode;
  showBorder?: boolean;
};

function SettingsRow({
  label,
  value,
  onPress,
  destructive = false,
  trailing,
  showBorder = true,
}: SettingsRowProps) {
  const dividerColor = useThemeColor({}, 'divider');
  const secondaryText = useThemeColor({}, 'textSecondary');
  const dangerColor = useThemeColor({}, 'danger');

  const content = (
    <View
      style={[
        styles.row,
        showBorder ? { borderBottomColor: dividerColor, borderBottomWidth: 1 } : null,
      ]}>
      <View style={styles.rowCopy}>
        <ThemedText style={[styles.rowLabel, destructive ? { color: dangerColor } : null]}>
          {label}
        </ThemedText>
        {value ? <ThemedText style={[styles.rowValue, { color: secondaryText }]}>{value}</ThemedText> : null}
      </View>
      {trailing}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.82 : 1 }]}>
      {content}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const clearAllSubscriptions = useSubscriptionStore((state) => state.clearAllSubscriptions);
  const languageCode = usePreferencesStore((state) => state.languageCode);
  const displayCurrency = usePreferencesStore((state) => state.displayCurrency);
  const notificationsEnabled = usePreferencesStore((state) => state.notificationsEnabled);
  const theme = usePreferencesStore((state) => state.theme);
  const setDisplayCurrency = usePreferencesStore((state) => state.setDisplayCurrency);
  const setNotificationsEnabled = usePreferencesStore((state) => state.setNotificationsEnabled);
  const setTheme = usePreferencesStore((state) => state.setTheme);

  const tintColor = useThemeColor({}, 'tint');
  const surfaceSecondary = useThemeColor({}, 'surfaceSecondary');
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false);

  const appVersion =
    Constants.expoConfig?.version ??
    Constants.manifest2?.extra?.expoClient?.version ??
    '1.0.0';
  const selectedLanguage = getAppLanguage(languageCode);
  const selectedCurrency = getAppCurrency(displayCurrency);

  async function handleRunExport(format: 'json' | 'csv' | 'pdf') {
    try {
      await exportSubscriptions(subscriptions, format);
    } catch (error) {
      Alert.alert(
        t('exportFailed'),
        error instanceof Error ? error.message : t('exportFailedBody')
      );
    }
  }

  function handleExportData() {
    Alert.alert(t('exportSubscriptions'), t('chooseExportFormat'), [
      { text: t('cancel'), style: 'cancel' },
      { text: 'JSON', onPress: () => void handleRunExport('json') },
      { text: 'Excel (CSV)', onPress: () => void handleRunExport('csv') },
      { text: 'PDF', onPress: () => void handleRunExport('pdf') },
    ]);
  }

  function handleCurrencySelect() {
    Alert.alert(
      t('currency'),
      undefined,
      [
        ...appCurrencies.map((currency) => ({
          text: t('currencyValue', { code: currency.code, symbol: currency.symbol }),
          onPress: () => setDisplayCurrency(currency.code),
        })),
        { text: t('cancel'), style: 'cancel' as const },
      ]
    );
  }

  function handleThemeSelect() {
    const themeOptions: AppThemeName[] = ['light', 'dark'];

    Alert.alert(
      t('theme'),
      undefined,
      [
        ...themeOptions.map((option) => ({
          text: option === 'light' ? t('lightTheme') : t('darkTheme'),
          onPress: () => setTheme(option),
        })),
        { text: t('cancel'), style: 'cancel' as const },
      ]
    );
  }

  async function handleNotificationsToggle(nextValue: boolean) {
    if (isUpdatingNotifications) {
      return;
    }

    setIsUpdatingNotifications(true);

    try {
      if (!nextValue) {
        await disableBillingNotificationsAsync();
        setNotificationsEnabled(false);
        return;
      }

      const permissionGranted = await requestNotificationPermissionAsync();

      if (!permissionGranted) {
        Alert.alert(
          t('notificationsDisabled'),
          t('notificationsDisabledBody')
        );
        setNotificationsEnabled(false);
        return;
      }

      await syncBillingNotificationsAsync(subscriptions);
      setNotificationsEnabled(true);

      Alert.alert(
        t('billingRemindersEnabled'),
        t('billingRemindersEnabledBody')
      );
    } catch (error) {
      setNotificationsEnabled(false);
      Alert.alert(
        t('notificationsUnavailable'),
        error instanceof Error ? error.message : t('notificationsUnavailableBody')
      );
    } finally {
      setIsUpdatingNotifications(false);
    }
  }

  function handleClearAll() {
    if (subscriptions.length === 0) {
      Alert.alert(t('noSubscriptions'), t('noSubscriptionsToClear'));
      return;
    }

    Alert.alert(t('clearAllSubscriptions'), t('clearAllSubscriptionsBody'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('clearAll'),
        style: 'destructive',
        onPress: () => clearAllSubscriptions(),
      },
    ]);
  }

  return (
    <ScreenContainer scrollable contentStyle={styles.container}>
      <Card padded={false}>
        <SettingsRow label={t('appVersion')} value={appVersion} />
        <SettingsRow
          label={t('notifications')}
          value={
            notificationsEnabled
              ? t('monthlyBillingReminders')
              : t('disabledByDefault')
          }
          trailing={
            <Switch
              disabled={isUpdatingNotifications}
              onValueChange={(value) => void handleNotificationsToggle(value)}
              value={notificationsEnabled}
              trackColor={{ false: surfaceSecondary, true: tintColor }}
              thumbColor="#FFFFFF"
            />
          }
        />
        <SettingsRow
          label={t('language')}
          value={t(`languageName_${selectedLanguage.code}`)}
          onPress={() => router.push('/language')}
        />
        <SettingsRow
          label={t('currency')}
          value={t('currencyValue', {
            code: selectedCurrency.code,
            symbol: selectedCurrency.symbol,
          })}
          onPress={handleCurrencySelect}
        />
        <SettingsRow
          label={t('theme')}
          value={theme === 'light' ? t('lightTheme') : t('darkTheme')}
          onPress={handleThemeSelect}
        />
        <SettingsRow
          label={t('dataExport')}
          value={t('dataExportValue')}
          onPress={handleExportData}
        />
        <SettingsRow
          label={t('support')}
          value={t('supportValue')}
          onPress={() => router.push('/support')}
        />
        <SettingsRow
          label={t('privacyPolicy')}
          value={t('privacyPolicyValue')}
          onPress={() => router.push('/privacy-policy')}
        />
        <SettingsRow
          destructive
          label={t('clearAllSubscriptions')}
          onPress={handleClearAll}
          showBorder={false}
        />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 88,
    gap: Spacing.lg,
  },
  row: {
    minHeight: 68,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    ...Typography.headline,
  },
  rowValue: {
    ...Typography.footnote,
  },
});

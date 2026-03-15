import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, View } from 'react-native';
import Constants from 'expo-constants';

import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { exportSubscriptions } from '@/utils/exportSubscriptions';
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
  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const clearAllSubscriptions = useSubscriptionStore((state) => state.clearAllSubscriptions);
  const notificationsEnabled = usePreferencesStore((state) => state.notificationsEnabled);
  const setNotificationsEnabled = usePreferencesStore((state) => state.setNotificationsEnabled);

  const tintColor = useThemeColor({}, 'tint');
  const surfaceSecondary = useThemeColor({}, 'surfaceSecondary');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const dangerColor = useThemeColor({}, 'danger');
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false);

  const appVersion =
    Constants.expoConfig?.version ??
    Constants.manifest2?.extra?.expoClient?.version ??
    '1.0.0';

  async function handleRunExport(format: 'json' | 'csv' | 'pdf') {
    try {
      await exportSubscriptions(subscriptions, format);
    } catch (error) {
      Alert.alert(
        'Export failed',
        error instanceof Error ? error.message : 'Something went wrong while exporting data.'
      );
    }
  }

  function handleExportData() {
    Alert.alert('Export subscriptions', 'Choose an export format.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'JSON', onPress: () => void handleRunExport('json') },
      { text: 'Excel (CSV)', onPress: () => void handleRunExport('csv') },
      { text: 'PDF', onPress: () => void handleRunExport('pdf') },
    ]);
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
          'Notifications disabled',
          'Permission was not granted, so reminders will stay off.'
        );
        setNotificationsEnabled(false);
        return;
      }

      await syncBillingNotificationsAsync(subscriptions);
      setNotificationsEnabled(true);

      Alert.alert(
        'Billing reminders enabled',
        'You will receive a daily reminder at 9:00 AM with upcoming renewal insights.'
      );
    } catch (error) {
      setNotificationsEnabled(false);
      Alert.alert(
        'Notifications unavailable',
        error instanceof Error ? error.message : 'Failed to update notification settings.'
      );
    } finally {
      setIsUpdatingNotifications(false);
    }
  }

  function handleClearAll() {
    if (subscriptions.length === 0) {
      Alert.alert('No subscriptions', 'There are no subscriptions to clear.');
      return;
    }

    Alert.alert('Clear all subscriptions', 'This will remove all saved subscriptions.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: () => clearAllSubscriptions(),
      },
    ]);
  }

  return (
    <ScreenContainer scrollable contentStyle={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Settings</ThemedText>
        <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
          App preferences, data controls, and future account settings.
        </ThemedText>
      </View>

      <Card padded={false}>
        <SettingsRow label="App Version" value={appVersion} />
        <SettingsRow
          label="Notifications"
          value={
            notificationsEnabled
              ? 'Daily billing reminders at 9:00 AM'
              : 'Disabled by default'
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
          label="Data Export"
          value="JSON, Excel-compatible CSV, or PDF"
          onPress={handleExportData}
        />
        <SettingsRow
          destructive
          label="Clear All Subscriptions"
          onPress={handleClearAll}
          showBorder={false}
        />
      </Card>

      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>Future</ThemedText>
        <View style={[styles.futureBadge, { backgroundColor: surfaceSecondary }]}>
          <ThemedText style={[styles.futureBadgeText, { color: dangerColor }]}>Placeholder</ThemedText>
        </View>
      </View>

      <Card padded={false}>
        <SettingsRow label="Account" value="Coming soon" />
        <SettingsRow label="Email" value="Coming soon" />
        <SettingsRow label="Password" value="Coming soon" showBorder={false} />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 120,
    gap: Spacing.lg,
  },
  header: {
    gap: Spacing.xs,
  },
  title: {
    ...Typography.largeTitle,
  },
  subtitle: {
    ...Typography.callout,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  sectionTitle: {
    ...Typography.title2,
  },
  futureBadge: {
    minHeight: 30,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  futureBadgeText: {
    ...Typography.caption,
  },
});

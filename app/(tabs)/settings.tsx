import { useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Switch, View } from 'react-native';
import Constants from 'expo-constants';

import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSubscriptionStore } from '@/store/subscriptionStore';

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

  const tintColor = useThemeColor({}, 'tint');
  const surfaceSecondary = useThemeColor({}, 'surfaceSecondary');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const dangerColor = useThemeColor({}, 'danger');

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const appVersion =
    Constants.expoConfig?.version ??
    Constants.manifest2?.extra?.expoClient?.version ??
    '1.0.0';

  async function handleExportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      subscriptions,
    };

    await Share.share({
      message: JSON.stringify(payload, null, 2),
      title: 'Subscription Tracker Export',
    });
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
          value={notificationsEnabled ? 'Enabled' : 'Disabled'}
          trailing={
            <Switch
              onValueChange={setNotificationsEnabled}
              value={notificationsEnabled}
              trackColor={{ false: surfaceSecondary, true: tintColor }}
              thumbColor="#FFFFFF"
            />
          }
        />
        <SettingsRow label="Data Export" value="Export subscriptions as JSON" onPress={handleExportData} />
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

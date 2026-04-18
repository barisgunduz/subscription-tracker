import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ServiceLogo } from '@/components/ServiceLogo';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSubscriptionStore } from '@/store/subscriptionStore';

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

type DetailRowProps = {
  label: string;
  value: string;
};

function DetailRow({ label, value }: DetailRowProps) {
  const secondaryText = useThemeColor({}, 'textSecondary');
  const dividerColor = useThemeColor({}, 'divider');

  return (
    <View style={[styles.detailRow, { borderBottomColor: dividerColor }]}>
      <ThemedText style={[styles.detailLabel, { color: secondaryText }]}>{label}</ThemedText>
      <ThemedText style={styles.detailValue}>{value}</ThemedText>
    </View>
  );
}

export default function SubscriptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const router = useRouter();
  const subscriptionId = Array.isArray(id) ? id[0] : id;

  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const pauseSubscription = useSubscriptionStore((state) => state.pauseSubscription);
  const restartSubscription = useSubscriptionStore((state) => state.restartSubscription);
  const deleteSubscription = useSubscriptionStore((state) => state.deleteSubscription);

  const tintColor = useThemeColor({}, 'tint');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const surfaceSecondary = useThemeColor({}, 'surfaceSecondary');
  const dangerColor = useThemeColor({}, 'danger');
  const borderColor = useThemeColor({}, 'border');

  const subscription = subscriptions.find((item) => item.id === subscriptionId);

  if (!subscription) {
    return (
      <ScreenContainer contentStyle={styles.notFoundContainer}>
        <Card>
          <ThemedText style={styles.notFoundTitle}>Subscription not found</ThemedText>
          <ThemedText style={[styles.notFoundCopy, { color: textSecondary }]}>
            This item may have been deleted or the link is invalid.
          </ThemedText>
          <View style={styles.notFoundAction}>
            <PrimaryButton onPress={() => router.back()} title="Go Back" />
          </View>
        </Card>
      </ScreenContainer>
    );
  }

  const currentSubscription = subscription;

  function handlePause() {
    if (currentSubscription.status === 'paused') {
      Alert.alert('Restart subscription', `Restart ${currentSubscription.name} today?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restart',
          onPress: () => restartSubscription(currentSubscription.id),
        },
      ]);
      return;
    }

    Alert.alert('Pause subscription', `Pause ${currentSubscription.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Pause',
        onPress: () => pauseSubscription(currentSubscription.id),
      },
    ]);
  }

  function handleDelete() {
    Alert.alert('Delete subscription', `Delete ${currentSubscription.name}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteSubscription(currentSubscription.id);
          router.replace('/(tabs)/subscriptions');
        },
      },
    ]);
  }

  function handleEdit() {
    router.push({
      pathname: '/subscription/edit',
      params: { id: currentSubscription.id },
    });
  }

  return (
    <ScreenContainer scrollable includeTopInset={false} contentStyle={styles.container}>
      <Card style={styles.heroCard}>
        <ServiceLogo
          serviceKey={currentSubscription.serviceKey}
          name={currentSubscription.name}
          size={72}
          style={[styles.logoBadge, { backgroundColor: surfaceSecondary }]}
        />

        <View style={styles.heroCopy}>
          <ThemedText style={styles.title}>{currentSubscription.name}</ThemedText>
          <ThemedText style={[styles.heroMeta, { color: textSecondary }]}>
            {formatCurrency(currentSubscription.price, currentSubscription.currency)} ·{' '}
            {currentSubscription.billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}
          </ThemedText>
          <View style={[styles.statusPill, { backgroundColor: surfaceSecondary, borderColor }]}>
            <ThemedText style={[styles.statusText, { color: tintColor }]}>
              {currentSubscription.status}
            </ThemedText>
          </View>
        </View>
      </Card>

      <Card padded={false}>
        <DetailRow
          label="Price"
          value={formatCurrency(currentSubscription.price, currentSubscription.currency)}
        />
        <DetailRow
          label="Billing Cycle"
          value={currentSubscription.billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}
        />
        <DetailRow label="Billing Day" value={String(currentSubscription.billingDay)} />
        <DetailRow label="Start Date" value={formatDate(currentSubscription.startDate)} />
        <DetailRow label="Renewal Date" value={formatDate(currentSubscription.renewalDate)} />
        <DetailRow
          label="Next Billing Date"
          value={formatDate(currentSubscription.nextBillingDate)}
        />
        <DetailRow label="Category" value={currentSubscription.category} />
        <View style={styles.notesRow}>
          <ThemedText style={[styles.detailLabel, { color: textSecondary }]}>Notes</ThemedText>
          <ThemedText style={styles.notesValue}>
            {currentSubscription.notes.trim() ? currentSubscription.notes : 'No notes'}
          </ThemedText>
        </View>
      </Card>

      <View style={styles.actions}>
        <PrimaryButton onPress={handleEdit} title="Edit" />

        <Pressable
          accessibilityRole="button"
          onPress={handlePause}
          style={({ pressed }) => [
            styles.secondaryAction,
            {
              backgroundColor: surfaceSecondary,
              borderColor,
              opacity: pressed ? 0.88 : 1,
            },
          ]}>
          <ThemedText style={styles.secondaryActionText}>
            {currentSubscription.status === 'paused' ? 'Renew' : 'Pause'}
          </ThemedText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={handleDelete}
          style={({ pressed }) => [
            styles.dangerAction,
            {
              borderColor: dangerColor,
              opacity: pressed ? 0.88 : 1,
            },
          ]}>
          <ThemedText style={[styles.dangerActionText, { color: dangerColor }]}>Delete</ThemedText>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.md,
    paddingBottom: 32,
    gap: Spacing.lg,
  },
  notFoundContainer: {
    justifyContent: 'center',
  },
  notFoundTitle: {
    ...Typography.title2,
  },
  notFoundCopy: {
    ...Typography.callout,
    marginTop: Spacing.xs,
  },
  notFoundAction: {
    marginTop: Spacing.md,
  },
  heroCard: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  logoBadge: {
    borderRadius: Radius.lg,
  },
  heroCopy: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  title: {
    ...Typography.title1,
    textAlign: 'center',
  },
  heroMeta: {
    ...Typography.callout,
    textAlign: 'center',
  },
  statusPill: {
    marginTop: Spacing.xs,
    minHeight: 32,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    ...Typography.caption,
    textTransform: 'capitalize',
  },
  detailRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.xs,
  },
  notesRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  detailLabel: {
    ...Typography.footnote,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    ...Typography.body,
  },
  notesValue: {
    ...Typography.body,
    minHeight: 24,
  },
  actions: {
    gap: Spacing.sm,
  },
  secondaryAction: {
    minHeight: 54,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  secondaryActionText: {
    ...Typography.button,
  },
  dangerAction: {
    minHeight: 54,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    backgroundColor: 'transparent',
  },
  dangerActionText: {
    ...Typography.button,
  },
});

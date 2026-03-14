import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { ListItem } from '@/components/ListItem';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { Subscription } from '@/types/subscription';

function getNormalizedMonthlyPrice(subscription: Subscription) {
  return subscription.billingCycle === 'monthly' ? subscription.price : subscription.price / 12;
}

function getYearlyProjection(subscription: Subscription) {
  return subscription.billingCycle === 'monthly' ? subscription.price * 12 : subscription.price;
}

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

function getLogoFallback(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return '?';
  }

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

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

function formatDaysRemaining(daysRemaining: number) {
  if (daysRemaining === 0) {
    return 'Today';
  }

  if (daysRemaining === 1) {
    return '1 day left';
  }

  return `${daysRemaining} days left`;
}

type MetricCardProps = {
  label: string;
  value: string;
  accent?: string;
};

function MetricCard({ label, value, accent }: MetricCardProps) {
  return (
    <Card style={styles.metricCard}>
      <ThemedText style={[styles.metricLabel, accent ? { color: accent } : null]}>{label}</ThemedText>
      <ThemedText style={styles.metricValue}>{value}</ThemedText>
    </Card>
  );
}

export default function HomeScreen() {
  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const tintColor = useThemeColor({}, 'tint');
  const secondaryText = useThemeColor({}, 'textSecondary');
  const mutedTint = useThemeColor({}, 'tintMuted');
  const surfaceSecondary = useThemeColor({}, 'surfaceSecondary');

  const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === 'active');
  const activeCount = activeSubscriptions.length;

  const monthlyTotal = activeSubscriptions.reduce(
    (total, subscription) => total + getNormalizedMonthlyPrice(subscription),
    0
  );

  const yearlyProjection = activeSubscriptions.reduce(
    (total, subscription) => total + getYearlyProjection(subscription),
    0
  );

  const displayCurrency = activeSubscriptions[0]?.currency ?? 'USD';

  const upcomingPayments = [...activeSubscriptions]
    .sort(
      (left, right) =>
        new Date(left.nextBillingDate).getTime() - new Date(right.nextBillingDate).getTime()
    )
    .slice(0, 5);

  return (
    <ScreenContainer scrollable contentStyle={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Dashboard</ThemedText>
        <ThemedText style={[styles.subtitle, { color: secondaryText }]}>
          Track recurring spending and upcoming renewals.
        </ThemedText>
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard label="Active Subscriptions" value={String(activeCount)} accent={tintColor} />
        <MetricCard
          label="Monthly Total"
          value={formatCurrency(monthlyTotal, displayCurrency)}
          accent={tintColor}
        />
        <MetricCard
          label="Yearly Projection"
          value={formatCurrency(yearlyProjection, displayCurrency)}
          accent={tintColor}
        />
      </View>

      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>Upcoming Payments</ThemedText>
        <ThemedText style={[styles.sectionMeta, { color: secondaryText }]}>
          Next 5 payments
        </ThemedText>
      </View>

      <View style={styles.list}>
        {upcomingPayments.length === 0 ? (
          <Card>
            <ThemedText style={styles.emptyTitle}>No upcoming payments</ThemedText>
            <ThemedText style={[styles.emptyCopy, { color: secondaryText }]}>
              Add subscriptions to see the next renewals here.
            </ThemedText>
          </Card>
        ) : (
          upcomingPayments.map((subscription) => {
            const daysRemaining = getDaysRemaining(subscription.nextBillingDate);

            return (
              <ListItem
                key={subscription.id}
                title={subscription.name}
                subtitle={formatDaysRemaining(daysRemaining)}
                leading={
                  <View style={[styles.logoBadge, { backgroundColor: mutedTint }]}>
                    <ThemedText style={styles.logoBadgeText}>
                      {getLogoFallback(subscription.name)}
                    </ThemedText>
                  </View>
                }
                trailing={
                  <View style={styles.trailing}>
                    <ThemedText style={styles.priceText}>
                      {formatCurrency(subscription.price, subscription.currency)}
                    </ThemedText>
                    <View style={[styles.dayPill, { backgroundColor: surfaceSecondary }]}>
                      <ThemedText style={[styles.dayPillText, { color: secondaryText }]}>
                        {daysRemaining === 0 ? 'Due' : `${daysRemaining}d`}
                      </ThemedText>
                    </View>
                  </View>
                }
              />
            );
          })
        )}
      </View>
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
  metricsGrid: {
    gap: Spacing.sm,
  },
  metricCard: {
    minHeight: 104,
    justifyContent: 'space-between',
  },
  metricLabel: {
    ...Typography.footnote,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metricValue: {
    ...Typography.title1,
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
  sectionMeta: {
    ...Typography.footnote,
  },
  list: {
    gap: Spacing.sm,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadgeText: {
    ...Typography.headline,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  priceText: {
    ...Typography.headline,
  },
  dayPill: {
    minWidth: 48,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillText: {
    ...Typography.caption,
  },
  emptyTitle: {
    ...Typography.headline,
  },
  emptyCopy: {
    ...Typography.callout,
    marginTop: Spacing.xs,
  },
});

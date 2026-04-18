import { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { ListItem } from '@/components/ListItem';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ServiceLogo } from '@/components/ServiceLogo';
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
  eyebrow: string;
  label: string;
  value: string;
  accent: string;
  backgroundColor: string;
  icon: ComponentProps<typeof Ionicons>['name'];
};

function MetricCard({ eyebrow, label, value, accent, backgroundColor, icon }: MetricCardProps) {
  return (
    <Card style={[styles.metricCard, { backgroundColor, borderColor: backgroundColor }]}>
      <View style={[styles.metricOrb, { backgroundColor: accent }]} />
      <View style={styles.metricTopRow}>
        <View style={[styles.metricIconWrap, { backgroundColor: accent }]}>
          <Ionicons name={icon} size={18} color="#FFFFFF" />
        </View>
        <ThemedText style={[styles.metricEyebrow, { color: accent }]}>{eyebrow}</ThemedText>
      </View>
      <View style={styles.metricBody}>
        <ThemedText style={styles.metricValue}>{value}</ThemedText>
        <ThemedText style={styles.metricLabel}>{label}</ThemedText>
      </View>
    </Card>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const secondaryText = useThemeColor({}, 'textSecondary');
  const mutedTint = useThemeColor({}, 'tintMuted');
  const surfaceSecondary = useThemeColor({}, 'surfaceSecondary');
  const accentBlue = useThemeColor({}, 'accentBlue');
  const accentBlueSoft = useThemeColor({}, 'accentBlueSoft');
  const accentMint = useThemeColor({}, 'accentMint');
  const accentMintSoft = useThemeColor({}, 'accentMintSoft');
  const accentPeach = useThemeColor({}, 'accentPeach');
  const accentPeachSoft = useThemeColor({}, 'accentPeachSoft');
  const accentGold = useThemeColor({}, 'accentGold');
  const accentGoldSoft = useThemeColor({}, 'accentGoldSoft');

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

  const dueSoonCount = activeSubscriptions.filter(
    (subscription) => getDaysRemaining(subscription.nextBillingDate) <= 7
  ).length;

  const displayCurrency = activeSubscriptions[0]?.currency ?? 'USD';

  const upcomingPayments = [...activeSubscriptions]
    .sort(
      (left, right) =>
        new Date(left.nextBillingDate).getTime() - new Date(right.nextBillingDate).getTime()
    )
    .slice(0, 5);

  const metricCards = [
    {
      eyebrow: 'Portfolio',
      label: 'Active subscriptions',
      value: String(activeCount),
      accent: accentBlue,
      backgroundColor: accentBlueSoft,
      icon: 'layers-outline' as const,
    },
    {
      eyebrow: 'Monthly',
      label: 'Recurring spend',
      value: formatCurrency(monthlyTotal, displayCurrency),
      accent: accentMint,
      backgroundColor: accentMintSoft,
      icon: 'wallet-outline' as const,
    },
    {
      eyebrow: 'Yearly',
      label: 'Projected total',
      value: formatCurrency(yearlyProjection, displayCurrency),
      accent: accentPeach,
      backgroundColor: accentPeachSoft,
      icon: 'sparkles-outline' as const,
    },
    {
      eyebrow: 'Attention',
      label: 'Due in 7 days',
      value: String(dueSoonCount),
      accent: accentGold,
      backgroundColor: accentGoldSoft,
      icon: 'time-outline' as const,
    },
  ];

  return (
    <ScreenContainer scrollable contentStyle={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Dashboard</ThemedText>
        <ThemedText style={[styles.subtitle, { color: secondaryText }]}>
          A calm snapshot of your subscriptions, renewals, and monthly rhythm.
        </ThemedText>
      </View>

      <View style={styles.metricsGrid}>
        {metricCards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionCopy}>
          <ThemedText style={styles.sectionTitle}>Upcoming Payments</ThemedText>
          <ThemedText style={[styles.sectionDescription, { color: secondaryText }]}>
            The next five renewals in your lineup.
          </ThemedText>
        </View>
        <View style={[styles.sectionBadge, { backgroundColor: accentBlueSoft }]}>
          <ThemedText style={[styles.sectionBadgeText, { color: accentBlue }]}>Next 5</ThemedText>
        </View>
      </View>

      <View style={styles.list}>
        {upcomingPayments.length === 0 ? (
          <Card style={styles.emptyCard}>
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
                onPress={() =>
                  router.push({
                    pathname: '/subscription/detail',
                    params: { id: subscription.id },
                  })
                }
                style={styles.listItem}
                leading={
                  <ServiceLogo
                    serviceKey={subscription.serviceKey}
                    name={subscription.name}
                    size={46}
                    style={[styles.logoBadge, { backgroundColor: mutedTint }]}
                  />
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
                showChevron
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
    gap: Spacing.xl,
  },
  header: {
    gap: Spacing.xs,
  },
  title: {
    ...Typography.largeTitle,
  },
  subtitle: {
    ...Typography.callout,
    maxWidth: 320,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  metricCard: {
    width: '48%',
    minHeight: 156,
    aspectRatio: 0.94,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  metricOrb: {
    position: 'absolute',
    top: -28,
    right: -18,
    width: 86,
    height: 86,
    borderRadius: 43,
    opacity: 0.18,
  },
  metricTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricEyebrow: {
    ...Typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metricBody: {
    gap: Spacing.xs,
  },
  metricValue: {
    ...Typography.title1,
  },
  metricLabel: {
    ...Typography.footnote,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  sectionCopy: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    ...Typography.title2,
  },
  sectionDescription: {
    ...Typography.footnote,
  },
  sectionBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  sectionBadgeText: {
    ...Typography.caption,
  },
  list: {
    gap: Spacing.sm,
  },
  listItem: {
    borderRadius: Radius.lg,
  },
  logoBadge: {
    borderRadius: Radius.md,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  priceText: {
    ...Typography.headline,
  },
  dayPill: {
    minWidth: 52,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillText: {
    ...Typography.caption,
  },
  emptyCard: {
    borderRadius: Radius.xl,
  },
  emptyTitle: {
    ...Typography.headline,
  },
  emptyCopy: {
    ...Typography.callout,
    marginTop: Spacing.xs,
  },
});

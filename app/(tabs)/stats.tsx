import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { Subscription } from '@/types/subscription';

const CATEGORY_ORDER = [
  'Streaming',
  'Music',
  'Software',
  'AI Tools',
  'Gaming',
  'Cloud Storage',
  'Productivity',
  'Education',
  'News & Media',
  'Finance',
  'Other',
] as const;

function getNormalizedMonthlyPrice(subscription: Subscription) {
  return subscription.billingCycle === 'monthly' ? subscription.price : subscription.price / 12;
}

function getYearlyProjection(subscription: Subscription) {
  return subscription.billingCycle === 'monthly' ? subscription.price * 12 : subscription.price;
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

export default function StatsScreen() {
  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const tintColor = useThemeColor({}, 'tint');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const surfaceSecondary = useThemeColor({}, 'surfaceSecondary');
  const dividerColor = useThemeColor({}, 'divider');

  const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === 'active');
  const displayCurrency = activeSubscriptions[0]?.currency ?? 'USD';

  const monthlyTotal = activeSubscriptions.reduce(
    (total, subscription) => total + getNormalizedMonthlyPrice(subscription),
    0
  );

  const yearlyProjection = activeSubscriptions.reduce(
    (total, subscription) => total + getYearlyProjection(subscription),
    0
  );

  const categoryBreakdown = CATEGORY_ORDER.map((category) => {
    const matchingSubscriptions = activeSubscriptions.filter((subscription) => {
      if (category === 'Other') {
        return !CATEGORY_ORDER.slice(0, -1).includes(
          subscription.category as (typeof CATEGORY_ORDER)[number]
        );
      }

      return subscription.category === category;
    });

    const monthlySpend = matchingSubscriptions.reduce(
      (total, subscription) => total + getNormalizedMonthlyPrice(subscription),
      0
    );

    return {
      category,
      count: matchingSubscriptions.length,
      monthlySpend,
    };
  });

  return (
    <ScreenContainer scrollable contentStyle={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Stats</ThemedText>
        <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
          A breakdown of recurring costs across your active subscriptions.
        </ThemedText>
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard
          label="Monthly Total Spending"
          value={formatCurrency(monthlyTotal, displayCurrency)}
          accent={tintColor}
        />
        <MetricCard
          label="Yearly Spending Projection"
          value={formatCurrency(yearlyProjection, displayCurrency)}
          accent={tintColor}
        />
        <MetricCard
          label="Active Subscriptions Count"
          value={String(activeSubscriptions.length)}
          accent={tintColor}
        />
      </View>

      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>Category Breakdown</ThemedText>
        <ThemedText style={[styles.sectionMeta, { color: textSecondary }]}>
          Monthly normalized spend
        </ThemedText>
      </View>

      <Card padded={false}>
        {categoryBreakdown.map((item, index) => (
          <View
            key={item.category}
            style={[
              styles.categoryRow,
              index < categoryBreakdown.length - 1 ? { borderBottomColor: dividerColor } : null,
            ]}>
            <View style={styles.categoryCopy}>
              <View style={[styles.categoryBadge, { backgroundColor: surfaceSecondary }]}>
                <ThemedText style={styles.categoryBadgeText}>{item.count}</ThemedText>
              </View>
              <View style={styles.categoryText}>
                <ThemedText style={styles.categoryName}>{item.category}</ThemedText>
                <ThemedText style={[styles.categoryMeta, { color: textSecondary }]}>
                  {item.count === 1 ? '1 active subscription' : `${item.count} active subscriptions`}
                </ThemedText>
              </View>
            </View>

            <ThemedText style={styles.categoryValue}>
              {formatCurrency(item.monthlySpend, displayCurrency)}
            </ThemedText>
          </View>
        ))}
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
  categoryRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  categoryCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  categoryBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadgeText: {
    ...Typography.headline,
  },
  categoryText: {
    flex: 1,
    gap: 2,
  },
  categoryName: {
    ...Typography.headline,
  },
  categoryMeta: {
    ...Typography.footnote,
  },
  categoryValue: {
    ...Typography.headline,
    textAlign: 'right',
  },
});

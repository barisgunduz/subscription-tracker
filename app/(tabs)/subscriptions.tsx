import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Card } from '@/components/Card';
import { ListItem } from '@/components/ListItem';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { Subscription } from '@/types/subscription';

type SortOption = 'next-payment' | 'price' | 'name';

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Next payment', value: 'next-payment' },
  { label: 'Price', value: 'price' },
  { label: 'Name', value: 'name' },
];

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

function sortSubscriptions(subscriptions: Subscription[], sortBy: SortOption) {
  const sorted = [...subscriptions];

  if (sortBy === 'name') {
    return sorted.sort((left, right) => left.name.localeCompare(right.name));
  }

  if (sortBy === 'price') {
    return sorted.sort((left, right) => right.price - left.price);
  }

  return sorted.sort(
    (left, right) =>
      new Date(left.nextBillingDate).getTime() - new Date(right.nextBillingDate).getTime()
  );
}

export default function SubscriptionsScreen() {
  const router = useRouter();
  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const [sortBy, setSortBy] = useState<SortOption>('next-payment');
  const tintColor = useThemeColor({}, 'tint');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const surfaceSecondary = useThemeColor({}, 'surfaceSecondary');
  const borderColor = useThemeColor({}, 'border');

  const sortedSubscriptions = useMemo(
    () => sortSubscriptions(subscriptions, sortBy),
    [subscriptions, sortBy]
  );

  return (
    <ScreenContainer scrollable contentStyle={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Subscriptions</ThemedText>
        <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
          All recurring services in one place.
        </ThemedText>
      </View>

      <View style={styles.sortSection}>
        <ThemedText style={styles.sortLabel}>Sort by</ThemedText>
        <View style={styles.sortRow}>
          {SORT_OPTIONS.map((option) => {
            const isActive = option.value === sortBy;

            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                onPress={() => setSortBy(option.value)}
                style={({ pressed }) => [
                  styles.sortChip,
                  {
                    backgroundColor: isActive ? tintColor : surfaceSecondary,
                    borderColor: isActive ? tintColor : borderColor,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}>
                <ThemedText
                  lightColor={isActive ? '#FFFFFF' : undefined}
                  darkColor={isActive ? '#FFFFFF' : undefined}
                  style={styles.sortChipLabel}>
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.list}>
        {sortedSubscriptions.length === 0 ? (
          <Card>
            <ThemedText style={styles.emptyTitle}>No subscriptions yet</ThemedText>
            <ThemedText style={[styles.emptyCopy, { color: textSecondary }]}>
              Add your first subscription to start tracking renewals and spending.
            </ThemedText>
          </Card>
        ) : (
          sortedSubscriptions.map((subscription) => (
            <ListItem
              key={subscription.id}
              title={subscription.name}
              subtitle={`Next billing: ${formatDate(subscription.nextBillingDate)}`}
              onPress={() =>
                router.push({
                  pathname: '/subscription/detail',
                  params: { id: subscription.id },
                })
              }
              leading={
                <View style={[styles.logoBadge, { backgroundColor: surfaceSecondary }]}>
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
                </View>
              }
              showChevron
            />
          ))
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
  sortSection: {
    gap: Spacing.sm,
  },
  sortLabel: {
    ...Typography.footnote,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  sortChip: {
    minHeight: 38,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortChipLabel: {
    ...Typography.footnote,
    fontWeight: '600',
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
  },
  priceText: {
    ...Typography.headline,
  },
  emptyTitle: {
    ...Typography.headline,
  },
  emptyCopy: {
    ...Typography.callout,
    marginTop: Spacing.xs,
  },
});

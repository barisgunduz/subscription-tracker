import { ComponentProps, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { Subscription } from '@/types/subscription';
import { getCategoryTranslationKey } from '@/utils/categories';
import {
  AppCurrencyCode,
  convertCurrency,
  ExchangeRates,
  formatCurrency,
} from '@/utils/currency';
import { useI18n } from '@/utils/i18n';

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

type PeriodFilter = '1m' | '3m' | '12m';

const PERIOD_MONTHS: Record<PeriodFilter, number> = {
  '1m': 1,
  '3m': 3,
  '12m': 12,
};

const CHART_COLORS = ['#2F80ED', '#27AE60', '#F2994A', '#9B51E0', '#EB5757', '#00A3A3'];

function getNormalizedMonthlyPrice(
  subscription: Subscription,
  displayCurrency: AppCurrencyCode,
  exchangeRates: ExchangeRates
) {
  const price = convertCurrency(
    subscription.price,
    subscription.currency,
    displayCurrency,
    exchangeRates
  );

  return subscription.billingCycle === 'monthly' ? price : price / 12;
}

function getYearlyProjection(
  subscription: Subscription,
  displayCurrency: AppCurrencyCode,
  exchangeRates: ExchangeRates
) {
  const price = convertCurrency(
    subscription.price,
    subscription.currency,
    displayCurrency,
    exchangeRates
  );

  return subscription.billingCycle === 'monthly' ? price * 12 : price;
}

function parseIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return new Date(value);
  }

  const [, year, month, day] = match;

  return new Date(Number(year), Number(month) - 1, Number(day));
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function isSameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function countRenewalsInPeriod(subscription: Subscription, startDate: Date, months: number) {
  const endDate = addMonths(startDate, months);
  let currentDate = parseIsoDate(subscription.nextBillingDate);
  let count = 0;

  while (currentDate < endDate) {
    if (currentDate >= startDate) {
      count += 1;
    }

    currentDate =
      subscription.billingCycle === 'monthly'
        ? new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate())
        : new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), currentDate.getDate());
  }

  return count;
}

function countRenewalsInMonth(subscription: Subscription, month: Date) {
  const monthStart = startOfMonth(month);
  const monthEnd = addMonths(monthStart, 1);
  let currentDate = parseIsoDate(subscription.nextBillingDate);
  let count = 0;

  while (currentDate < monthEnd) {
    if (currentDate >= monthStart && isSameMonth(currentDate, monthStart)) {
      count += 1;
    }

    currentDate =
      subscription.billingCycle === 'monthly'
        ? new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate())
        : new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), currentDate.getDate());
  }

  return count;
}

type InsightCardProps = {
  label: string;
  value: string;
  meta: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  accent: string;
  backgroundColor: string;
};

function InsightCard({ label, value, meta, icon, accent, backgroundColor }: InsightCardProps) {
  return (
    <Card style={[styles.insightCard, { backgroundColor, borderColor: backgroundColor }]}>
      <View style={[styles.insightIconWrap, { backgroundColor: accent }]}>
        <Ionicons name={icon} size={18} color="#FFFFFF" />
      </View>
      <View style={styles.insightCopy}>
        <ThemedText style={styles.insightValue}>{value}</ThemedText>
        <ThemedText style={styles.insightLabel}>{label}</ThemedText>
        <ThemedText style={[styles.insightMeta, { color: accent }]}>{meta}</ThemedText>
      </View>
    </Card>
  );
}

export default function StatsScreen() {
  const { locale, t } = useI18n();
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('3m');
  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const displayCurrency = usePreferencesStore((state) => state.displayCurrency);
  const exchangeRates = usePreferencesStore((state) => state.exchangeRates);
  const textSecondary = useThemeColor({}, 'textSecondary');
  const dividerColor = useThemeColor({}, 'divider');
  const surfaceSecondary = useThemeColor({}, 'surfaceSecondary');
  const borderColor = useThemeColor({}, 'border');
  const tintColor = useThemeColor({}, 'tint');
  const accentBlue = useThemeColor({}, 'accentBlue');
  const accentBlueSoft = useThemeColor({}, 'accentBlueSoft');
  const accentMint = useThemeColor({}, 'accentMint');
  const accentMintSoft = useThemeColor({}, 'accentMintSoft');
  const accentPeach = useThemeColor({}, 'accentPeach');
  const accentPeachSoft = useThemeColor({}, 'accentPeachSoft');
  const accentGold = useThemeColor({}, 'accentGold');
  const accentGoldSoft = useThemeColor({}, 'accentGoldSoft');

  const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === 'active');
  const periodMonths = PERIOD_MONTHS[periodFilter];
  const periodStart = useMemo(() => new Date(), []);

  const monthlyTotal = activeSubscriptions.reduce(
    (total, subscription) =>
      total + getNormalizedMonthlyPrice(subscription, displayCurrency, exchangeRates),
    0
  );

  const yearlyProjection = activeSubscriptions.reduce(
    (total, subscription) =>
      total + getYearlyProjection(subscription, displayCurrency, exchangeRates),
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
      (total, subscription) =>
        total + getNormalizedMonthlyPrice(subscription, displayCurrency, exchangeRates),
      0
    );

    return {
      category,
      count: matchingSubscriptions.length,
      monthlySpend,
      share: monthlyTotal > 0 ? monthlySpend / monthlyTotal : 0,
    };
  })
    .filter((item) => item.count > 0)
    .sort((left, right) => right.monthlySpend - left.monthlySpend || right.count - left.count);

  const topCategory = categoryBreakdown[0];
  const translateCategory = (category: string) => {
    const key = getCategoryTranslationKey(category);

    return key ? t(key) : category;
  };

  const projectedSpend = activeSubscriptions.reduce((total, subscription) => {
    const convertedPrice = convertCurrency(
      subscription.price,
      subscription.currency,
      displayCurrency,
      exchangeRates
    );
    const renewalCount = countRenewalsInPeriod(subscription, periodStart, periodMonths);

    return total + convertedPrice * renewalCount;
  }, 0);

  const periodRenewalCount = activeSubscriptions.reduce(
    (total, subscription) => total + countRenewalsInPeriod(subscription, periodStart, periodMonths),
    0
  );

  const monthlyForecast = Array.from({ length: 6 }, (_, index) => {
    const month = addMonths(startOfMonth(periodStart), index);
    const spend = activeSubscriptions.reduce((total, subscription) => {
      const renewalCount = countRenewalsInMonth(subscription, month);
      const convertedPrice = convertCurrency(
        subscription.price,
        subscription.currency,
        displayCurrency,
        exchangeRates
      );

      return total + convertedPrice * renewalCount;
    }, 0);

    return {
      label: new Intl.DateTimeFormat(locale, { month: 'short' }).format(month),
      year: new Intl.DateTimeFormat(locale, { year: '2-digit' }).format(month),
      spend,
    };
  });
  const maxForecastSpend = Math.max(...monthlyForecast.map((item) => item.spend), 1);
  const maxCategorySpend = Math.max(...categoryBreakdown.map((item) => item.monthlySpend), 1);
  const topSubscriptions = [...activeSubscriptions]
    .map((subscription) => ({
      id: subscription.id,
      name: subscription.name,
      monthlySpend: getNormalizedMonthlyPrice(subscription, displayCurrency, exchangeRates),
    }))
    .sort((left, right) => right.monthlySpend - left.monthlySpend)
    .slice(0, 5);
  const maxSubscriptionSpend = Math.max(...topSubscriptions.map((item) => item.monthlySpend), 1);

  const periodOptions: { label: string; value: PeriodFilter }[] = [
    { label: t('nextMonth'), value: '1m' },
    { label: t('nextQuarter'), value: '3m' },
    { label: t('nextYear'), value: '12m' },
  ];

  const insightCards = [
    {
      label: t('projectedSpend'),
      value: formatCurrency(projectedSpend, displayCurrency, locale),
      meta: periodOptions.find((option) => option.value === periodFilter)?.label ?? t('nextQuarter'),
      icon: 'layers-outline' as const,
      accent: accentBlue,
      backgroundColor: accentBlueSoft,
    },
    {
      label: t('renewalCount'),
      value: String(periodRenewalCount),
      meta: activeSubscriptions.length > 0 ? t('acrossActiveSubscriptions', { count: activeSubscriptions.length }) : t('addPlanToCompare'),
      icon: 'wallet-outline' as const,
      accent: accentMint,
      backgroundColor: accentMintSoft,
    },
    {
      label: t('topCategory'),
      value: topCategory ? translateCategory(topCategory.category) : t('noneYet'),
      meta: topCategory
        ? formatCurrency(topCategory.monthlySpend, displayCurrency, locale)
        : t('noMonthlySpend'),
      icon: 'podium-outline' as const,
      accent: accentPeach,
      backgroundColor: accentPeachSoft,
    },
    {
      label: t('yearlyProjection'),
      value: formatCurrency(yearlyProjection, displayCurrency, locale),
      meta:
        monthlyTotal > 0
          ? t('normalizedMonthly', { amount: formatCurrency(monthlyTotal, displayCurrency, locale) })
          : t('noActiveRecurringSpend'),
      icon: 'sparkles-outline' as const,
      accent: accentGold,
      backgroundColor: accentGoldSoft,
    },
  ];

  return (
    <ScreenContainer scrollable contentStyle={styles.container}>
      <View style={styles.filterSection}>
        <ThemedText style={styles.sectionTitle}>{t('stats')}</ThemedText>
        <View style={styles.filterRow}>
          {periodOptions.map((option) => {
            const isActive = option.value === periodFilter;

            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                onPress={() => setPeriodFilter(option.value)}
                style={({ pressed }) => [
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? tintColor : surfaceSecondary,
                    borderColor: isActive ? tintColor : borderColor,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}>
                <ThemedText
                  lightColor={isActive ? '#FFFFFF' : undefined}
                  darkColor={isActive ? '#FFFFFF' : undefined}
                  style={styles.filterChipText}>
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.insightsGrid}>
        {insightCards.map((card) => (
          <InsightCard key={card.label} {...card} />
        ))}
      </View>

      {activeSubscriptions.length === 0 ? (
        <Card>
          <ThemedText style={styles.emptyTitle}>{t('noStats')}</ThemedText>
          <ThemedText style={[styles.emptyCopy, { color: textSecondary }]}>
            {t('noStatsBody')}
          </ThemedText>
        </Card>
      ) : (
        <>
          <Card style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View>
                <ThemedText style={styles.sectionTitle}>{t('renewalForecast')}</ThemedText>
                <ThemedText style={[styles.sectionMeta, { color: textSecondary }]}>
                  {t('projectedSpend')} · {formatCurrency(projectedSpend, displayCurrency, locale)}
                </ThemedText>
              </View>
              <View style={[styles.chartIcon, { backgroundColor: accentMint }]}>
                <Ionicons name="analytics-outline" size={18} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.forecastChart}>
              {monthlyForecast.map((item, index) => {
                const height = Math.max((item.spend / maxForecastSpend) * 80, item.spend > 0 ? 8 : 2);

                return (
                  <View key={item.label} style={styles.forecastItem}>
                    <View style={styles.forecastTrack}>
                      <View
                        style={[
                          styles.forecastBar,
                          {
                            height,
                            backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.forecastLabelGroup}>
                      <ThemedText style={styles.columnLabel}>{item.label}</ThemedText>
                      <ThemedText style={[styles.forecastYear, { color: textSecondary }]}>
                        {item.year}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.columnValue, { color: textSecondary }]}>
                      {item.spend > 0 ? formatCurrency(item.spend, displayCurrency, locale) : '-'}
                    </ThemedText>
                  </View>
                );
              })}
            </View>
          </Card>

          <Card style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View>
                <ThemedText style={styles.sectionTitle}>{t('categoryBreakdown')}</ThemedText>
                <ThemedText style={[styles.sectionMeta, { color: textSecondary }]}>
                  {t('rankedByMonthlySpend')}
                </ThemedText>
              </View>
            </View>

            <View style={styles.barList}>
              {categoryBreakdown.map((item, index) => (
                <View key={item.category} style={styles.barRow}>
                  <View style={styles.barRowHeader}>
                    <ThemedText style={styles.barLabel}>{translateCategory(item.category)}</ThemedText>
                    <ThemedText style={[styles.barValue, { color: textSecondary }]}>
                      {formatCurrency(item.monthlySpend, displayCurrency, locale)} · {Math.round(item.share * 100)}%
                    </ThemedText>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: surfaceSecondary }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.max((item.monthlySpend / maxCategorySpend) * 100, 8)}%`,
                          backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </Card>

          <Card padded={false}>
            <View style={styles.listHeader}>
              <ThemedText style={styles.sectionTitle}>{t('topSubscriptions')}</ThemedText>
              <ThemedText style={[styles.sectionMeta, { color: textSecondary }]}>
                {t('normalizedMonthly', { amount: formatCurrency(monthlyTotal, displayCurrency, locale) })}
              </ThemedText>
            </View>
            {topSubscriptions.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.subscriptionRow,
                  index < topSubscriptions.length - 1 ? { borderBottomColor: dividerColor } : null,
                ]}>
                <View style={styles.subscriptionInfo}>
                  <View style={[styles.categoryBadge, { backgroundColor: surfaceSecondary }]}>
                    <ThemedText style={styles.categoryBadgeText}>{index + 1}</ThemedText>
                  </View>
                  <View style={styles.subscriptionCopy}>
                    <ThemedText style={styles.categoryName}>{item.name}</ThemedText>
                    <View style={[styles.progressTrack, { backgroundColor: surfaceSecondary }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.max((item.monthlySpend / maxSubscriptionSpend) * 100, 8)}%`,
                            backgroundColor: index === 0 ? accentGold : accentBlue,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
                <ThemedText style={styles.categoryValue}>
                  {formatCurrency(item.monthlySpend, displayCurrency, locale)}
                </ThemedText>
              </View>
            ))}
          </Card>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 88,
    gap: Spacing.xl,
  },
  filterSection: {
    gap: Spacing.xs,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    flex: 1,
    minHeight: 34,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipText: {
    ...Typography.caption,
    fontWeight: '600',
    textAlign: 'center',
  },
  chartCard: {
    gap: Spacing.md,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  chartIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forecastChart: {
    minHeight: 136,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  forecastItem: {
    width: 38,
    alignItems: 'center',
    gap: 4,
  },
  forecastTrack: {
    width: 18,
    height: 88,
    borderRadius: Radius.pill,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  forecastBar: {
    width: '100%',
    borderRadius: Radius.pill,
  },
  forecastLabelGroup: {
    minHeight: 30,
    alignItems: 'center',
    gap: 0,
  },
  forecastYear: {
    ...Typography.caption,
    fontSize: 10,
  },
  columnValue: {
    ...Typography.caption,
    textAlign: 'center',
    fontSize: 10,
  },
  columnLabel: {
    ...Typography.caption,
    fontWeight: '700',
  },
  barList: {
    gap: Spacing.md,
  },
  barRow: {
    gap: Spacing.xs,
  },
  barRowHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  barLabel: {
    ...Typography.headline,
    flex: 1,
  },
  barValue: {
    ...Typography.footnote,
    textAlign: 'right',
    flexShrink: 0,
  },
  listHeader: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: 2,
  },
  subscriptionRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  subscriptionInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  subscriptionCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  heroCard: {
    gap: Spacing.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  heroEyebrow: {
    ...Typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroValue: {
    ...Typography.largeTitle,
    marginTop: Spacing.xs,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMeta: {
    ...Typography.footnote,
  },
  heroFooter: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  heroPill: {
    flex: 1,
    minHeight: 70,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    justifyContent: 'center',
    gap: 2,
  },
  heroPillLabel: {
    ...Typography.caption,
  },
  heroPillValue: {
    ...Typography.headline,
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  insightCard: {
    width: '48%',
    minHeight: 152,
    justifyContent: 'space-between',
  },
  insightIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightCopy: {
    gap: Spacing.xs,
  },
  insightValue: {
    ...Typography.title2,
  },
  insightLabel: {
    ...Typography.footnote,
  },
  insightMeta: {
    ...Typography.caption,
  },
  sectionHeader: {
    gap: Spacing.xs,
  },
  sectionCopy: {
    gap: 2,
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
    gap: Spacing.sm,
  },
  categoryRowTop: {
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
    width: 38,
    height: 38,
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
  categoryValues: {
    alignItems: 'flex-end',
    gap: 2,
  },
  categoryValue: {
    ...Typography.headline,
    textAlign: 'right',
  },
  categoryShare: {
    ...Typography.caption,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
  emptyTitle: {
    ...Typography.headline,
  },
  emptyCopy: {
    ...Typography.callout,
    marginTop: Spacing.xs,
  },
});

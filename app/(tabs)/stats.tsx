import { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

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
  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const displayCurrency = usePreferencesStore((state) => state.displayCurrency);
  const exchangeRates = usePreferencesStore((state) => state.exchangeRates);
  const textSecondary = useThemeColor({}, 'textSecondary');
  const dividerColor = useThemeColor({}, 'divider');
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

  const averageSubscriptionCost =
    activeSubscriptions.length > 0 ? monthlyTotal / activeSubscriptions.length : 0;

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

  const insightCards = [
    {
      label: t('activeSubscriptions'),
      value: String(activeSubscriptions.length),
      meta: topCategory ? t('topCategoryLeads', { category: translateCategory(topCategory.category) }) : t('noActivePlans'),
      icon: 'layers-outline' as const,
      accent: accentBlue,
      backgroundColor: accentBlueSoft,
    },
    {
      label: t('averageMonthlyCost'),
      value: formatCurrency(averageSubscriptionCost, displayCurrency, locale),
      meta: activeSubscriptions.length > 0 ? t('perActiveSubscription') : t('addPlanToCompare'),
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
      <Card style={[styles.heroCard, { backgroundColor: accentMintSoft, borderColor: accentMintSoft }]}>
        <View style={styles.heroTopRow}>
          <View>
            <ThemedText style={[styles.heroEyebrow, { color: accentMint }]}>{t('monthlySpend')}</ThemedText>
            <ThemedText style={styles.heroValue}>
              {formatCurrency(monthlyTotal, displayCurrency, locale)}
            </ThemedText>
          </View>
          <View style={[styles.heroIconWrap, { backgroundColor: accentMint }]}>
            <Ionicons name="stats-chart" size={22} color="#FFFFFF" />
          </View>
        </View>

        <ThemedText style={[styles.heroMeta, { color: textSecondary }]}>
          {activeSubscriptions.length > 0
            ? t('acrossActiveSubscriptions', { count: activeSubscriptions.length })
            : t('addSubscriptionsToUnlock')}
        </ThemedText>

        <View style={styles.heroFooter}>
          <View style={[styles.heroPill, { backgroundColor: '#FFFFFFAA' }]}>
            <ThemedText style={styles.heroPillLabel}>{t('yearly')}</ThemedText>
            <ThemedText style={styles.heroPillValue}>
              {formatCurrency(yearlyProjection, displayCurrency, locale)}
            </ThemedText>
          </View>
          <View style={[styles.heroPill, { backgroundColor: '#FFFFFFAA' }]}>
            <ThemedText style={styles.heroPillLabel}>{t('average')}</ThemedText>
            <ThemedText style={styles.heroPillValue}>
              {formatCurrency(averageSubscriptionCost, displayCurrency, locale)}
            </ThemedText>
          </View>
        </View>
      </Card>

      <View style={styles.insightsGrid}>
        {insightCards.map((card) => (
          <InsightCard key={card.label} {...card} />
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionCopy}>
          <ThemedText style={styles.sectionTitle}>{t('categoryBreakdown')}</ThemedText>
          <ThemedText style={[styles.sectionMeta, { color: textSecondary }]}>
            {t('rankedByMonthlySpend')}
          </ThemedText>
        </View>
      </View>

      {categoryBreakdown.length === 0 ? (
        <Card>
          <ThemedText style={styles.emptyTitle}>{t('noStats')}</ThemedText>
          <ThemedText style={[styles.emptyCopy, { color: textSecondary }]}>
            {t('noStatsBody')}
          </ThemedText>
        </Card>
      ) : (
        <Card padded={false}>
          {categoryBreakdown.map((item, index) => (
            <View
              key={item.category}
              style={[
                styles.categoryRow,
                index < categoryBreakdown.length - 1 ? { borderBottomColor: dividerColor } : null,
              ]}>
              <View style={styles.categoryRowTop}>
                <View style={styles.categoryCopy}>
                  <View style={[styles.categoryBadge, { backgroundColor: surfaceSecondary }]}>
                    <ThemedText style={styles.categoryBadgeText}>{index + 1}</ThemedText>
                  </View>
                  <View style={styles.categoryText}>
                    <ThemedText style={styles.categoryName}>{translateCategory(item.category)}</ThemedText>
                    <ThemedText style={[styles.categoryMeta, { color: textSecondary }]}>
                      {item.count === 1 ? t('oneActiveSubscription') : t('activeSubscriptionsCount', { count: item.count })}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.categoryValues}>
                  <ThemedText style={styles.categoryValue}>
                    {formatCurrency(item.monthlySpend, displayCurrency, locale)}
                  </ThemedText>
                  <ThemedText style={[styles.categoryShare, { color: textSecondary }]}>
                    {Math.round(item.share * 100)}%
                  </ThemedText>
                </View>
              </View>

              <View style={[styles.progressTrack, { backgroundColor: surfaceSecondary }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.max(item.share * 100, 8)}%`,
                      backgroundColor:
                        index === 0 ? accentMint : index === 1 ? accentBlue : accentPeach,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </Card>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 120,
    gap: Spacing.xl,
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

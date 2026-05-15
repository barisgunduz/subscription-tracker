import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Card } from '@/components/Card';
import { ListItem } from '@/components/ListItem';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ServiceLogo } from '@/components/ServiceLogo';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { Subscription } from '@/types/subscription';
import { AppCurrencyCode, convertCurrency, ExchangeRates, formatCurrency } from '@/utils/currency';
import { useI18n } from '@/utils/i18n';

type SortOption = 'next-payment' | 'price' | 'name';

function formatDate(value: string, locale: string) {
  const date = parseIsoDate(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function parseIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return new Date(value);
  }

  const [, year, month, day] = match;

  return new Date(Number(year), Number(month) - 1, Number(day));
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function startOfToday() {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function formatMonthYear(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatSelectedDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(parseIsoDate(value));
}

function getCalendarDays(month: Date) {
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const firstWeekday = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const cells: (Date | null)[] = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function chunkIntoWeeks(days: (Date | null)[]) {
  const weeks: (Date | null)[][] = [];

  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  return weeks;
}

function sortSubscriptions(
  subscriptions: Subscription[],
  sortBy: SortOption,
  displayCurrency: AppCurrencyCode,
  exchangeRates: ExchangeRates
) {
  const sorted = [...subscriptions];

  if (sortBy === 'name') {
    return sorted.sort((left, right) => left.name.localeCompare(right.name));
  }

  if (sortBy === 'price') {
    return sorted.sort(
      (left, right) =>
        convertCurrency(right.price, right.currency, displayCurrency, exchangeRates) -
        convertCurrency(left.price, left.currency, displayCurrency, exchangeRates)
    );
  }

  return sorted.sort(
    (left, right) =>
      new Date(left.nextBillingDate).getTime() - new Date(right.nextBillingDate).getTime()
  );
}

export default function SubscriptionsScreen() {
  const router = useRouter();
  const { view } = useLocalSearchParams<{ view?: string }>();
  const { locale, t } = useI18n();
  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const displayCurrency = usePreferencesStore((state) => state.displayCurrency);
  const exchangeRates = usePreferencesStore((state) => state.exchangeRates);
  const [sortBy, setSortBy] = useState<SortOption>('next-payment');
  const [visibleMonth, setVisibleMonth] = useState(() => getMonthStart(startOfToday()));
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const surfaceSecondary = useThemeColor({}, 'surfaceSecondary');
  const surfaceTertiary = useThemeColor({}, 'surfaceTertiary');
  const borderColor = useThemeColor({}, 'border');
  const tintMuted = useThemeColor({}, 'tintMuted');

  const defaultSelectedDate = useMemo(() => {
    const sortedByBillingDate = sortSubscriptions(
      subscriptions,
      'next-payment',
      displayCurrency,
      exchangeRates
    );

    return sortedByBillingDate[0]?.nextBillingDate ?? toIsoDate(startOfToday());
  }, [displayCurrency, exchangeRates, subscriptions]);
  const [selectedDate, setSelectedDate] = useState(defaultSelectedDate);

  const sortedSubscriptions = useMemo(
    () => sortSubscriptions(subscriptions, sortBy, displayCurrency, exchangeRates),
    [displayCurrency, exchangeRates, subscriptions, sortBy]
  );

  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);
  const calendarWeeks = useMemo(() => chunkIntoWeeks(calendarDays), [calendarDays]);

  const billingDatesByDay = useMemo(() => {
    return subscriptions.reduce<Record<string, Subscription[]>>((accumulator, subscription) => {
      const key = subscription.nextBillingDate;

      if (!accumulator[key]) {
        accumulator[key] = [];
      }

      accumulator[key].push(subscription);
      return accumulator;
    }, {});
  }, [subscriptions]);

  const selectedDaySubscriptions = useMemo(() => {
    return sortedSubscriptions.filter((subscription) => subscription.nextBillingDate === selectedDate);
  }, [selectedDate, sortedSubscriptions]);

  const isCalendarView = view === 'calendar';
  const sortOptions: { label: string; value: SortOption }[] = [
    { label: t('sortNextPayment'), value: 'next-payment' },
    { label: t('sortPrice'), value: 'price' },
    { label: t('sortName'), value: 'name' },
  ];
  const weekdayLabels = Array.from({ length: 7 }, (_, index) => {
    const baseSunday = new Date(2024, 0, 7 + index);

    return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(baseSunday);
  });

  useEffect(() => {
    setSelectedDate((currentDate) => currentDate || defaultSelectedDate);
  }, [defaultSelectedDate]);

  useEffect(() => {
    if (isCalendarView) {
      setVisibleMonth(getMonthStart(parseIsoDate(selectedDate)));
    }
  }, [isCalendarView, selectedDate]);

  return (
    <ScreenContainer scrollable contentStyle={styles.container}>
      {isCalendarView ? (
        <Card style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('back')}
              onPress={() => setVisibleMonth((currentMonth) => addMonths(currentMonth, -1))}
              style={({ pressed }) => [
                styles.calendarNavButton,
                { backgroundColor: surfaceSecondary, opacity: pressed ? 0.82 : 1 },
              ]}>
              <Ionicons name="chevron-back" size={18} color={tintColor} />
            </Pressable>
            <ThemedText style={styles.calendarMonthLabel}>
              {formatMonthYear(visibleMonth, locale)}
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('continue')}
              onPress={() => setVisibleMonth((currentMonth) => addMonths(currentMonth, 1))}
              style={({ pressed }) => [
                styles.calendarNavButton,
                { backgroundColor: surfaceSecondary, opacity: pressed ? 0.82 : 1 },
              ]}>
              <Ionicons name="chevron-forward" size={18} color={tintColor} />
            </Pressable>
          </View>

          <View style={styles.weekdaysRow}>
            {weekdayLabels.map((label) => (
              <View key={label} style={styles.weekdayCell}>
                <ThemedText style={[styles.weekdayLabel, { color: textSecondary }]}>
                  {label}
                </ThemedText>
              </View>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarWeeks.map((week, weekIndex) => (
              <View key={`week-${weekIndex}`} style={styles.calendarWeekRow}>
                {week.map((date, dayIndex) => {
                  if (!date) {
                    return <View key={`empty-${weekIndex}-${dayIndex}`} style={styles.dayCell} />;
                  }

                  const isoDate = toIsoDate(date);
                  const daySubscriptions = billingDatesByDay[isoDate] ?? [];
                  const isSelected = isoDate === selectedDate;
                  const isToday = isoDate === toIsoDate(startOfToday());

                  return (
                    <View key={isoDate} style={styles.dayCell}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => setSelectedDate(isoDate)}
                        style={({ pressed }) => [
                          styles.dayPressable,
                          {
                            backgroundColor: isSelected ? tintMuted : surfaceSecondary,
                            borderColor: isSelected ? tintColor : borderColor,
                            opacity: pressed ? 0.88 : 1,
                          },
                        ]}>
                        <View style={styles.dayTopRow}>
                          <View
                            style={[
                              styles.dayNumberBadge,
                              {
                                backgroundColor: isSelected
                                  ? tintColor
                                  : isToday
                                    ? tintColor
                                    : 'transparent',
                              },
                            ]}>
                            <ThemedText
                              lightColor={isSelected || isToday ? '#FFFFFF' : undefined}
                              darkColor={isSelected || isToday ? '#FFFFFF' : undefined}
                              style={[
                                styles.dayNumber,
                                {
                                  color:
                                    isSelected || isToday ? undefined : textColor,
                                },
                              ]}>
                              {date.getDate()}
                            </ThemedText>
                          </View>
                          {daySubscriptions.length > 0 ? (
                            <View style={[styles.dayCountBadge, { backgroundColor: surfaceTertiary }]}>
                              <ThemedText style={[styles.dayCountText, { color: textSecondary }]}>
                                {daySubscriptions.length}
                              </ThemedText>
                            </View>
                          ) : null}
                        </View>

                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <View style={styles.sortSection}>
        <ThemedText style={styles.sortLabel}>{t('sortBy')}</ThemedText>
        <View style={styles.sortRow}>
          {sortOptions.map((option) => {
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

      {isCalendarView ? (
        <View style={styles.selectedDateHeader}>
          <ThemedText style={styles.selectedDateTitle}>
            {formatSelectedDate(selectedDate, locale)}
          </ThemedText>
          <ThemedText style={[styles.selectedDateSubtitle, { color: textSecondary }]}>
            {selectedDaySubscriptions.length === 0
              ? t('noBillingOnDate')
              : selectedDaySubscriptions.length === 1
                ? t('oneBillingItemOnDate')
                : t('billingItemsOnDate', { count: selectedDaySubscriptions.length })}
          </ThemedText>
        </View>
      ) : null}

      <View style={styles.list}>
        {(isCalendarView ? selectedDaySubscriptions : sortedSubscriptions).length === 0 ? (
          <Card>
            <ThemedText style={styles.emptyTitle}>
              {isCalendarView ? t('noBillingsOnThisDay') : t('noSubscriptionsYet')}
            </ThemedText>
            <ThemedText style={[styles.emptyCopy, { color: textSecondary }]}>
              {isCalendarView
                ? t('pickAnotherDate')
                : t('addYourFirstSubscription')}
            </ThemedText>
          </Card>
        ) : (
          (isCalendarView ? selectedDaySubscriptions : sortedSubscriptions).map((subscription) => (
            <ListItem
              key={subscription.id}
              title={subscription.name}
              subtitle={t('nextBilling', { date: formatDate(subscription.nextBillingDate, locale) })}
              onPress={() =>
                router.push({
                  pathname: '/subscription/detail',
                  params: { id: subscription.id },
                })
              }
              leading={
                <ServiceLogo
                  serviceKey={subscription.serviceKey}
                  name={subscription.name}
                  size={44}
                  style={[styles.logoBadge, { backgroundColor: surfaceSecondary }]}
                />
              }
              trailing={
                <View style={styles.trailing}>
                  <ThemedText style={styles.priceText}>
                    {formatCurrency(subscription.price, subscription.currency, locale)}
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
  calendarCard: {
    gap: Spacing.md,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarMonthLabel: {
    ...Typography.headline,
  },
  calendarNavButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdaysRow: {
    flexDirection: 'row',
  },
  weekdayCell: {
    width: '14.2857%',
    alignItems: 'center',
  },
  weekdayLabel: {
    ...Typography.caption,
    textTransform: 'uppercase',
  },
  calendarGrid: {
    gap: 6,
  },
  calendarWeekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    paddingHorizontal: 2,
    aspectRatio: 1,
  },
  dayPressable: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 6,
    justifyContent: 'space-between',
  },
  dayTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 4,
    minHeight: 24,
  },
  dayNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    ...Typography.caption,
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '700',
  },
  dayCountBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  dayCountText: {
    ...Typography.caption,
    fontSize: 9,
    lineHeight: 10,
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
  selectedDateHeader: {
    gap: 2,
  },
  selectedDateTitle: {
    ...Typography.title2,
  },
  selectedDateSubtitle: {
    ...Typography.footnote,
  },
  logoBadge: {
    borderRadius: Radius.md,
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

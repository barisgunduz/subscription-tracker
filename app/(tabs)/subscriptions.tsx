import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
type ViewMode = 'list' | 'calendar';

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Next payment', value: 'next-payment' },
  { label: 'Price', value: 'price' },
  { label: 'Name', value: 'name' },
];

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
  const date = parseIsoDate(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
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

function formatMonthYear(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatSelectedDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
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
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [visibleMonth, setVisibleMonth] = useState(() => getMonthStart(startOfToday()));
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const surfaceSecondary = useThemeColor({}, 'surfaceSecondary');
  const surfaceTertiary = useThemeColor({}, 'surfaceTertiary');
  const borderColor = useThemeColor({}, 'border');
  const tintMuted = useThemeColor({}, 'tintMuted');

  const defaultSelectedDate = useMemo(() => {
    const sortedByBillingDate = sortSubscriptions(subscriptions, 'next-payment');

    return sortedByBillingDate[0]?.nextBillingDate ?? toIsoDate(startOfToday());
  }, [subscriptions]);
  const [selectedDate, setSelectedDate] = useState(defaultSelectedDate);

  const sortedSubscriptions = useMemo(
    () => sortSubscriptions(subscriptions, sortBy),
    [subscriptions, sortBy]
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

  const isCalendarView = viewMode === 'calendar';

  useEffect(() => {
    setSelectedDate((currentDate) => currentDate || defaultSelectedDate);
  }, [defaultSelectedDate]);

  const handleToggleView = () => {
    setViewMode((currentView) => {
      const nextView = currentView === 'list' ? 'calendar' : 'list';

      if (nextView === 'calendar') {
        setVisibleMonth(getMonthStart(parseIsoDate(selectedDate)));
      }

      return nextView;
    });
  };

  return (
    <ScreenContainer scrollable contentStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <ThemedText style={styles.title}>Subscriptions</ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isCalendarView ? 'Switch to subscriptions list view' : 'Switch to calendar view'
            }
            onPress={handleToggleView}
            style={({ pressed }) => [
              styles.calendarToggle,
              {
                backgroundColor: isCalendarView ? tintColor : surfaceSecondary,
                borderColor: isCalendarView ? tintColor : borderColor,
                opacity: pressed ? 0.82 : 1,
              },
            ]}>
            <Ionicons
              name={isCalendarView ? 'list-outline' : 'calendar-outline'}
              size={18}
              color={isCalendarView ? '#FFFFFF' : tintColor}
            />
          </Pressable>
        </View>
        <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
          All recurring services in one place.
        </ThemedText>
      </View>

      {isCalendarView ? (
        <Card style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Show previous month"
              onPress={() => setVisibleMonth((currentMonth) => addMonths(currentMonth, -1))}
              style={({ pressed }) => [
                styles.calendarNavButton,
                { backgroundColor: surfaceSecondary, opacity: pressed ? 0.82 : 1 },
              ]}>
              <Ionicons name="chevron-back" size={18} color={tintColor} />
            </Pressable>
            <ThemedText style={styles.calendarMonthLabel}>
              {formatMonthYear(visibleMonth)}
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Show next month"
              onPress={() => setVisibleMonth((currentMonth) => addMonths(currentMonth, 1))}
              style={({ pressed }) => [
                styles.calendarNavButton,
                { backgroundColor: surfaceSecondary, opacity: pressed ? 0.82 : 1 },
              ]}>
              <Ionicons name="chevron-forward" size={18} color={tintColor} />
            </Pressable>
          </View>

          <View style={styles.weekdaysRow}>
            {WEEKDAY_LABELS.map((label) => (
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

      {isCalendarView ? (
        <View style={styles.selectedDateHeader}>
          <ThemedText style={styles.selectedDateTitle}>
            {formatSelectedDate(selectedDate)}
          </ThemedText>
          <ThemedText style={[styles.selectedDateSubtitle, { color: textSecondary }]}>
            {selectedDaySubscriptions.length === 0
              ? 'No billing scheduled on this day.'
              : `${selectedDaySubscriptions.length} billing item${
                  selectedDaySubscriptions.length === 1 ? '' : 's'
                } on this date.`}
          </ThemedText>
        </View>
      ) : null}

      <View style={styles.list}>
        {(isCalendarView ? selectedDaySubscriptions : sortedSubscriptions).length === 0 ? (
          <Card>
            <ThemedText style={styles.emptyTitle}>
              {isCalendarView ? 'No billings on this day' : 'No subscriptions yet'}
            </ThemedText>
            <ThemedText style={[styles.emptyCopy, { color: textSecondary }]}>
              {isCalendarView
                ? 'Pick another date to see the subscriptions billed on that day.'
                : 'Add your first subscription to start tracking renewals and spending.'}
            </ThemedText>
          </Card>
        ) : (
          (isCalendarView ? selectedDaySubscriptions : sortedSubscriptions).map((subscription) => (
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
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  title: {
    ...Typography.largeTitle,
    flex: 1,
  },
  subtitle: {
    ...Typography.callout,
  },
  calendarToggle: {
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
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

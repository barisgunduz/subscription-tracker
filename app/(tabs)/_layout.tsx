import { Ionicons } from '@expo/vector-icons';
import { Tabs, useGlobalSearchParams, usePathname, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { FloatingButton } from '@/components/FloatingButton';
import { HapticTab } from '@/components/haptic-tab';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useI18n } from '@/utils/i18n';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const pathname = usePathname();
  const { view } = useGlobalSearchParams<{ view?: string }>();
  const { t } = useI18n();
  const palette = Colors[colorScheme ?? 'light'];
  const isSubscriptionsRoute = pathname === '/subscriptions';
  const isCalendarView = view === 'calendar';

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: palette.tint,
          tabBarInactiveTintColor: palette.tabIconDefault,
          tabBarButton: HapticTab,
          tabBarIconStyle: styles.tabBarIcon,
          tabBarItemStyle: styles.tabBarItem,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarStyle: [
            styles.tabBar,
            {
              backgroundColor: palette.background,
              borderTopColor: colorScheme === 'dark' ? '#22262B' : '#E6E8EC',
            },
          ],
        }}>
        <Tabs.Screen
          name="home"
          options={{
            title: t('home'),
            tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="subscriptions"
          options={{
            title: t('subscriptions'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="wallet" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: t('stats'),
            tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t('settings'),
            tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
          }}
        />
      </Tabs>

      {isSubscriptionsRoute ? (
        <FloatingButton
          accessibilityLabel={
            isCalendarView ? t('tabListView') : t('tabCalendarView')
          }
          onPress={() =>
            router.replace({
              pathname: '/subscriptions',
              params: { view: isCalendarView ? 'list' : 'calendar' },
            })
          }
          style={styles.calendarFab}
          icon={
            <Ionicons
              name={isCalendarView ? 'list-outline' : 'calendar-outline'}
              size={22}
              color="#FFFFFF"
            />
          }
        />
      ) : null}

      <FloatingButton
        accessibilityLabel={t('tabAddSubscription')}
        onPress={() => router.push('/subscription/add')}
        style={styles.fab}
        icon={<Ionicons name="add" size={28} color="#FFFFFF" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    height: 72,
    paddingBottom: 8,
    paddingTop: 0,
  },
  tabBarItem: {
    paddingVertical: 0,
  },
  tabBarIcon: {
    marginTop: -4,
  },
  tabBarLabel: {
    marginTop: -2,
    marginBottom: 6,
  },
  fab: {
    right: Spacing.md,
    bottom: 88,
  },
  calendarFab: {
    right: Spacing.md,
    bottom: 160,
  },
});

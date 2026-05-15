import { Tabs, useGlobalSearchParams, usePathname, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { FloatingButton } from '@/components/FloatingButton';
import { HapticTab } from '@/components/haptic-tab';
import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const pathname = usePathname();
  const { view } = useGlobalSearchParams<{ view?: string }>();
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
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="subscriptions"
          options={{
            title: 'Subscriptions',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="wallet" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: 'Stats',
            tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
          }}
        />
      </Tabs>

      {isSubscriptionsRoute ? (
        <FloatingButton
          accessibilityLabel={
            isCalendarView ? 'Switch to subscriptions list view' : 'Switch to calendar view'
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
        accessibilityLabel="Add subscription"
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
    paddingBottom: 12,
    paddingTop: 10,
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

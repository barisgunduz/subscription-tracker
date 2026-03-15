import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="subscription/add"
          options={{ presentation: 'modal', title: 'Add Subscription' }}
        />
        <Stack.Screen
          name="subscription/detail"
          options={{ title: 'Subscription Detail', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="subscription/edit"
          options={{ presentation: 'modal', title: 'Edit Subscription' }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

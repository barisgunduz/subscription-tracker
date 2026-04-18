import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';

import { useThemeColor } from '@/hooks/use-theme-color';
import { getHasCompletedOnboarding } from '@/utils/onboarding';

export default function IndexScreen() {
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadOnboardingState() {
      try {
        const hasCompleted = await getHasCompletedOnboarding();

        if (isMounted) {
          setHasCompletedOnboarding(hasCompleted);
        }
      } catch {
        if (isMounted) {
          setHasCompletedOnboarding(false);
        }
      }
    }

    void loadOnboardingState();

    return () => {
      isMounted = false;
    };
  }, []);

  if (hasCompletedOnboarding === null) {
    return (
      <View style={[styles.loadingState, { backgroundColor }]}>
        <ActivityIndicator color={tintColor} size="small" />
      </View>
    );
  }

  return <Redirect href={hasCompletedOnboarding ? '/home' : '/onboarding'} />;
}

const styles = StyleSheet.create({
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

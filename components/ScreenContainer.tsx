import { PropsWithChildren } from 'react';
import { ScrollView, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing } from '@/constants/theme';

type ScreenContainerProps = PropsWithChildren<{
  scrollable?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  includeTopInset?: boolean;
}>;

export function ScreenContainer({
  children,
  scrollable = false,
  contentStyle,
  style,
  includeTopInset = true,
}: ScreenContainerProps) {
  const backgroundColor = useThemeColor({}, 'background');

  if (scrollable) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor }, style]}
        edges={includeTopInset ? undefined : ['left', 'right', 'bottom']}>
        <ScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          style={styles.fill}
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }, style]}>
      <SafeAreaView style={[styles.content, contentStyle]} edges={['left', 'right', 'bottom']}>
        {children}
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },
});

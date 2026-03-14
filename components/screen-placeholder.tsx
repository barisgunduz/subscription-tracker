import { StyleSheet } from 'react-native';

import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { Spacing, Typography } from '@/constants/theme';

type ScreenPlaceholderProps = {
  title: string;
};

export function ScreenPlaceholder({ title }: ScreenPlaceholderProps) {
  return (
    <ScreenContainer contentStyle={styles.container}>
      <ThemedText style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText style={styles.caption}>Screen pending implementation</ThemedText>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.largeTitle,
    textAlign: 'center',
  },
  caption: {
    marginTop: Spacing.xs,
    opacity: 0.7,
    textAlign: 'center',
  },
});

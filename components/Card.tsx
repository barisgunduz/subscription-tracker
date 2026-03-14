import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { CardStyles, Radius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

type CardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}>;

export function Card({ children, style, padded = true }: CardProps) {
  const backgroundColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View
      style={[
        styles.base,
        CardStyles.base,
        {
          backgroundColor,
          borderColor,
          padding: padded ? Spacing.md : 0,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
  },
});

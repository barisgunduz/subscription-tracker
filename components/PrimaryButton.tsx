import { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ButtonStyles, Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

type PrimaryButtonProps = {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  leftAdornment?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
  leftAdornment,
  style,
}: PrimaryButtonProps) {
  const backgroundColor = useThemeColor({}, 'tint');
  const disabledColor = useThemeColor({}, 'surfaceTertiary');

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        ButtonStyles.primary,
        {
          backgroundColor: disabled ? disabledColor : backgroundColor,
          opacity: pressed && !disabled ? 0.88 : 1,
        },
        style,
      ]}>
      {leftAdornment}
      <ThemedText
        lightColor="#FFFFFF"
        darkColor="#FFFFFF"
        style={[styles.label, disabled && styles.disabledLabel]}>
        {title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  label: {
    ...Typography.button,
    color: '#FFFFFF',
  },
  disabledLabel: {
    color: '#8E8E93',
  },
});

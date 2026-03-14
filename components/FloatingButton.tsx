import { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ButtonStyles } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

type FloatingButtonProps = {
  onPress?: () => void;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
};

export function FloatingButton({
  onPress,
  icon,
  style,
  accessibilityLabel,
}: FloatingButtonProps) {
  const backgroundColor = useThemeColor({}, 'tint');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        ButtonStyles.floating,
        {
          backgroundColor,
          opacity: pressed ? 0.92 : 1,
        },
        style,
      ]}>
      {icon ?? <Ionicons name="add" size={28} color="#FFFFFF" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    position: 'absolute',
  },
});

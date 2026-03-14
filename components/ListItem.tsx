import { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ListItemStyles, Spacing, Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

type ListItemProps = {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  showChevron?: boolean;
};

export function ListItem({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  style,
  showChevron = false,
}: ListItemProps) {
  const backgroundColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const secondaryTextColor = useThemeColor({}, 'textSecondary');
  const iconColor = useThemeColor({}, 'icon');

  const content = (
    <View
      style={[
        styles.base,
        ListItemStyles.base,
        { backgroundColor, borderColor },
        style,
      ]}>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.copy}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        {subtitle ? (
          <ThemedText style={[styles.subtitle, { color: secondaryTextColor }]}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      {showChevron ? (
        <Ionicons name="chevron-forward" size={18} color={iconColor} />
      ) : null}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.78 : 1 }]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
  },
  leading: {
    marginRight: Spacing.xs,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...Typography.headline,
  },
  subtitle: {
    ...Typography.footnote,
  },
  trailing: {
    marginLeft: Spacing.sm,
  },
});

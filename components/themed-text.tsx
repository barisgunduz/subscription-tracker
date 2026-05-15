import { StyleSheet, Text, type TextProps } from 'react-native';

import { Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { usePreferencesStore } from '@/store/preferencesStore';
import { translateKnownText } from '@/utils/i18n';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
  translate?: boolean;
};

export function ThemedText({
  children,
  style,
  lightColor,
  darkColor,
  type = 'default',
  translate = true,
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const languageCode = usePreferencesStore((state) => state.languageCode);
  const translatedChildren =
    translate && typeof children === 'string'
      ? translateKnownText(languageCode, children)
      : children;

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}>
      {translatedChildren}
    </Text>
  );
}

const styles = StyleSheet.create({
  default: {
    ...Typography.body,
  },
  defaultSemiBold: {
    ...Typography.body,
    fontWeight: '600',
  },
  title: {
    ...Typography.title1,
  },
  subtitle: {
    ...Typography.title2,
  },
  link: {
    ...Typography.callout,
    color: '#0a7ea4',
  },
});

import { Platform, TextStyle, ViewStyle } from 'react-native';

import { AppColors } from '@/constants/colors';

export const Colors = AppColors;

const webFonts = {
  sans: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
  rounded: "'SF Pro Rounded', -apple-system, BlinkMacSystemFont, sans-serif",
  mono: "'SF Mono', Menlo, monospace",
} as const;

const iosFonts = {
  sans: 'system-ui',
  rounded: 'ui-rounded',
  mono: 'ui-monospace',
} as const;

const androidFonts = {
  sans: 'sans-serif',
  rounded: 'sans-serif-medium',
  mono: 'monospace',
} as const;

const defaultFonts = {
  sans: 'System',
  rounded: 'System',
  mono: 'monospace',
} as const;

export const Fonts =
  Platform.OS === 'web'
    ? webFonts
    : Platform.OS === 'ios'
      ? iosFonts
      : Platform.OS === 'android'
        ? androidFonts
        : defaultFonts;

export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const Typography = {
  largeTitle: {
    fontFamily: Fonts.rounded,
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700',
    letterSpacing: 0.37,
  } as TextStyle,
  title1: {
    fontFamily: Fonts.rounded,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: 0.2,
  } as TextStyle,
  title2: {
    fontFamily: Fonts.sans,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  } as TextStyle,
  headline: {
    fontFamily: Fonts.sans,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
  } as TextStyle,
  body: {
    fontFamily: Fonts.sans,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '400',
  } as TextStyle,
  callout: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
  } as TextStyle,
  footnote: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  } as TextStyle,
  caption: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  } as TextStyle,
  button: {
    fontFamily: Fonts.sans,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
  } as TextStyle,
} as const;

export const Shadows = {
  card: {
    shadowColor: AppColors.light.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  } as ViewStyle,
  floating: {
    shadowColor: AppColors.light.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  } as ViewStyle,
} as const;

export const CardStyles = {
  base: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    ...Shadows.card,
  } as ViewStyle,
} as const;

export const ListItemStyles = {
  base: {
    minHeight: 64,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  } as ViewStyle,
} as const;

export const ButtonStyles = {
  primary: {
    minHeight: 54,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  floating: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.floating,
  } as ViewStyle,
} as const;

export const Theme = {
  colors: Colors,
  spacing: Spacing,
  typography: Typography,
  card: CardStyles,
  listItem: ListItemStyles,
  button: ButtonStyles,
  radius: Radius,
  shadows: Shadows,
} as const;

import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { Radius, Typography } from '@/constants/theme';
import { getServiceLogoSource } from '@/utils/serviceLogos';

type ServiceLogoProps = {
  serviceKey?: string | null;
  name: string;
  size: number;
  style?: StyleProp<ViewStyle>;
};

function getLogoFallback(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return '?';
  }

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

export function ServiceLogo({ serviceKey, name, size, style }: ServiceLogoProps) {
  const source = getServiceLogoSource(serviceKey);

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: Math.min(Radius.md, size / 3),
        },
        style,
      ]}>
      {source ? (
        <Image contentFit="contain" source={source} style={styles.image} />
      ) : (
        <ThemedText style={styles.fallbackText}>{getLogoFallback(name)}</ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackText: {
    ...Typography.headline,
  },
});

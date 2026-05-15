import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { Spacing, Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { TranslationKey, useI18n } from '@/utils/i18n';

const githubUrl = 'https://github.com/barisgunduz/subscription-tracker';
const supportEmail = 'baris@gunduzmedya.com';

const sections: { titleKey: TranslationKey; bodyKey: TranslationKey }[] = [
  { titleKey: 'appFeatures', bodyKey: 'appFeaturesBody' },
  { titleKey: 'howToUse', bodyKey: 'howToUseBody' },
  { titleKey: 'dataStored', bodyKey: 'dataStoredBody' },
  { titleKey: 'openSource', bodyKey: 'openSourceBody' },
  { titleKey: 'contact', bodyKey: 'contactBody' },
];

export default function SupportScreen() {
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');
  const dividerColor = useThemeColor({}, 'divider');
  const { t } = useI18n();

  async function openGithub() {
    try {
      await Linking.openURL(githubUrl);
    } catch {
      Alert.alert(t('unableOpenLink'), githubUrl);
    }
  }

  async function openEmail() {
    const mailUrl = `mailto:${supportEmail}`;

    try {
      const canOpenMail = await Linking.canOpenURL(mailUrl);

      if (!canOpenMail) {
        Alert.alert(t('noMailApp'), t('emailFallback', { email: supportEmail }));
        return;
      }

      await Linking.openURL(mailUrl);
    } catch {
      Alert.alert(t('unableOpenMail'), t('emailFallback', { email: supportEmail }));
    }
  }

  return (
    <ScreenContainer scrollable includeTopInset={false} contentStyle={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>{t('support')}</ThemedText>
        <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
          {t('helpProjectContact')}
        </ThemedText>
      </View>

      <Card style={styles.card}>
        {sections.map((section) => (
          <View key={section.titleKey} style={styles.section}>
            <ThemedText style={styles.sectionTitle}>{t(section.titleKey)}</ThemedText>
            <ThemedText style={[styles.body, { color: textSecondary }]}>{t(section.bodyKey)}</ThemedText>
          </View>
        ))}

        <View style={[styles.links, { borderTopColor: dividerColor }]}>
          <Pressable
            accessibilityRole="link"
            onPress={() => void openGithub()}
            style={({ pressed }) => [styles.linkButton, { opacity: pressed ? 0.72 : 1 }]}>
            <ThemedText style={[styles.linkText, { color: tintColor }]}>{githubUrl}</ThemedText>
          </Pressable>

          <Pressable
            accessibilityRole="link"
            onPress={() => void openEmail()}
            style={({ pressed }) => [styles.linkButton, { opacity: pressed ? 0.72 : 1 }]}>
            <ThemedText style={[styles.linkText, { color: tintColor }]}>
              mailto:{supportEmail}
            </ThemedText>
          </Pressable>
        </View>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 120,
    gap: Spacing.lg,
  },
  header: {
    gap: Spacing.xs,
  },
  title: {
    ...Typography.title1,
  },
  subtitle: {
    ...Typography.footnote,
  },
  card: {
    gap: Spacing.lg,
  },
  section: {
    gap: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.headline,
  },
  body: {
    ...Typography.callout,
  },
  links: {
    borderTopWidth: 1,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  linkButton: {
    minHeight: 32,
    justifyContent: 'center',
  },
  linkText: {
    ...Typography.callout,
    fontWeight: '600',
  },
});

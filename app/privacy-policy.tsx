import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { Spacing, Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { TranslationKey, useI18n } from '@/utils/i18n';

const updatedDate = 'June 3, 2026';

const sections: { titleKey: TranslationKey; bodyKey: TranslationKey }[] = [
  { titleKey: 'overview', bodyKey: 'overviewBody' },
  { titleKey: 'dataYouEnter', bodyKey: 'dataYouEnterBody' },
  { titleKey: 'dataStored', bodyKey: 'dataStoredBody' },
  { titleKey: 'analytics', bodyKey: 'analyticsBody' },
  { titleKey: 'authenticationAndAds', bodyKey: 'authenticationAndAdsBody' },
  { titleKey: 'notifications', bodyKey: 'notificationsPolicyBody' },
  { titleKey: 'exportingData', bodyKey: 'exportingDataBody' },
  { titleKey: 'yearsOldChildren', bodyKey: 'yearsOldChildrenBody' },
  { titleKey: 'changes', bodyKey: 'changesBody' },
  { titleKey: 'contact', bodyKey: 'privacyContactBody' },
];

export default function PrivacyPolicyScreen() {
  const textSecondary = useThemeColor({}, 'textSecondary');
  const { t } = useI18n();

  return (
    <ScreenContainer scrollable includeTopInset={false} contentStyle={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>{t('privacyPolicy')}</ThemedText>
        <ThemedText style={[styles.updated, { color: textSecondary }]}>
          {t('lastUpdated', { date: updatedDate })}
        </ThemedText>
      </View>

      <Card style={styles.card}>
        {sections.map((section, index) => (
          <View
            key={section.titleKey}
            style={[styles.section, index === sections.length - 1 ? styles.lastSection : null]}>
            <ThemedText style={styles.sectionTitle}>{t(section.titleKey)}</ThemedText>
            <ThemedText style={[styles.body, { color: textSecondary }]}>{t(section.bodyKey)}</ThemedText>
          </View>
        ))}
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
  updated: {
    ...Typography.footnote,
  },
  card: {
    gap: Spacing.lg,
  },
  section: {
    gap: Spacing.xs,
  },
  lastSection: {
    marginBottom: 0,
  },
  sectionTitle: {
    ...Typography.headline,
  },
  body: {
    ...Typography.callout,
  },
});

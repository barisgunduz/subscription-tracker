import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { Spacing, Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

const updatedDate = 'May 15, 2026';

const sections = [
  {
    title: 'Overview',
    body:
      'Suburio is designed to work without an account, advertising, or selling personal data. The app helps you track subscriptions using information you enter on your device.',
  },
  {
    title: 'Data You Enter',
    body:
      'Subscription names, prices, billing dates, categories, notes, and notification preferences are stored locally on your device. We do not operate a server that receives or stores this subscription data.',
  },
  {
    title: 'Analytics',
    body:
      'The app may use an analytics tool to understand basic app usage, performance, and crashes. Analytics, if enabled, is used to improve the app and is not used for advertising or user profiling.',
  },
  {
    title: 'Authentication and Ads',
    body:
      'The app does not include user authentication and does not show ads. We do not sell your data or share your subscription details with advertisers.',
  },
  {
    title: 'Notifications',
    body:
      'If you enable billing reminders, notification scheduling happens for the purpose of reminding you about upcoming renewals. You can turn notifications off in Settings at any time.',
  },
  {
    title: 'Exporting Data',
    body:
      'If you export your subscriptions, the exported file is created from the data stored on your device. You control where that file is saved or shared after export.',
  },
  {
    title: 'Children',
    body:
      'The app is not directed to children under 13. We do not knowingly collect personal information from children.',
  },
  {
    title: 'Changes',
    body:
      'This policy may be updated when app features or legal requirements change. The updated date above will reflect the latest version.',
  },
  {
    title: 'Contact',
    body:
      'For privacy questions, contact baris@gunduzmedya.com.',
  },
];

export default function PrivacyPolicyScreen() {
  const textSecondary = useThemeColor({}, 'textSecondary');

  return (
    <ScreenContainer scrollable includeTopInset={false} contentStyle={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Privacy Policy</ThemedText>
        <ThemedText style={[styles.updated, { color: textSecondary }]}>
          Last updated: {updatedDate}
        </ThemedText>
      </View>

      <Card style={styles.card}>
        {sections.map((section, index) => (
          <View
            key={section.title}
            style={[styles.section, index === sections.length - 1 ? styles.lastSection : null]}>
            <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
            <ThemedText style={[styles.body, { color: textSecondary }]}>{section.body}</ThemedText>
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

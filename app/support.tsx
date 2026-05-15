import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { Spacing, Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

const githubUrl = 'https://github.com/barisgunduz/subscription-tracker';
const supportEmail = 'baris@gunduzmedya.com';

const sections = [
  {
    title: 'App Features',
    body:
      'Suburio helps you save recurring subscriptions, see upcoming payments, review spending by category, pause or restart subscriptions, enable billing reminders, and export your data as JSON, CSV, or PDF.',
  },
  {
    title: 'How to Use',
    body:
      'Add each subscription with its price, billing cycle, billing day, category, and optional notes. Use Home for upcoming renewals, Subscriptions for your full list, Stats for spending summaries, and Settings for notifications, exports, support, and privacy details.',
  },
  {
    title: 'How Data Is Stored',
    body:
      'Your subscription data is stored locally on your device. There is no account system, no ads, and no server account connected to your saved subscription details.',
  },
  {
    title: 'Open Source',
    body:
      'The app is open sourced. You can review the project, report issues, or collaborate through the GitHub repository.',
  },
  {
    title: 'Contact',
    body:
      'For support questions, feedback, or collaboration requests, email the developer.',
  },
];

export default function SupportScreen() {
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');
  const dividerColor = useThemeColor({}, 'divider');

  async function openGithub() {
    try {
      await Linking.openURL(githubUrl);
    } catch {
      Alert.alert('Unable to open link', githubUrl);
    }
  }

  async function openEmail() {
    const mailUrl = `mailto:${supportEmail}`;

    try {
      const canOpenMail = await Linking.canOpenURL(mailUrl);

      if (!canOpenMail) {
        Alert.alert('No mail app found', `Please email ${supportEmail}.`);
        return;
      }

      await Linking.openURL(mailUrl);
    } catch {
      Alert.alert('Unable to open mail app', `Please email ${supportEmail}.`);
    }
  }

  return (
    <ScreenContainer scrollable includeTopInset={false} contentStyle={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Support</ThemedText>
        <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
          Help, project details, and contact information.
        </ThemedText>
      </View>

      <Card style={styles.card}>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
            <ThemedText style={[styles.body, { color: textSecondary }]}>{section.body}</ThemedText>
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

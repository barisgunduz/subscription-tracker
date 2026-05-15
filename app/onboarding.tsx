import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { setHasCompletedOnboarding } from '@/utils/onboarding';
import { TranslationKey, useI18n } from '@/utils/i18n';

const ONBOARDING_STEPS: {
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  icon: 'wallet-outline' | 'calendar-clear-outline' | 'stats-chart-outline';
}[] = [
  {
    titleKey: 'trackSubscriptionsTitle',
    descriptionKey: 'trackSubscriptionsBody',
    icon: 'wallet-outline' as const,
  },
  {
    titleKey: 'upcomingPaymentsTitle',
    descriptionKey: 'upcomingPaymentsBody',
    icon: 'calendar-clear-outline' as const,
  },
  {
    titleKey: 'controlSpendingTitle',
    descriptionKey: 'controlSpendingBody',
    icon: 'stats-chart-outline' as const,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const tintColor = useThemeColor({}, 'tint');
  const tintMuted = useThemeColor({}, 'tintMuted');
  const surfaceSecondary = useThemeColor({}, 'surfaceSecondary');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');

  const step = ONBOARDING_STEPS[activeStep];
  const isLastStep = activeStep === ONBOARDING_STEPS.length - 1;

  async function handleComplete() {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await setHasCompletedOnboarding(true);
      router.replace('/home');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleNext() {
    if (isLastStep) {
      void handleComplete();
      return;
    }

    setActiveStep((currentStep) => currentStep + 1);
  }

  return (
    <ScreenContainer contentStyle={styles.container}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          <View style={styles.progressRow}>
            {ONBOARDING_STEPS.map((item, index) => {
              const isActive = index === activeStep;

              return (
                <View
                  key={item.titleKey}
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor: isActive ? tintColor : surfaceSecondary,
                      borderColor: isActive ? tintColor : borderColor,
                    },
                  ]}
                />
              );
            })}
          </View>

          {!isLastStep ? (
            <ThemedText style={[styles.skipText, { color: textSecondary }]} onPress={handleComplete}>
              {t('skip')}
            </ThemedText>
          ) : null}
        </View>

        <Card style={styles.heroCard}>
          <View style={[styles.heroIcon, { backgroundColor: tintMuted }]}>
            <Ionicons name={step.icon} size={34} color={tintColor} />
          </View>

          <View style={styles.copyBlock}>
            <ThemedText style={styles.eyebrow}>
              {t('stepProgress', { current: activeStep + 1, total: ONBOARDING_STEPS.length })}
            </ThemedText>
            <ThemedText style={styles.title}>{t(step.titleKey)}</ThemedText>
            <ThemedText style={[styles.description, { color: textSecondary }]}>
              {t(step.descriptionKey)}
            </ThemedText>
          </View>
        </Card>
      </View>

      <View style={styles.actions}>
        {activeStep > 0 ? (
          <ThemedText
            style={[styles.secondaryAction, { color: textSecondary }]}
            onPress={() => setActiveStep((currentStep) => Math.max(0, currentStep - 1))}>
            {t('back')}
          </ThemedText>
        ) : (
          <View />
        )}

        <PrimaryButton
          title={isLastStep ? t('openApp') : t('continue')}
          onPress={handleNext}
          disabled={isSubmitting}
          style={styles.primaryAction}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: Spacing.xxl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  progressDot: {
    width: 36,
    height: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  skipText: {
    ...Typography.callout,
    fontWeight: '600',
  },
  heroCard: {
    padding: Spacing.xl,
    gap: Spacing.xl,
  },
  heroIcon: {
    width: 88,
    height: 88,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBlock: {
    gap: Spacing.md,
  },
  eyebrow: {
    ...Typography.footnote,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    ...Typography.title1,
  },
  description: {
    ...Typography.body,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  secondaryAction: {
    ...Typography.callout,
    fontWeight: '600',
  },
  primaryAction: {
    flex: 1,
  },
});

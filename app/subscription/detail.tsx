import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ServiceLogo } from '@/components/ServiceLogo';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { getCategoryTranslationKey } from '@/utils/categories';
import { formatCurrency } from '@/utils/currency';
import { useI18n } from '@/utils/i18n';

function formatDate(value: string, locale: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

type DetailRowProps = {
  label: string;
  value: string;
};

function DetailRow({ label, value }: DetailRowProps) {
  const secondaryText = useThemeColor({}, 'textSecondary');
  const dividerColor = useThemeColor({}, 'divider');

  return (
    <View style={[styles.detailRow, { borderBottomColor: dividerColor }]}>
      <ThemedText style={[styles.detailLabel, { color: secondaryText }]}>{label}</ThemedText>
      <ThemedText style={styles.detailValue}>{value}</ThemedText>
    </View>
  );
}

export default function SubscriptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const router = useRouter();
  const { locale, t } = useI18n();
  const subscriptionId = Array.isArray(id) ? id[0] : id;

  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const pauseSubscription = useSubscriptionStore((state) => state.pauseSubscription);
  const restartSubscription = useSubscriptionStore((state) => state.restartSubscription);
  const deleteSubscription = useSubscriptionStore((state) => state.deleteSubscription);

  const tintColor = useThemeColor({}, 'tint');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const surfaceSecondary = useThemeColor({}, 'surfaceSecondary');
  const dangerColor = useThemeColor({}, 'danger');
  const borderColor = useThemeColor({}, 'border');

  const subscription = subscriptions.find((item) => item.id === subscriptionId);

  function navigateBackToSubscriptions() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)/subscriptions');
  }

  if (!subscription) {
    return (
      <ScreenContainer contentStyle={styles.notFoundContainer}>
        <Card>
          <ThemedText style={styles.notFoundTitle}>{t('subscriptionNotFound')}</ThemedText>
          <ThemedText style={[styles.notFoundCopy, { color: textSecondary }]}>
            {t('subscriptionNotFoundBody')}
          </ThemedText>
          <View style={styles.notFoundAction}>
            <PrimaryButton onPress={navigateBackToSubscriptions} title={t('goBack')} />
          </View>
        </Card>
      </ScreenContainer>
    );
  }

  const currentSubscription = subscription;
  const categoryTranslationKey = getCategoryTranslationKey(currentSubscription.category);
  const originalPrice = formatCurrency(
    currentSubscription.price,
    currentSubscription.currency,
    locale
  );

  function handlePause() {
    if (currentSubscription.status === 'paused') {
      Alert.alert(t('restartSubscription'), t('restartSubscriptionBody', { name: currentSubscription.name }), [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('restart'),
          onPress: () => restartSubscription(currentSubscription.id),
        },
      ]);
      return;
    }

    Alert.alert(t('pauseSubscription'), t('pauseSubscriptionBody', { name: currentSubscription.name }), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('pause'),
        onPress: () => pauseSubscription(currentSubscription.id),
      },
    ]);
  }

  function handleDelete() {
    Alert.alert(t('deleteSubscription'), t('deleteSubscriptionBody', { name: currentSubscription.name }), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => {
          deleteSubscription(currentSubscription.id);
          router.replace('/(tabs)/subscriptions');
        },
      },
    ]);
  }

  function handleEdit() {
    router.push({
      pathname: '/subscription/edit',
      params: { id: currentSubscription.id },
    });
  }

  return (
    <ScreenContainer scrollable includeTopInset={false} contentStyle={styles.container}>
      <Card style={styles.heroCard}>
        <ServiceLogo
          serviceKey={currentSubscription.serviceKey}
          name={currentSubscription.name}
          size={72}
          style={[styles.logoBadge, { backgroundColor: surfaceSecondary }]}
        />

        <View style={styles.heroCopy}>
          <ThemedText style={styles.title}>{currentSubscription.name}</ThemedText>
          <ThemedText style={[styles.heroMeta, { color: textSecondary }]}>
            {originalPrice} · {currentSubscription.billingCycle === 'monthly' ? t('monthly') : t('yearly')}
          </ThemedText>
          <View style={[styles.statusPill, { backgroundColor: surfaceSecondary, borderColor }]}>
            <ThemedText style={[styles.statusText, { color: tintColor }]}>
              {currentSubscription.status === 'active' ? t('active') : t('pause')}
            </ThemedText>
          </View>
        </View>
      </Card>

      <Card padded={false}>
        <DetailRow
          label={t('price')}
          value={originalPrice}
        />
        <DetailRow
          label={t('billingCycle')}
          value={currentSubscription.billingCycle === 'monthly' ? t('monthly') : t('yearly')}
        />
        <DetailRow label={t('billingDay')} value={String(currentSubscription.billingDay)} />
        <DetailRow label={t('startDate')} value={formatDate(currentSubscription.startDate, locale)} />
        <DetailRow label={t('renewalDate')} value={formatDate(currentSubscription.renewalDate, locale)} />
        <DetailRow
          label={t('nextBillingDate')}
          value={formatDate(currentSubscription.nextBillingDate, locale)}
        />
        <DetailRow
          label={t('category')}
          value={categoryTranslationKey ? t(categoryTranslationKey) : currentSubscription.category}
        />
        <View style={styles.notesRow}>
          <ThemedText style={[styles.detailLabel, { color: textSecondary }]}>{t('notes')}</ThemedText>
          <ThemedText style={styles.notesValue}>
            {currentSubscription.notes.trim() ? currentSubscription.notes : t('noNotes')}
          </ThemedText>
        </View>
      </Card>

      <View style={styles.actions}>
        <PrimaryButton onPress={handleEdit} title={t('edit')} />

        <Pressable
          accessibilityRole="button"
          onPress={handlePause}
          style={({ pressed }) => [
            styles.secondaryAction,
            {
              backgroundColor: surfaceSecondary,
              borderColor,
              opacity: pressed ? 0.88 : 1,
            },
          ]}>
          <ThemedText style={styles.secondaryActionText}>
            {currentSubscription.status === 'paused' ? t('restart') : t('pause')}
          </ThemedText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={handleDelete}
          style={({ pressed }) => [
            styles.dangerAction,
            {
              borderColor: dangerColor,
              opacity: pressed ? 0.88 : 1,
            },
          ]}>
          <ThemedText style={[styles.dangerActionText, { color: dangerColor }]}>{t('delete')}</ThemedText>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.md,
    paddingBottom: 32,
    gap: Spacing.lg,
  },
  notFoundContainer: {
    justifyContent: 'center',
  },
  notFoundTitle: {
    ...Typography.title2,
  },
  notFoundCopy: {
    ...Typography.callout,
    marginTop: Spacing.xs,
  },
  notFoundAction: {
    marginTop: Spacing.md,
  },
  heroCard: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  logoBadge: {
    borderRadius: Radius.lg,
  },
  heroCopy: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  title: {
    ...Typography.title1,
    textAlign: 'center',
  },
  heroMeta: {
    ...Typography.callout,
    textAlign: 'center',
  },
  statusPill: {
    marginTop: Spacing.xs,
    minHeight: 32,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    ...Typography.caption,
    textTransform: 'capitalize',
  },
  detailRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.xs,
  },
  notesRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  detailLabel: {
    ...Typography.footnote,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    ...Typography.body,
  },
  notesValue: {
    ...Typography.body,
    minHeight: 24,
  },
  actions: {
    gap: Spacing.sm,
  },
  secondaryAction: {
    minHeight: 54,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  secondaryActionText: {
    ...Typography.button,
  },
  dangerAction: {
    minHeight: 54,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    backgroundColor: 'transparent',
  },
  dangerActionText: {
    ...Typography.button,
  },
});

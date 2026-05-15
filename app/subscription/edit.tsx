import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { BILLING_CYCLES, BillingCycle } from '@/types/subscription';
import { getAppCurrency } from '@/utils/currency';
import { useI18n } from '@/utils/i18n';

const BILLING_CYCLE_OPTIONS: BillingCycle[] = [...BILLING_CYCLES];

function parseNumber(value: string) {
  const normalizedValue = value.replace(',', '.');
  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function clampBillingDay(value: string) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return '';
  }

  return String(Math.min(31, Math.max(1, Math.floor(parsedValue))));
}

export default function EditSubscriptionScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const router = useRouter();
  const { t } = useI18n();
  const subscriptionId = Array.isArray(id) ? id[0] : id;

  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
  const updateSubscription = useSubscriptionStore((state) => state.updateSubscription);

  const subscription = subscriptions.find((item) => item.id === subscriptionId);

  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const surfaceSecondary = useThemeColor({}, 'surfaceSecondary');
  const surface = useThemeColor({}, 'surface');
  const textColor = useThemeColor({}, 'text');

  const [price, setPrice] = useState(subscription ? String(subscription.price) : '');
  const [billingDay, setBillingDay] = useState(
    subscription ? String(subscription.billingDay) : ''
  );
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    subscription?.billingCycle ?? 'monthly'
  );
  const [category, setCategory] = useState(subscription?.category ?? '');
  const [notes, setNotes] = useState(subscription?.notes ?? '');
  const [validationMessage, setValidationMessage] = useState('');

  if (!subscription) {
    return (
      <ScreenContainer contentStyle={styles.notFoundContainer}>
        <Card>
          <ThemedText style={styles.notFoundTitle}>{t('subscriptionNotFound')}</ThemedText>
          <ThemedText style={[styles.notFoundCopy, { color: textSecondary }]}>
            {t('subscriptionNotFoundBody')}
          </ThemedText>
          <View style={styles.notFoundAction}>
            <PrimaryButton onPress={() => router.back()} title={t('goBack')} />
          </View>
        </Card>
      </ScreenContainer>
    );
  }

  const currentSubscription = subscription;
  const selectedCurrency = getAppCurrency(
    currentSubscription.currency === 'EUR' || currentSubscription.currency === 'TRY'
      ? currentSubscription.currency
      : 'USD'
  );

  function handleSave() {
    const parsedPrice = parseNumber(price);
    const normalizedBillingDay = Number(clampBillingDay(billingDay));
    const trimmedCategory = category.trim();
    const trimmedNotes = notes.trim();

    if (parsedPrice === null || parsedPrice <= 0) {
      setValidationMessage(t('priceInvalid'));
      return;
    }

    if (!normalizedBillingDay) {
      setValidationMessage(t('billingDayInvalid'));
      return;
    }

    if (!trimmedCategory) {
      setValidationMessage(t('categoryRequired'));
      return;
    }

    updateSubscription(currentSubscription.id, {
      price: parsedPrice,
      billingDay: normalizedBillingDay,
      billingCycle,
      category: trimmedCategory,
      notes: trimmedNotes,
    });

    router.replace({
      pathname: '/subscription/detail',
      params: { id: currentSubscription.id },
    });
  }

  return (
    <ScreenContainer scrollable contentStyle={styles.container}>
      <Card>
        <ThemedText style={styles.sectionTitle}>{currentSubscription.name}</ThemedText>
        <ThemedText style={[styles.sectionMeta, { color: textSecondary }]}>
          {t('serviceNameFixed')}
        </ThemedText>

        <View style={styles.sectionContent}>
          <View style={styles.twoColumnRow}>
            <View style={styles.fieldGroupFlexible}>
              <ThemedText style={styles.fieldLabel}>
                {t('price')} ({selectedCurrency.symbol})
              </ThemedText>
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={setPrice}
                placeholder="0.00"
                placeholderTextColor={textSecondary}
                style={[
                  styles.input,
                  {
                    backgroundColor: surface,
                    borderColor,
                    color: textColor,
                  },
                ]}
                value={price}
              />
            </View>

            <View style={styles.fieldGroupFlexible}>
              <ThemedText style={styles.fieldLabel}>{t('billingDay')}</ThemedText>
              <TextInput
                keyboardType="number-pad"
                onChangeText={(value) => setBillingDay(clampBillingDay(value))}
                placeholder="1"
                placeholderTextColor={textSecondary}
                style={[
                  styles.input,
                  {
                    backgroundColor: surface,
                    borderColor,
                    color: textColor,
                  },
                ]}
                value={billingDay}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>{t('billingCycle')}</ThemedText>
            <View style={styles.chipRow}>
              {BILLING_CYCLE_OPTIONS.map((option) => {
                const isActive = option === billingCycle;

                return (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    onPress={() => setBillingCycle(option)}
                    style={({ pressed }) => [
                      styles.optionChip,
                      {
                        backgroundColor: isActive ? tintColor : surfaceSecondary,
                        borderColor: isActive ? tintColor : borderColor,
                        opacity: pressed ? 0.9 : 1,
                      },
                    ]}>
                    <ThemedText
                      lightColor={isActive ? '#FFFFFF' : undefined}
                      darkColor={isActive ? '#FFFFFF' : undefined}
                      style={styles.optionChipText}>
                      {option === 'monthly' ? t('monthly') : t('yearly')}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>{t('category')}</ThemedText>
            <TextInput
              onChangeText={setCategory}
              placeholder={t('enterCategory')}
              placeholderTextColor={textSecondary}
              style={[
                styles.input,
                styles.fullWidth,
                {
                  backgroundColor: surface,
                  borderColor,
                  color: textColor,
                },
              ]}
              value={category}
            />
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>{t('notes')}</ThemedText>
            <TextInput
              multiline
              onChangeText={setNotes}
              placeholder={t('optionalNotes')}
              placeholderTextColor={textSecondary}
              style={[
                styles.input,
                styles.notesInput,
                {
                  backgroundColor: surface,
                  borderColor,
                  color: textColor,
                },
              ]}
              textAlignVertical="top"
              value={notes}
            />
          </View>
        </View>
      </Card>

      {validationMessage ? (
        <ThemedText style={[styles.validationText, { color: '#FF3B30' }]}>
          {validationMessage}
        </ThemedText>
      ) : null}

      <PrimaryButton onPress={handleSave} title={t('saveChanges')} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
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
  sectionTitle: {
    ...Typography.title2,
  },
  sectionMeta: {
    ...Typography.footnote,
    marginTop: Spacing.xs,
  },
  sectionContent: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  fieldGroup: {
    gap: Spacing.xs,
  },
  fieldGroupFlexible: {
    flex: 1,
    gap: Spacing.xs,
  },
  fieldLabel: {
    ...Typography.footnote,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body,
  },
  fullWidth: {
    width: '100%',
  },
  notesInput: {
    minHeight: 112,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  optionChip: {
    minHeight: 40,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionChipText: {
    ...Typography.footnote,
    fontWeight: '600',
  },
  validationText: {
    ...Typography.footnote,
  },
});

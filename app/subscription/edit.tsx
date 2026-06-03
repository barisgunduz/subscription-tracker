import { useState } from 'react';
import {
  Alert,
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { BILLING_CYCLES, BillingCycle } from '@/types/subscription';
import { getCategoryTranslationKey } from '@/utils/categories';
import { getAppCurrency } from '@/utils/currency';
import { useI18n } from '@/utils/i18n';
import { listServiceCategories } from '@/utils/serviceLookup';

const BILLING_CYCLE_OPTIONS: BillingCycle[] = [...BILLING_CYCLES];
const NOTES_INPUT_ACCESSORY_ID = 'edit-subscription-notes-accessory';

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
  const availableCategories = listServiceCategories();
  const translateCategory = (value: string) => {
    const key = getCategoryTranslationKey(value);

    return key ? t(key) : value;
  };

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

  function handleCategorySelect() {
    Alert.alert(
      t('category'),
      undefined,
      [
        ...availableCategories.map((option) => ({
          text: translateCategory(option),
          onPress: () => {
            setCategory(option);
            setValidationMessage('');
          },
        })),
        { text: t('cancel'), style: 'cancel' as const },
      ],
      { cancelable: true }
    );
  }

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

    if (!availableCategories.includes(trimmedCategory)) {
      setValidationMessage(t('selectCategoryRequired'));
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
            <Pressable
              accessibilityRole="button"
              onPress={handleCategorySelect}
              style={[
                styles.selectInput,
                styles.fullWidth,
                {
                  backgroundColor: surface,
                  borderColor,
                },
              ]}>
              <ThemedText
                style={[
                  styles.selectInputText,
                  {
                    color: category ? textColor : textSecondary,
                  },
                ]}>
                {category ? translateCategory(category) : t('selectCategory')}
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>{t('notes')}</ThemedText>
            <TextInput
              inputAccessoryViewID={
                Platform.OS === 'ios' ? NOTES_INPUT_ACCESSORY_ID : undefined
              }
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

      {Platform.OS === 'ios' ? (
        <InputAccessoryView nativeID={NOTES_INPUT_ACCESSORY_ID}>
          <View
            style={[
              styles.keyboardAccessory,
              {
                backgroundColor: surface,
                borderTopColor: borderColor,
              },
            ]}>
            <Pressable
              accessibilityRole="button"
              onPress={Keyboard.dismiss}
              style={({ pressed }) => [
                styles.keyboardDoneButton,
                {
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <ThemedText style={[styles.keyboardDoneText, { color: tintColor }]}>
                {t('done')}
              </ThemedText>
            </Pressable>
          </View>
        </InputAccessoryView>
      ) : null}

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
  selectInput: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: Radius.md,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  selectInputText: {
    ...Typography.body,
  },
  keyboardAccessory: {
    minHeight: 44,
    borderTopWidth: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  keyboardDoneButton: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  keyboardDoneText: {
    ...Typography.headline,
  },
  validationText: {
    ...Typography.footnote,
  },
});

import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ServiceLogo } from '@/components/ServiceLogo';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { BILLING_CYCLES, BillingCycle } from '@/types/subscription';
import { getCategoryTranslationKey } from '@/utils/categories';
import { appCurrencies, AppCurrencyCode, getAppCurrency } from '@/utils/currency';
import { useI18n } from '@/utils/i18n';
import { Service, searchServices } from '@/utils/serviceLookup';

type ServiceMode = 'default' | 'custom';

const BILLING_CYCLE_OPTIONS: BillingCycle[] = [...BILLING_CYCLES];

function toIsoDate(date: Date) {
  return date.toISOString().split('T')[0];
}

function normalizeServiceKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

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

export default function AddSubscriptionScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const addSubscription = useSubscriptionStore((state) => state.addSubscription);
  const displayCurrency = usePreferencesStore((state) => state.displayCurrency);
  const exchangeRates = usePreferencesStore((state) => state.exchangeRates);
  const exchangeRatesDate = usePreferencesStore((state) => state.exchangeRatesDate);

  const tintColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const surfaceSecondary = useThemeColor({}, 'surfaceSecondary');
  const surface = useThemeColor({}, 'surface');
  const textColor = useThemeColor({}, 'text');

  const [serviceMode, setServiceMode] = useState<ServiceMode>('default');
  const [serviceQuery, setServiceQuery] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<AppCurrencyCode>(displayCurrency);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [billingDay, setBillingDay] = useState(String(new Date().getDate()));
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [validationMessage, setValidationMessage] = useState('');

  const matchingServices = searchServices(serviceQuery).slice(0, 8);
  const selectedCurrency = getAppCurrency(currency);
  const translateCategory = (value: string) => {
    const key = getCategoryTranslationKey(value);

    return key ? t(key) : value;
  };

  function applySelectedService(service: Service) {
    setSelectedService(service);
    setServiceName(service.name);
    setCategory(service.category);
    setServiceQuery(service.name);
    setValidationMessage('');
  }

  function handleServiceModeChange(nextMode: ServiceMode) {
    setServiceMode(nextMode);
    setValidationMessage('');

    if (nextMode === 'custom') {
      setSelectedService(null);
      setServiceQuery('');
      return;
    }

    setServiceName('');
    setCategory('');
  }

  function handleSave() {
    const trimmedName = serviceName.trim();
    const trimmedCategory = category.trim();
    const trimmedNotes = notes.trim();
    const parsedPrice = parseNumber(price);
    const normalizedBillingDay = Number(clampBillingDay(billingDay));

    if (!trimmedName) {
      setValidationMessage(t('serviceNameRequired'));
      return;
    }

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

    const activeService = serviceMode === 'default' ? selectedService : null;

    if (serviceMode === 'default' && !activeService) {
      setValidationMessage(t('selectDefaultService'));
      return;
    }

    addSubscription({
      serviceKey: activeService?.key ?? normalizeServiceKey(trimmedName),
      name: trimmedName,
      logo: activeService?.key ?? '',
      price: parsedPrice,
      currency,
      exchangeRatesAtCreation: exchangeRates,
      exchangeRatesDate,
      billingCycle,
      billingDay: normalizedBillingDay,
      startDate: toIsoDate(new Date()),
      renewalDate: toIsoDate(new Date()),
      category: trimmedCategory,
      status: 'active',
      notes: trimmedNotes,
    });

    router.back();
  }

  return (
    <ScreenContainer scrollable contentStyle={styles.container}>
      <Card>
        <ThemedText style={styles.sectionTitle}>{t('serviceType')}</ThemedText>
        <View style={styles.chipRow}>
          {(['default', 'custom'] as ServiceMode[]).map((mode) => {
            const isActive = mode === serviceMode;

            return (
              <Pressable
                key={mode}
                accessibilityRole="button"
                onPress={() => handleServiceModeChange(mode)}
                style={({ pressed }) => [
                  styles.modeChip,
                  {
                    backgroundColor: isActive ? tintColor : surfaceSecondary,
                    borderColor: isActive ? tintColor : borderColor,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}>
                <ThemedText
                  lightColor={isActive ? '#FFFFFF' : undefined}
                  darkColor={isActive ? '#FFFFFF' : undefined}
                  style={styles.modeChipText}>
                  {mode === 'default' ? t('defaultService') : t('customService')}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {serviceMode === 'default' ? (
          <View style={styles.sectionContent}>
            <ThemedText style={styles.fieldLabel}>{t('searchServices')}</ThemedText>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setServiceQuery}
              placeholder={t('searchByNameOrCategory')}
              placeholderTextColor={textSecondary}
              style={[
                styles.input,
                {
                  backgroundColor: surface,
                  borderColor,
                  color: textColor,
                },
              ]}
              value={serviceQuery}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.serviceRow}>
              {matchingServices.map((service) => {
                const isActive = selectedService?.key === service.key;

                return (
                  <Pressable
                    key={service.id}
                    accessibilityRole="button"
                    onPress={() => applySelectedService(service)}
                    style={({ pressed }) => [
                      styles.serviceCard,
                      {
                        backgroundColor: isActive ? tintColor : surfaceSecondary,
                        borderColor: isActive ? tintColor : borderColor,
                        opacity: pressed ? 0.9 : 1,
                      },
                    ]}>
                    <ServiceLogo
                      serviceKey={service.key}
                      name={service.name}
                      size={42}
                      style={styles.serviceBadge}
                    />
                    <ThemedText
                      lightColor={isActive ? '#FFFFFF' : undefined}
                      darkColor={isActive ? '#FFFFFF' : undefined}
                      style={styles.serviceName}>
                      {service.name}
                    </ThemedText>
                    <ThemedText
                      lightColor={isActive ? '#EAF3FF' : undefined}
                      darkColor={isActive ? '#D9EBFF' : undefined}
                      style={styles.serviceCategory}>
                      {translateCategory(service.category)}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </Card>

      <Card>
        <ThemedText style={styles.sectionTitle}>{t('subscriptionDetails')}</ThemedText>

        <View style={styles.sectionContent}>
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>{t('serviceName')}</ThemedText>
            <TextInput
              editable={serviceMode === 'custom'}
              onChangeText={setServiceName}
              placeholder={t('enterServiceName')}
              placeholderTextColor={textSecondary}
              style={[
                styles.input,
                styles.fullWidth,
                {
                  backgroundColor: serviceMode === 'default' ? surfaceSecondary : surface,
                  borderColor,
                  color: textColor,
                },
              ]}
              value={serviceName}
            />
          </View>

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
            <ThemedText style={styles.fieldLabel}>{t('subscriptionCurrency')}</ThemedText>
            <View style={styles.chipRow}>
              {appCurrencies.map((option) => {
                const isActive = option.code === currency;

                return (
                  <Pressable
                    key={option.code}
                    accessibilityRole="button"
                    onPress={() => setCurrency(option.code)}
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
                      {t('currencyValue', { code: option.code, symbol: option.symbol })}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
            {exchangeRatesDate ? (
              <ThemedText style={[styles.helperText, { color: textSecondary }]}>
                {t('exchangeRateDate', { date: exchangeRatesDate })} ·{' '}
                {t('exchangeRatesSummary', {
                  eur: exchangeRates.EUR.toFixed(4),
                  try: exchangeRates.TRY.toFixed(4),
                })}
              </ThemedText>
            ) : null}
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
                  backgroundColor: serviceMode === 'default' ? surfaceSecondary : surface,
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

      <PrimaryButton onPress={handleSave} title={t('saveSubscription')} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
    gap: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.title2,
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
  notesInput: {
    minHeight: 112,
  },
  fullWidth: {
    width: '100%',
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
  modeChip: {
    minHeight: 40,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeChipText: {
    ...Typography.footnote,
    fontWeight: '600',
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
  helperText: {
    ...Typography.footnote,
  },
  serviceRow: {
    paddingRight: Spacing.xs,
    gap: Spacing.sm,
  },
  serviceCard: {
    width: 148,
    minHeight: 126,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  serviceBadge: {
    borderRadius: Radius.md,
    backgroundColor: '#FFFFFF',
  },
  serviceName: {
    ...Typography.headline,
  },
  serviceCategory: {
    ...Typography.footnote,
  },
  validationText: {
    ...Typography.footnote,
  },
});

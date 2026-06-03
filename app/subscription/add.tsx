import { useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  InputAccessoryView,
  Keyboard,
  Platform,
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
import { Service, listServiceCategories, searchServices } from '@/utils/serviceLookup';

type ServiceMode = 'default' | 'custom';

const BILLING_CYCLE_OPTIONS: BillingCycle[] = [...BILLING_CYCLES];
const NOTES_INPUT_ACCESSORY_ID = 'add-subscription-notes-accessory';

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
  const subscriptions = useSubscriptionStore((state) => state.subscriptions);
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
  const [duplicateNameSuffix, setDuplicateNameSuffix] = useState('');
  const [isDuplicateNameOverride, setIsDuplicateNameOverride] = useState(false);
  const [isDuplicateSuffixEditing, setIsDuplicateSuffixEditing] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const duplicateSuffixInputRef = useRef<TextInput>(null);

  const availableCategories = listServiceCategories();
  const matchingServices = searchServices(serviceQuery).slice(0, 8);
  const trimmedServiceQuery = serviceQuery.trim();
  const hasNoServiceMatches = Boolean(trimmedServiceQuery) && matchingServices.length === 0;
  const duplicateServiceSubscriptions = selectedService
    ? subscriptions.filter(
        (subscription) =>
          subscription.serviceKey === selectedService.key && subscription.status !== 'cancelled'
      )
    : [];
  const isSelectedServiceDuplicate =
    serviceMode === 'default' && Boolean(selectedService) && duplicateServiceSubscriptions.length > 0;
  const canEditDuplicateName = isSelectedServiceDuplicate && isDuplicateNameOverride;
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
    resetDuplicateNameState();
    setValidationMessage('');
  }

  function resetDuplicateNameState() {
    setDuplicateNameSuffix('');
    setIsDuplicateNameOverride(false);
    setIsDuplicateSuffixEditing(false);
  }

  function getNextDuplicateSuffix(service: Service) {
    const existingNames = new Set(
      subscriptions.map((subscription) => subscription.name.trim().toLowerCase())
    );
    let suffix = 2;

    while (existingNames.has(`${service.name}-${suffix}`.toLowerCase())) {
      suffix += 1;
    }

    return String(suffix);
  }

  function handleServiceModeChange(nextMode: ServiceMode) {
    setServiceMode(nextMode);
    setValidationMessage('');

    if (nextMode === 'custom') {
      const customName = serviceQuery.trim() || serviceName.trim();

      setSelectedService(null);
      resetDuplicateNameState();

      if (customName) {
        setServiceName(customName);
      }

      return;
    }

    if (selectedService) {
      setServiceName(selectedService.name);
      setCategory(selectedService.category);
      setServiceQuery(selectedService.name);
      return;
    }

    setServiceName('');
    setCategory('');
  }

  function handleServiceQueryChange(value: string) {
    setServiceQuery(value);
    setSelectedService(null);
    setServiceName('');
    setCategory('');
    resetDuplicateNameState();
    setValidationMessage('');
  }

  function applyCustomServiceFromQuery() {
    setServiceMode('custom');
    setSelectedService(null);
    setServiceName(trimmedServiceQuery);
    resetDuplicateNameState();
    setValidationMessage('');
  }

  function applyDuplicateNameOverride() {
    if (!selectedService) {
      return;
    }

    const nextSuffix = getNextDuplicateSuffix(selectedService);

    setDuplicateNameSuffix(nextSuffix);
    setServiceName(`${selectedService.name}-${nextSuffix}`);
    setIsDuplicateNameOverride(true);
    setIsDuplicateSuffixEditing(false);
    setValidationMessage('');
  }

  function handleDuplicateSuffixChange(value: string) {
    setDuplicateNameSuffix(value);

    if (selectedService) {
      setServiceName(`${selectedService.name}-${value}`);
    }
  }

  function handleDuplicateSuffixEditPress() {
    setIsDuplicateSuffixEditing(true);
    requestAnimationFrame(() => duplicateSuffixInputRef.current?.focus());
  }

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
    const trimmedName = serviceName.trim();
    const trimmedCategory = category.trim();
    const trimmedNotes = notes.trim();
    const parsedPrice = parseNumber(price);
    const normalizedBillingDay = Number(clampBillingDay(billingDay));

    if (!trimmedName) {
      setValidationMessage(t('serviceNameRequired'));
      return;
    }

    if (isSelectedServiceDuplicate && !isDuplicateNameOverride) {
      setValidationMessage(t('duplicateServiceRequiresConfirmation'));
      return;
    }

    if (canEditDuplicateName && !duplicateNameSuffix.trim()) {
      setValidationMessage(t('duplicateServiceSuffixRequired'));
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

    if (!availableCategories.includes(trimmedCategory)) {
      setValidationMessage(t('selectCategoryRequired'));
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
            <View
              style={[
                styles.searchInputWrapper,
                {
                  backgroundColor: surface,
                  borderColor,
                },
              ]}>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={handleServiceQueryChange}
                placeholder={t('searchByNameOrCategory')}
                placeholderTextColor={textSecondary}
                style={[styles.searchInput, { color: textColor }]}
                value={serviceQuery}
              />
              {serviceQuery ? (
                <Pressable
                  accessibilityLabel={t('clearSearch')}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => handleServiceQueryChange('')}
                  style={({ pressed }) => [
                    styles.clearSearchButton,
                    {
                      backgroundColor: surfaceSecondary,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}>
                  <Ionicons name="close" size={16} color={textSecondary} />
                </Pressable>
              ) : null}
            </View>

            {matchingServices.length > 0 ? (
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
            ) : null}

            {isSelectedServiceDuplicate && selectedService ? (
              <View style={styles.duplicateServiceNotice}>
                <ThemedText
                  style={[styles.duplicateServiceNoticeText, { color: textSecondary }]}>
                  {t('duplicateServiceNotice', { name: selectedService.name })}
                </ThemedText>
                {!isDuplicateNameOverride ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={applyDuplicateNameOverride}
                    style={({ pressed }) => [
                      styles.duplicateAddButton,
                      {
                        borderColor: tintColor,
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}>
                    <ThemedText style={[styles.duplicateAddButtonText, { color: tintColor }]}>
                      {t('addAnyway')}
                    </ThemedText>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {hasNoServiceMatches ? (
              <Pressable
                accessibilityRole="button"
                onPress={applyCustomServiceFromQuery}
                style={({ pressed }) => [
                  styles.customServiceAction,
                  {
                    backgroundColor: surfaceSecondary,
                    borderColor,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}>
                <ThemedText style={styles.customServiceActionTitle}>
                  {t('useAsCustomService', { name: trimmedServiceQuery })}
                </ThemedText>
                <ThemedText style={[styles.customServiceActionCopy, { color: textSecondary }]}>
                  {t('customServiceNoMatch')}
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </Card>

      <Card>
        <ThemedText style={styles.sectionTitle}>{t('subscriptionDetails')}</ThemedText>

        <View style={styles.sectionContent}>
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>{t('serviceName')}</ThemedText>
            {canEditDuplicateName && selectedService ? (
              <View
                style={[
                  styles.duplicateNameInputWrapper,
                  {
                    backgroundColor: surface,
                    borderColor,
                  },
                ]}>
                <ThemedText style={[styles.duplicateNamePrefix, { color: textColor }]}>
                  {selectedService.name}-
                </ThemedText>
                <TextInput
                  ref={duplicateSuffixInputRef}
                  editable={isDuplicateSuffixEditing}
                  keyboardType="default"
                  onBlur={() => setIsDuplicateSuffixEditing(false)}
                  onChangeText={handleDuplicateSuffixChange}
                  placeholder="2"
                  placeholderTextColor={textSecondary}
                  style={[styles.duplicateSuffixInput, { color: textColor }]}
                  value={duplicateNameSuffix}
                />
                <Pressable
                  accessibilityLabel={t('editDuplicateNameSuffix')}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={handleDuplicateSuffixEditPress}
                  style={({ pressed }) => [
                    styles.editServiceNameButton,
                    {
                      backgroundColor: surfaceSecondary,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}>
                  <Ionicons name="pencil" size={15} color={textSecondary} />
                </Pressable>
              </View>
            ) : (
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
            )}
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
  searchInputWrapper: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    minHeight: 52,
    paddingVertical: Spacing.sm,
    ...Typography.body,
  },
  clearSearchButton: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
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
  duplicateServiceNotice: {
    gap: Spacing.xs,
  },
  duplicateServiceNoticeText: {
    ...Typography.footnote,
    fontStyle: 'italic',
  },
  duplicateAddButton: {
    alignSelf: 'flex-start',
    minHeight: 32,
    borderRadius: Radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  duplicateAddButtonText: {
    ...Typography.footnote,
    fontWeight: '600',
  },
  duplicateNameInputWrapper: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
  },
  duplicateNamePrefix: {
    ...Typography.body,
  },
  duplicateSuffixInput: {
    flex: 1,
    minHeight: 52,
    minWidth: 48,
    paddingVertical: Spacing.sm,
    ...Typography.body,
  },
  editServiceNameButton: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customServiceAction: {
    minHeight: 76,
    borderRadius: Radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    padding: Spacing.md,
    gap: 2,
  },
  customServiceActionTitle: {
    ...Typography.headline,
  },
  customServiceActionCopy: {
    ...Typography.footnote,
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

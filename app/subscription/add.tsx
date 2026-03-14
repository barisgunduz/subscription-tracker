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
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { BILLING_CYCLES, BillingCycle } from '@/types/subscription';
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

function getLogoFallback(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return '?';
  }

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
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
  const addSubscription = useSubscriptionStore((state) => state.addSubscription);

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
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [billingDay, setBillingDay] = useState(String(new Date().getDate()));
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [validationMessage, setValidationMessage] = useState('');

  const matchingServices = searchServices(serviceQuery).slice(0, 8);

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
      setValidationMessage('Service name is required.');
      return;
    }

    if (parsedPrice === null || parsedPrice <= 0) {
      setValidationMessage('Enter a valid price greater than zero.');
      return;
    }

    if (!normalizedBillingDay) {
      setValidationMessage('Billing day must be between 1 and 31.');
      return;
    }

    if (!trimmedCategory) {
      setValidationMessage('Category is required.');
      return;
    }

    const activeService = serviceMode === 'default' ? selectedService : null;

    if (serviceMode === 'default' && !activeService) {
      setValidationMessage('Select a service from the default list or switch to custom.');
      return;
    }

    addSubscription({
      serviceKey: activeService?.key ?? normalizeServiceKey(trimmedName),
      name: trimmedName,
      logo: activeService?.logo ?? '',
      price: parsedPrice,
      currency: 'USD',
      billingCycle,
      billingDay: normalizedBillingDay,
      startDate: toIsoDate(new Date()),
      category: trimmedCategory,
      status: 'active',
      notes: trimmedNotes,
    });

    router.back();
  }

  return (
    <ScreenContainer scrollable contentStyle={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Add Subscription</ThemedText>
        <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
          Choose a default service or create a custom one.
        </ThemedText>
      </View>

      <Card>
        <ThemedText style={styles.sectionTitle}>Service Type</ThemedText>
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
                  {mode === 'default' ? 'Default Service' : 'Custom Service'}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {serviceMode === 'default' ? (
          <View style={styles.sectionContent}>
            <ThemedText style={styles.fieldLabel}>Search Services</ThemedText>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setServiceQuery}
              placeholder="Search by name or category"
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
                    <View style={styles.serviceBadge}>
                      <ThemedText
                        lightColor={isActive ? tintColor : undefined}
                        darkColor={isActive ? tintColor : undefined}
                        style={styles.serviceBadgeText}>
                        {getLogoFallback(service.name)}
                      </ThemedText>
                    </View>
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
                      {service.category}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </Card>

      <Card>
        <ThemedText style={styles.sectionTitle}>Subscription Details</ThemedText>

        <View style={styles.sectionContent}>
          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>Service Name</ThemedText>
            <TextInput
              editable={serviceMode === 'custom'}
              onChangeText={setServiceName}
              placeholder="Enter service name"
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
              <ThemedText style={styles.fieldLabel}>Price</ThemedText>
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
              <ThemedText style={styles.fieldLabel}>Billing Day</ThemedText>
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
            <ThemedText style={styles.fieldLabel}>Billing Cycle</ThemedText>
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
                      {option === 'monthly' ? 'Monthly' : 'Yearly'}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <ThemedText style={styles.fieldLabel}>Category</ThemedText>
            <TextInput
              onChangeText={setCategory}
              placeholder="Enter category"
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
            <ThemedText style={styles.fieldLabel}>Notes</ThemedText>
            <TextInput
              multiline
              onChangeText={setNotes}
              placeholder="Optional notes"
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

      <PrimaryButton onPress={handleSave} title="Save Subscription" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
    gap: Spacing.lg,
  },
  header: {
    gap: Spacing.xs,
  },
  title: {
    ...Typography.largeTitle,
  },
  subtitle: {
    ...Typography.callout,
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
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceBadgeText: {
    ...Typography.headline,
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

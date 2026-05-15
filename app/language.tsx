import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, I18nManager, Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { appLanguages, AppLanguageCode, getAppLanguage } from '@/constants/languages';
import { Spacing, Typography } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useI18n } from '@/utils/i18n';

export default function LanguageScreen() {
  const router = useRouter();
  const selectedLanguageCode = usePreferencesStore((state) => state.languageCode);
  const setLanguageCode = usePreferencesStore((state) => state.setLanguageCode);
  const { t } = useI18n();

  const tintColor = useThemeColor({}, 'tint');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const dividerColor = useThemeColor({}, 'divider');

  function handleSelectLanguage(languageCode: AppLanguageCode) {
    if (languageCode === selectedLanguageCode) {
      router.back();
      return;
    }

    const previousLanguage = getAppLanguage(selectedLanguageCode);
    const nextLanguage = getAppLanguage(languageCode);
    const directionChanged = Boolean(previousLanguage.isRTL) !== Boolean(nextLanguage.isRTL);

    setLanguageCode(languageCode);
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(Boolean(nextLanguage.isRTL));

    if (directionChanged) {
      Alert.alert(
        t('restartRequired'),
        t('restartRequiredBody')
      );
    }

    router.back();
  }

  return (
    <ScreenContainer scrollable includeTopInset={false} contentStyle={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>{t('language')}</ThemedText>
        <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
          {t('languageDefaultBody')}
        </ThemedText>
      </View>

      <Card padded={false}>
        {appLanguages.map((language, index) => {
          const isSelected = language.code === selectedLanguageCode;
          const isLast = index === appLanguages.length - 1;

          return (
            <Pressable
              accessibilityRole="button"
              key={language.code}
              onPress={() => handleSelectLanguage(language.code)}
              style={({ pressed }) => [{ opacity: pressed ? 0.78 : 1 }]}>
              <View
                style={[
                  styles.row,
                  !isLast ? { borderBottomColor: dividerColor, borderBottomWidth: 1 } : null,
                ]}>
                <View style={styles.rowCopy}>
                  <ThemedText style={styles.rowLabel}>{t(`languageName_${language.code}`)}</ThemedText>
                  <ThemedText translate={false} style={[styles.rowValue, { color: textSecondary }]}>
                    {language.nativeLabel}
                  </ThemedText>
                </View>

                {isSelected ? (
                  <Ionicons name="checkmark-circle" size={22} color={tintColor} />
                ) : null}
              </View>
            </Pressable>
          );
        })}
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
    ...Typography.callout,
  },
  row: {
    minHeight: 64,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    ...Typography.headline,
  },
  rowValue: {
    ...Typography.footnote,
  },
});

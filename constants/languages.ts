export type AppLanguageCode =
  | 'en'
  | 'tr';

export type AppLanguage = {
  code: AppLanguageCode;
  label: string;
  nativeLabel: string;
  isRTL?: boolean;
};

export const defaultLanguageCode: AppLanguageCode = 'en';

export const appLanguages: AppLanguage[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'tr', label: 'Turkish', nativeLabel: 'Türkçe' },
];

export function getAppLanguage(code: AppLanguageCode) {
  return appLanguages.find((language) => language.code === code) ?? appLanguages.find((language) => language.code === defaultLanguageCode) ?? appLanguages[0];
}

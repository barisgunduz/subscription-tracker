import { TranslationKey } from '@/utils/i18n';

const CATEGORY_TRANSLATION_KEYS: Record<string, TranslationKey> = {
  'AI Tools': 'categoryAiTools',
  'Cloud Storage': 'categoryCloudStorage',
  Education: 'categoryEducation',
  Finance: 'categoryFinance',
  Gaming: 'categoryGaming',
  Music: 'categoryMusic',
  'News & Media': 'categoryNewsMedia',
  Other: 'categoryOther',
  Productivity: 'categoryProductivity',
  Software: 'categorySoftware',
  Streaming: 'categoryStreaming',
};

export function getCategoryTranslationKey(category: string) {
  return CATEGORY_TRANSLATION_KEYS[category];
}

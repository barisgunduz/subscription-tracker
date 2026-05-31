import { usePreferencesStore } from '@/store/preferencesStore';

export function useColorScheme() {
  return usePreferencesStore((state) => state.theme);
}

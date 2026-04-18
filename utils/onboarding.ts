import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETED_KEY = 'onboarding-completed';

export async function getHasCompletedOnboarding() {
  const value = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);

  return value === 'true';
}

export async function setHasCompletedOnboarding(value: boolean) {
  await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, String(value));
}

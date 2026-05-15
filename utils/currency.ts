export type AppCurrencyCode = 'USD' | 'EUR' | 'TRY';

export type ExchangeRates = Record<AppCurrencyCode, number>;

export const defaultCurrencyCode: AppCurrencyCode = 'USD';

export const defaultExchangeRates: ExchangeRates = {
  USD: 1,
  EUR: 0.92,
  TRY: 32,
};

export const appCurrencies: { code: AppCurrencyCode; label: string; symbol: string }[] = [
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'TRY', label: 'Turkish Lira', symbol: '₺' },
];

export function getAppCurrency(code: AppCurrencyCode) {
  return appCurrencies.find((currency) => currency.code === code) ?? appCurrencies[0];
}

export function isSupportedCurrency(value: string): value is AppCurrencyCode {
  return value === 'USD' || value === 'EUR' || value === 'TRY';
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: AppCurrencyCode,
  rates: ExchangeRates
) {
  if (!isSupportedCurrency(fromCurrency)) {
    return amount;
  }

  const fromRate = rates[fromCurrency] || defaultExchangeRates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || defaultExchangeRates[toCurrency] || 1;

  return (amount / fromRate) * toRate;
}

export function formatCurrency(amount: number, currency: AppCurrencyCode, locale: string) {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${getAppCurrency(currency).symbol}${amount.toFixed(2)}`;
  }
}

export function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

export async function fetchDailyExchangeRates(): Promise<{
  date: string;
  rates: ExchangeRates;
}> {
  const response = await fetch('https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR,TRY');

  if (!response.ok) {
    throw new Error(`Exchange rate request failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    date?: string;
    rates?: Partial<Record<AppCurrencyCode, number>>;
  };

  return {
    date: data.date ?? getTodayKey(),
    rates: {
      USD: 1,
      EUR: data.rates?.EUR ?? defaultExchangeRates.EUR,
      TRY: data.rates?.TRY ?? defaultExchangeRates.TRY,
    },
  };
}

import { withTimeoutAndRetry } from './withTimeout';
import { ServiceResponse } from '../types/models';

export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
}

const DEFAULT_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 154.5,
  AUD: 1.52,
  CAD: 1.36,
  SGD: 1.35,
  CHF: 0.90,
  NZD: 1.66,
  HKD: 7.82,
};

export async function fetchExchangeRates(baseCurrency: string = 'USD'): Promise<ServiceResponse<ExchangeRates>> {
  const fallback: ExchangeRates = {
    base: baseCurrency,
    rates: DEFAULT_RATES,
  };

  return withTimeoutAndRetry<ExchangeRates>(
    async () => {
      // Frankfurter API is free, no API key needed
      const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=${encodeURIComponent(baseCurrency)}`);
      if (!res.ok) {
        // try alternative endpoint
        const alt = await fetch(`https://api.frankfurter.app/latest?base=${encodeURIComponent(baseCurrency)}`);
        if (!alt.ok) throw new Error(`Frankfurter HTTP ${alt.status}`);
        const altJson = await alt.json();
        return {
          base: altJson.base || baseCurrency,
          rates: { ...DEFAULT_RATES, ...altJson.rates, [baseCurrency]: 1 },
        };
      }
      const json = await res.json();
      return {
        base: json.base || baseCurrency,
        rates: { ...DEFAULT_RATES, ...json.rates, [baseCurrency]: 1 },
      };
    },
    fallback,
    'Frankfurter Currency API'
  );
}

export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount;
  const fromRate = rates[fromCurrency] || DEFAULT_RATES[fromCurrency] || 1;
  const toRate = rates[toCurrency] || DEFAULT_RATES[toCurrency] || 1;
  
  // convert from -> USD -> to
  const inUSD = amount / fromRate;
  return Math.round(inUSD * toRate);
}

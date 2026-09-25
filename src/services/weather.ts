import { withTimeoutAndRetry } from './withTimeout';
import { ServiceResponse } from '../types/models';

export interface WeatherInfo {
  avgHighC: number;
  avgLowC: number;
  rainChance: number;
  type: 'forecast' | 'seasonal';
  summary: string;
  wmoCode?: number;
}

export function getWeatherConditionFromWMO(code: number): { text: string; icon: string } {
  if (code === 0) return { text: 'Sunny / Clear', icon: 'Sun' };
  if (code >= 1 && code <= 3) return { text: 'Partly Cloudy', icon: 'CloudSun' };
  if (code >= 45 && code <= 48) return { text: 'Foggy', icon: 'CloudFog' };
  if (code >= 51 && code <= 55) return { text: 'Light Drizzle', icon: 'CloudDrizzle' };
  if (code >= 61 && code <= 67) return { text: 'Rain', icon: 'CloudRain' };
  if (code >= 71 && code <= 77) return { text: 'Snow', icon: 'CloudSnow' };
  if (code >= 80 && code <= 82) return { text: 'Rain Showers', icon: 'CloudRain' };
  if (code >= 95 && code <= 99) return { text: 'Thunderstorms', icon: 'CloudLightning' };
  return { text: 'Mild', icon: 'Sun' };
}

export async function fetchDestinationWeather(
  city: string,
  startDate: string,
  endDate: string
): Promise<ServiceResponse<WeatherInfo>> {
  const fallback: WeatherInfo = {
    avgHighC: 22,
    avgLowC: 15,
    rainChance: 25,
    type: 'seasonal',
    summary: 'Seasonal average ~22°C, moderate precipitation chance',
    wmoCode: 1,
  };

  return withTimeoutAndRetry<WeatherInfo>(
    async () => {
      // 1. Geocode city
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
      const geoRes = await fetch(geoUrl);
      if (!geoRes.ok) throw new Error(`Geocoding HTTP ${geoRes.status}`);
      const geoJson = await geoRes.json();
      if (!geoJson.results || geoJson.results.length === 0) {
        throw new Error(`City "${city}" not found in Open-Meteo`);
      }

      const { latitude, longitude } = geoJson.results[0];

      // Check if dates are within 16 days
      const now = new Date();
      const tripStart = new Date(startDate);
      const diffDays = Math.round((tripStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays >= -1 && diffDays <= 15) {
        // Within 16 days -> Live Forecast
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto`;
        const wRes = await fetch(weatherUrl);
        if (!wRes.ok) throw new Error(`Weather HTTP ${wRes.status}`);
        const wJson = await wRes.json();

        const highs: number[] = wJson.daily?.temperature_2m_max || [23];
        const lows: number[] = wJson.daily?.temperature_2m_min || [15];
        const rainChances: number[] = wJson.daily?.precipitation_probability_max || [20];
        const codes: number[] = wJson.daily?.weathercode || [1];

        const avgHigh = Math.round(highs.reduce((a, b) => a + b, 0) / highs.length);
        const avgLow = Math.round(lows.reduce((a, b) => a + b, 0) / lows.length);
        const maxRain = Math.max(...rainChances);
        const avgRain = Math.round(rainChances.reduce((a, b) => a + b, 0) / rainChances.length);
        const primaryCode = codes[0] || 1;
        const condition = getWeatherConditionFromWMO(primaryCode);

        return {
          avgHighC: avgHigh,
          avgLowC: avgLow,
          rainChance: maxRain,
          type: 'forecast',
          summary: `${condition.text}, ${avgLow}°C to ${avgHigh}°C, ${avgRain}% rain chance`,
          wmoCode: primaryCode,
        };
      } else {
        // Further out than 16 days -> Seasonal average from Open-Meteo Climate API or archive
        const month = tripStart.getMonth() + 1; // 1-12
        // Sample seasonal estimation based on latitude and month
        // Or query archive for same period last year
        const lastYearStart = new Date(tripStart);
        lastYearStart.setFullYear(lastYearStart.getFullYear() - 1);
        const lastYearEnd = new Date(endDate);
        lastYearEnd.setFullYear(lastYearEnd.getFullYear() - 1);

        const startIso = lastYearStart.toISOString().split('T')[0];
        const endIso = lastYearEnd.toISOString().split('T')[0];

        try {
          const archiveUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${startIso}&end_date=${endIso}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
          const aRes = await fetch(archiveUrl);
          if (aRes.ok) {
            const aJson = await aRes.json();
            const highs: number[] = aJson.daily?.temperature_2m_max || [22];
            const lows: number[] = aJson.daily?.temperature_2m_min || [14];
            const precips: number[] = aJson.daily?.precipitation_sum || [0];

            const avgHigh = Math.round(highs.reduce((a, b) => a + b, 0) / highs.length);
            const avgLow = Math.round(lows.reduce((a, b) => a + b, 0) / lows.length);
            const rainDays = precips.filter(p => p > 1).length;
            const rainPct = Math.min(100, Math.round((rainDays / Math.max(1, precips.length)) * 100));

            return {
              avgHighC: avgHigh,
              avgLowC: avgLow,
              rainChance: rainPct,
              type: 'seasonal',
              summary: `Seasonal average: ${avgLow}°C - ${avgHigh}°C, typical rain chance ~${rainPct}%`,
              wmoCode: rainPct > 40 ? 61 : 1,
            };
          }
        } catch {
          // fall through to general seasonal
        }

        // Climate general default based on latitude
        const isNorthern = latitude > 0;
        const isSummer = isNorthern ? (month >= 6 && month <= 8) : (month >= 12 || month <= 2);
        const estHigh = isSummer ? 27 : 17;
        const estLow = isSummer ? 18 : 9;

        return {
          avgHighC: estHigh,
          avgLowC: estLow,
          rainChance: 25,
          type: 'seasonal',
          summary: `Seasonal climate average: ${estLow}°C - ${estHigh}°C`,
          wmoCode: 1,
        };
      }
    },
    fallback,
    'Open-Meteo Weather API'
  );
}

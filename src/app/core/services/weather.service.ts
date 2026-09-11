import { Injectable } from '@angular/core';
import { US_STATES } from '../models/profile';
export interface WeatherReading { temperature: number; condition: string; high: number; low: number; icon: string; }
export interface WeatherCoordinates { latitude: number; longitude: number; }
@Injectable({ providedIn: 'root' })
export class WeatherService {
  /** Only call with the user's explicitly requested browser location. No coordinates are cached. */
  async reverseGeocode(coordinates: WeatherCoordinates): Promise<string> {
    const url = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
    url.search = new URLSearchParams({
      latitude: String(coordinates.latitude), longitude: String(coordinates.longitude), localityLanguage: 'en',
    }).toString();
    const response = await fetch(url, { signal: AbortSignal.timeout(10000), cache: 'no-store' });
    if (!response.ok) throw new Error('Location unavailable');
    const data: Record<string, unknown> = await response.json();
    const text = (key: string) => typeof data[key] === 'string' ? data[key].trim() : '';
    const city = text('city') || text('locality');
    if (!city) throw new Error('Locality unavailable');
    let region = text('principalSubdivision') || text('countryName');
    if (text('countryCode') === 'US') {
      const code = text('principalSubdivisionCode').replace(/^US-/, '');
      region = US_STATES.find(([abbreviation, name]) =>
        abbreviation === code || name.toLowerCase() === text('principalSubdivision').toLowerCase()
      )?.[0] || region;
    }
    return region && region !== city ? `${city}, ${region}` : city;
  }

  async getWeather(query: string, coordinates?: WeatherCoordinates): Promise<WeatherReading> {
    let point = coordinates;
    if (!point) {
      const [city, state] = query.split(',').map(value => value.trim());
      const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
      url.search = new URLSearchParams({ name: city, countryCode: 'US', count: '100', language: 'en' }).toString();
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('Location unavailable');
      const data: { results?: (WeatherCoordinates & { admin1?: string })[] } = await response.json();
      const stateName = US_STATES.find(item => item[0] === state?.toUpperCase())?.[1] ?? state;
      point = data.results?.find(item => item.admin1?.toLowerCase() === stateName?.toLowerCase());
      if (!point) throw new Error('Location not found');
    }
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.search = new URLSearchParams({ latitude: String(point.latitude), longitude: String(point.longitude), current: 'temperature_2m,weather_code', daily: 'temperature_2m_max,temperature_2m_min', temperature_unit: 'fahrenheit', timezone: 'auto', forecast_days: '1' }).toString();
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Weather unavailable');
    const data = await response.json() as { current?: { temperature_2m: number; weather_code: number }; daily?: { temperature_2m_max: number[]; temperature_2m_min: number[] } };
    const temperature = data.current?.temperature_2m;
    const high = data.daily?.temperature_2m_max?.[0];
    const low = data.daily?.temperature_2m_min?.[0];
    if (![temperature, high, low].every(value => typeof value === 'number' && Number.isFinite(value))) throw new Error('Invalid weather');
    const code = data.current?.weather_code ?? -1;
    const [condition, icon] = code === 0 ? ['Clear', '☀'] : code <= 3 && code >= 1 ? ['Partly cloudy', '☁'] : [45,48].includes(code) ? ['Foggy', '☁'] : code >= 95 ? ['Thunderstorms', 'ϟ'] : [71,73,75,77,85,86].includes(code) ? ['Snow', '❄'] : code >= 51 ? ['Rain', '☂'] : ['Weather', '☁'];
    return { temperature: Math.round(temperature!), high: Math.round(high!), low: Math.round(low!), condition, icon };
  }
}

import { WeatherService } from './weather.service';
import { vi } from 'vitest';

describe('WeatherService', () => {
  const forecast = { current: { temperature_2m: 72.2, weather_code: 2 }, daily: { temperature_2m_max: [80], temperature_2m_min: [60] } };
  afterEach(() => vi.unstubAllGlobals());
  it.each([
    [{ city: 'Atlanta', countryCode: 'US', principalSubdivisionCode: 'US-GA' }, 'Atlanta, GA'],
    [{ city: 'New York', countryCode: 'US', principalSubdivision: 'New York' }, 'New York, NY'],
    [{ locality: 'Dhaka', countryCode: 'BD', principalSubdivision: 'Dhaka Division' }, 'Dhaka, Dhaka Division'],
    [{ city: 'Paris', countryName: 'France' }, 'Paris, France'],
  ])('formats reverse-geocoded locations', async (data, expected) => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(data));
    vi.stubGlobal('fetch', fetcher);
    expect(await new WeatherService().reverseGeocode({ latitude: 1, longitude: 2 })).toBe(expected);
    expect(fetcher.mock.calls[0][0].searchParams.get('latitude')).toBe('1');
    expect(fetcher.mock.calls[0][1].cache).toBe('no-store');
  });
  it('rejects unavailable or incomplete reverse-geocoding responses', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(Response.json({ countryName: 'US' }));
    vi.stubGlobal('fetch', fetcher);
    const service = new WeatherService();
    await expect(service.reverseGeocode({ latitude: 1, longitude: 2 })).rejects.toThrow();
    await expect(service.reverseGeocode({ latitude: 1, longitude: 2 })).rejects.toThrow();
  });
  it('resolves the saved city within its state and requests Fahrenheit weather', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(Response.json({ results: [
        { admin1: 'Texas', latitude: 1, longitude: 2 },
        { admin1: 'Georgia', latitude: 33.75, longitude: -84.39 },
      ] }))
      .mockResolvedValueOnce(Response.json(forecast));
    vi.stubGlobal('fetch', fetcher);
    expect(await new WeatherService().getWeather('Atlanta, GA')).toMatchObject({ temperature: 72, condition: 'Partly cloudy' });
    expect(fetcher.mock.calls[0][0].searchParams.get('name')).toBe('Atlanta');
    expect(fetcher.mock.calls[1][0].searchParams.get('latitude')).toBe('33.75');
    expect(fetcher.mock.calls[1][0].searchParams.get('temperature_unit')).toBe('fahrenheit');
  });
  it('skips geocoding for explicitly supplied coordinates', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(forecast));
    vi.stubGlobal('fetch', fetcher);
    await new WeatherService().getWeather('Atlanta, GA', { latitude: 10, longitude: 20 });
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher.mock.calls[0][0].searchParams.get('longitude')).toBe('20');
  });
  it('rejects unknown cities without fetching weather for a different location', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ results: [] }));
    vi.stubGlobal('fetch', fetcher);
    await expect(new WeatherService().getWeather('Unknown, GA')).rejects.toThrow('Location not found');
    expect(fetcher).toHaveBeenCalledOnce();
  });
});

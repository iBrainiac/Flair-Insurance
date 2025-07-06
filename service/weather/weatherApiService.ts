  apiKey: string;
import axios from "axios";
import { RateLimiter } from "../../utils/rateLimiter";
import { WeatherCache } from "../../utils/weatherCache";

interface WeatherAPIConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
}

interface GeoLocation {
  lat: number;
  lon: number;
}

interface WeatherMetrics {
  rainfall: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
}

interface WeatherDataPoint {
  timestamp: number;
  location: GeoLocation;
  metrics: WeatherMetrics;
  confidence: number;
  source: string;
}

export class WeatherAPIService {
  private config: WeatherAPIConfig;
  private rateLimiter: RateLimiter;
  private cache: WeatherCache;

  constructor(config: WeatherAPIConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter(60, 60000); // 60 calls per minute
    this.cache = new WeatherCache(300000); // 5-minute cache
  }

  async getCurrentWeather(lat: number, lon: number): Promise<WeatherDataPoint> {
    const cacheKey = `current-${lat}-${lon}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    await this.rateLimiter.acquire();

    const endpoint = `${this.config.baseUrl}/current.json`;
    const params = {
      key: this.config.apiKey,
      q: `${lat},${lon}`
    };

    const response = await axios.get(endpoint, { params, timeout: this.config.timeout });
    const transformed = this.transformWeatherAPIResponse(response.data);

    this.cache.set(cacheKey, transformed);
    return transformed;
  }

  private transformWeatherAPIResponse(rawData: any): WeatherDataPoint {
    return {
      timestamp: new Date(rawData.location.localtime).getTime() / 1000,
      location: {
        lat: rawData.location.lat,
        lon: rawData.location.lon
      },
      metrics: {
        rainfall: rawData.current.precip_mm,
        temperature: rawData.current.temp_c,
        humidity: rawData.current.humidity,
        windSpeed: rawData.current.wind_kph,
        pressure: rawData.current.pressure_mb
      },
      confidence: 0.95,
      source: "WeatherAPI.com"
    };
  }
}
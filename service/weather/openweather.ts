import axios from 'axios';

interface OpenWeatherConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
}

interface WeatherMetrics {
  rainfall: number;        // mm
  temperature: number;     // celsius
  humidity: number;        // percentage
  windSpeed: number;       // km/h
  pressure: number;        // hPa
}

interface GeoLocation {
  lat: number;
  lon: number;
}

interface WeatherDataPoint {
  timestamp: number;
  location: GeoLocation;
  metrics: WeatherMetrics;
  confidence: number;      // 0-1 scale
  source: string;
}

class OpenWeatherService {
  private config: OpenWeatherConfig;

  constructor(config: OpenWeatherConfig) {
    this.config = config;
  }

  async getCurrentWeather(lat: number, lon: number): Promise<WeatherDataPoint> {
    const endpoint = `${this.config.baseUrl}/weather`;
    const params = {
      lat,
      lon,
      appid: this.config.apiKey,
      units: 'metric',
    };

    const response = await axios.get(endpoint, { params, timeout: this.config.timeout });
    return this.transformResponse(response.data, lat, lon);
  }

  private transformResponse(rawData: any, lat: number, lon: number): WeatherDataPoint {
    return {
      timestamp: rawData.dt * 1000,
      location: { lat, lon },
      metrics: {
        temperature: rawData.main.temp,
        rainfall: rawData.rain ? rawData.rain['1h'] || 0 : 0,
        humidity: rawData.main.humidity,
        windSpeed: rawData.wind.speed,
        pressure: rawData.main.pressure
      },
      confidence: 0.9, // Assume 0.9 for single API source
      source: 'OpenWeatherMap'
    };
  }
}

export default OpenWeatherService;

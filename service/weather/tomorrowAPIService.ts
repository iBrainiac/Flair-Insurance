// services/weather/tomorrowAPIService.ts
import axios from "axios";

export class TomorrowAPIService {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config: {
    apiKey: string;
    baseUrl?: string;
    timeout?: number;
  }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://api.tomorrow.io/v4";
    this.timeout = config.timeout || 5000;
  }

  async getCurrentWeather(lat: number, lon: number) {
    console.log("Using Tomorrow.io API Key:", this.apiKey);
    const url = `${this.baseUrl}/weather/realtime`;

    try {
      const response = await axios.get(url, {
        params: {
          location: `${lat},${lon}`,
          apikey: this.apiKey
        },
        timeout: this.timeout
      });

      const data = response.data;

      return {
        timestamp: Math.floor(Date.now() / 1000),
        location: {
          lat,
          lon
        },
        metrics: {
          rainfall: data.data.values.precipitationIntensity,
          temperature: data.data.values.temperature,
          humidity: data.data.values.humidity,
          windSpeed: data.data.values.windSpeed,
          pressure: data.data.values.pressureSurfaceLevel
        },
        confidence: 0.95,
        source: "Tomorrow.io"
      };
    } catch (error) {
      console.error("Tomorrow.io API Error:", error);
      throw error;
    }
  }
}
export default TomorrowAPIService;

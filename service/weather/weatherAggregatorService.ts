// services/weather/weatherAggregatorService.ts

import OpenWeatherService from "./openWeatherService";

import  WeatherAPIService  from "./weatherAPIService";
import  TomorrowAPIService  from "./tomorrowAPIService";

const openWeather = new OpenWeatherService({
  apiKey: process.env.OPENWEATHER_API_KEY!,
  baseUrl: "https://api.openweathermap.org/data/2.5",
  timeout: 5000,
  retryAttempts: 3
});

const weatherAPI = new WeatherAPIService({
  apiKey: process.env.WEATHERAPI_KEY!,
  baseUrl: "http://api.weatherapi.com/v1",
  timeout: 5000,
  retryAttempts: 3
});

const tomorrowAPI = new TomorrowAPIService({
  apiKey: process.env.TOMORROWAPI_KEY!,
  baseUrl: "https://api.tomorrow.io/v4",
  timeout: 5000,
  retryAttempts: 3
});

class WeatherAggregatorService {
  static async getAggregatedWeather(lat: number, lon: number) {
    const [openWeatherData, weatherAPIData, tomorrowData] = await Promise.allSettled([
      openWeather.getCurrentWeather(lat, lon),
      weatherAPI.getCurrentWeather(lat, lon),
      tomorrowAPI.getCurrentWeather(lat, lon)
    ]);

    const results = [openWeatherData, weatherAPIData, tomorrowData]
      .filter(r => r.status === "fulfilled")
      .map(r => (r as PromiseFulfilledResult<any>).value);

    if (results.length === 0) {
      throw new Error("All weather API calls failed");
    }

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

    const aggregated = {
      timestamp: Date.now(),
      location: {
        lat,
        lon
      },
      metrics: {
        temperature: avg(results.map(r => r.metrics.temperature)),
        rainfall: avg(results.map(r => r.metrics.rainfall || 0)),
        humidity: avg(results.map(r => r.metrics.humidity)),
        windSpeed: avg(results.map(r => r.metrics.windSpeed)),
        pressure: avg(results.map(r => r.metrics.pressure))
      },
      confidence: avg(results.map(r => r.confidence)),
      sources: results.map(r => r.source)
    };

    return aggregated;
  }
}
export default WeatherAggregatorService;

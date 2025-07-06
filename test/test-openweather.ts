import 'dotenv/config';
import OpenWeatherService from '../services/weather/openWeatherService';

async function main() {
  const service = new OpenWeatherService({
    apiKey: process.env.OPENWEATHER_API_KEY!,
    baseUrl: 'https://api.openweathermap.org/data/2.5',
    timeout: 5000,
  });

  const weather = await service.getCurrentWeather(-1.286389, 36.817223); // Nairobi example
  console.log(weather);
}

main().catch(console.error);

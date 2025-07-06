import "dotenv/config"; // Ensure this is at the top to load .env before using process.env
import { WeatherAPIService } from "../services/weather/weatherAPIService";

const weatherService = new WeatherAPIService({
  apiKey: process.env.WEATHERAPI_KEY,
  baseUrl: "http://api.weatherapi.com/v1",
  timeout: 5000,
  retryAttempts: 3
});

async function main() {
  console.log("Using API Key:", process.env.WEATHERAPI_KEY); // Debugging line

  const data = await weatherService.getCurrentWeather(-1.2921, 36.8219); // Nairobi
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);

// scripts/test-aggregator.ts
import 'dotenv/config';

import WeatherAggregatorService from "../services/weather/weatherAggregatorService";

async function main() {
  const data = await WeatherAggregatorService.getAggregatedWeather(-1.2921, 36.8219);
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);

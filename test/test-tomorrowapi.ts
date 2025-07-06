import "dotenv/config"; 
import { TomorrowAPIService } from "../services/weather/tomorrowAPIService";

const tomorrowService = new TomorrowAPIService({
  apiKey: process.env.TOMORROWAPI_KEY,
  timeout: 5000
});

async function main() {
  const data = await tomorrowService.getCurrentWeather(-1.2921, 36.8219); // Nairobi
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);

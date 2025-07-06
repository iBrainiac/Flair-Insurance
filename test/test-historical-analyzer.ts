import { HistoricalPatternAnalyzer } from "../services/risk/HistoricalPatternAnalyzer";

const analyzer = new HistoricalPatternAnalyzer();

const currentWeather = {
  rainfall: 20,
  temperature: 28,
  humidity: 80,
  windSpeed: 10,
  pressure: 1015
};

const historicalData = [
  { rainfall: 10, temperature: 25, humidity: 75, windSpeed: 8, pressure: 1012 },
  { rainfall: 30, temperature: 27, humidity: 78, windSpeed: 12, pressure: 1014 },
  { rainfall: 25, temperature: 26, humidity: 77, windSpeed: 9, pressure: 1013 },
];

const analysis = analyzer.analyzeAgainstHistorical(currentWeather, historicalData);

console.log("📊 Historical Pattern Analysis:");
console.log(JSON.stringify(analysis, null, 2));

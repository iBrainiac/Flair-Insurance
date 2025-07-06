// scripts/test-anomaly.ts

import { WeatherAnomalyDetector } from "../services/weather/AnomalyDetector";

const detector = new WeatherAnomalyDetector();

// Example data: Replace these with your real API outputs if desired
const rawData = [
  {
    name: "OpenWeatherMap",
    data: {
      rainfall: 0,
      temperature: 14.83,
      humidity: 87,
      windSpeed: 1.47,
      pressure: 1019
    }
  },
  {
    name: "WeatherAPI.com",
    data: {
      rainfall: 0.01,
      temperature: 16,
      humidity: 88,
      windSpeed: 5,
      pressure: 1024
    }
  },
  {
    name: "Tomorrow.io",
    data: {
      rainfall: 0.0033333333333333335,
      temperature: 14.1,
      humidity: 96,
      windSpeed: 1.2,
      pressure: 828.92
    }
  }
];

const report = detector.detectAnomalies(rawData);

console.log("🔍 Anomaly Detection Report:");
console.log(JSON.stringify(report, null, 2));

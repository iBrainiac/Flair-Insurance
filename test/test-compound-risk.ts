import { CompoundRiskDetector } from "../services/risk/CompoundRiskDetector";

const detector = new CompoundRiskDetector();

const weatherSample = {
  rainfall: 5,
  temperature: 36,
  humidity: 85,
  windSpeed: 10,
  pressure: 1010
};

const compoundRisk = detector.detectCompoundRisk(weatherSample);

console.log("⚠️ Compound Risk Assessment:");
console.log(JSON.stringify(compoundRisk, null, 2));

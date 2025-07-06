import { CropRiskAssessment } from "../services/risk/CropRiskAssessment";

const riskEngine = new CropRiskAssessment();

const rainfall = 20; // mm/month example
const crop = 'MAIZE';
const season = 'RAINY';

const risk = riskEngine.calculateRainfallRisk(rainfall, crop, season);

console.log("🌾 Crop Risk Assessment:");
console.log(JSON.stringify(risk, null, 2));

import * as ort from 'onnxruntime-web';

// Fix for 'e.getValue is not a function' in Vite
ort.env.wasm.proxy = false;
ort.env.wasm.numThreads = 1;
const VERSION = "1.19.0";
ort.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${VERSION}/dist/`;

export interface AIResult {
  diabetesRisk: number;
  heartRisk: number;
  cancerRisk: number;
  overallScore: number;
  reasons: string[];
  contributions: {
    label: string;
    value: number;
    color: string;
  }[];
  mlRiskLevel?: string;
}

// Global variable to keep the session
let session: ort.InferenceSession | null = null;

async function loadModel() {
  if (session) return;

  try {
    console.log("Loading ONNX Model (WASM)...");
    session = await ort.InferenceSession.create("/healthModel.onnx", { 
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all"
    });
    console.log("ONNX Model loaded successfully (WASM)");
  } catch (e) {
    console.warn("ONNX WASM load failed, trying WebGL...", e);
    try {
      session = await ort.InferenceSession.create("/healthModel.onnx", { 
        executionProviders: ["webgl"] 
      });
      console.log("ONNX Model loaded successfully (WebGL)");
    } catch (err2) {
      console.error("All ONNX backends failed. Using fallback rule-based logic.");
    }
  }
}

export const predictHealthRisk = async (answers: Record<string, string>): Promise<AIResult> => {
  await loadModel();

  const age = Number(answers.age || 25);
  const weight = Number(answers.weight || 65);
  const height = Number(answers.height || 170);
  const bmi = weight / (Math.pow(height / 100, 2));
  const systolic = Number(answers.bp_systolic || 120);
  const saltIntake = Number(answers.salt_intake || 5);
  const airPollution = Number(answers.air_pollution || 5);
  const alcoholFreq = answers.alcohol_freq || 'never';
  const smoking = answers.smoking || 'never';
  const gender = answers.gender || 'male';
  const geneticRisk = answers.genetic_risk === 'yes';
  const specificSymptom = answers.specific_symptoms || 'none';
  const activity = answers.activity === 'active' ? 1 : 0;
  const fruitVeg = answers.diet === 'good' ? 1 : 0;

  // 1. REAL ML INFERENCE
  let mlRiskLevel = "Low";
  let mlScore = 0; // 0: Low, 1: Moderate, 2: High

  if (session) {
    try {
      const inputData = new Float32Array([
        age,
        gender === 'male' ? 1 : 0,
        smoking === 'current' ? 1 : 0,
        alcoholFreq !== 'never' ? 1 : 0,
        fruitVeg,
        activity,
        bmi,
        systolic
      ]);
      const tensor = new ort.Tensor("float32", inputData, [1, 8]);
      
      // Run inference - specifying output_label to avoid common probability errors
      const results = await session.run({ float_input: tensor }, ["output_label"]);
      const outputRaw = results["output_label"].data[0];
      mlScore = typeof outputRaw === 'bigint' ? Number(outputRaw) : Number(outputRaw);
      
      mlRiskLevel = mlScore === 2 ? "High" : mlScore === 1 ? "Moderate" : "Low";
    } catch (e) {
      console.error("ML Inference failed", e);
    }
  }

  // 2. EXPLAINABLE LOGIC & RISK SCORING
  const reasons: string[] = [];
  const contributionMap: Record<string, number> = {
    "Жин (BMI)": 0,
    "Цусны даралт": 0,
    "Тамхидалт": 0,
    "Давсны хэрэглээ": 0,
    "Агаарын бохирдол": 0,
    "Генетик/Бусад": 0
  };

  // Diabetes Risk
  let diabBase = mlScore === 2 ? 60 : mlScore === 1 ? 30 : 10;
  if (bmi > 25) {
    diabBase += 15;
    contributionMap["Жин (BMI)"] += 15;
    reasons.push(gender === 'female' ? "Биеийн жингийн илүүдэл (Монгол эмэгтэйчүүдийн онцлог)" : "Биеийн жингийн илүүдэл (BMI > 25)");
  }
  if (age > 45) {
    diabBase += 10;
    contributionMap["Генетик/Бусад"] += 5;
    reasons.push("Насжилтын хамааралтай эрсдэл (45+ нас)");
  }

  // Heart Risk
  let heartBase = mlScore === 2 ? 70 : mlScore === 1 ? 40 : 15;
  if (systolic > 140) {
    heartBase += 20;
    contributionMap["Цусны даралт"] += 30;
    reasons.push("Цусны даралт ихсэлт");
  }
  if (saltIntake > 7) {
    heartBase += 15;
    contributionMap["Давсны хэрэглээ"] += 20;
    reasons.push("Давсны өндөр хэрэглээ (Монголчуудын дундаж ДЭМБ-аас 2 дахин их)");
  }

  // Cancer Risk
  let cancerBase = mlScore === 2 ? 50 : mlScore === 1 ? 25 : 10;
  if (smoking === 'current') {
    cancerBase += 30;
    contributionMap["Тамхидалт"] += 25;
    reasons.push("Идэвхтэй тамхидалт");
  }
  if (airPollution > 7) {
    cancerBase += 15;
    contributionMap["Агаарын бохирдол"] += 15;
    reasons.push("Агаарын бохирдол");
  }
  if (specificSymptom === 'coughing_blood') {
    cancerBase += 40;
    reasons.push("Цусаар ханиалгах (Яаралтай үзүүлнэ үү)");
  }

  const diabetesRisk = Math.min(diabBase, 100);
  const heartRisk = Math.min(heartBase, 100);
  const cancerRisk = Math.min(cancerBase, 100);

  if (reasons.length === 0) {
    reasons.push("Таны амьдралын хэв маяг болон эрүүл мэндийн үзүүлэлтүүд одоогоор эрсдэл багатай байна");
  }

  const contributions = Object.entries(contributionMap)
    .filter(([_, value]) => value > 0)
    .map(([label, value]) => ({
      label,
      value,
      color: label === "Жин (BMI)" ? "bg-orange-500" : 
             label === "Цусны даралт" ? "bg-red-500" :
             label === "Тамхидалт" ? "bg-gray-700" :
             label === "Давсны хэрэглээ" ? "bg-blue-500" :
             label === "Агаарын бохирдол" ? "bg-purple-500" : "bg-green-500"
    }))
    .sort((a, b) => b.value - a.value);

  return {
    diabetesRisk: Math.round(diabetesRisk),
    heartRisk: Math.round(heartRisk),
    cancerRisk: Math.round(cancerRisk),
    overallScore: Math.round((diabetesRisk + heartRisk + cancerRisk) / 3),
    reasons: Array.from(new Set(reasons)),
    contributions,
    mlRiskLevel
  };
};

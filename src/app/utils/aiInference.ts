// Using global ort from script tag if available, otherwise fallback to import
const ort = (window as any).ort;

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
  mlRiskLevel?: string; // New field for real ML output
}

// Global variable to keep the session
let session: any = null;

async function loadModel() {
  if (!ort) {
    console.error("ONNX Runtime (ort) not found. Check if the script tag in index.html is correct.");
    return;
  }

  if (!session) {
    try {
      // Configuration to prevent 'e.getValue is not a function' error
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.proxy = false;
      ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.0/dist/";

      // Try WASM first with conservative settings
      session = await ort.InferenceSession.create("/healthModel.onnx", { 
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all"
      });
      console.log("ONNX Model loaded successfully with wasm backend");
    } catch (e) {
      console.warn("WASM backend failed, trying webgl...", e);
      try {
        // Fallback to WebGL if WASM fails
        session = await ort.InferenceSession.create("/healthModel.onnx", { 
          executionProviders: ["webgl"] 
        });
        console.log("ONNX Model loaded successfully with webgl backend");
      } catch (webglError) {
        console.error("All ONNX backends failed", webglError);
      }
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
  const activity = answers.activity === 'low' ? 1 : 0;
  const fruit_veg = answers.diet === 'bad' ? 1 : 0;

  // 1. REAL ML INFERENCE (Random Forest via ONNX)
  let mlRiskLevel = "Low";
  if (session) {
    try {
      // Input features match train_model.py: 
      // ['age', 'gender', 'smoking', 'alcohol', 'fruit_veg', 'activity', 'bmi', 'sys_bp']
      const inputData = new Float32Array([
        age,
        gender === 'male' ? 1 : 0,
        smoking === 'current' ? 1 : 0,
        alcoholFreq !== 'never' ? 1 : 0,
        fruit_veg,
        activity,
        bmi,
        systolic
      ]);
      const tensor = new ort.Tensor("float32", inputData, [1, 8]);
      
      console.log("Session output names:", session.outputNames);
      
      // IMPORTANT: Explicitly request ONLY 'output_label' to skip the
      // non-tensor probability output which causes the ERROR_CODE: 9 error.
      const results = await session.run({ float_input: tensor }, ["output_label"]);
      
      const outputRaw = results["output_label"].data[0];
      const output = typeof outputRaw === 'bigint' ? Number(outputRaw) : Number(outputRaw);
      
      mlRiskLevel = output === 2 ? "High" : output === 1 ? "Moderate" : "Low";
      console.log("Real ML Inference Result:", mlRiskLevel);
    } catch (e) {
      console.error("Inference failed", e);
    }
  }

  // 2. EXPLAINABLE LOGIC (Rule-based for UI and specific risks)
  const reasons: string[] = [];
  const contributionMap: Record<string, number> = {
    "Жин (BMI)": 0,
    "Цусны даралт": 0,
    "Тамхидалт": 0,
    "Давсны хэрэглээ": 0,
    "Агаарын бохирдол": 0,
    "Генетик/Бусад": 0
  };

  let diabBase = 5;
  if (bmi > 25) {
    diabBase += 25;
    contributionMap["Жин (BMI)"] += 15;
    if (gender === 'female') {
      diabBase += 10;
      reasons.push("Биеийн жингийн илүүдэл (Монгол эмэгтэйчүүдийн дунд төвийн таргалалт өндөр байдаг)");
    } else {
      reasons.push("Биеийн жингийн илүүдэл (BMI > 25)");
    }
  }
  if (age > 45) {
    diabBase += 20;
    contributionMap["Генетик/Бусад"] += 10;
    reasons.push("Насжилтын хамааралтай чихрийн шижингийн эрсдэл (45+ нас)");
  }
  if (geneticRisk) {
    diabBase *= 1.4;
    contributionMap["Генетик/Бусад"] += 15;
    reasons.push("Гэр бүлийн генетик удамшил");
  }

  let heartBase = 10;
  if (systolic > 140) {
    heartBase += 35;
    contributionMap["Цусны даралт"] += 30;
    reasons.push("Цусны даралт ихсэлт (Зүрх судасны өвчлөлийн гол шалтгаан)");
  }
  if (saltIntake > 7) {
    heartBase += 20;
    contributionMap["Давсны хэрэглээ"] += 20;
    reasons.push("Давсны өндөр хэрэглээ (Монголчуудын дундаж 11г буюу ДЭМБ-ын зөвлөмжөөс 2 дахин их)");
  }
  if (smoking === 'current') {
    heartBase += 20;
    contributionMap["Тамхидалт"] += 20;
    reasons.push("Идэвхтэй тамхидалт");
  }

  let cancerBase = 5;
  if (smoking === 'current') {
    cancerBase += 35;
    contributionMap["Тамхидалт"] += 20;
  }
  if (airPollution > 7) {
    cancerBase += 20;
    contributionMap["Агаарын бохирдол"] += 15;
    reasons.push("Агаарын бохирдол (Уушгины өвчлөлд нөлөөлөх өндөр өртөлт)");
  }
  if (specificSymptom === 'coughing_blood') {
    cancerBase += 40;
    contributionMap["Генетик/Бусад"] += 20;
    reasons.push("Цусаар ханиалгах (Хавдрын ноцтой шинж тэмдэг байж болзошгүй)");
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
    mlRiskLevel // Return the real ML result too
  };
};

import * as ort from 'onnxruntime-web';

/**
 * AI МОДЕЛУУДЫН НЭГДСЭН ФАЙЛ
 * Энэхүү файл нь дүрэмд суурилсан (Rule-based) болон Машин сургалтын (ONNX) 
 * загваруудыг хоёуланг нь агуулна.
 */

// --- 1. ДҮРЭМД СУУРИЛСАН МОДЕЛ (Rule-based Inference) ---

export interface AIResult {
  diabetesRisk: number;
  heartRisk: number;
  cancerRisk: number;
  overallScore: number;
  reasons: string[];
}

/**
 * САЙЖРУУЛСАН AI МОДЕЛ: 
 * Kaggle-ийн бодит дата + Монгол улсын STEPS 2005/2013 статистик.
 */
export const predictHealthRisk = (answers: Record<string, string>): AIResult => {
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

  const reasons: string[] = [];

  // 1. ЧИХРИЙН ШИЖИНГИЙН ЭРСДЭЛ
  let diabBase = 5;
  if (bmi > 25) {
    diabBase += 25;
    if (gender === 'female') {
      diabBase += 10;
      reasons.push("Биеийн жингийн илүүдэл (Монгол эмэгтэйчүүдийн дунд төвийн таргалалт өндөр байдаг)");
    } else {
      reasons.push("Биеийн жингийн илүүдэл (BMI > 25)");
    }
  }
  if (age > 45) {
    diabBase += 20;
    reasons.push("Насжилтын хамааралтай чихрийн шижингийн эрсдэл (45+ нас)");
  }
  if (geneticRisk) {
    diabBase *= 1.4;
    reasons.push("Гэр бүлийн генетик удамшил");
  }

  // 2. ЗҮРХ СУДАСНЫ ЭРСДЭЛ
  let heartBase = 10;
  if (systolic > 140) {
    heartBase += 35;
    reasons.push("Цусны даралт ихсэлт (Зүрх судасны өвчлөлийн гол шалтгаан)");
  }
  if (saltIntake > 7) {
    heartBase += 20;
    reasons.push("Давсны өндөр хэрэглээ (Монголчуудын дундаж 11г буюу ДЭМБ-ын зөвлөмжөөс 2 дахин их)");
  }
  if (gender === 'male' && age > 45) {
    heartBase += 20;
    reasons.push("Хүйс болон насны өндөр эрсдэл (Монгол эрэгтэйчүүд 45-аас дээш насанд өндөр эрсдэлтэй)");
  }
  if (smoking === 'current') {
    heartBase += 20;
    reasons.push("Идэвхтэй тамхидалт");
  }

  // 3. ХАВДРЫН ЭРСДЭЛ
  let cancerBase = 5;
  if (smoking === 'current') {
    cancerBase += 35;
  }
  if (airPollution > 7) {
    cancerBase += 20;
    reasons.push("Агаарын бохирдол (Уушгины өвчлөлд нөлөөлөх өндөр өртөлт)");
  }
  if (specificSymptom === 'coughing_blood') {
    cancerBase += 40;
    reasons.push("Цусаар ханиалгах (Хавдрын ноцтой шинж тэмдэг байж болзошгүй)");
  }
  if (alcoholFreq === 'daily' || alcoholFreq === 'often') {
    cancerBase += 15;
    reasons.push("Согтууруулах ундааны тогтмол хэрэглээ");
  }

  const diabetesRisk = Math.min(diabBase, 100);
  const heartRisk = Math.min(heartBase, 100);
  const cancerRisk = Math.min(cancerBase, 100);

  if (reasons.length === 0) {
    reasons.push("Таны амьдралын хэв маяг болон эрүүл мэндийн үзүүлэлтүүд одоогоор эрсдэл багатай байна");
  }

  return {
    diabetesRisk: Math.round(diabetesRisk),
    heartRisk: Math.round(heartRisk),
    cancerRisk: Math.round(cancerRisk),
    overallScore: Math.round((diabetesRisk + heartRisk + cancerRisk) / 3),
    reasons: Array.from(new Set(reasons))
  };
};

// --- 2. МАШИН СУРГАЛТЫН МОДЕЛ (Offline ONNX Inference) ---

export class HealthAI {
  private static session: ort.InferenceSession | null = null;

  static async init() {
    if (!this.session) {
      try {
        this.session = await ort.InferenceSession.create('/models/healthModel.onnx');
        console.log("✅ Offline AI Model loaded successfully");
      } catch (e) {
        console.error("❌ Failed to load AI model:", e);
      }
    }
  }

  static async predict(data: {
    age: number;
    gender: number;
    smoking: number;
    alcohol: number;
    fruit_veg: number;
    activity: number;
    bmi: number;
    sys_bp: number;
  }) {
    if (!this.session) await this.init();
    if (!this.session) return null;

    const inputData = Float32Array.from([
      data.age, data.gender, data.smoking, data.alcohol, 
      data.fruit_veg, data.activity, data.bmi, data.sys_bp
    ]);

    const tensor = new ort.Tensor('float32', inputData, [1, 8]);
    
    try {
      const feeds: Record<string, ort.Tensor> = { float_input: tensor };
      const results = await this.session.run(feeds);
      const riskLevel = results.output_label.data[0]; 
      
      return {
        level: riskLevel,
        probability: results.output_probability.data as Float32Array
      };
    } catch (e) {
      console.error("Inference Error:", e);
      return null;
    }
  }

  static getSpecialtyMapping(prediction: any, data: any) {
    if (prediction.level === 2) {
      if (data.sys_bp >= 140) return "Зүрх судас";
      if (data.bmi >= 25) return "Дотоод шүүрэл";
      if (data.smoking === 1) return "Уушги, амьсгалын зам";
      if (data.alcohol === 1) return "Сэтгэцийн эрүүл мэнд";
    }
    return undefined;
  }
}

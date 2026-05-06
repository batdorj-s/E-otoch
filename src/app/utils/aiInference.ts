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
  const contributionMap: Record<string, number> = {
    "Жин (BMI)": 0,
    "Цусны даралт": 0,
    "Тамхидалт": 0,
    "Давсны хэрэглээ": 0,
    "Агаарын бохирдол": 0,
    "Генетик/Бусад": 0
  };

  // 1. ЧИХРИЙН ШИЖИНГИЙН ЭРСДЭЛ
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

  // 2. ЗҮРХ СУДАСНЫ ЭРСДЭЛ
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

  // 3. ХАВДРЫН ЭРСДЭЛ
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

  // Convert map to sorted contributions
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
    contributions
  };
};

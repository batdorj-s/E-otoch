

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

export const getAIAdvice = async (answers: Record<string, string>, aiResults: any) => {
  const prompt = `
    Чи бол "Eotoch" нэртэй Монгол улсын эрүүл мэндийн хиймэл оюунт туслах юм. 
    Хэрэглэгчийн мэдээлэл:
    - Нас: ${answers.age}
    - Хүйс: ${answers.gender === 'male' ? 'Эрэгтэй' : 'Эмэгтэй'}
    - BMI: ${(Number(answers.weight) / (Math.pow(Number(answers.height) / 100, 2))).toFixed(1)}
    - Цусны даралт (Систол): ${answers.bp_systolic}
    - Тамхидалт: ${answers.smoking}
    - Архины хэрэглээ: ${answers.alcohol_freq}
    
    AI-ийн тооцоолсон эрсдэлүүд:
    - Чихрийн шижин: ${aiResults.diabetesRisk}%
    - Зүрх судас: ${aiResults.heartRisk}%
    - Хавдрын эрсдэл: ${aiResults.cancerRisk}%
    
    Дээрх мэдээлэл дээр үндэслэн энэ хүнд зориулсан эрүүл мэндийн маш товч, тодорхой, зөвлөгөөг Монгол хэлээр бичнэ үү. 
    Зөвлөгөө нь дараах бүтцээр байна:
    1. Одоогийн байдалд өгөх ерөнхий дүгнэлт (1 өгүүлбэр).
    2. Хамгийн чухал анхаарах 2-3 зөвлөмж (Bullet points).
    3. Итгэл найдвар өгсөн төгсгөл.
    
    Хиймэл оюун ухаан учраас оношилгоо биш гэдгийг санаарай.
  `;

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    const data = await response.json();
    
    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0].content.parts[0].text;
    } else {
      console.error("Gemini API Full Error:", data);
      const errorMsg = data.error?.message || "Тодорхойгүй алдаа гарлаа";
      return `Уучлаарай, AI зөвлөгөөг боловсруулахад асуудал гарлаа: ${errorMsg}`;
    }
  } catch (error) {
    console.error("Gemini API Network Error:", error);
    return "Уучлаарай, AI зөвлөгөөг ачаалахад алдаа гарлаа. Та өөрийн эрсдэлийн оноог харна уу.";
  }
};

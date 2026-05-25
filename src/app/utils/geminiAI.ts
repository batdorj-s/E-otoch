/// <reference types="vite/client" />

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Using v1beta and gemini-flash-latest for better compatibility
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

export const getAIAdvice = async (answers: Record<string, string>, aiResults: any) => {
  if (!GEMINI_API_KEY) {
    console.error("Gemini API Key is missing! Please check your .env file.");
    return "AI зөвлөгөө авахын тулд API түлхүүр тохируулах шаардлагатай байна.";
  }

  const safeAiResults = aiResults || {};

  const prompt = `
    Чи бол "Eotoch" нэртэй Монгол улсын эрүүл мэндийн хиймэл оюунт туслах юм. 
    Хэрэглэгчийн мэдээлэл:
    - Нас: ${answers.age}
    - Хүйс: ${answers.gender === 'male' ? 'Эрэгтэй' : 'Эмэгтэй'}
    - BMI: ${answers.weight && answers.height ? (Number(answers.weight) / (Math.pow(Number(answers.height) / 100, 2))).toFixed(1) : 'Тодорхойгүй'}
    - Цусны даралт (Систол): ${answers.bp_systolic || 'Тодорхойгүй'}
    - Тамхидалт: ${answers.smoking || 'Тодорхойгүй'}
    - Архины хэрэглээ: ${answers.alcohol_freq || 'Тодорхойгүй'}
    - ЯРИАГААР БОЛОН БИЧГЭЭР ӨГСӨН ЗОВИУР: ${answers.other_symptoms || 'Тусгайлан дурдсан зовиургүй'}
    
    AI-ийн тооцоолсон эрсдэлүүд:
    - Чихрийн шижин: ${safeAiResults.diabetesRisk || 0}%
    - Зүрх судас: ${safeAiResults.heartRisk || 0}%
    - Хавдрын эрсдэл: ${safeAiResults.cancerRisk || 0}%
    
    Дээрх мэдээлэл дээр үндэслэн энэ хүнд зориулсан эрүүл мэндийн маш товч, тодорхой, зөвлөгөөг Монгол хэлээр бичнэ үү. 
    Зөвлөгөө нь дараах бүтцээр байна:
    1. Зовиурын дүн шинжилгээ: Хэрэглэгчийн хэлсэн зовиурыг (хэрэв байгаа бол) тайлбарлаж зөвлөх.
    2. Одоогийн байдалд өгөх ерөнхий дүгнэлт (1 өгүүлбэр).
    3. Хамгийн чухал анхаарах 2-3 зөвлөмж (Bullet points).
    4. Итгэл найдвар өгсөн төгсгөл.
    
    Хиймэл оюун ухаан учраас оношилгоо биш гэдгийг санаарай.
  `;

  try {
    let response;
    let retries = 0;
    const maxRetries = 5;
    const baseDelay = 2000;

    while (retries < maxRetries) {
      response = await fetch(GEMINI_URL, {
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

      if (response.status === 429) {
        retries++;
        const delay = baseDelay * Math.pow(2, retries);
        console.warn(`Gemini API rate limit hit (429). Retrying in ${delay}ms... (Attempt ${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      break;
    }

    if (!response || !response.ok) {
      const errorData = await response?.json().catch(() => ({}));
      console.error("Gemini API Error:", response?.status, errorData);
      
      if (response?.status === 429) {
        return "Уучлаарай, систем ачаалалтай байна (Too Many Requests). Түр хүлээгээд дахин оролдоно уу.";
      }
      if (response?.status === 404) {
        return "Уучлаарай, AI модел олдсонгүй (404). API хаягийг шалгана уу.";
      }
      return `Уучлаарай, AI зөвлөгөөг боловсруулахад асуудал гарлаа (${response?.status || 'Network Error'}).`;
    }

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

// 2. Fetch conversational AI clinical analysis on Lung Cancer ML scan results
export const getLungAIAdvice = async (mlResults: { risk: number; status: string; details: string[] }) => {
  if (!GEMINI_API_KEY) {
    console.error("Gemini API Key is missing! Please check your .env file.");
    return "AI зөвлөгөө авахын тулд API түлхүүр тохируулах шаардлагатай байна.";
  }

  const prompt = `
    Чи бол "Eotoch" нэртэй Монгол улсын эрүүл мэндийн хиймэл оюунт туслах эмч юм.
    Манай уушгины CT зураг шинжлэх ML (Machine Learning) модел дараах үр дүнг гаргасан байна:
    - Хавдрын магадлал (VGG16): ${mlResults.risk}%
    - Шинжилгээний төлөв: ${mlResults.status}
    - Шинжилгээний үзүүлэлтүүд:
      ${mlResults.details.map(d => `- ${d}`).join("\n")}

    Дээрх ML моделийн гаргасан тоон болон клиник үзүүлэлтүүдийг боловсруулж, хэрэглэгчид зориулсан маш дэлгэрэнгүй, мэргэжлийн бөгөөд дулаан уур амьсгалтай зөвлөгөөг Монгол хэлээр бичнэ үү.
    Зөвлөгөө нь дараах бүтцээр байна:
    1. Шинжилгээний үр дүнг энгийн үгээр тайлбарлах: Хавдрын магадлалын хувь (${mlResults.risk}%) болон илэрсэн зангилааны шинж чанар хэрэглэгчийн хувьд ямар утгатай болохыг эмнэлгийн бус энгийн үгээр тайлбарлаж өгөх.
    2. Эмнэлзүйн тодорхой алхмууд: Энэ хүн цаашид яг ямар шинжилгээ хийлгэх (жишээ нь: HRCT, биопси, уушгины эмчийн үзлэг), аль эмнэлэгт хандах эсвэл хэдий хугацааны дараа хянуулах шаардлагатайг тодорхой зөвлөх.
    3. Амьдралын хэв маягийн зөвлөмжүүд: Уушгины үйл ажиллагааг дэмжих зөвлөмж (тамихнаас татгалзах, дасгал хөдөлгөөн, агаарын чийгшил гэх мэт).
    4. Урам зориг өгсөн дулаан төгсгөл: Айдас түгшүүрийг нь намжааж, эрүүл мэнддээ анхаарал тавихад нь урам өгсөн үг хэллэг.

    Чухал санамж: Энэ нь хиймэл оюуны урьдчилсан үнэлгээ бөгөөд мэргэжлийн рентген эмчийн эцсийн оношийг орлохгүй гэдгийг уриалгахан, зөөлөн хэлбэрээр анхааруулна уу.
  `;

  try {
    let response;
    let retries = 0;
    const maxRetries = 5;
    const baseDelay = 2000;

    while (retries < maxRetries) {
      response = await fetch(GEMINI_URL, {
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

      if (response.status === 429) {
        retries++;
        const delay = baseDelay * Math.pow(2, retries);
        console.warn(`Gemini API rate limit hit (429). Retrying in ${delay}ms... (Attempt ${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      break;
    }

    if (!response || !response.ok) {
      const errorData = await response?.json().catch(() => ({}));
      console.error("Gemini API Error:", response?.status, errorData);
      
      if (response?.status === 429) {
        return "Уучлаарай, систем ачаалалтай байна (Too Many Requests). Түр хүлээгээд дахин оролдоно уу.";
      }
      return `Уучлаарай, AI зөвлөгөөг боловсруулахад асуудал гарлаа (${response?.status || 'Network Error'}).`;
    }

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
    return "Уучлаарай, AI-ийн дэлгэрэнгүй зөвлөгөөг ачаалахад алдаа гарлаа.";
  }
};


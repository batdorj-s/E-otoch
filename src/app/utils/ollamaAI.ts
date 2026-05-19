import { getRelevantKnowledge } from "./knowledgeBase";
import { getAIAdvice } from "./geminiAI";

const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODEL_NAME = "llama3"; // Та өөрийн суулгасан моделын нэрийг энд оруулж болно (жишээ нь: llama3, gemma2, mistral, llama3.1)

/**
 * 100% Local RAG-based rule generator to serve as the ultimate bulletproof fallback 
 * if both local Ollama and remote Google Gemini API are down (e.g. 503 error).
 */
export const generateLocalRAGAdvice = (answers: Record<string, string>, aiResults: any): string => {
  const age = answers.age || "25";
  const gender = answers.gender === "male" ? "Эрэгтэй" : "Эмэгтэй";
  const systolic = Number(answers.bp_systolic || 120);
  const weight = Number(answers.weight || 65);
  const height = Number(answers.height || 170);
  const bmi = (weight / Math.pow(height / 100, 2)).toFixed(1);
  const salt = Number(answers.salt_intake || 5);
  const smoking = answers.smoking || "never";
  const alcohol = answers.alcohol_freq || "never";

  let adviceText = `**Eotoch Офлайн Анализ & Ахлах эмчийн зөвлөгөө** (Офлайн горим)\n\n`;
  adviceText += `*(Жич: AI сервертэй холбогдох боломжгүй байгаа тул таны өгөгдөл дээр суурилсан стандартын дагуух дүн шинжилгээг харуулж байна.)*\n\n`;
  adviceText += `**1. Эрүүл мэндийн ерөнхий дүгнэлт:**\n`;
  adviceText += `Таны ${age} насны, ${gender} бие махбодын бодит үзүүлэлтүүд болон судалгааны дата дээр үндэслэн дараах дүн шинжилгээг хийлээ.\n\n`;

  if (answers.other_symptoms && answers.other_symptoms.trim() !== "") {
    adviceText += `* **Нэмэлт зовиурын тэмдэглэл:** Таны дурдсан "*${answers.other_symptoms}*" гэх шинж тэмдгийг систем бүртгэн авлаа. Энэ нь таны өнөөдрийн үнэлгээний чухал хэсэг бөгөөд доорх эрсдэлийн оноотой хамт эмчид үзүүлэхдээ давхар хэлж зөвлөлдөөрэй.\n\n`;
  }

  // BMI Assessment
  adviceText += `* **Биеийн жингийн индекс (BMI):** ${bmi}. `;
  const bmiNum = Number(bmi);
  if (bmiNum >= 30) {
    adviceText += `Таны жин хэт таргалалттай ангилалд байна. Монгол улсад насанд хүрсэн хүмүүсийн 19.7% нь хэт таргалалттай байдаг бөгөөд таны Чихрийн шижин өвчлөх эрсдэлийг нэмэгдүүлж байна.\n`;
  } else if (bmiNum >= 25) {
    adviceText += `Таны жин илүүдэлтэй байна. Монгол улсын хүн амын 54.4% нь илүүдэл жинтэй буюу таргалалттай байдаг тул жингээ хэвийн хэмжээнд барихад анхаарах хэрэгтэй.\n`;
  } else {
    adviceText += `Таны биеийн жин хэвийн хэмжээнд байна. Энэ нь зүрх судас болон чихрийн шижингийн өвчлөлөөс сэргийлэх маш сайн суурь үзүүлэлт юм.\n`;
  }

  // BP Assessment
  adviceText += `* **Артерийн даралт:** ${systolic} mmHg. `;
  if (systolic >= 140) {
    adviceText += `Цусны даралт өндөр байна (Даралт ихсэлт). Монголын насанд хүрэгчдийн 27.5% нь даралт ихсэлттэй байдгаас 71.7% нь өөрийгөө өмнө нь оношлуулаагүй байсныг анхаарна уу. Даралт ихсэлт нь зүрх судасны нас баралтын 52%-ийг бүрдүүлдэг.\n`;
  } else if (systolic >= 130) {
    adviceText += `Даралт бага зэрэг өндөр (Хязгаарын даралт). Давсны хэрэглээ болон амьдралын хэв маягтаа яаралтай анхаарах шаардлагатай.\n`;
  } else {
    adviceText += `Таны цусны даралт хэвийн түвшинд байна. Зүрх судасны үйл ажиллагаа тогтвортой байна.\n`;
  }

  // Salt Assessment
  if (salt > 6) {
    adviceText += `* **Давсны хэрэглээ:** Давсны хэрэглээ өндөр (${salt}/10 оноо) байна. Монголчуудын давсны дундаж хэрэглээ өдөрт 11.1 грамм буюу ДЭМБ-ын зөвлөмжөөс 2 дахин их байдаг. Давстай цай болон бэлэн бүтээгдэхүүнийг хязгаарлах шаардлагатай.\n`;
  }

  // Risk Scores Assessment
  adviceText += `\n**2. Өвчлөлийн эрсдэлийн үнэлгээ (Random Forest оношлогоо):**\n`;
  adviceText += `- **Чихрийн шижин эрсдэл:** ${aiResults.diabetesRisk}% `;
  if (aiResults.diabetesRisk > 60) adviceText += `(⚠️ Маш өндөр эрсдэл! Өдөр тутмын сахар, нүүрс усны хэрэглээг хянаж, чихрийн шижингийн далд хэлбэрээс сэргийлж шинжилгээ өгнө үү)\n`;
  else if (aiResults.diabetesRisk > 30) adviceText += `(Дунд зэргийн эрсдэл. Жил бүр урьдчилан сэргийлэх үзлэгт хамрагдахыг зөвлөж байна)\n`;
  else adviceText += `(Бага эрсдэл. Хэвийн хэмжээнд байна)\n`;

  adviceText += `- **Зүрх судасны эрсдэл:** ${aiResults.heartRisk}% `;
  if (aiResults.heartRisk > 60) adviceText += `(⚠️ Зүрх судасны өндөр эрсдэл! Цусны даралтаа өдөр бүр хэмжиж, давсны хэрэглээгээ яаралтай 5 граммаас бага болгох хэрэгтэй)\n`;
  else if (aiResults.heartRisk > 30) adviceText += `(Дунд зэргийн эрсдэл. Идэвхтэй хөдөлгөөн, агаарт алхах дадал суулгаарай)\n`;
  else adviceText += `(Эрсдэл багатай)\n`;

  adviceText += `- **Хавдрын эрсдэл:** ${aiResults.cancerRisk}% `;
  if (aiResults.cancerRisk > 40) adviceText += `(Хорт зуршил, тамхи, согтууруулах ундааны хэрэглээг яаралтай хязгаарлах хэрэгтэй)\n`;
  else adviceText += `(Бага эрсдэлтэй)\n`;

  // Action Plan
  adviceText += `\n**3. Танд зориулсан тусгай төлөвлөгөө:**\n`;
  let stepNum = 1;
  if (systolic >= 130 || salt > 6) {
    adviceText += `${stepNum++}. **Давсыг өдөрт 5 граммаас хэтрүүлэхгүй байх:** Давстай цай болон хоолны давсаа багасгаж, шошго дээрх натрийн хэмжээг шалгаж сураарай.\n`;
  }
  if (bmiNum >= 25) {
    adviceText += `${stepNum++}. **Жингээ хянах & Хөдөлгөөн:** Долоо хоногт 150 минутаас багагүй дунд зэргийн эрчимтэй дасгал хийж, BMI жингээ 24.9-өөс доош оруулахыг зорилгоо болгоно уу.\n`;
  }
  if (smoking === "current" || smoking === "former") {
    adviceText += `${stepNum++}. **Тамхинаас бүрэн татгалзах:** Тамхи татаж эхэлсэн дундаж нас Монголд 19 байгаа бөгөөд зүрх судас, уушигны өвчлөлийг 3-4 дахин өдөөж байна.\n`;
  }
  if (alcohol && alcohol !== "never") {
    adviceText += `${stepNum++}. **Архины хэрэглээг хянах:** Монгол эрэгтэйчүүдийн 37.5% нь архи хэтрүүлэн хэрэглэх эрсдэлтэй байдаг тул стандарт хэмжээнээс (10гр цэвэр спирт) хэтрүүлэхгүй байх хэрэгтэй.\n`;
  }
  adviceText += `${stepNum++}. **Эмнэлгийн урьдчилан сэргийлэх үзлэг:** Жилд хамгийн багадаа нэг удаа цусан дахь глюкоз болон зүрхний цахилгаан бичлэгийг хийлгэж дадвал ноцтой хүндрэлээс 80% сэргийлж чадна.\n`;

  adviceText += `\n**4. Дүгнэлт:**\n`;
  adviceText += `Эрүүл мэнд бол таны өдөр тутамдаа хийдэг жижиг зөв сонголтуудын нийлбэр юм. Өнөөдрөөс эхлэн давсаа багасгаж, хөдөлгөөн хийх нь таны амьдралын чанарыг эрс сайжруулна. Та өөрийн эрсдэлийг удирдаж чадна!\n\n`;
  adviceText += `*Санамж: Энэхүү офлайн дүн шинжилгээ нь зөвхөн урьдчилан сэргийлэх зорилготой бөгөөд эмнэлгийн мэргэжлийн оношилгоо, зөвлөгөөг орлохгүй.*`;

  return adviceText;
};

export const getOllamaAdvice = async (answers: Record<string, string>, aiResults: any): Promise<string> => {
  const relevantFacts = getRelevantKnowledge(answers, aiResults);
  const bmiVal = answers.weight && answers.height 
    ? (Number(answers.weight) / (Math.pow(Number(answers.height) / 100, 2))).toFixed(1) 
    : 'Тодорхойгүй';

  const systemPrompt = `
    Чи бол "Eotoch" системийн ахлах зөвлөх эмч, Монгол улсын эрүүл мэндийн шинжээч хиймэл оюун ухаан юм.
    Таны үүрэг бол хэрэглэгчийн эрүүл мэндийн үзүүлэлтүүд болон Монгол улсын STEPS судалгааны баримтуудыг харьцуулж, мэргэжлийн, байгалийн уянгалаг бөгөөд амьдралд шууд хэрэгжихүйц эмчийн зөвлөгөөг боловсруулах явдал юм.

    АНХААРАХ ШААРДЛАГА:
    - Зөвхөн Монгол хэлээр хариул.
    - Хариултыг заавал дараах 4 бүлэг хэсэгт хувааж бич.
    - Миний өгөгдсөн даалгаврын заавар эсвэл даалгавар өгөхөд ашигласан загвар текстийг өөрөө давтаж бичиж болохгүй! Зөвхөн хэрэглэгчийн бодит өгөгдлийг тайлбарлаж бич.
  `;

  const userPrompt = `
    Дараах эрүүл мэндийн өгөгдөл дээр үндэслэн ахлах эмчийн нарийвчилсан зөвлөгөөг боловсруулж өгнө үү.

    ХЭРЭГЛЭГЧИЙН ӨГӨГДӨЛ:
    - Нас/Хүйс: ${answers.age} нас, ${answers.gender === 'male' ? 'Эрэгтэй' : 'Эмэгтэй'}
    - Биеийн жингийн индекс (BMI): ${bmiVal}
    - Цусны даралт (Систол): ${answers.bp_systolic || 'Тодорхойгүй'} mmHg
    - Хорт зуршил: Тамхи - ${answers.smoking || 'Тодорхойгүй'}, Архи - ${answers.alcohol_freq || 'Тодорхойгүй'}
    - Давсны хэрэглээ (1-10 оноо): ${answers.salt_intake || 'Тодорхойгүй'}
    - Нэмэлт зовиур: ${answers.other_symptoms || 'Тусгайлан дурдсан зовиургүй'}
    
    МЭДЛЭГИЙН САНГИЙН СУДАЛГААНЫ БАРИМТУУД:
    ${relevantFacts}

    ML МОДЕЛЫН ЭРСДЭЛИЙН ҮНЭЛГЭЭ:
    - Чихрийн шижин: ${aiResults.diabetesRisk || 0}%
    - Зүрх судасны өвчлөл: ${aiResults.heartRisk || 0}%
    - Хавдрын эрсдэл: ${aiResults.cancerRisk || 0}%
    
    Хариултын формат:
    1. **Зовиурын дүн шинжилгээ:** (Хэрэглэгчийн хэлсэн зовиур дээр үндэслэн эмнэлзүйн үүднээс юуг анхаарах ёстойг тайлбарлаж зөвлөх)
    2. **Эрсдэлийн дүн шинжилгээ:** (Тоон үзүүлэлт болон судалгааны баримтуудыг Монгол улсын дундажтай харьцуулж дүгнэх)
    3. **Тодорхой Action Plan:** (Амьдралд хэрэгжихүйц 3-4 тодорхой зөвлөмж)
    4. **Дүгнэлт:** (Урам зориг өгсөн дулаан төгсгөл. Санамж: Эмнэлгийн оношилгоог орлохгүй гэдгийг жижиг үсгээр төгсгөлд нь нэм.)
  `;

  try {
    console.log("Connecting to local Ollama Chat API...");
    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        stream: false,
        options: {
          temperature: 0.6,
          top_p: 0.9,
          num_predict: 800,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama returned status ${response.status}`);
    }

    const data = await response.json();
    
    if (data.message && data.message.content) {
      console.log("Successfully fetched advice from local Ollama Chat!");
      return data.message.content;
    } else {
      console.warn("Ollama response format unexpected. Falling back to Gemini...");
      const backup = await getAIAdvice(answers, aiResults);
      if (backup.startsWith("Уучлаарай") || backup.startsWith("AI зөвлөгөө")) {
        console.warn("Gemini backup returned an error. Using local RAG fallback advice...");
        return generateLocalRAGAdvice(answers, aiResults);
      }
      return backup;
    }
  } catch (error) {
    console.warn("Local Ollama connection failed. Falling back to Google Gemini AI API...", error);
    
    try {
      const backupAdvice = await getAIAdvice(answers, aiResults);
      if (backupAdvice.startsWith("Уучлаарай") || backupAdvice.startsWith("AI зөвлөгөө")) {
        console.warn("Gemini backup returned an error. Using local RAG fallback advice...");
        return generateLocalRAGAdvice(answers, aiResults);
      }
      return backupAdvice;
    } catch (geminiError) {
      console.error("Gemini fallback crashed. Using local RAG fallback advice...", geminiError);
      return generateLocalRAGAdvice(answers, aiResults);
    }
  }
};

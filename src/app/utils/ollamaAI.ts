import { getRelevantKnowledge } from "./knowledgeBase";
import { getAIAdvice as getGeminiAdvice } from "./geminiAI";

const OLLAMA_URL = "http://localhost:11434/api/generate";
const MODEL_NAME = "llama3";

export interface AgentContext {
  answers: Record<string, string>;
  aiResults: any;
  expandedQuery?: string;
  retrievedFacts?: string;
}

// 1. PRE-RETRIEVAL: Query Expansion & Intent Discovery
const expandQuery = async (context: AgentContext): Promise<string> => {
  const prompt = `
    Хэрэглэгчийн эрүүл мэндийн өгөгдлөөс хайлтын гол түлхүүр үгс болон эмнэлгийн сэдвүүдийг тодорхойл.
    
    ӨГӨГДӨЛ:
    - Нас/Хүйс: ${context.answers.age}, ${context.answers.gender}
    - Жин/Өндөр: ${context.answers.weight}кг, ${context.answers.height}см
    - Даралт: ${context.answers.bp_systolic}
    - Зовиур: ${context.answers.other_symptoms || "Байхгүй"}
    - Эрсдэлүүд: Чихрийн шижин ${context.aiResults.diabetesRisk}%, Зүрх судас ${context.aiResults.heartRisk}%
    
    Дараах хэлбэрээр хариул (Зөвхөн түлхүүр үгс):
    Сэдвүүд: [Сэдвүүдийн жагсаалт]
  `;

  try {
    const res = await callOllama(prompt, { temperature: 0.1 });
    return res;
  } catch (e) {
    return "hypertension, diabetes, obesity"; // Fallback
  }
};

// 2. ROUTER & RETRIEVAL: Smart search in Knowledge Base
const retrieveKnowledge = (context: AgentContext): string => {
  // We use the existing getRelevantKnowledge but we can enhance it with expanded keywords if needed
  return getRelevantKnowledge(context.answers, context.aiResults);
};

// 3. GENERATION: Final response with RAG
const generateFinalResponse = async (context: AgentContext): Promise<string> => {
  const prompt = `
    Чи бол "Eotoch" системийн ахлах зөвлөх эмч, эрүүл мэндийн шинжээч AI Agent юм. 
    Доорх баримтууд дээр тулгуурлан хэрэглэгчид МАШ ТОДОРХОЙ зөвлөгөө өг.

    ХЭРЭГЛЭГЧИЙН МЭДЭЭЛЭЛ:
    - Нас: ${context.answers.age}
    - BMI: ${(Number(context.answers.weight) / (Math.pow(Number(context.answers.height) / 100, 2))).toFixed(1)}
    - Даралт: ${context.answers.bp_systolic}
    - ML Эрсдэл: Зүрх судас ${context.aiResults.heartRisk}%, Чихрийн шижин ${context.aiResults.diabetesRisk}%

    ШИНЖЛЭХ УХААНЫ БАРИМТУУД (RAG):
    ${context.retrievedFacts}

    ЗААВАР:
    1. Эхлээд хэрэглэгчийн үзүүлэлтийг баримтуудтай харьцуулж дүгнэ.
    2. Хэрэгжүүлж болох 3 тодорхой алхам санал болго.
    3. Монгол хүний хооллолт, амьдралын хэв маягийн онцлогийг тусга.
    
    *Зөвхөн Монгол хэлээр хариул.*
  `;

  return await callOllama(prompt, { temperature: 0.7 });
};

// 4. POST-GENERATION: Self-Reflection & Guardrails
const reflectAndRefine = async (response: string, context: AgentContext): Promise<string> => {
  const prompt = `
    Зөвлөгөөнд дараах шалгуураар хяналт хийж, шаардлагатай бол засаж сайжруул:
    1. Зөвлөгөө нь өгөгдсөн баримтуудад (RAG) үндэслэсэн үү?
    2. Анагаах ухааны хувьд алдаатай эсвэл аюултай зөвлөмж байна уу?
    3. Эмчийн оношилгоог орлохгүй гэдгийг сануулсан уу?

    ЭХ ХАРИУЛТ:
    ${response}

    Хэрэв засах шаардлагагүй бол эх хариултыг хэвээр нь, засах бол сайжруулсан хувилбарыг нь бич.
  `;

  try {
    const res = await callOllama(prompt, { temperature: 0.1 });
    return res;
  } catch (e) {
    return response;
  }
};

// --- CORE AGENT ORCHESTRATOR ---
export const getOllamaAdvice = async (answers: Record<string, string>, aiResults: any) => {
  const context: AgentContext = { answers, aiResults };

  try {
    console.log("Agent Phase 1: Query Expansion...");
    context.expandedQuery = await expandQuery(context);

    console.log("Agent Phase 2: Knowledge Retrieval...");
    context.retrievedFacts = retrieveKnowledge(context);

    console.log("Agent Phase 3: Response Generation...");
    let initialResponse = await generateFinalResponse(context);

    // If Ollama returns the error message we defined in callOllama, trigger fallback
    if (initialResponse.includes("Ollama ажиллахгүй байна")) {
      console.log("Ollama failed, falling back to Gemini...");
      return await getGeminiAdvice(answers, aiResults);
    }

    console.log("Agent Phase 4: Self-Reflection...");
    const finalResponse = await reflectAndRefine(initialResponse, context);

    return finalResponse;
  } catch (error) {
    console.warn("Ollama Agent failed, trying Gemini fallback...", error);
    return await getGeminiAdvice(answers, aiResults);
  }
};

// Helper for Ollama API calls
async function callOllama(prompt: string, options: any = {}) {
  try {
    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL_NAME,
        prompt: prompt,
        stream: false,
        options: {
          num_predict: 800,
          ...options
        }
      })
    });
    
    if (!response.ok) return "Уучлаарай, Ollama систем хариу өгсөнгүй.";
    
    const data = await response.json();
    return data.response;
  } catch (e: any) {
    console.error("Ollama connection failed:", e.message);
    return "Ollama ажиллахгүй байна. 11434 порт нээлттэй эсэхийг шалгана уу.";
  }
}

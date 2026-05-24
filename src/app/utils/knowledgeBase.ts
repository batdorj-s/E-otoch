import compiledKnowledge from "../data/compiledKnowledge.json";

export interface KnowledgeChunk {
  id: string;
  category: "salt" | "tobacco" | "alcohol" | "obesity" | "hypertension" | "diabetes" | "general";
  content: string;
  source: string;
}

// Convert JSON to typed interface
const medicalKnowledge = compiledKnowledge as KnowledgeChunk[];

export const getRelevantKnowledge = (answers: Record<string, string>, aiResults: any): string => {
  let context = "";
  const weight = Number(answers.weight || 65);
  const height = Number(answers.height || 170);
  const bmi = weight / (Math.pow(height / 100, 2));
  const systolic = Number(answers.bp_systolic || 120);
  const symptoms = (answers.other_symptoms || "").toLowerCase();

  // 1. Identify priority categories based on user data
  const targetCategories = new Set<string>(["general"]);

  if (systolic >= 135 || aiResults.heartRisk > 30) targetCategories.add("hypertension");
  if (bmi > 25 || aiResults.obesityRisk > 30) targetCategories.add("obesity");
  if (aiResults.diabetesRisk > 30) targetCategories.add("diabetes");
  if (answers.smoking === "current") targetCategories.add("tobacco");
  if (answers.alcohol_freq && answers.alcohol_freq !== "never") targetCategories.add("alcohol");

  // Keyword matching for symptoms
  if (symptoms.includes("даралт") || symptoms.includes("толгой")) targetCategories.add("hypertension");
  if (symptoms.includes("сахар") || symptoms.includes("цангах")) targetCategories.add("diabetes");
  if (symptoms.includes("жин") || symptoms.includes("таргалах")) targetCategories.add("obesity");

  // 2. Filter knowledge base
  const filteredKnowledge = medicalKnowledge.filter(chunk => targetCategories.has(chunk.category));

  // 3. Simple Keyword Ranking (Naive RAG)
  // We'll pick top chunks that mention the specific symptoms or risks
  const rankedChunks = filteredKnowledge.map(chunk => {
    let score = 0;
    if (symptoms && chunk.content.toLowerCase().includes(symptoms)) score += 10;
    if (targetCategories.has(chunk.category)) score += 5;
    return { ...chunk, score };
  }).sort((a, b) => b.score - a.score);

  // Take top 10 relevant chunks to avoid context overflow
  const topChunks = rankedChunks.slice(0, 10);

  context = topChunks.map(k => `- [Эх сурвалж: ${k.source}] ${k.content}`).join("\n\n");

  return context || "Монгол улсын эрүүл мэндийн ерөнхий судалгааны статистик үзүүлэлтүүдийг зөвлөгөөндөө ашиглана уу.";
};

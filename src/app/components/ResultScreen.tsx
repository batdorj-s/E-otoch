import { motion } from "motion/react";
import { AlertCircle, CheckCircle, AlertTriangle, XCircle, RefreshCw, Activity, Info, PhoneCall, User, Sparkles } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { HospitalFinder } from "./HospitalFinder";
import { AIResult } from "../utils/aiInference";

type RiskLevel = "low" | "moderate" | "high" | "critical" | "emergency";

interface ResultScreenProps {
  answers: Record<string, string>;
  aiResults: AIResult & { aiAdvice?: string };
  onRestart: () => void;
  onViewProfile: () => void;
}

const riskConfig = {
  low: {
    icon: CheckCircle,
    bgColor: "bg-green-50",
    borderColor: "border-green-400",
    iconColor: "text-green-600",
    badgeColor: "bg-green-500 text-white",
    trafficLight: "#22C55E",
  },
  moderate: {
    icon: AlertTriangle,
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-400",
    iconColor: "text-yellow-600",
    badgeColor: "bg-yellow-500 text-white",
    trafficLight: "#EAB308",
  },
  high: {
    icon: AlertCircle,
    bgColor: "bg-orange-50",
    borderColor: "border-orange-400",
    iconColor: "text-orange-600",
    badgeColor: "bg-orange-500 text-white",
    trafficLight: "#F97316",
  },
  critical: {
    icon: XCircle,
    bgColor: "bg-red-50",
    borderColor: "border-red-400",
    iconColor: "text-red-600",
    badgeColor: "bg-red-500 text-white",
    trafficLight: "#EF4444",
  },
  emergency: {
    icon: AlertCircle,
    bgColor: "bg-red-900",
    borderColor: "border-red-600",
    iconColor: "text-red-100",
    badgeColor: "bg-red-600 text-white",
    trafficLight: "#EF4444",
  },
};

export function ResultScreen({ answers, aiResults, onRestart, onViewProfile }: ResultScreenProps) {
  const height = Number(answers.height) / 100;
  const weight = Number(answers.weight);
  const bmi = weight / (height * height);
  const systolic = Number(answers.bp_systolic);
  
  const isEmergency = aiResults.heartRisk > 85 || aiResults.cancerRisk > 85;

  const getRiskLevel = (score: number): RiskLevel => {
    if (isEmergency) return "emergency";
    if (score > 70) return "critical";
    if (score > 50) return "high";
    if (score > 30) return "moderate";
    return "low";
  };

  const level = getRiskLevel(aiResults.overallScore);
  const config = riskConfig[level];
  const Icon = config.icon;

  const factors = [
    { subject: "Чихрийн шижин", value: aiResults.diabetesRisk, fullMark: 100 },
    { subject: "Зүрх судас", value: aiResults.heartRisk, fullMark: 100 },
    { subject: "Хавдрын эрсдэл", value: aiResults.cancerRisk, fullMark: 100 },
    { subject: "Даралт", value: systolic >= 140 ? 100 : systolic >= 130 ? 60 : 20, fullMark: 100 },
    { subject: "Жин (BMI)", value: bmi >= 30 ? 100 : bmi >= 25 ? 60 : 20, fullMark: 100 },
  ];

  const recommendations = [
    aiResults.heartRisk > 50 ? "Давсны хэрэглээгээ яаралтай багасгаж, даралтаа хянах" : "Эрүүл хооллолтыг хэвшүүлэх",
    aiResults.diabetesRisk > 50 ? "Сахарын агууламжтай бүтээгдэхүүнээс татгалзах, идэвхтэй хөдөлгөөн" : "Жил бүр урьдчилан сэргийлэх үзлэгт орох",
    aiResults.cancerRisk > 40 ? "Хорт зуршлаас татгалзаж, агаарын бохирдлоос өөрийгөө хамгаалах" : "Сэтгэл зүйн эрүүл мэнддээ анхаарах",
  ];

  return (
    <div className={`min-h-screen ${level === "emergency" ? "bg-red-50" : "bg-[#E3F2FD]"} py-6 px-6 overflow-auto`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto space-y-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${level === "emergency" ? "bg-red-700 text-white" : "bg-white"} rounded-3xl shadow-2xl p-6 overflow-hidden relative`}
        >
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"></div>

          <div className="flex items-center justify-center gap-4 mb-6 pt-4">
            <div className="bg-gray-900 rounded-2xl p-3 shadow-lg">
              <div className="space-y-2">
                {["low", "moderate", "critical"].map((l) => (
                  <motion.div
                    key={l}
                    initial={{ opacity: 0.3 }}
                    animate={{
                      opacity: (l === "low" && level === "low") || 
                               (l === "moderate" && level === "moderate") ||
                               (l === "critical" && (level === "high" || level === "critical" || level === "emergency")) ? 1 : 0.2,
                      scale: (l === "low" && level === "low") || 
                             (l === "moderate" && level === "moderate") ||
                             (l === "critical" && (level === "high" || level === "critical" || level === "emergency")) ? 1.1 : 1,
                    }}
                    className={`w-8 h-8 rounded-full ${
                      l === "low" ? "bg-green-500" : l === "moderate" ? "bg-yellow-500" : "bg-red-500"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold ${config.badgeColor}`}>
                  AI: {aiResults.overallScore}%
                </span>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                  ДУНДАЖ: 36.9%
                </span>
              </div>
              <h1 className={`text-2xl font-bold ${level === "emergency" ? "text-white" : "text-gray-900"}`}>
                {level === "low" ? "Эрсдэл бага" : level === "moderate" ? "Дунд зэргийн эрсдэл" : level === "high" ? "Өндөр эрсдэл" : level === "critical" ? "Маш өндөр эрсдэл" : "ЯАРАЛТАЙ ТУСЛАМЖ"}
              </h1>
            </div>

            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", delay: 0.3 }}
            >
              <Icon className={`w-14 h-14 ${level === "emergency" ? "text-white" : config.iconColor}`} />
            </motion.div>
          </div>

          <div className={`mt-4 p-4 rounded-2xl ${level === "emergency" ? "bg-white/10" : "bg-blue-50"} border ${level === "emergency" ? "border-white/20" : "border-blue-100"}`}>
             <h3 className={`text-xs font-bold mb-2 flex items-center gap-2 ${level === "emergency" ? "text-white" : "text-blue-800"}`}>
                <Activity className="w-3 h-3" />
                AI-ИЙН ДҮГНЭЛТ:
             </h3>
             <ul className="space-y-1.5">
                {aiResults.reasons.map((reason, i) => (
                  <li key={i} className={`text-[11px] flex items-start gap-2 ${level === "emergency" ? "text-red-50" : "text-gray-600"}`}>
                    <div className={`w-1 h-1 rounded-full mt-1.5 flex-shrink-0 ${level === "emergency" ? "bg-white" : "bg-blue-400"}`} />
                    {reason}
                  </li>
                ))}
             </ul>
          </div>
          
          {level === "emergency" && (
             <motion.a
                href="tel:103"
                whileTap={{ scale: 0.95 }}
                className="mt-6 w-full flex items-center justify-center gap-3 bg-white text-red-700 py-4 rounded-2xl font-black text-xl shadow-lg border-b-4 border-red-200"
             >
                <PhoneCall className="w-6 h-6" />
                103 РУУ ЗАЛГАХ
             </motion.a>
          )}
        </motion.div>

        {/* Hospital Finder */}
        <HospitalFinder 
          isEmergencyMode={level === "emergency"} 
          requiredSpecialty={aiResults.heartRisk > aiResults.diabetesRisk ? "Cardiology" : "Endocrinology"}
        />

        {/* Gemini AI Advice Card */}
        {aiResults.aiAdvice && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl shadow-xl p-6 text-white relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles className="w-20 h-20" />
            </div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              Eotoch AI-ийн зөвлөгөө
            </h2>
            <div className="text-sm leading-relaxed space-y-2 opacity-90 whitespace-pre-line">
              {aiResults.aiAdvice}
            </div>
          </motion.div>
        )}

        {/* AI Contribution Analysis (SHAP-style) */}
        {aiResults.contributions && aiResults.contributions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl p-6"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Эрсдэлд нөлөөлж буй хүчин зүйлс
            </h2>
            <div className="space-y-4">
              {aiResults.contributions.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                    <span>{item.label}</span>
                    <span>{item.value} оноо</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.value / 100) * 100}%` }}
                      className={`h-full ${item.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[10px] text-gray-400 italic">
              * Энэхүү задаргаа нь AI модел таны эрсдэлийг тооцоолохдоо аль үзүүлэлтэд илүү ач холбогдол өгснийг харуулж байна.
            </p>
          </motion.div>
        )}

        {/* Radar Chart Card */}
        {level !== "emergency" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl shadow-xl p-6"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              AI Эрсдэлийн задаргаа
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={factors}>
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748B", fontSize: 11, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Эрсдэл"
                    dataKey="value"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-between items-center text-xs text-gray-500 border-t pt-4">
              <div className="flex flex-col items-center">
                <span className="font-bold text-gray-900">{bmi.toFixed(1)}</span>
                <span>BMI</span>
              </div>
              <div className="flex flex-col items-center border-x px-4">
                <span className="font-bold text-gray-900">{answers.bp_systolic}</span>
                <span>Даралт</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-gray-900">{answers.age}</span>
                <span>Нас</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-lg p-6"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            AI Зөвлөмж
          </h2>
          <ul className="space-y-3">
            {recommendations.map((recommendation, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + 0.1 * index }}
                className="flex items-start gap-3 bg-blue-50 rounded-xl p-3"
              >
                <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-white font-bold text-xs">{index + 1}</span>
                </div>
                <span className="text-gray-700 text-sm flex-1">{recommendation}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Дахин эхлүүлэх
          </button>
          <button
            onClick={onViewProfile}
            className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200"
          >
            <User className="w-4 h-4" />
            Миний Профайл
          </button>
        </div>
      </motion.div>
    </div>
  );
}

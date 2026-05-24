import { useState, useEffect } from "react";
import { OnboardingScreen } from "./components/OnboardingScreen";
import { AssessmentScreen } from "./components/AssessmentScreen";
import { AnalysisScreen } from "./components/AnalysisScreen";
import { ResultScreen } from "./components/ResultScreen";
import { ProfileScreen } from "./components/ProfileScreen";
import { LungAnalysisScreen } from "./components/LungAnalysisScreen";
import { VoiceAssistant } from "./components/VoiceAssistant";
import { PhoneCall, X, User, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { predictHealthRisk, AIResult } from "./utils/aiInference";
import { getOllamaAdvice } from "./utils/ollamaAI";
import { secureStorage } from "./utils/storageUtils";

type Screen = "onboarding" | "assessment" | "analysis" | "result" | "profile" | "lungAnalysis";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("onboarding");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [aiResults, setAiResults] = useState<(AIResult & { aiAdvice?: string }) | null>(null);
  const [showSOS, setShowSOS] = useState(false);
  const [showVoiceAI, setShowVoiceAI] = useState(false);

  useEffect(() => {
    const savedAnswers = secureStorage.load("eotoch_answers");
    const savedResults = secureStorage.load("eotoch_results");
    
    if (savedAnswers && savedResults) {
      setAnswers(savedAnswers);
      setAiResults(savedResults);
    }
  }, []);

  const handleStart = () => {
    setCurrentScreen("assessment");
  };

  const handleAssessmentComplete = async (userAnswers: Record<string, string>) => {
    setAnswers(userAnswers);
    setCurrentScreen("analysis");
    
    try {
      const results = await predictHealthRisk(userAnswers);
      setAiResults(results);

      const advice = await getOllamaAdvice(userAnswers, results);
      const updatedResults = { ...results, aiAdvice: advice };
      setAiResults(updatedResults);
      secureStorage.save("eotoch_answers", userAnswers);
      secureStorage.save("eotoch_results", updatedResults);
    } catch (e) {
      console.error("Health prediction or Ollama advice failed", e);
    }
  };

  const handleAnalysisComplete = () => {
    setCurrentScreen("result");
  };

  const handleGoToProfile = () => {
    setCurrentScreen("profile");
  };

  const handleRestart = () => {
    setAnswers({});
    setAiResults(null);
    secureStorage.remove("eotoch_answers");
    secureStorage.remove("eotoch_results");
    setCurrentScreen("onboarding");
  };

  return (
    <div className="min-h-screen bg-[#E3F2FD] relative overflow-hidden">
      {currentScreen === "onboarding" && (
        <OnboardingScreen 
          onStart={handleStart} 
          onViewProfile={handleGoToProfile} 
          onVoiceAI={() => setShowVoiceAI(true)} 
        />
      )}
      {currentScreen === "assessment" && <AssessmentScreen onComplete={handleAssessmentComplete} />}
      {currentScreen === "analysis" && <AnalysisScreen onComplete={handleAnalysisComplete} />}
      {currentScreen === "result" && aiResults && (
        <ResultScreen 
          answers={answers} 
          aiResults={aiResults} 
          onRestart={handleRestart} 
          onViewProfile={handleGoToProfile}
          onLungAnalysis={() => setCurrentScreen("lungAnalysis")}
        />
      )}
      {currentScreen === "lungAnalysis" && (
        <LungAnalysisScreen onBack={() => setCurrentScreen("result")} />
      )}
      {currentScreen === "profile" && (
        <ProfileScreen 
          answers={answers} 
          aiResults={aiResults as any} 
          onBack={() => aiResults ? setCurrentScreen("result") : setCurrentScreen("onboarding")} 
        />
      )}

      <div className="fixed bottom-24 right-6 z-50 flex flex-col gap-3">
        {currentScreen !== "onboarding" && currentScreen !== "assessment" && (
           <>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowVoiceAI(true)}
              className="w-16 h-16 bg-blue-600 rounded-full shadow-2xl flex items-center justify-center text-white border-4 border-blue-100"
            >
              <MessageCircle className="w-6 h-6" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleGoToProfile}
              className="w-16 h-16 bg-white rounded-full shadow-2xl flex items-center justify-center text-blue-600 border-4 border-blue-50"
            >
              <User className="w-6 h-6" />
            </motion.button>
          </>
        )}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowSOS(true)}
          className="w-16 h-16 bg-red-600 rounded-full shadow-2xl flex items-center justify-center text-white border-4 border-white"
        >
          <span className="font-black text-xs">SOS</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {showVoiceAI && (
          <VoiceAssistant 
            isOpen={showVoiceAI} 
            onClose={() => setShowVoiceAI(false)} 
            initialAnswers={answers}
            aiResults={aiResults}
          />
        )}
        {showSOS && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-red-900/90 backdrop-blur-md z-[60] flex items-center justify-center p-6"
          >
            <div className="max-w-sm w-full bg-white rounded-3xl p-8 text-center relative shadow-2xl">
              <button
                onClick={() => setShowSOS(false)}
                className="absolute top-4 right-4 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>

              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <PhoneCall className="w-10 h-10 text-red-600" />
              </div>

              <h2 className="text-2xl font-black text-gray-900 mb-2">ЯАРАЛТАЙ ТУСЛАМЖ</h2>
              <p className="text-gray-600 mb-8">Та 103 руу залгахдаа итгэлтэй байна уу?</p>

              <div className="space-y-3">
                <a
                  href="tel:103"
                  className="w-full flex items-center justify-center gap-3 bg-red-600 text-white py-5 rounded-2xl font-black text-xl shadow-lg"
                >
                  <PhoneCall className="w-6 h-6" />
                  103 ЗАЛГАХ
                </a>
                <button
                  onClick={() => setShowSOS(false)}
                  className="w-full py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-50"
                >
                  Буцах
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
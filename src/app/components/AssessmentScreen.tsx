import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as Progress from "@radix-ui/react-progress";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { ChevronRight, ChevronLeft, User, Ruler, Weight, Activity, Thermometer, Calendar, Wind, Wine, Beaker, Users, AlertCircle, Phone, Mic, MicOff, Trash2, Volume2 } from "lucide-react";
import { HumanBodyModel } from "./HumanBodyModel";
import { Slider } from "./ui/slider";
import { startSpeechToText } from "../utils/voiceUtils";

interface Question {
  id: string;
  text: string;
  type: "radio" | "slider" | "body-map" | "voice";
  icon?: any;
  options?: { value: string; label: string; score: number }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  defaultValue?: number;
}

const questions: Question[] = [
  {
    id: "age",
    text: "Таны нас хэд вэ?",
    type: "slider",
    icon: Calendar,
    min: 15,
    max: 100,
    step: 1,
    unit: "нас",
    defaultValue: 25,
  },
  {
    id: "gender",
    text: "Таны хүйс?",
    type: "radio",
    icon: User,
    options: [
      { value: "male", label: "Эрэгтэй", score: 0 },
      { value: "female", label: "Эмэгтэй", score: 0 },
    ],
  },
  {
    id: "height",
    text: "Таны өндөр?",
    type: "slider",
    icon: Ruler,
    min: 100,
    max: 220,
    step: 1,
    unit: "см",
    defaultValue: 170,
  },
  {
    id: "weight",
    text: "Таны жин?",
    type: "slider",
    icon: Weight,
    min: 30,
    max: 200,
    step: 1,
    unit: "кг",
    defaultValue: 65,
  },
  {
    id: "bp_systolic",
    text: "Цусны даралт (Систол)?",
    type: "slider",
    icon: Activity,
    min: 80,
    max: 200,
    step: 1,
    unit: "mmHg",
    defaultValue: 120,
  },
  {
    id: "smoking",
    text: "Та тамхи татдаг уу?",
    type: "radio",
    icon: AlertCircle,
    options: [
      { value: "never", label: "Хэзээ ч татаагүй", score: 0 },
      { value: "former", label: "Өмнө нь татаж байсан", score: 1 },
      { value: "current", label: "Одоо тогтмол татдаг", score: 3 },
    ],
  },
  {
    id: "alcohol_freq",
    text: "Архи, согтууруулах ундааны хэрэглээ?",
    type: "radio",
    icon: Wine,
    options: [
      { value: "never", label: "Хэрэглэдэггүй", score: 0 },
      { value: "seldom", label: "Заримдаа", score: 1 },
      { value: "often", label: "Тогтмол", score: 2 },
      { value: "daily", label: "Өдөр бүр", score: 4 },
    ],
  },
  {
    id: "salt_intake",
    text: "Таны өдөр тутмын давсны хэрэглээ? (1-10)",
    type: "slider",
    icon: Beaker,
    min: 1,
    max: 10,
    step: 1,
    unit: "оноо",
    defaultValue: 5,
  },
  {
    id: "air_pollution",
    text: "Агаарын бохирдолд хэр их өртдөг вэ? (1-10)",
    type: "slider",
    icon: Wind,
    min: 1,
    max: 10,
    step: 1,
    unit: "оноо",
    defaultValue: 5,
  },
  {
    id: "genetic_risk",
    text: "Гэр бүлийн түүхэнд хавдар, чихрийн шижин байсан уу?",
    type: "radio",
    icon: Users,
    options: [
      { value: "yes", label: "Тийм (Гэр бүлийн түүхтэй)", score: 5 },
      { value: "no", label: "Үгүй", score: 0 },
    ],
  },
  {
    id: "specific_symptoms",
    text: "Танд дараах өвөрмөц шинжүүд бий юу?",
    type: "radio",
    icon: AlertCircle,
    options: [
      { value: "coughing_blood", label: "Цусаар ханиалгах", score: 8 },
      { value: "swallow_diff", label: "Юм залгихад хүндрэлтэй", score: 6 },
      { value: "chest_pain", label: "Цээжээр байнга өвдөх", score: 5 },
      { value: "none", label: "Аль нь ч биш", score: 0 },
    ],
  },
  {
    id: "other_symptoms",
    text: "Танд илэрч буй бусад зовиур, шинж тэмдэг бий юу? (Энд бичих эсвэл яриагаар хэлж болно)",
    type: "voice",
    icon: Mic,
  },
  {
    id: "symptoms",
    text: "Бие махбодоос өвдөж байгаа хэсгүүдээ сонгоно уу",
    type: "body-map",
  },
];

interface AssessmentScreenProps {
  onComplete: (answers: Record<string, string>) => void;
}

export function AssessmentScreen({ onComplete }: AssessmentScreenProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [particleTrail, setParticleTrail] = useState<Array<{id: string, x: number, y: number}>>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState("");
  const [recognitionSession, setRecognitionSession] = useState<{ stop: () => void } | null>(null);

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];
  const isSymptomQuestion = currentQ.type === "body-map";
  const isSliderQuestion = currentQ.type === "slider";
  const isRadioQuestion = currentQ.type === "radio";
  const hasAnswer = isSymptomQuestion 
    ? selectedBodyParts.length > 0 
    : !!answers[currentQ.id] || isSliderQuestion || currentQ.type === "voice";

  const stopActiveRecording = () => {
    if (recognitionSession) {
      recognitionSession.stop();
      setRecognitionSession(null);
    }
    setIsRecording(false);
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopActiveRecording();
    } else {
      setRecordingError("");
      try {
        const session = startSpeechToText(
          (transcript) => {
            setAnswers(prev => ({ ...prev, [currentQ.id]: transcript }));
          },
          () => {
            setIsRecording(true);
          },
          () => {
            setIsRecording(false);
          },
          (err) => {
            setRecordingError(err);
            setIsRecording(false);
          }
        );
        setRecognitionSession(session);
      } catch (e) {
        console.error("Recording init failed", e);
        setRecordingError("Микрофон ажиллуулахад алдаа гарлаа.");
      }
    }
  };

  const handleNext = () => {
    if (isSubmitting) return;
    stopActiveRecording();

    let finalAnswers = { ...answers };
    if (isSymptomQuestion) {
      finalAnswers.symptoms = selectedBodyParts.join(",");
    } else if (isSliderQuestion && !answers[currentQ.id]) {
      finalAnswers[currentQ.id] = String(currentQ.defaultValue);
    }

    if (currentQuestion < questions.length - 1) {
      setAnswers(finalAnswers);
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setIsSubmitting(true);
      onComplete(finalAnswers);
    }
  };

  const handleBack = () => {
    stopActiveRecording();
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleBodyPartSelect = (partId: string) => {
    setSelectedBodyParts((prev) =>
      prev.includes(partId) ? prev.filter((id) => id !== partId) : [...prev, partId]
    );
  };

  const handleSliderChange = (value: number[]) => {
    setAnswers({ ...answers, [currentQ.id]: String(value[0]) });
    
    if (currentQ.id === "age") {
      const newParticle = {
        id: Date.now().toString(),
        x: Math.random() * 100,
        y: Math.random() * 100
      };
      setParticleTrail(prev => [...prev, newParticle].slice(-5));
    }
  };

  const handleRadioChange = (value: string) => {
    setAnswers({ ...answers, [currentQ.id]: value });
    
    if (currentQ.id === "gender" && currentQuestion < questions.length - 1) {
      setTimeout(() => {
        handleNext();
      }, 400);
    }
  };

  const QuestionIcon = currentQ.icon || User;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E3F2FD] via-[#E3F2FD] to-[#F5F5F5] flex flex-col relative overflow-hidden">
      <style>{`
        @keyframes particleFloat {
          0% {
            opacity: 1;
            transform: translateY(0) translateX(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-40px) translateX(var(--tx)) scale(0);
          }
        }
        
        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
        
        .particle {
          animation: particleFloat 0.8s ease-out forwards;
        }
        
        .ripple-effect::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%);
          border-radius: 50%;
          transform: translate(-50%, -50%) scale(0);
          animation: ripple 0.6s ease-out;
        }
        
      `}</style>

      <div className="bg-white shadow-sm px-6 py-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={handleBack}
            disabled={currentQuestion === 0}
            className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-900">
                {currentQuestion + 1} / {questions.length}
              </span>
              <span className="text-sm font-semibold text-blue-600">{Math.round(progress)}%</span>
            </div>
            <Progress.Root className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <Progress.Indicator
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </Progress.Root>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-6 overflow-auto">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="max-w-md mx-auto"
        >
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-start gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <QuestionIcon className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 flex-1 pt-1">{currentQ.text}</h2>
            </div>

            {currentQ.type === "body-map" ? (
              <HumanBodyModel selectedParts={selectedBodyParts} onPartSelect={handleBodyPartSelect} />
            ) : currentQ.type === "slider" ? (
              <div className="space-y-8 py-4">
                <div className="text-center">
                  <span className="text-5xl font-black text-blue-600">
                    {answers[currentQ.id] || currentQ.defaultValue}
                  </span>
                  <span className="text-lg font-semibold text-gray-500 ml-2">{currentQ.unit}</span>
                </div>

                <div className="relative h-12 flex items-center">
                  {particleTrail.map((particle) => (
                    <motion.div
                      key={particle.id}
                      className="particle absolute w-2 h-2 bg-blue-400 rounded-full pointer-events-none"
                      style={{
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        '--tx': `${(Math.random() - 0.5) * 50}px`
                      } as any}
                      initial={{ opacity: 1, scale: 1 }}
                      animate={{ opacity: 0, scale: 0, y: -40 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  ))}
                  
                  <Slider
                    defaultValue={[currentQ.defaultValue || 0]}
                    max={currentQ.max}
                    min={currentQ.min}
                    step={currentQ.step}
                    onValueChange={handleSliderChange}
                    className="w-full py-4"
                  />
                </div>
                
                <div className="flex justify-between text-xs font-bold text-gray-400 px-1">
                  <span>{currentQ.min} {currentQ.unit}</span>
                  <span>{currentQ.max} {currentQ.unit}</span>
                </div>
              </div>
            ) : currentQ.type === "voice" ? (
              <div className="space-y-6 py-4 flex flex-col items-center">
                <div className="w-full relative">
                  <textarea
                    value={answers[currentQ.id] || ""}
                    onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
                    placeholder="Энд бичих эсвэл доорх микрофон дээр дарж яриарай..."
                    className="w-full h-32 p-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm text-gray-800 placeholder-gray-400 bg-gray-50 resize-none font-medium transition-all"
                  />
                  {(answers[currentQ.id]) && (
                    <button
                      onClick={() => setAnswers({ ...answers, [currentQ.id]: "" })}
                      className="absolute bottom-3 right-3 p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors active:scale-95"
                      title="Арилгах"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {recordingError && (
                  <div className="text-xs font-bold text-red-500 flex items-center gap-1 bg-red-50 px-3 py-2 rounded-lg w-full">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{recordingError}</span>
                  </div>
                )}

                <div className="flex flex-col items-center gap-3">
                   <div className="relative flex items-center justify-center">
                     {isRecording && (
                       <>
                         <div className="absolute w-28 h-28 bg-red-400/20 rounded-full animate-ping pointer-events-none" />
                         <div className="absolute w-24 h-24 bg-red-400/30 rounded-full animate-pulse pointer-events-none" />
                       </>
                     )}
                     
                     <motion.button
                       type="button"
                       onClick={handleToggleRecording}
                       whileHover={{ scale: 1.05 }}
                       whileTap={{ scale: 0.95 }}
                       className={`w-20 h-20 rounded-full shadow-lg flex items-center justify-center text-white transition-all cursor-pointer relative z-10 ${
                         isRecording 
                           ? "bg-gradient-to-br from-red-500 to-rose-600 shadow-red-200" 
                           : "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-200"
                       }`}
                     >
                       {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                     </motion.button>
                   </div>

                   <span className={`text-xs font-bold ${isRecording ? "text-red-500 animate-pulse" : "text-gray-400"}`}>
                     {isRecording ? "Яриаг сонсож байна... (Дарж зогсооно уу)" : "Микрофон дээр дарж ярьж эхэлнэ үү"}
                   </span>
                </div>

                {isRecording && (
                  <div className="flex items-center gap-1 justify-center h-6">
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 bg-red-500 rounded-full"
                        animate={{ height: [8, 24, 8] }}
                        transition={{
                          duration: 0.5 + i * 0.1,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <RadioGroup.Root
                value={answers[currentQ.id] || ""}
                onValueChange={handleRadioChange}
                className="space-y-3"
              >
                <AnimatePresence>
                  {currentQ.options?.map((option, index) => (
                    <motion.div
                      key={option.value}
                      initial={{ opacity: 0, y: 10, x: -20 }}
                      animate={{ opacity: 1, y: 0, x: 0 }}
                      transition={{ delay: index * 0.06, type: "spring", stiffness: 100 }}
                      className="radio-option relative"
                    >
                      <RadioGroup.Item
                        value={option.value}
                        className="flex items-center space-x-3 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-50 active:scale-98 ripple-effect relative overflow-hidden group"
                      >
                        <motion.div 
                          className="w-5 h-5 border-2 border-gray-300 rounded-full flex items-center justify-center data-[state=checked]:border-blue-600 flex-shrink-0"
                          whileTap={{ scale: 1.2 }}
                        >
                          <RadioGroup.Indicator className="w-3 h-3 bg-blue-600 rounded-full" />
                        </motion.div>
                        <label className="flex-1 text-gray-900 font-medium cursor-pointer text-sm">
                          {option.label}
                        </label>
                      </RadioGroup.Item>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </RadioGroup.Root>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div 
        className="bg-white/80 backdrop-blur-sm px-6 py-6 shadow-lg border-t border-gray-100"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <motion.button
          onClick={handleNext}
          disabled={!hasAnswer || isSubmitting}
          animate={{
            backgroundColor: hasAnswer && !isSubmitting ? "#3B82F6" : "#D1D5DB",
            boxShadow: hasAnswer && !isSubmitting ? "0 10px 25px rgba(59, 130, 246, 0.3)" : "0 5px 10px rgba(0, 0, 0, 0.05)"
          }}
          whileHover={hasAnswer && !isSubmitting ? { scale: 1.02 } : {}}
          whileTap={hasAnswer && !isSubmitting ? { scale: 0.98 } : {}}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-white transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
             <div className="flex items-center gap-2">
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
               Түр хүлээнэ үү...
             </div>
          ) : (
            <>
              {currentQuestion < questions.length - 1 ? "Дараах асуулт" : "Дуусгах"}
              <motion.div
                animate={{ x: hasAnswer ? 4 : 0 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <ChevronRight className="w-5 h-5" />
              </motion.div>
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
}

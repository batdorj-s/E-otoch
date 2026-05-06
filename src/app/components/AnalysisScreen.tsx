import { useEffect } from "react";
import { motion } from "motion/react";
import { Activity, Cpu, Database } from "lucide-react";

interface AnalysisScreenProps {
  onComplete: () => void;
}

export function AnalysisScreen({ onComplete }: AnalysisScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-[#E3F2FD] flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 text-center flex flex-col items-center justify-center min-h-[600px]"
        >
          {/* Animated Icon */}
          <div className="relative mb-8 flex-shrink-0">
            <motion.div
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
              className="w-24 h-24 mx-auto"
            >
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl opacity-20"></div>
                <div className="absolute inset-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Cpu className="w-10 h-10 text-white" />
                </div>
              </div>
            </motion.div>

            {/* Pulse rings */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 2],
                  opacity: [0.5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.6,
                }}
                className="absolute inset-0 border-4 border-blue-400 rounded-2xl"
                style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
              />
            ))}
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-gray-900 mb-2"
          >
            AI шинжилгээ хийж байна
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-600 mb-8 text-sm"
          >
            Таны эрүүл мэндийн өгөгдлийг боловсруулж байна
          </motion.p>

          {/* Progress steps */}
          <div className="space-y-3 mb-6">
            {[
              { icon: Database, text: "Kaggle эмнэлгийн өгөгдлийг ачаалж байна", delay: 0 },
              { icon: Cpu, text: "STEPS-2013 статистиктай харьцуулж байна", delay: 0.8 },
              { icon: Activity, text: "Давс болон BMI-ийн коэффициентийг бодож байна", delay: 1.6 },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: step.delay }}
                className="flex items-center gap-3 bg-blue-50 rounded-xl p-3"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <step.icon className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm text-gray-700 flex-1 text-left">{step.text}</span>
                <div className="flex gap-1">
                  {[0, 1, 2].map((dot) => (
                    <motion.div
                      key={dot}
                      animate={{
                        opacity: [0.3, 1, 0.3],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: dot * 0.2,
                      }}
                      className="w-1.5 h-1.5 bg-blue-600 rounded-full"
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

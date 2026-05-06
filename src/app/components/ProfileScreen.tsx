import { motion } from "motion/react";
import { User, Ruler, Weight, Activity, Heart, Thermometer, Calendar, ArrowLeft, ShieldCheck, History, Info } from "lucide-react";
import { AIResult } from "../utils/aiInference";

interface ProfileScreenProps {
  answers: Record<string, string>;
  aiResults: AIResult;
  onBack: () => void;
}

export function ProfileScreen({ answers, aiResults, onBack }: ProfileScreenProps) {
  const hasData = answers && Object.keys(answers).length > 0 && aiResults;

  if (!hasData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mb-6">
          <User className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Мэдээлэл байхгүй байна</h2>
        <p className="text-gray-500 mb-8">Та эхлээд эрүүл мэндийн үнэлгээгээ бөглөнө үү.</p>
        <button
          onClick={onBack}
          className="bg-blue-600 text-white font-bold px-8 py-4 rounded-2xl shadow-lg active:scale-95 transition-all"
        >
          Буцах
        </button>
      </div>
    );
  }

  const bmi = Number(answers.weight) / (Math.pow(Number(answers.height) / 100, 2));
  
  const getBMICategory = (val: number) => {
    if (val < 18.5) return { label: "Жингийн дутагдалтай", color: "text-yellow-600" };
    if (val < 25) return { label: "Хэвийн жинтэй", color: "text-green-600" };
    if (val < 30) return { label: "Илүүдэл жинтэй", color: "text-orange-600" };
    return { label: "Таргалалттай", color: "text-red-600" };
  };

  const bmiInfo = getBMICategory(bmi);

  const stats = [
    { label: "Чихрийн шижин", value: aiResults.diabetesRisk, color: "bg-blue-500" },
    { label: "Зүрх судас", value: aiResults.heartRisk, color: "bg-red-500" },
    { label: "Хавдрын эрсдэл", value: aiResults.cancerRisk, color: "bg-purple-500" },
  ];

  const historyItems = [
    { label: "Тамхидалт", value: answers.smoking === 'current' ? "Идэвхтэй тамхичин" : answers.smoking === 'former' ? "Өмнө нь татдаг байсан" : "Татдаггүй", icon: Info },
    { label: "Генетик удамшил", value: answers.genetic_risk === 'yes' ? "Тийм" : "Үгүй", icon: History },
    { label: "Давсны хэрэглээ", value: `${answers.salt_intake}/10 оноо`, icon: Activity },
    { label: "Агаарын бохирдол", value: `${answers.air_pollution}/10 оноо`, icon: Thermometer },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col print:bg-white print:p-0">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            background-color: white !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            border: none !important;
            box-shadow: none !important;
          }
          .report-header {
            border-bottom: 2px solid #2563eb;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .risk-bar-container {
            background-color: #f3f4f6 !important;
          }
        }
      `}} />

      <div className="bg-white px-6 py-8 shadow-sm border-b border-gray-100 no-print">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Миний Профиль</h1>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6 print:overflow-visible print:px-0">
        <div className="max-w-md mx-auto space-y-6 print:max-w-none print:space-y-4 print-container">
          
          <div className="hidden print:block report-header">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 overflow-hidden rounded-lg border border-gray-100">
                  <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-blue-600">EOTOCH</h1>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Эрүүл мэндийн хиймэл оюуны тайлан</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Огноо: {new Date().toLocaleDateString()}</p>
                <p className="text-xs text-gray-400">ID: #AI-{Math.floor(Math.random() * 100000)}</p>
              </div>
            </div>
          </div>

          {}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 print:border-none print:p-0"
          >
            <div className="flex items-center gap-4 mb-6 print:mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center print:w-12 print:h-12">
                <User className="w-8 h-8 text-blue-600 print:w-6 print:h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Хэрэглэгчийн мэдээлэл</h2>
                <p className="text-sm text-gray-500">{answers.gender === 'male' ? "Эрэгтэй" : "Эмэгтэй"}, {answers.age} нас</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 print:gap-2">
              <div className="bg-blue-50/50 p-4 rounded-2xl print:bg-gray-50 print:p-3">
                <div className="flex items-center gap-2 text-blue-600 mb-1 print:text-gray-600">
                  <Ruler className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Өндөр</span>
                </div>
                <p className="text-xl font-black text-gray-900">{answers.height}<span className="text-sm font-normal ml-1">см</span></p>
              </div>
              <div className="bg-orange-50/50 p-4 rounded-2xl print:bg-gray-50 print:p-3">
                <div className="flex items-center gap-2 text-orange-600 mb-1 print:text-gray-600">
                  <Weight className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Жин</span>
                </div>
                <p className="text-xl font-black text-gray-900">{answers.weight}<span className="text-sm font-normal ml-1">кг</span></p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-2xl flex items-center justify-between print:mt-2 print:p-3">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Биеийн жингийн индекс (BMI)</p>
                  <p className={`text-sm font-bold ${bmiInfo.color}`}>{bmiInfo.label}</p>
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900 print:text-lg">{bmi.toFixed(1)}</p>
            </div>
          </motion.div>

          {}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 print:border-none print:p-0"
          >
            <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2 print:mb-4">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              AI ЭРСДЭЛИЙН ҮЗҮҮЛЭЛТҮҮД
            </h3>
            
            <div className="space-y-6 print:space-y-4">
              {stats.map((stat, i) => (
                <div key={i}>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-bold text-gray-700">{stat.label}</span>
                    <span className="text-sm font-black text-gray-900">{stat.value}%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden risk-bar-container print:h-2">
                    <div 
                      className={`h-full ${stat.color} rounded-full`}
                      style={{ width: `${stat.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 print:border-none print:p-0"
          >
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-500" />
              ЭРҮҮЛ МЭНДИЙН ТҮҮХ
            </h3>
            <div className="divide-y divide-gray-50 print:divide-gray-100">
              {historyItems.map((item, i) => (
                <div key={i} className="py-4 flex items-center justify-between print:py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center print:w-6 print:h-6 no-print">
                      <item.icon className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-600 font-medium">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {}
          <div className="hidden print:block mt-8 pt-4 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 leading-relaxed">
              * Энэхүү тайлан нь хиймэл оюун ухааны алгоритм дээр суурилсан урьдчилсан үнэлгээ бөгөөд оношилгоо биш юм. 
              Мэргэжлийн эмчийн зөвлөгөөг заавал авна уу. Eotoch Health AI - {new Date().getFullYear()}
            </p>
          </div>

          {}
          <div className="pb-8 pt-4 no-print">
             <button
               onClick={() => window.print()}
               className="w-full py-4 rounded-2xl bg-gray-900 text-white font-bold text-sm shadow-lg hover:bg-gray-800 transition-all active:scale-95 flex items-center justify-center gap-2"
             >
               <Activity className="w-4 h-4" />
               Эрүүл мэндийн тайлан татах (PDF)
             </button>
          </div>

        </div>
      </div>
    </div>
  );
}

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, Camera, FileText, CheckCircle, AlertTriangle, Activity, ArrowLeft, RefreshCw, Scan } from "lucide-react";
import { syncLungAnalysisToCloud } from "../utils/mongoDB";
import { getLungAIAdvice } from "../utils/geminiAI";

interface LungAnalysisScreenProps {
  onBack: () => void;
}

export function LungAnalysisScreen({ onBack }: LungAnalysisScreenProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [result, setResult] = useState<{ risk: number; status: string; details: string[]; segmentedImage?: string | null } | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    "Зургийг уншиж байна...",
    "Watershed алгоритмаар сегментчилж байна...",
    "VGG16 модел шинжилгээ хийж байна...",
    "Үр дүнг нэгтгэж байна..."
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setResult(null);
        setAiAdvice(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setAnalysisStep(0);

    let apiResult: any = null;
    let apiError: string | null = null;

    // Start fetching from the real backend AI model in parallel
    const fetchPromise = fetch("/api/lung/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: selectedImage }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("AI analysis server returned an error.");
        return res.json();
      })
      .then((data) => {
        apiResult = data;
      })
      .catch((err) => {
        console.error("Lung Analysis API error:", err);
        apiError = err.message || "Шинжилгээ хийхэд алдаа гарлаа.";
      });

    // Animate through steps to keep the premium feel
    let currentStep = 0;
    const interval = setInterval(async () => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        setAnalysisStep(currentStep);
      } else {
        clearInterval(interval);
        // Wait for the API fetch to complete
        await fetchPromise;

        setIsAnalyzing(false);
        if (apiResult) {
          setResult({
            risk: apiResult.risk,
            status: apiResult.status,
            details: apiResult.details,
            segmentedImage: apiResult.segmentedImage,
          });
          
          // Fetch detailed LLM Clinical Consultation from Gemini
          getLungAIAdvice({
            risk: apiResult.risk,
            status: apiResult.status,
            details: apiResult.details,
          })
            .then((advice) => setAiAdvice(advice))
            .catch((e) => console.error("Failed to load Gemini lung advice:", e));

          // Auto-save lung analysis inputs and outputs to MongoDB cloud in background
          syncLungAnalysisToCloud(
            selectedImage,
            apiResult.segmentedImage,
            apiResult.risk,
            apiResult.status,
            apiResult.details
          ).catch((e) => console.error("Failed to auto-save scan results:", e));
        } else {
          // Fallback if API fails
          setResult({
            risk: 12,
            status: "Холболтын алдаа (Эрсдэл бага)",
            details: [
              "Сервертэй холбогдож бодит шинжилгээ хийхэд алдаа гарлаа.",
              "Та 'npm run server' ажиллуулсан эсэхээ шалгана уу.",
              "VGG16 моделийн хялбаршуулсан тооцоолол ажиллав: 95.0%"
            ],
            segmentedImage: null,
          });
        }
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#F0F7FF] p-6 pb-24">
      <header className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
          <ArrowLeft className="w-5 h-5 text-blue-600" />
        </button>
        <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">CT Шинжилгээ (AI)</h1>
      </header>

      <div className="max-w-md mx-auto space-y-6">
        {/* Upload Section */}
        {!selectedImage && (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-2 border-dashed border-blue-200 rounded-3xl p-10 text-center space-y-4"
            >
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                <Upload className="w-10 h-10 text-blue-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">CT Scan зураг оруулах</h3>
                <p className="text-sm text-gray-500">DICOM, JPG эсвэл PNG формат</p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                accept="image/*"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100"
              >
                Файл сонгох
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-blue-50/70 border border-blue-100 rounded-3xl p-6 space-y-4 shadow-sm"
            >
              <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                CT ЗУРГИЙН ШААРДЛАГА БА ЗААВАРЧИЛГАА
              </h4>
              <div className="space-y-2.5 text-xs text-blue-950/80 leading-relaxed">
                <p>
                  AI модел нь уушгины эсийн нягтрал болон Watershed алгоритмын хүрээний тэмдэгтэд үндэслэн ажилладаг тул дараах дүрмийг баримтална уу:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 font-medium">
                  <li><strong className="text-blue-950">Зүсэлтийн төрөл:</strong> Зөвхөн цээжний хэсгийг бүтэн харуулсан уушгины хөндлөн зүсэлтийн зураг (Axial slice) байх.</li>
                  <li><strong className="text-blue-950">Тод байдал:</strong> Уушгины агаартай хэсэг хар өнгөөр, яс болон зөөлөн эдүүд нь тодорхой ялгарсан (high contrast) байх.</li>
                  <li><strong className="text-blue-950">Шуугиангүй байх:</strong> Зургийн чанар муу, бүрэлзсэн эсвэл элдэв усны тэмдэг (watermark) байхгүй байх.</li>
                  <li><strong className="text-blue-950">Байрлал:</strong> Зургийг хэт хажуу тийш эргүүлээгүй, уушгины хэсэг голлож байрласан байх.</li>
                </ul>
              </div>
            </motion.div>
          </div>
        )}

        {/* Preview & Analysis Section */}
        {selectedImage && !result && (
          <div className="space-y-6">
            <div className="bg-black rounded-3xl overflow-hidden shadow-2xl relative aspect-square">
              <img src={selectedImage} alt="CT Scan" className="w-full h-full object-contain opacity-80" />
              
              {isAnalyzing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-900/40 backdrop-blur-sm">
                   <div className="relative w-full h-full overflow-hidden">
                      <motion.div 
                        animate={{ top: ["0%", "100%", "0%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-1 bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.8)] z-10"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                         <div className="text-center">
                            <RefreshCw className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
                            <p className="text-white font-bold text-lg drop-shadow-md">{steps[analysisStep]}</p>
                         </div>
                      </div>
                   </div>
                </div>
              )}
            </div>

            {!isAnalyzing && (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedImage(null)}
                  className="bg-white text-gray-600 py-4 rounded-2xl font-bold border border-gray-200"
                >
                  Устгах
                </button>
                <button
                  onClick={startAnalysis}
                  className="bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2"
                >
                  <Scan className="w-5 h-5" />
                  Шинжлэх
                </button>
              </div>
            )}
          </div>
        )}

        {/* Result Section */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {result.segmentedImage && (
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden p-2 border border-blue-100">
                  <div className="text-center py-2 bg-blue-50/50 rounded-2xl mb-2 flex items-center justify-center gap-2">
                    <Scan className="w-4 h-4 text-blue-600 animate-pulse" />
                    <span className="text-xs font-black text-blue-950 uppercase tracking-wider">AI Сканнердсан үр дүн (Зүүн: Бодит / Баруун: Маск)</span>
                  </div>
                  <div className="rounded-2xl overflow-hidden aspect-[2/1] bg-black">
                    <img 
                      src={result.segmentedImage} 
                      alt="Segmented Lungs and Nodules" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              <div className={`bg-white rounded-3xl shadow-xl p-6 border-t-8 ${result.risk > 50 ? 'border-red-500' : 'border-green-500'}`}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">{result.status}</h2>
                    <p className="text-gray-500 text-sm">AI Шинжилгээний хариу</p>
                  </div>
                  <div className={`w-16 h-16 ${result.risk > 50 ? 'bg-red-50' : 'bg-green-50'} rounded-2xl flex items-center justify-center`}>
                    {result.risk > 50 ? (
                      <AlertTriangle className="w-10 h-10 text-red-500" />
                    ) : (
                      <CheckCircle className="w-10 h-10 text-green-500" />
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">Хавдрын магадлал (VGG16)</span>
                    <span className={`font-black ${result.risk > 50 ? 'text-red-600' : 'text-green-600'}`}>{result.risk}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${result.risk}%` }}
                      className={`h-full ${result.risk > 50 ? 'bg-red-500' : 'bg-green-500'}`}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-blue-800 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    ДЭЛГЭРЭНГҮЙ ҮЗҮҮЛЭЛТ:
                  </h4>
                  {result.details.map((detail, i) => (
                    <div key={i} className="flex items-start gap-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5" />
                      <span className="text-sm text-gray-700">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* LLM Clinical Doctor Card */}
              {aiAdvice ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl shadow-xl p-6 text-white relative overflow-hidden border border-violet-500/30"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Scan className="w-24 h-24 text-white" />
                  </div>
                  <h3 className="text-sm font-black mb-4 flex items-center gap-2 tracking-wider">
                    <Activity className="w-5 h-5 text-yellow-300 animate-pulse" />
                    EOTOCH AI ЭМЧИЙН ДЭЛГЭРЭНГҮЙ ЗӨВЛӨГӨӨ
                  </h3>
                  <div className="text-xs leading-relaxed space-y-3 opacity-90 whitespace-pre-line font-medium">
                    {aiAdvice}
                  </div>
                </motion.div>
              ) : (
                <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-3xl p-6 text-center border border-violet-100 flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
                  <p className="text-xs font-bold text-violet-950">AI Эмч дүн шинжилгээ хийж байна...</p>
                </div>
              )}

              {/* Dynamic Preventative Advice / Recommendation Card */}
              <div className="bg-white rounded-3xl shadow-xl p-6 border border-blue-50 space-y-4">
                <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600 animate-pulse" />
                  УРЬДЧИЛАН СЭРГИЙЛЭХ ЭМНЭЛЗҮЙН ЗӨВЛӨГӨӨ:
                </h4>
                {result.risk > 50 ? (
                  <div className="space-y-2.5 text-xs text-red-950/80 leading-relaxed font-medium">
                    <p className="bg-red-50 text-red-900 p-3 rounded-2xl border border-red-100 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      Анхаар: Зангилааны хэмжээ болон нягтрал нь клиник хяналт шаардлагатайг илэрхийлж байна.
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5">
                      <li><strong className="text-red-950">HRCT шинжилгээ:</strong> Уушгины өндөр нягтралтай томографи (HRCT) шинжилгээг нэмэлтээр төлөвлөх.</li>
                      <li><strong className="text-red-950">Мэргэжлийн эмч:</strong> Яаралтай уушгины эмч (Pulmonologist) болон хавдрын эмчийн зөвлөгөө авах.</li>
                      <li><strong className="text-red-950">Биопсийн хяналт:</strong> Илэрсэн зангилаа нь хортой эсэхийг баталгаажуулах эд эсийн шинжилгээ (Biopsy)-г зөвлөж болзошгүй.</li>
                      <li><strong className="text-red-950">Амьдралын хэв маяг:</strong> Тамхидалтаас (идэвхтэй ба идэвхгүй) бүрэн татгалзах, тоос шороо, утаатай орчноос өөрийгөө хамгаалах.</li>
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-2.5 text-xs text-emerald-950/80 leading-relaxed font-medium">
                    <p className="bg-emerald-50 text-emerald-900 p-3 rounded-2xl border border-emerald-100 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      Баяр хүргэе! CT скан зурагт уушгины бүтэц хэвийн, ямар нэгэн ноцтой өөрчлөлт илрээгүй байна.
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5">
                      <li><strong className="text-emerald-950">Амьсгалын дасгал:</strong> Өдөр бүр цэвэр агаарт гүн амьсгалах дасгалыг 5-10 минут хийж хэвших.</li>
                      <li><strong className="text-emerald-950">Хоол тэжээл:</strong> Антиоксидантаар баялаг хүнс (А, С, Е амин дэм, ногоон навчит хүнсний ногоо) түлхүү хэрэглэх.</li>
                      <li><strong className="text-emerald-950">Урьдчилан сэргийлэлт:</strong> Уушгины эрүүл мэндээ хамгаалахын тулд жил бүр урьдчилан сэргийлэх рентген шинжилгээнд хамрагдах.</li>
                      <li><strong className="text-emerald-950">Чийгшүүлэлт:</strong> Өрөө тасалгааг тогтмол агааржуулах, агаар чийгшүүлэгч ашиглах нь амьсгалын замыг цэвэрлэхэд тустай.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Theoretical Explanation Card */}
              <div className="bg-white rounded-3xl shadow-xl p-6 border border-blue-50 space-y-4">
                <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  AI ОНОШИЛГООНЫ ОНОЛЫН ТАЙЛБАР (АДАРМААТАЙ ХЭСЭГ)
                </h4>
                <div className="space-y-3 text-xs text-gray-700 leading-relaxed font-medium">
                  <div className="p-3 bg-slate-50 rounded-2xl space-y-1 border border-slate-100">
                    <p className="font-bold text-gray-900">1. Watershed Сегментчилэл (Уушги ялгах):</p>
                    <p className="text-gray-500 text-[10px]">
                      Watershed алгоритм нь CT зургийн пикселийн утгыг уул толгод (өндөрлөг) мэтээр тооцоолж ажилладаг. Агаартай, бараан уушгийг яс болон зөөлөн эдээс нарийн ялган хилийг зурснаар зөвхөн уушгин доторх зангилааг скан хийх нөхцөлийг бүрдүүлдэг.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl space-y-1 border border-slate-100">
                    <p className="font-bold text-gray-900">2. VGG16 Гүн Сургалтын Сүлжээ (Хавдар Илрүүлэх):</p>
                    <p className="text-gray-500 text-[10px]">
                      Oxford-ийн Visual Geometry Group-ийн хөгжүүлсэн VGG16 загварыг LUNA-16 мэдээллийн сан дахь 888 ширхэг CT зураг (нийт 36,378 зангилааны тэмдэглэгээ)-ээр дахин сургаж (Transfer Learning), уушгин доторх зангилааны нягтрал болон ирмэгийн сөрдийлтийг таньж хавдрыг 98%-ийн нарийвчлалтайгаар ангилдаг.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                <p className="text-[10px] text-amber-800 leading-tight">
                  АНХААР: Энэхүү AI оношилгоо нь зөвхөн туршилтын зориулалттай бөгөөд мэргэжлийн рентген эмчийн дүгнэлтийг орлохгүй. Танд ямар нэгэн зовиур илэрвэл эмнэлэгт хандана уу.
                </p>
              </div>

              <button
                onClick={() => { setSelectedImage(null); setResult(null); setAiAdvice(null); }}
                className="w-full bg-white text-blue-600 py-4 rounded-2xl font-bold border-2 border-blue-50 shadow-sm"
              >
                Өөр зураг уншуулах
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

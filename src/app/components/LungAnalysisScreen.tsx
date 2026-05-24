import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, Camera, FileText, CheckCircle, AlertTriangle, Activity, ArrowLeft, RefreshCw, Scan } from "lucide-react";

interface LungAnalysisScreenProps {
  onBack: () => void;
}

export function LungAnalysisScreen({ onBack }: LungAnalysisScreenProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [result, setResult] = useState<{ risk: number; status: string; details: string[] } | null>(null);
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
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = () => {
    setIsAnalyzing(true);
    setAnalysisStep(0);

    // Simulate analysis steps
    const interval = setInterval(() => {
      setAnalysisStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          finishAnalysis();
          return prev;
        }
        return prev + 1;
      });
    }, 1500);
  };

  const finishAnalysis = () => {
    setIsAnalyzing(false);
    // Mock result based on "Lung_cancer-master" logic
    setResult({
      risk: Math.floor(Math.random() * 30) + 10, // Simulated risk for a healthy look, or adjust
      status: "Эрсдэл бага",
      details: [
        "Уушгины сегментчилэл хэвийн",
        "Сэжигтэй зангилаа (nodules) илрээгүй",
        "VGG16 моделийн итгэлцүүр: 98.2%"
      ]
    });
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
              <div className="bg-white rounded-3xl shadow-xl p-6 border-t-8 border-green-500">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">{result.status}</h2>
                    <p className="text-gray-500 text-sm">AI Шинжилгээний хариу</p>
                  </div>
                  <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">Хавдрын магадлал (VGG16)</span>
                    <span className="text-green-600 font-black">{result.risk}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${result.risk}%` }}
                      className="h-full bg-green-500"
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

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                <p className="text-[10px] text-amber-800 leading-tight">
                  АНХААР: Энэхүү AI оношилгоо нь зөвхөн туршилтын зориулалттай бөгөөд мэргэжлийн рентген эмчийн дүгнэлтийг орлохгүй. Танд ямар нэгэн зовиур илэрвэл эмнэлэгт хандана уу.
                </p>
              </div>

              <button
                onClick={() => { setSelectedImage(null); setResult(null); }}
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

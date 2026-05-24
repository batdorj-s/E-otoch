import { motion, AnimatePresence } from "motion/react";
import { Heart, Shield, User, Activity, Bell, Search, History, X, Ruler, Weight, MapPin, Phone, ChevronDown, Map, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import hospitalsData from "../data/hospitals.json";
import { calculateDistance } from "../utils/geoUtils";

interface OnboardingScreenProps {
  onStart: () => void;
  onViewProfile: () => void;
  onVoiceAI: () => void;
}

export function OnboardingScreen({ onStart, onViewProfile, onVoiceAI }: OnboardingScreenProps) {
  const [showBMICalc, setShowBMICalc] = useState(false);
  const [bmiData, setBMIData] = useState({ height: 170, weight: 65 });
  const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>({
    "Public": true,
    "Private": true,
  });
  const [hoveredHospital, setHoveredHospital] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [hospitalsWithDistance, setHospitalsWithDistance] = useState<Array<typeof hospitalsData[0] & { distance?: number }>>([]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          calculateDistances(latitude, longitude);
        },
        () => {
          
          const ubCenter = { lat: 47.9188, lng: 106.9176 };
          setUserLocation(ubCenter);
          calculateDistances(ubCenter.lat, ubCenter.lng);
        }
      );
    } else {
      const ubCenter = { lat: 47.9188, lng: 106.9176 };
      setUserLocation(ubCenter);
      calculateDistances(ubCenter.lat, ubCenter.lng);
    }
  }, []);

  const calculateDistances = (lat: number, lng: number) => {
    const enriched = hospitalsData.map((h) => ({
      ...h,
      distance: calculateDistance(lat, lng, h.lat, h.lng),
    }));
    setHospitalsWithDistance(enriched);
  };

  const handleNavigateToMap = (hospital: typeof hospitalsData[0]) => {
    const query = hospital.address ? `${hospital.name}, ${hospital.address}, Ulaanbaatar` : `${hospital.name}, Ulaanbaatar`;
    const encodedQuery = encodeURIComponent(query);
    window.open(`https://www.google.com/maps/search/${encodedQuery}/@${hospital.lat},${hospital.lng},15z`, "_blank");
  };

  const toggleType = (type: string) => {
    setExpandedTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const calculateBMI = () => {
    const heightInMeters = bmiData.height / 100;
    return (bmiData.weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: "Жингийн дутагдалтай", color: "text-yellow-500" };
    if (bmi < 25) return { label: "Хэвийн жинтэй", color: "text-green-500" };
    if (bmi < 30) return { label: "Илүүдэл жинтэй", color: "text-orange-500" };
    return { label: "Таргалалттай", color: "text-red-500" };
  };

  return (
    <div className="min-h-screen bg-[#E3F2FD] flex flex-col">
      <style>{`
        @keyframes sosPulseGlow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4), 0 10px 20px rgba(0, 0, 0, 0.1);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(239, 68, 68, 0.1), 0 10px 20px rgba(0, 0, 0, 0.1);
          }
        }
        
        .sos-glow {
          animation: sosPulseGlow 3s infinite;
        }
      `}</style>
      {}
      <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 overflow-hidden rounded-xl shadow-md border border-gray-50 bg-white flex items-center justify-center">
            <img src="/logo.jpg" alt="Eotoch Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Eotoch</h1>
            <p className="text-xs text-gray-500">Эрүүл мэндийн AI</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onViewProfile}
          className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"
        >
          <User className="w-5 h-5" />
        </motion.button>
      </div>

      {}
      <div className="flex-1 px-6 py-8 overflow-auto">
        <div className="max-w-md mx-auto w-full space-y-8">
          {}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-3xl blur-2xl"></div>
            <div className="relative bg-white rounded-3xl p-8 shadow-xl border border-blue-100 text-center">
              <div className="w-24 h-24 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-blue-100 rounded-3xl blur-xl opacity-50 animate-pulse"></div>
                <div className="relative w-24 h-24 overflow-hidden rounded-3xl shadow-lg border-2 border-white">
                  <img src="/logo.jpg" alt="Eotoch Logo" className="w-full h-full object-cover" />
                </div>
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-3">Eotoch</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Хиймэл оюун ухаанд суурилсан
                <br />
                эрүүл мэндийн цахим туслах
              </p>
              <button
                onClick={onStart}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all"
              >
                Үнэлгээ эхлүүлэх
              </button>
            </div>
          </motion.div>

          {}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-500" />
              ӨДРИЙН ЗӨВЛӨГӨӨ
            </h3>
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <Activity className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 mb-1">Давсны хэрэглээгээ хянах</p>
                <p className="text-xs text-gray-600 leading-relaxed">Монголчуудын давсны хэрэглээ ДЭМБ-ын зөвлөмжөөс 2 дахин их байдаг. Өнөөдөр хоолондоо бага давс хийгээрэй.</p>
              </div>
            </div>
          </div>

          {}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-500" />
              ШУУРХАЙ ХЭРЭГСЛҮҮД
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowBMICalc(true)}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center active:scale-95 transition-all"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xs font-bold text-gray-900">BMI тооцоолуур</span>
              </button>
              <button 
                onClick={onVoiceAI}
                className="bg-blue-600 p-4 rounded-2xl border border-blue-500 shadow-md flex flex-col items-center text-center active:scale-95 transition-all"
              >
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-bold text-white">Voice AI</span>
              </button>
              <button 
                onClick={onViewProfile}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center active:scale-95 transition-all col-span-2"
              >
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-3">
                  <History className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-xs font-bold text-gray-900">Шинжилгээний түүх</span>
              </button>
            </div>
          </div>

          {}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500" />
              ЭМНЭЛГҮҮДИЙН СҮЛЖЭЭ
            </h3>
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              {(() => {
                
                const grouped: Record<string, Array<typeof hospitalsData[0] & { distance?: number }>> = {
                  "Public": [],
                  "Private": [],
                };
                
                hospitalsWithDistance.forEach((hospital) => {
                  if (hospital.type === "Public") {
                    grouped["Public"].push(hospital);
                  } else {
                    grouped["Private"].push(hospital);
                  }
                });
                
                return Object.entries(grouped).map(([type, hospitals], typeIndex) => {
                  const typeLabel = type === "Public" ? "Улсын Эмнэлгүүд" : "Хувийн Эмнэлгүүд";
                  const isExpanded = expandedTypes[type];
                  
                  return (
                    <div key={type} className={typeIndex > 0 ? "border-t border-gray-100" : ""}>
                      {}
                      <motion.button
                        onClick={() => toggleType(type)}
                        className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                            type === "Public" ? "bg-blue-100" : "bg-emerald-100"
                          }`}>
                            <Heart className={`w-4 h-4 ${
                              type === "Public" ? "text-blue-600" : "text-emerald-600"
                            }`} />
                          </div>
                          <span className="text-sm font-bold text-gray-900">{typeLabel}</span>
                          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {hospitals.length}
                          </span>
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </motion.div>
                      </motion.button>

                      {}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="bg-gray-50/50"
                          >
                            {hospitals.map((hospital, hospitalIndex) => (
                              <motion.div
                                key={hospital.id}
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ 
                                  delay: hospitalIndex * 0.08,
                                  duration: 0.4,
                                  type: "spring",
                                  stiffness: 100
                                }}
                                onMouseEnter={() => setHoveredHospital(hospital.id)}
                                onMouseLeave={() => setHoveredHospital(null)}
                                onTouchStart={() => setHoveredHospital(hospital.id)}
                                onTouchEnd={() => setHoveredHospital(null)}
                                className={`px-4 py-3 flex items-start gap-3 cursor-pointer ${
                                  hospitalIndex < hospitals.length - 1 ? "border-b border-gray-100" : ""
                                }`}
                              >
                                <motion.div
                                  animate={{
                                    scale: hoveredHospital === hospital.id ? 1.05 : 1,
                                  }}
                                  transition={{ duration: 0.2 }}
                                  className={`flex-1 rounded-xl p-3 transition-all ${
                                    hoveredHospital === hospital.id 
                                      ? "shadow-lg" 
                                      : "shadow-sm"
                                  } ${
                                    hospital.isEmergency ? "sos-glow bg-red-50" : "bg-white border border-gray-100"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="text-sm font-bold text-gray-900">{hospital.name}</h4>
                                        {hospital.isEmergency && (
                                          <span className="text-[10px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter animate-pulse">
                                            SOS
                                          </span>
                                        )}
                                        {type === "Public" ? (
                                          <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Улсын</span>
                                        ) : (
                                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Хувийн</span>
                                        )}
                                      </div>
                                      
                                      {}
                                      {hospital.distance !== undefined && (
                                        <p className="text-xs font-bold text-blue-600 mt-1.5 flex items-center gap-1">
                                          <MapPin className="w-3 h-3" />
                                          {hospital.distance.toFixed(1)} км
                                        </p>
                                      )}
                                      
                                      {hospital.address && (
                                        <p className="text-xs text-gray-600 mt-1.5 line-clamp-1">{hospital.address}</p>
                                      )}
                                      
                                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                                        <a 
                                          href={`tel:${hospital.phone}`}
                                          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
                                        >
                                          <Phone className="w-3 h-3" />
                                          {hospital.phone}
                                        </a>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                          hospital.hours === "24/7" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                                        }`}>
                                          {hospital.hours}
                                        </span>
                                      </div>
                                    </div>

                                    {}
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => handleNavigateToMap(hospital)}
                                      className="flex-shrink-0 w-8 h-8 bg-blue-100 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg flex items-center justify-center transition-all"
                                      title="Газрын зураг дээр харах"
                                    >
                                      <Map className="w-4 h-4" />
                                    </motion.button>
                                  </div>
                                </motion.div>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showBMICalc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-end sm:items-center justify-center p-0 sm:p-6"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-8 shadow-2xl relative"
            >
              <button
                onClick={() => setShowBMICalc(false)}
                className="absolute top-4 right-4 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>

              <h2 className="text-2xl font-black text-gray-900 mb-6">BMI Тооцоолуур</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Өндөр (см)</label>
                  <div className="flex items-center gap-4">
                    <Ruler className="text-blue-500 w-5 h-5" />
                    <input 
                      type="range" min="100" max="220" 
                      value={bmiData.height}
                      onChange={(e) => setBMIData({...bmiData, height: Number(e.target.value)})}
                      className="flex-1 h-2 bg-gray-100 rounded-full appearance-none cursor-pointer accent-blue-600"
                    />
                    <span className="font-bold text-gray-900 w-12">{bmiData.height}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Жин (кг)</label>
                  <div className="flex items-center gap-4">
                    <Weight className="text-orange-500 w-5 h-5" />
                    <input 
                      type="range" min="30" max="150" 
                      value={bmiData.weight}
                      onChange={(e) => setBMIData({...bmiData, weight: Number(e.target.value)})}
                      className="flex-1 h-2 bg-gray-100 rounded-full appearance-none cursor-pointer accent-orange-500"
                    />
                    <span className="font-bold text-gray-900 w-12">{bmiData.weight}</span>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-3xl p-6 text-center">
                  <p className="text-xs font-bold text-blue-600 uppercase mb-1">Таны BMI</p>
                  <p className="text-5xl font-black text-gray-900 mb-2">{calculateBMI()}</p>
                  <p className={`text-sm font-bold ${getBMICategory(Number(calculateBMI())).color}`}>
                    {getBMICategory(Number(calculateBMI())).label}
                  </p>
                </div>

                <button
                  onClick={() => setShowBMICalc(false)}
                  className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl active:scale-95 transition-all"
                >
                  Хаах
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



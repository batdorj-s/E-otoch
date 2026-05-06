import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Phone, Clock, Navigation, AlertCircle, PhoneCall, CalendarCheck, Check, Info } from "lucide-react";
import hospitalsData from "../data/hospitals.json";
import { calculateDistance } from "../utils/geoUtils";
import { BookingModal } from "./BookingModal";

interface Hospital {
  id: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  phone: string;
  hours: string;
  isEmergency: boolean;
  type: string;
  specialties: string[];
  openTime: string;
  closeTime: string;
  distance?: number;
}

interface HospitalFinderProps {
  isEmergencyMode?: boolean;
  requiredSpecialty?: string;
}

export function HospitalFinder({ isEmergencyMode = false, requiredSpecialty }: HospitalFinderProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [displayHospitals, setDisplayHospitals] = useState<Hospital[]>(hospitalsData);
  const [bookingStatus, setBookingStatus] = useState<Record<string, "idle" | "booking" | "completed">>( {});
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          processHospitals(latitude, longitude);
        },
        () => {
          const ubCenter = { lat: 47.9188, lng: 106.9176 };
          processHospitals(ubCenter.lat, ubCenter.lng);
        }
      );
    } else {
      const ubCenter = { lat: 47.9188, lng: 106.9176 };
      processHospitals(ubCenter.lat, ubCenter.lng);
    }
  }, [requiredSpecialty]);

  const processHospitals = (lat: number, lng: number) => {
    const enriched = hospitalsData.map((h) => ({
      ...h,
      distance: calculateDistance(lat, lng, h.lat, h.lng),
    }));

    let filtered = [...enriched];
    
    if (requiredSpecialty) {
      filtered = filtered.sort((a, b) => {
        const aHasSpec = a.specialties.includes(requiredSpecialty);
        const bHasSpec = b.specialties.includes(requiredSpecialty);
        if (aHasSpec && !bHasSpec) return -1;
        if (!aHasSpec && bHasSpec) return 1;
        return (a.distance || 0) - (b.distance || 0);
      });
    } else {
      filtered = filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    setDisplayHospitals(filtered);
  };

  const handleNavigate = (hospital: Hospital) => {
    const query = hospital.address ? `${hospital.name}, ${hospital.address}, Ulaanbaatar` : `${hospital.name}, Ulaanbaatar`;
    const encodedQuery = encodeURIComponent(query);
    window.open(`https://www.google.com/maps/search/${encodedQuery}/@${hospital.lat},${hospital.lng},15z`, "_blank");
  };

  const handleBookClick = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setIsBookingModalOpen(true);
  };

  const handleBookingConfirm = (details: any) => {
    if (selectedHospital) {
      setBookingStatus(prev => ({ ...prev, [selectedHospital.id]: "completed" }));
    }
  };

  const isHospitalOpen = (openTime: string, closeTime: string) => {
    const now = new Date();
    const currentStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return currentStr >= openTime && currentStr <= closeTime;
  };

  return (
    <div className="space-y-4">
      {isEmergencyMode && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-red-600 text-white p-4 rounded-2xl shadow-xl flex items-center gap-4 mb-6"
        >
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">Яаралтай тусламж!</h3>
            <p className="text-sm opacity-90">Зүрхний өвдөлтийн шинж тэмдэг илэрлээ.</p>
          </div>
          <a
            href="tel:103"
            className="bg-white text-red-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <PhoneCall className="w-5 h-5" />
            103
          </a>
        </motion.div>
      )}

      <div className="flex items-center justify-between mb-2">
        <h2 className={`font-bold ${isEmergencyMode ? "text-red-700" : "text-gray-900"}`}>
          {requiredSpecialty ? `Мэргэшсэн: ${requiredSpecialty}` : "Ойрхон эмнэлгүүд"}
        </h2>
        <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-lg">
          <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">Офлайн мэдээлэл</span>
        </div>
      </div>

      <div className="space-y-4">
        {displayHospitals.map((hospital, index) => {
          const isOpen = isHospitalOpen(hospital.openTime, hospital.closeTime);
          const hasSpecialty = requiredSpecialty && hospital.specialties.includes(requiredSpecialty);
          const currentBooking = bookingStatus[hospital.id] || "idle";

          return (
            <motion.div
              key={hospital.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white rounded-3xl p-5 shadow-sm border-2 ${
                isEmergencyMode && index === 0 ? "border-red-500 shadow-red-100" : 
                hasSpecialty ? "border-blue-200 bg-blue-50/10" : "border-transparent"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2 mb-1.5">
                    <h4 className="font-bold text-gray-900 text-base">{hospital.name}</h4>
                    {hospital.isEmergency && (
                      <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">SOS</span>
                    )}
                    {hasSpecialty && (
                      <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Мэргэшсэн</span>
                    )}
                  </div>
                  {hospital.address && (
                    <p className="text-xs text-gray-600 mb-2 flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>{hospital.address}</span>
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-gray-500">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{hospital.distance ? `${hospital.distance.toFixed(1)} км` : "-- км"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${isOpen ? "bg-green-500" : "bg-gray-400"}`}></div>
                      <span className={`text-[10px] font-bold ${isOpen ? "text-green-600" : "text-gray-500"}`}>
                        {isOpen ? "Одоо нээлттэй" : "Хаалттай"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${hospital.type === "Public" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
                  {hospital.type === "Public" ? "Улсын" : "Хувийн"}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <a
                    href={`tel:${hospital.phone}`}
                    className="w-11 h-11 bg-gray-100 text-gray-700 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all active:scale-90"
                  >
                    <Phone className="w-5 h-5" />
                  </a>
                  <button 
                    onClick={() => handleNavigate(hospital)}
                    className="w-11 h-11 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all active:scale-90"
                  >
                    <Navigation className="w-5 h-5" />
                  </button>
                </div>
                
                <button
                  onClick={() => handleBookClick(hospital)}
                  disabled={currentBooking === "completed" || !isOpen}
                  className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-2xl text-xs font-bold transition-all active:scale-95 ${
                    currentBooking === "completed" ? "bg-green-500 text-white" :
                    isOpen ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {currentBooking === "completed" ? (
                    <><Check className="w-4 h-4" /> Цаг захиалагдлаа</>
                  ) : (
                    <><CalendarCheck className="w-4 h-4" /> Цаг захиалах</>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {selectedHospital && (
        <BookingModal
          hospital={selectedHospital}
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          onConfirm={handleBookingConfirm}
          initialSpecialty={requiredSpecialty}
        />
      )}
    </div>
  );
}

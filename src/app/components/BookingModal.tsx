import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Calendar, Clock, User, Phone, CheckCircle2, ChevronRight, Stethoscope } from "lucide-react";

interface Hospital {
  id: string;
  name: string;
  specialties: string[];
}

interface BookingModalProps {
  hospital: Hospital;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (bookingDetails: any) => void;
  initialSpecialty?: string;
}

export function BookingModal({ hospital, isOpen, onClose, onConfirm, initialSpecialty }: BookingModalProps) {
  const [step, setStep] = useState(1);
  const [details, setDetails] = useState({
    specialty: initialSpecialty || hospital.specialties[0],
    date: "",
    time: "",
    name: "",
    phone: "",
  });

  const timeSlots = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];
  const dates = [
    { label: "Маргааш", value: "2024-05-06" },
    { label: "Нөгөөдөр", value: "2024-05-07" },
    { label: "05/08", value: "2024-05-08" },
  ];

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = () => {
    onConfirm(details);
    setStep(4);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          className="relative w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="px-6 py-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
            <div>
              <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{hospital.name}</h3>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Цаг захиалах</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center active:scale-90 transition-transform"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6">
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-3 block">Тасгийн чиглэл</label>
                  <div className="grid grid-cols-1 gap-2">
                    {hospital.specialties.map((spec) => (
                      <button
                        key={spec}
                        onClick={() => setDetails({ ...details, specialty: spec })}
                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                          details.specialty === spec ? "border-blue-600 bg-blue-50" : "border-gray-100 bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${details.specialty === spec ? "bg-blue-600 text-white" : "bg-white text-gray-400"}`}>
                            <Stethoscope className="w-4 h-4" />
                          </div>
                          <span className={`font-bold text-sm ${details.specialty === spec ? "text-blue-700" : "text-gray-700"}`}>{spec}</span>
                        </div>
                        {details.specialty === spec && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleNext}
                  className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  Үргэлжлүүлэх <ChevronRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-3 block flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Өдөр сонгох
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {dates.map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setDetails({ ...details, date: d.value })}
                        className={`py-3 rounded-xl border-2 font-bold text-xs transition-all ${
                          details.date === d.value ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-100 bg-gray-50 text-gray-500"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 mb-3 block flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Цаг сонгох
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((t) => (
                      <button
                        key={t}
                        onClick={() => setDetails({ ...details, time: t })}
                        className={`py-3 rounded-xl border-2 font-bold text-xs transition-all ${
                          details.time === t ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-100 bg-gray-50 text-gray-500"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={handleBack} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold">Буцах</button>
                  <button
                    onClick={handleNext}
                    disabled={!details.date || !details.time}
                    className="flex-[2] bg-gray-900 text-white py-4 rounded-2xl font-bold disabled:opacity-50"
                  >
                    Дараах
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-2 block">Таны нэр</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Овог нэр"
                        value={details.name}
                        onChange={(e) => setDetails({ ...details, name: e.target.value })}
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:border-blue-500 outline-none transition-all font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-2 block">Утасны дугаар</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        placeholder="88******"
                        value={details.phone}
                        onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 pl-12 pr-4 focus:border-blue-500 outline-none transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <h4 className="text-xs font-black text-blue-700 uppercase tracking-widest mb-2">Захиалгын хураангуй</h4>
                  <p className="text-sm text-blue-900 font-bold">{details.specialty}</p>
                  <p className="text-xs text-blue-600 font-medium">{details.date} | {details.time}</p>
                </div>

                <div className="flex gap-2">
                  <button onClick={handleBack} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold">Буцах</button>
                  <button
                    onClick={handleSubmit}
                    disabled={!details.name || !details.phone}
                    className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200"
                  >
                    Захиалга баталгаажуулах
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Хүсэлт илгээгдлээ!</h3>
                <p className="text-gray-500 text-sm mb-8 px-4">
                  Таны офлайн захиалга амжилттай хадгалагдлаа. Интернет холбогдмогц эмнэлэг рүү илгээгдэх болно.
                </p>
                <button
                  onClick={onClose}
                  className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold"
                >
                  Ойлголоо
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

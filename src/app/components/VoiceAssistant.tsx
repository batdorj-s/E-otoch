import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Send, X, Bot, User, Loader2, Sparkles, Volume2, VolumeX } from "lucide-react";
import { getOllamaAdvice } from "../utils/ollamaAI";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
}

interface VoiceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  initialAnswers?: Record<string, string>;
  aiResults?: any;
}

export function VoiceAssistant({ isOpen, onClose, initialAnswers = {}, aiResults = {} }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "assistant", text: "Сайн байна уу! Би бол Eotoch AI байна. Та өөрийн биед илэрч буй зовиур болон эрүүл мэндийн талаар асуух зүйлээ надад хэлээрэй." }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Speech Recognition Setup
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "mn-MN";

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setInputText(transcript);
          } else {
            interimTranscript += transcript;
            setInputText(interimTranscript); // Show text as user speaks
          }
        }
      };

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        console.log("Voice recognition started");
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed') {
          alert("Микрофоны зөвшөөрөл олгоно уу.");
        }
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
        console.log("Voice recognition ended");
      };
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setInputText("");
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error("Failed to start recognition:", e);
        // If already started, just toggle the state for safety
        setIsListening(true);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", text: inputText };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText("");
    setIsLoading(true);

    try {
      // We pass a simplified answers object for the chat context
      const chatContext = { ...initialAnswers, user_query: currentInput };
      const response = await getOllamaAdvice(chatContext as any, aiResults);
      
      const assistantMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        role: "assistant", 
        text: response 
      };
      setMessages(prev => [...prev, assistantMessage]);
      speakText(response);
    } catch (error) {
      console.error("Failed to get AI response", error);
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'mn-MN'; // Mongolian
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg h-[80vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center relative">
              <Bot className="w-7 h-7" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Eotoch Voice</h3>
              <p className="text-xs opacity-80">AI Эрүүл мэндийн туслах</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mb-1">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
              )}
              <div
                className={`max-w-[80%] p-4 rounded-3xl text-sm shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex justify-start items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              </div>
              <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm italic text-xs text-gray-400">
                Eotoch бодож байна...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Action Controls */}
        <div className="p-6 bg-white border-t border-gray-100 space-y-4">
          <AnimatePresence>
            {inputText && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-blue-50 p-3 rounded-2xl text-xs text-blue-700 flex items-center justify-between gap-3 border border-blue-100"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <span className="font-medium truncate">{inputText}</span>
                </div>
                <button 
                  onClick={handleSendMessage}
                  className="bg-blue-600 text-white p-2 rounded-xl"
                >
                  <Send className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-center gap-6">
            <button
              onClick={isSpeaking ? stopSpeaking : () => {}}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isSpeaking ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'
              }`}
              title={isSpeaking ? "Дуу зогсоох" : "Дуу хаалттай"}
            >
              {isSpeaking ? <Volume2 className="w-6 h-6 animate-pulse" /> : <VolumeX className="w-6 h-6" />}
            </button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all relative ${
                isListening 
                  ? 'bg-red-500 text-white ring-8 ring-red-100' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <AnimatePresence>
                {isListening && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, scale: 1 }}
                      animate={{ opacity: [0, 0.4, 0], scale: [1, 1.8] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                      className="absolute inset-0 bg-red-400 rounded-full z-0"
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 1 }}
                      animate={{ opacity: [0, 0.3, 0], scale: [1, 2.2] }}
                      transition={{ repeat: Infinity, duration: 2, delay: 0.5, ease: "easeOut" }}
                      className="absolute inset-0 bg-red-300 rounded-full z-0"
                    />
                    {/* Visual Audio Waves */}
                    <div className="absolute -top-8 flex gap-1 items-end h-6">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [4, 16, 4] }}
                          transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                          className="w-1 bg-red-500 rounded-full"
                        />
                      ))}
                    </div>
                  </>
                )}
              </AnimatePresence>
              {isListening ? <MicOff className="w-8 h-8 z-10" /> : <Mic className="w-8 h-8 z-10" />}
            </motion.button>

            <div className="w-12 h-12" /> {}
          </div>
          
          <p className="text-center text-[10px] text-gray-400 font-medium">
            {isListening ? "Та яриагаа дуусгаад микрофон дээр дахин дарна уу" : "Микрофон дээр дарж яриагаа эхлүүлнэ үү"}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

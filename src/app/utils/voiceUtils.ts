interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

// Global Chimege Token (can be stored in secureStorage or env)
let CHIMEGE_TOKEN = import.meta.env.VITE_CHIMEGE_TOKEN || "";

export const setChimegeToken = (token: string) => {
  CHIMEGE_TOKEN = token;
};

export const getChimegeToken = () => {
  return CHIMEGE_TOKEN;
};

/**
 * Text-to-Speech using Chimege API with a web-speech fallback
 */
export const speakText = async (
  text: string, 
  onStart: () => void, 
  onEnd: () => void,
  onError: (err: string) => void
): Promise<{ stop: () => void }> => {
  let activeAudio: HTMLAudioElement | null = null;
  let isStopped = false;

  const stop = () => {
    isStopped = true;
    if (activeAudio) {
      activeAudio.pause();
      activeAudio = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    onEnd();
  };

  // Clean the text from markdown characters like *, #, etc.
  const cleanText = text
    .replace(/[\*#_`>]/g, "")
    .replace(/\n+/g, " ")
    .trim();

  // 1. Try Chimege TTS if Token is configured
  if (CHIMEGE_TOKEN) {
    try {
      onStart();
      
      // Алхам 1: Бичвэрийг хэвийн болгох (Тоо, хувь, товчлолыг задлах)
      let textToSynthesize = cleanText;
      try {
        console.log("Normalizing text using Chimege API...");
        const normResponse = await fetch("/chimege-api/v1.2/normalize-text", {
          method: "POST",
          headers: {
            "Token": CHIMEGE_TOKEN,
            "Content-Type": "text/plain; charset=utf-8"
          },
          body: cleanText
        });
        if (normResponse.ok) {
          textToSynthesize = await normResponse.text();
          console.log("Normalized text length:", textToSynthesize.length);
        }
      } catch (normError) {
        console.warn("Text normalization skipped or failed, proceeding with raw text...");
      }

      if (isStopped) return { stop };

      // Алхам 2: Текстийг 280 тэмдэгтээр өгүүлбэрээр хуваах (Чимигэ 300 limit)
      const splitTextIntoChunks = (text: string, maxLength: number) => {
        const sentences = text.split(/([.!?\n]+)/);
        const chunks: string[] = [];
        let currentChunk = "";
        
        for (let i = 0; i < sentences.length; i += 2) {
          const sentence = sentences[i] + (sentences[i+1] || "");
          if ((currentChunk + sentence).length <= maxLength) {
            currentChunk += sentence;
          } else {
            // Хэрэв нэг өгүүлбэр дангаараа 280-аас урт байвал үгээр нь хуваах
            if (sentence.length > maxLength) {
               if (currentChunk) chunks.push(currentChunk.trim());
               let tempSentence = sentence;
               while (tempSentence.length > maxLength) {
                 const splitIndex = tempSentence.lastIndexOf(" ", maxLength);
                 const actualSplit = splitIndex > 0 ? splitIndex : maxLength;
                 chunks.push(tempSentence.substring(0, actualSplit).trim());
                 tempSentence = tempSentence.substring(actualSplit);
               }
               currentChunk = tempSentence;
            } else {
               if (currentChunk) chunks.push(currentChunk.trim());
               currentChunk = sentence;
            }
          }
        }
        if (currentChunk) chunks.push(currentChunk.trim());
        return chunks;
      };

      const chunks = splitTextIntoChunks(textToSynthesize, 280);
      let currentChunkIndex = 0;

      // Алхам 3: Хэсгүүдийг дарааллан дуудах Recursive функц
      const playNextChunk = async () => {
        if (isStopped || currentChunkIndex >= chunks.length) {
          onEnd();
          return;
        }
        
        const chunkText = chunks[currentChunkIndex];
        currentChunkIndex++;
        
        try {
          const response = await fetch("/chimege-api/v1.2/synthesize", {
            method: "POST",
            headers: {
              "Token": CHIMEGE_TOKEN,
              "Content-Type": "text/plain; charset=utf-8",
              "voice-id": "FEMALE3v2"
            },
            body: chunkText
          });
          
          if (!response.ok) throw new Error(`Chunk API failed: ${response.status}`);
          
          const blob = await response.blob();
          if (isStopped) return;
          
          const audioUrl = URL.createObjectURL(blob);
          activeAudio = new Audio(audioUrl);
          
          activeAudio.onended = () => {
            playNextChunk();
          };
          
          activeAudio.onerror = () => {
            console.error("Audio chunk playback error, skipping to next chunk.");
            playNextChunk();
          };
          
          await activeAudio.play();
        } catch (error) {
          console.error("Chunk synthesis error:", error);
          playNextChunk(); // Алдаа гарсан ч дараагийн хэсгийг үргэлжлүүлэн уншина
        }
      };

      console.log(`Synthesizing voice in ${chunks.length} chunks via local dev proxy...`);
      playNextChunk();
      
      return { stop };
    } catch (e) {
      console.warn("Chimege TTS failed, falling back to Web Speech Synthesis...", e);
    }
  }

  // 2. Browser Native Web Speech Synthesis Fallback
  fallbackSpeak(cleanText, onStart, onEnd, onError);
  return { stop };
};

const fallbackSpeak = (
  text: string,
  onStart: () => void,
  onEnd: () => void,
  onError: (err: string) => void
) => {
  if (!window.speechSynthesis) {
    onError("Таны төхөөрөмж дуу тоглуулах технологийг дэмжихгүй байна.");
    return;
  }

  window.speechSynthesis.cancel(); // Stop any active speech
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Attempt to select a Mongolian-compatible voice, or default
  utterance.lang = "mn-MN";
  
  utterance.onstart = () => {
    onStart();
  };
  
  utterance.onend = () => {
    onEnd();
  };
  
  utterance.onerror = (e) => {
    if (e.error === "interrupted" || e.error === "canceled") {
      onEnd();
      return;
    }
    console.error("Web Speech synthesis error", e);
    onError("Дуу уншихад алдаа гарлаа.");
    onEnd();
  };

  window.speechSynthesis.speak(utterance);
};

/**
 * Creates and starts a Speech Recognition session for Mongolian
 */
export const startSpeechToText = (
  onResult: (text: string) => void,
  onStart: () => void,
  onEnd: () => void,
  onError: (err: string) => void
): { stop: () => void } => {
  const SpeechRecognitionConstructor = 
    (window as any).SpeechRecognition || 
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognitionConstructor) {
    onError("Таны хөтөч дуу хөрвүүлэх технологийг дэмжихгүй байна. Chrome эсвэл Safari ашиглана уу.");
    return { stop: () => {} };
  }

  const recognition: SpeechRecognition = new SpeechRecognitionConstructor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "mn-MN"; // Mongolian language transcription

  recognition.onstart = () => {
    onStart();
  };

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let finalTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      finalTranscript += event.results[i][0].transcript;
    }
    if (finalTranscript) {
      onResult(finalTranscript);
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    if (event.error === "no-speech" || event.error === "aborted") {
      onEnd();
      return;
    }
    console.error("Speech Recognition error", event);
    if (event.error === "not-allowed") {
      onError("Микрофоны зөвшөөрөл олгоогүй байна.");
    } else {
      onError("Аудиог хөрвүүлэхэд алдаа гарлаа.");
    }
  };

  recognition.onend = () => {
    onEnd();
  };

  recognition.start();

  return {
    stop: () => {
      recognition.stop();
    }
  };
};

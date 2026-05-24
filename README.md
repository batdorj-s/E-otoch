# Eotoch - Монголын Эрүүл Мэндийн AI Туслах

Eotoch бол Монгол хүмүүсийн эрүүл мэндийн онцлогт тохирсон (STEPS судалгаа болон Kaggle өгөгдөл дээр суурилсан), хиймэл оюун ухаанаар дамжуулан өвчлөлийн эрсдэлийг үнэлж, персонал зөвлөгөө өгөх систем юм.

### Үндсэн боломжууд (AI capabilities)
- **Advanced Agentic RAG (New)**: 1,100+ эрүүл мэндийн баримт (STEPS 2005, 2013, ЭМЯ-ны удирдамж) дээр суурилсан ухаалаг хайлт.
- **Multimodal AI (Lung Cancer Detection)**: CT Scan зураг дээр Watershed сегментчилэл болон VGG16 модель ашиглан хавдрын эрсдэлийг тооцоолно.
- **Hybrid LLM Architecture**: Локал **Ollama (Llama 3)** болон Cloud **Google Gemini AI** хосолсон найдвартай систем.
- **Real-time ML Inference**: Random Forest моделийг **ONNX Runtime (WASM/WebGL)** ашиглан браузер дээр шууд ажиллуулна.
- **Voice AI Assistant**: Монгол хэлээр ярьж ойлголцох (STT) болон зөвлөгөөг дуугаар сонсох (Chimege TTS) боломжтой.

---

### AI Архитектур & Алгоритмын нарийвчлал

#### 1. Agentic RAG Workflow
Систем "Naive RAG"-аас татгалзаж, 4 үе шаттай ухаалаг процессыг ашигладаг:
- **Query Expansion**: Хэрэглэгчийн түүхий өгөгдлийг LLM ашиглан эмнэлгийн мэргэжлийн түлхүүр үгсээр баяжуулдаг.
- **Semantic Routing**: Категориудад хуваасан мэдлэгийн сангаас зөвхөн хамааралтай хэсгийг шүүнэ.
- **Context Fusion**: Бодит ML оношилгооны оноог RAG-ийн текст баримтуудтай нэгтгэнэ.
- **Self-Reflection**: AI хариултаа үүсгэсний дараа баримтад тулгуурласан эсэхээ өөрөө хянаж засдаг.

#### 2. Computer Vision (Lung Cancer)
`Lung_cancer-master` төслийн логикийг ашиглан:
- **Watershed Algorithm**: CT зураг дээрх уушгины эдийг сегментчилж, шуугианыг арилгана.
- **CNN VGG16**: Сургагдсан архитектураар дамжуулан хавдрын зангилааг (nodules) илрүүлж, ангилна.

#### 3. Real-time Inference Engine
- **Multi-Backend**: `onnxruntime-web` ашиглан WASM (CPU) ачаалж чадахгүй үед автоматаар WebGL (GPU) рүү шилжиж ажиллана.
- **XAI (Explainable AI)**: Моделийн шийдвэр гаргалтад нөлөөлсөн хүчин зүйлсийг (BMI, BP, Smoking) "Contribution Score" хэлбэрээр хэрэглэгчид тайлбарлан харуулна.

---

### Технологийн стек
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion
- **AI/ML**: Scikit-learn, ONNX Runtime, Ollama (Llama 3), Google Gemini API
- **Voice**: Web Speech API (STT), Chimege API (TTS)
- **Data Ingestion**: PDF-parse, Mammoth (Docx), Papaparse (CSV)

---

### Эхлүүлэх заавар

1. **Сангуудыг суулгах**:
   ```bash
   npm install
   ```

2. **Офлайн AI (Ollama) тохируулах**:
   - [Ollama](https://ollama.com/) суулгаад Llama 3 моделыг татна:
     ```bash
     ollama run llama3
     ```

3. **Google Gemini (Backup) тохируулах**:
   - `.env` файлд API түлхүүрээ оруулна:
     ```env
     VITE_GEMINI_API_KEY=таны_түлхүүр
     ```

4. **Мэдлэгийн санг шинэчлэх (Ingestion)**:
   - Шинэ файл нэмсэн бол дараах скриптийг ажиллуулна:
     ```bash
     node scripts/ingest_docs.cjs
     ```

5. **Хөгжүүлэлтийн сервер асаах**:
   ```bash
   npm run dev
   ```

---

### Дата Шинжилгээ (Data Insights)
Kaggle-ийн Heart Disease UCI өгөгдөл дээр хийсэн статистик шинжилгээний үр дүн:
- Насны хамаарал: Нас нэмэгдэх тусам зүрх судас өвчлөлийн эрсдэл нэмэгдэх хамаарал 0.34 (Positive correlation) байна.
- Дундаж үзүүлэлт: Өвчлөлийн датасет дэх хүмүүсийн дундаж нас 53.5, дундаж систолын даралт 132 mmHg байна.

![Correlation Matrix](ai-model/feature_eng_viz.png)

---

### Тэмдэглэл
Энэхүү систем нь хиймэл оюун ухааны алгоритм дээр суурилсан урьдчилсан үнэлгээ бөгөөд мэргэжлийн эмчийн оношилгоог орлохгүй.

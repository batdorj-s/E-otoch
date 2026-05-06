# Eotoch - Монголын Эрүүл Мэндийн AI Туслах

Eotoch бол Монгол улсын хүмүүсийн эрүүл мэндийн эрсдэлийг оношилдог бөгөөд персонализирован зөвлөгөө өгөх AI системийг ашигладаг healthcare аппликейшн юм.

**Технологи:**
- Frontend: React 18 + TypeScript
- Styling: Tailwind CSS + Radix UI
- AI: Google Gemini API
- Machine Learning: Rule-based inference + Kaggle data
- Build: Vite

## 📦 Суулгалт

```bash
npm install
```

## 🚀 Хөгжүүлэлтийн сервер асаах

```bash
npm run dev
```

Сервер `http://localhost:5173` дээр асанна.

## 🔐 Environment Variables

`.env` файл үүсгэнэ:

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

API Key авах: https://ai.google.dev/

## 📦 Production Build

```bash
npm run build
```

Үүнээс `dist/` хавтсанд production-ready файлууд гаралцна.

## 🌐 GitHub & Vercel Deploy

### 📌 GitHub дээр Байршуулах (Repository Setup)

#### Алхам 1: GitHubRepo үүсгэх
1. https://github.com/new -д очно
2. Repository name: `eotoch` (эсвэл өөр нэр)
3. **Public** эсвэл **Private** сонгоно
4. README.md, .gitignore: добавлуулах шаардлагагүй (аль хэдийнээ байна)
5. **Create Repository** дарна

#### Алхам 2: Орон нутагт Git Setup хийх
```bash
# Төслийн үндсэн хавтсанд
cd /Users/batdorjsukhbaatar/Downloads/hicheel/fibo_cloud\ /e_otoch

# Git инициализ хийх (хэрэв эхний удаа)
git init

# Remote repository холбоно
git remote add origin https://github.com/YOUR_USERNAME/eotoch.git

# Branch үүсгэнэ (main эсвэл master)
git branch -M main
```

#### Алхам 3: Code Push хийх
```bash
# Бүх файл stage хийнэ
git add .

# Commit хийнэ
git commit -m "Initial commit: Eotoch Healthcare AI App"

# GitHub-д push хийнэ
git push -u origin main
```

**⚠️ Чухал Шалгалт:**
```bash
# .env файл GitHub-д орсон үү?
git ls-files | grep .env
# → үр дүн байхгүй ✅ (байх ёсгүй!)

# .gitignore-д байгаа эсэх?
cat .gitignore | grep -E "\.env|node_modules|dist"
# → .env, node_modules, dist гарч ирэх ёстой
```

### 🚀 Vercel дээр Байршуулах (Production Deploy)

#### Алхам 1: Vercel Account Setup
1. https://vercel.com/signup -д бүртгүүлнэ (GitHub эккаунттай)
2. GitHub аккаунттай холбоно

#### Алхам 2: Project Холбоно
1. Vercel Dashboard-д "Add New Project" дарна
2. GitHub репозиторийг сонгоно (`eotoch`)
3. **Import** дарна

#### Алхам 3: Build Settings
Vercel аутоматаар сайн сонголтуудыг ойлгодог:
- **Framework Preset**: Vite ✅
- **Build Command**: `npm run build` ✅
- **Output Directory**: `dist` ✅

Өөрчлөлтгүй **Deploy** товчийг дарна.

#### Алхам 4: Environment Variables Суулгах (ЧУХАЛ!)
1. **Project Settings** → **Environment Variables**
2. Variable нэмнэ:
   - **Name**: `VITE_GEMINI_API_KEY`
   - **Value**: `AIzaSyBKx7FI5nHu_t8MK6...` (таны API Key)
   - **Environments**: Production, Preview, Development сонгоно
3. **Save** дарна
4. **Redeploy** хийх (Settings-ээс "Redeploy" товч)

#### Алхам 5: Deployment Статус Шалгах
```
✅ Deployment successful!
Live URL: https://eotoch.vercel.app
```

---

### 🔍 Deploy Дараа Verification

#### ✅ Live App Тест
1. Vercel URL-аа нээнэ: `https://eotoch.vercel.app`
2. Assessment завсруулав
3. AI зөвлөгөө идэвхтэй эсэхийг шалгаарай

#### ❌ Хэрэв Error Гарвал:
| Error | Шийдэл |
|-------|--------|
| `VITE_GEMINI_API_KEY is not defined` | Vercel → Env Vars → VITE_GEMINI_API_KEY нэмэх |
| `Build failed` | Vercel Logs → Error message нь яг юу байгаа шалгаарай |
| `Cannot GET /` | public/index.html байгаа эсэхийг шалгаарай |

---

### 💡 Deploy Дараа Updates

Орон нутагт өөрчлөлт хийгээд GitHub-д push хийхэд:
```bash
git add .
git commit -m "Fix: Update AI model"
git push origin main
```
→ Vercel аутоматаар deploy хийх болно ⚡

**⚠️ Remember:** `.env` файлыг хэзээ ч push хийбэл болохгүй!

## 🏗️ Архитектур

```
src/
├── app/
│   ├── components/    (React components)
│   ├── utils/         (AI, Storage, Geo utilities)
│   └── data/          (Hospital data)
└── styles/           (Tailwind CSS)
```

## 🎯 Үндсэн Функциональ

- **Assessment Questionnaire**: 12 асуултаар эрүүл мэндийн үнэлгээ
- **AI Risk Prediction**: 3 үндсэн өвчлөл эрсдэлийн таамаглал (Kaggle + STEPS)
- **Hospital Finder**: Ойрхон эмнэлгүүд хайх (Google Maps интеграц)
- **Personalized Advice**: Gemini API ашиглан персонал зөвлөгөө
- **User Profile**: Үнэлгээ болон эрсдэл таамаглалын нээлэмжтэй тайлан

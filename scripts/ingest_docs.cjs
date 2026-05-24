const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

const DOCUMENTS_DIR = "/Users/batdorjsukhbaatar/Downloads/hicheel/fibo_cloud /";
const OUTPUT_FILE = path.join(__dirname, '../src/app/data/compiledKnowledge.json');

const filesToProcess = [
    'mongolia-2013-steps-report.pdf',
    'STEPS_Mongolia_2005_Report.pdf',
    'eotoch.docx',
    'MS+2828+-+to+web.pdf',
    'MS+2971.pdf',
    'MS+2798+to+web.pdf'
];

async function extractText() {
    // Dynamic import for ESM in CJS
    const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    const allChunks = [];

    for (const fileName of filesToProcess) {
        const filePath = path.join(DOCUMENTS_DIR, fileName);
        if (!fs.existsSync(filePath)) continue;

        console.log(`Processing ${fileName}...`);
        try {
            let text = "";
            const ext = path.extname(filePath).toLowerCase();
            
            if (ext === '.pdf') {
                const data = new Uint8Array(fs.readFileSync(filePath));
                const loadingTask = getDocument({ data, verbosity: 0 });
                const pdf = await loadingTask.promise;
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    text += textContent.items.map(item => item.str).join(' ') + "\n";
                }
            } else if (ext === '.docx') {
                const dataBuffer = fs.readFileSync(filePath);
                const result = await mammoth.extractRawText({ buffer: dataBuffer });
                text = result.value;
            }

            const chunks = chunkText(text, fileName);
            allChunks.push(...chunks);
            console.log(`- Extracted ${chunks.length} chunks.`);
        } catch (e) {
            console.error(`Error processing ${fileName}:`, e.message);
        }
    }

    const dir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allChunks, null, 2));
    console.log(`\nSuccess! ${allChunks.length} chunks saved.`);
}

function chunkText(text, filename, chunkSize = 1200, overlap = 200) {
    if (!text || text.trim().length === 0) return [];
    const chunks = [];
    const cleanText = text.replace(/\s+/g, ' ').trim();
    let i = 0;
    while (i < cleanText.length) {
        const content = cleanText.slice(i, i + chunkSize);
        if (content.length > 50) {
            chunks.push({
                id: `${filename}-${chunks.length}`,
                content: content,
                source: filename,
                category: inferCategory(content, filename)
            });
        }
        i += (chunkSize - overlap);
    }
    return chunks;
}

function inferCategory(text, filename) {
    const lowerText = (text + filename).toLowerCase();
    if (lowerText.includes('даралт') || lowerText.includes('hypertension')) return 'hypertension';
    if (lowerText.includes('сахар') || lowerText.includes('чихрийн шижин') || lowerText.includes('diabetes')) return 'diabetes';
    if (lowerText.includes('давс') || lowerText.includes('salt')) return 'salt';
    if (lowerText.includes('тамхи') || lowerText.includes('tobacco')) return 'tobacco';
    if (lowerText.includes('архи') || lowerText.includes('alcohol')) return 'alcohol';
    if (lowerText.includes('жин') || lowerText.includes('таргалалт') || lowerText.includes('bmi')) return 'obesity';
    return 'general';
}

extractText();

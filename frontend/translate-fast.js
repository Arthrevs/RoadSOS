import fs from 'fs';
import path from 'path';

const i18nDir = path.resolve('src/i18n');
const enFile = path.join(i18nDir, 'en.json');
const enData = JSON.parse(fs.readFileSync(enFile, 'utf-8'));

async function translateSingle(text, targetLang) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  const response = await fetch(url);
  const data = await response.json();
  return data[0].map(x => x[0]).join('');
}

async function processLang(file) {
  if (file === 'en.json' || !file.endsWith('.json')) return;
  const langCode = file.replace('.json', '');
  
  const filePath = path.join(i18nDir, file);
  const langData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  let updated = false;
  
  for (const [key, text] of Object.entries(enData)) {
    // If it's missing OR it's identical to English (and shouldn't be)
    if (!langData[key] || langData[key] === text) {
      // Don't retranslate "Medical ID" or "RoadSOS" if they naturally match, but we'll try
      if (text === "RoadSOS" || text === "Medical ID") {
          langData[key] = text;
          updated = true;
          continue;
      }
      
      console.log(`[${langCode}] Translating single: ${key}...`);
      try {
        const translated = await translateSingle(text, langCode);
        langData[key] = translated;
        updated = true;
      } catch (e) {
        console.error(`[${langCode}] Error translating ${key}: ${e.message}`);
        langData[key] = text; // fallback to English
      }
      
      // Delay to avoid hitting API rate limits
      await new Promise(r => setTimeout(r, 400));
    }
  }
  
  if (updated) {
    fs.writeFileSync(filePath, JSON.stringify(langData, null, 2) + '\n', 'utf-8');
    console.log(`[${langCode}] Saved updates.`);
  }
}

async function main() {
  const files = fs.readdirSync(i18nDir);
  for (const file of files) {
    await processLang(file);
  }
  console.log("All languages processed.");
}

main().catch(console.error);

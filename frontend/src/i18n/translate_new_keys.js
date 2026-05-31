import fs from 'fs';
import path from 'path';
import { translate } from '@vitalets/google-translate-api';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const newStrings = {
  "tutorial.icon.offline": "Save information about your area to be available even when offline",
  "sidebar.save_area": "Save Area for Offline",
  "sidebar.shortcut_info": "The shortcut to these buttons are given on the main screen with corresponding symbols as given here — features 1 to 6 exist on top bar and 7 on right side of your screen."
};

const delimiter = "\n||\n";
const textToTranslate = Object.values(newStrings).join(delimiter);
const keys = Object.keys(newStrings);

const langs = ['en', 'as', 'hi', 'te', 'ta', 'ml', 'kn', 'bn'];

async function run() {
  for (const lang of langs) {
    const filePath = path.join(__dirname, `${lang}.json`);
    
    let content = {};
    if (fs.existsSync(filePath)) {
      try {
        content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch(e) {
        console.error(`Failed to parse ${lang}.json`);
        continue;
      }
    }
    
    console.log(`Translating for ${lang}...`);
    
    if (lang === 'en') {
      keys.forEach(k => {
        content[k] = newStrings[k];
      });
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
      continue;
    }
    
    try {
      const res = await translate(textToTranslate, { to: lang });
      const translatedParts = res.text.split(/\|\|/g).map(s => s.trim().replace(/^\||\|$/g, '').trim());
      
      keys.forEach((k, i) => {
        content[k] = translatedParts[i] || newStrings[k];
      });
      
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
      
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`Failed to translate ${lang}:`, err.message);
      keys.forEach(k => {
        content[k] = newStrings[k];
      });
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
    }
  }
  console.log("Translation complete!");
}

run();

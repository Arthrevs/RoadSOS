import fs from 'fs';
import path from 'path';
import { translate } from '@vitalets/google-translate-api';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const newStrings = {
  "menu": "Menu",
  "medical_card": "Your Medical Card",
  "language": "Language",
  "plan_trip": "Plan Offline Trip",
  "manual_location": "Manual Location",
  "toggle_theme": "Dark / Light Mode",
  "recenter": "Recenter My Location",
  "tutorial": "Tutorial",
  "shortcut_info": "The shortcut to these buttons are given on the main screen with corresponding symbols as given here — features 1 to 5 exist on top bar and 6 on right side of your screen.",
  "crash_test_info": "To check our crash test demo you can go through this link:",
  "open_crash_test": "Open Crash Test Demo"
};

const delimiter = "\n||\n";
const textToTranslate = Object.values(newStrings).join(delimiter);
const keys = Object.keys(newStrings);

async function run() {
  const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.json'));
  
  for (const file of files) {
    const lang = file.replace('.json', '');
    const filePath = path.join(__dirname, file);
    
    let content = {};
    try {
      content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch(e) { continue; }
    
    console.log(`Translating for ${lang}...`);
    
    if (lang === 'en') {
      content.sidebar = newStrings;
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
      continue;
    }
    
    try {
      // Use google translate api
      const res = await translate(textToTranslate, { to: lang });
      // Split back by delimiter
      const translatedParts = res.text.split(/\|\|/g).map(s => s.trim().replace(/^\||\|$/g, '').trim());
      
      const sidebarObj = {};
      keys.forEach((k, i) => {
        sidebarObj[k] = translatedParts[i] || newStrings[k];
      });
      
      content.sidebar = sidebarObj;
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
      
      // Delay to avoid rate limit (500ms)
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`Failed to translate ${lang}:`, err.message);
      // Fallback to english
      content.sidebar = newStrings;
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
    }
  }
  console.log("Done!");
}

run();

import fs from 'fs';
import path from 'path';
import { translate } from '@vitalets/google-translate-api';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const enStrings = {
  "call_dispatcher": "Call a Dispatcher",
  "in_control": "You're in Control",
  "explain_location": "Explain the situation and share your location.",
  "loc_approx": "Location approximate",
  "acquiring_gps": "Acquiring GPS...",
  "select_service": "Select a service",
  "ambulance": "Ambulance",
  "police": "Police",
  "general": "General",
  "plus_code": "Plus Code",
  "close_go_back": "Close — go back to contacts"
};

const delimiter = "\n||\n";
const textToTranslate = Object.values(enStrings).join(delimiter);
const keys = Object.keys(enStrings);

async function run() {
  const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const lang = file.replace('.json', '');
    if (lang === 'en') continue;

    const filePath = path.join(__dirname, file);
    let content = {};
    try {
      content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) { continue; }

    // Skip if dispatcher block exists AND at least one key differs from English
    // (handles languages like French where "Ambulance" == "Ambulance")
    if (content.dispatcher) {
      const hasNonEnglish = keys.some(k =>
        content.dispatcher[k] && content.dispatcher[k] !== enStrings[k]
      );
      if (hasNonEnglish) {
        console.log(`Skipping ${lang} (already translated)`);
        continue;
      }
    }

    console.log(`Translating dispatcher for ${lang}...`);

    try {
      const res = await translate(textToTranslate, { to: lang });
      const translatedParts = res.text.split(/\|\|/g).map(s => s.trim().replace(/^\||\|$/g, '').trim());

      const dispatcherObj = {};
      keys.forEach((k, i) => {
        dispatcherObj[k] = translatedParts[i] || enStrings[k];
      });

      content.dispatcher = dispatcherObj;
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
      console.log(`  ✓ ${lang} done`);

      // 5 second delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 5000));
    } catch (err) {
      console.error(`  ✗ Failed ${lang}: ${err.message}`);
    }
  }
  console.log("All done!");
}

run();

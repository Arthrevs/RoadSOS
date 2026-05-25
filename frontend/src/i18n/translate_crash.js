import fs from 'fs';
import path from 'path';
import { translate } from '@vitalets/google-translate-api';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const enStrings = {
  "crash_detected": "CRASH DETECTED",
  "do_not_panic": "DO NOT PANIC",
  "seconds_until": "seconds until auto-SOS",
  "deceleration": "Sudden deceleration at {{speed}} km/h.",
  "emergency_contacts": "emergency contacts",
  "no_contacts": "no contacts set",
  "will_be_alerted": "will be alerted.",
  "automatic": "Automatic",
  "auto_desc": "Calls + notifies contacts",
  "manual": "Manual",
  "manual_desc": "I'll call — contacts notified",
  "im_ok_cancel": "I'M OK — CANCEL",
  "false_alarm": "False alarm? Enter PIN to silence:",
  "stop_alarm": "Stop alarm",
  "incorrect_pin": "Incorrect PIN",
  "send_sos_now": "Send SOS now"
};

// Only target the 20 languages that previously succeeded
const TARGET_LANGS = [
  'am', 'ar', 'as', 'bn', 'de', 'doi', 'el', 'es', 'fa',
  'gu', 'he', 'hi', 'id', 'it', 'ja', 'kn', 'ko', 'kok'
];

// We need to preserve {{speed}} placeholder — replace before translating, restore after
const PLACEHOLDER = '___SPEED___';

const keys = Object.keys(enStrings);

async function run() {
  // First write English
  const enPath = path.join(__dirname, 'en.json');
  const enContent = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  enContent.crash_choosing = enStrings;
  fs.writeFileSync(enPath, JSON.stringify(enContent, null, 2));
  console.log('✓ en done');

  for (const lang of TARGET_LANGS) {
    const filePath = path.join(__dirname, `${lang}.json`);
    if (!fs.existsSync(filePath)) continue;

    let content = {};
    try {
      content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) { continue; }

    console.log(`Translating crash_choosing for ${lang}...`);

    // Prepare text: replace {{speed}} with placeholder
    const delimiter = "\n||\n";
    const vals = Object.values(enStrings).map(v => v.replace('{{speed}}', PLACEHOLDER));
    const textToTranslate = vals.join(delimiter);

    try {
      const res = await translate(textToTranslate, { to: lang });
      const translatedParts = res.text.split(/\|\|/g).map(s => s.trim().replace(/^\||\|$/g, '').trim());

      const obj = {};
      keys.forEach((k, i) => {
        let val = translatedParts[i] || enStrings[k];
        // Restore placeholder
        val = val.replace(PLACEHOLDER, '{{speed}}').replace(/___SPEED___/gi, '{{speed}}');
        obj[k] = val;
      });

      content.crash_choosing = obj;
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
      console.log(`  ✓ ${lang} done`);

      await new Promise(r => setTimeout(r, 3000));
    } catch (err) {
      console.error(`  ✗ Failed ${lang}: ${err.message}`);
      content.crash_choosing = enStrings;
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
    }
  }
  console.log("All done!");
}

run();

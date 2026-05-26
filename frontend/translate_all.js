import fs from 'fs/promises';
import path from 'path';
import { translate } from '@vitalets/google-translate-api';

const i18nDir = path.join(process.cwd(), 'src', 'i18n');

// We will only translate the critical SOS messages for now to ensure safety.
const keysToTranslatePrefixes = [
  'sos.sms_'
];

async function run() {
  const files = await fs.readdir(i18nDir);
  const enPath = path.join(i18nDir, 'en.json');
  const enData = JSON.parse(await fs.readFile(enPath, 'utf8'));

  for (const file of files) {
    if (!file.endsWith('.json') || file === 'en.json' || file === 'as.json') continue;
    
    let lang = file.replace('.json', '');
    if (lang === 'zh') lang = 'zh-CN';
    if (lang === 'sa') lang = 'sa'; 
    if (lang === 'brx') lang = 'hi'; 
    if (lang === 'mni') lang = 'mni-Mtei';
    
    const filePath = path.join(i18nDir, file);
    const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
    
    let updated = false;
    
    const promises = [];

    for (const key of Object.keys(data)) {
      const needsTranslation = keysToTranslatePrefixes.some(prefix => key.startsWith(prefix));

      if (needsTranslation && data[key] === enData[key]) {
        promises.push((async () => {
          try {
            const res = await translate(data[key], { to: lang });
            console.log(`[${lang}] Translated ${key}: ${data[key]} -> ${res.text}`);
            data[key] = res.text;
            updated = true;
          } catch (err) {
            console.error(`[${lang}] Error translating ${key}: ${err.message}`);
          }
        })());
      }
    }

    await Promise.all(promises);

    if (updated) {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
      console.log(`Saved ${file}`);
    }
  }
}

run().catch(console.error);

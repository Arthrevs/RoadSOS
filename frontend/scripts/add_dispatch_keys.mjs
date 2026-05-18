// Adds dispatch TTS keys to all 47 non-English locale files.
import fs from 'node:fs';
import path from 'node:path';

const I18N_DIR = path.resolve('src/i18n');

const TRANSLATIONS = {
  hi: {
    'dispatch.accident': '{{place}} पर सड़क दुर्घटना।',
    'dispatch.injured_blocking': 'घायल व्यक्ति मौके पर हैं। वाहन यातायात को अवरुद्ध कर रहा है।',
    'dispatch.injured_clear': 'घायल व्यक्ति मौके पर हैं। वाहन यातायात को अवरुद्ध नहीं कर रहा।',
    'dispatch.no_injury_blocking': 'कोई चोट नहीं। वाहन यातायात को अवरुद्ध कर रहा है।',
    'dispatch.minor': 'मामूली घटना। कोई चोट नहीं।',
    'dispatch.send_services': 'कृपया तुरंत आपातकालीन सेवाएँ भेजें।',
    'dispatch.plus_code': 'स्थान का प्लस कोड',
    'dispatch.gps_coords': 'जीपीएस निर्देशांक',
  },
  ta: {
    'dispatch.accident': '{{place}} இல் சாலை விபத்து.',
    'dispatch.injured_blocking': 'காயமடைந்தவர்கள் நிகழ்விடத்தில் உள்ளனர். வாகனம் போக்குவரத்தை தடுக்கிறது.',
    'dispatch.injured_clear': 'காயமடைந்தவர்கள் நிகழ்விடத்தில் உள்ளனர். வாகனம் போக்குவரத்தை தடுக்கவில்லை.',
    'dispatch.no_injury_blocking': 'காயங்கள் எதுவும் இல்லை. வாகனம் போக்குவரத்தை தடுக்கிறது.',
    'dispatch.minor': 'சிறிய சம்பவம். காயங்கள் இல்லை.',
    'dispatch.send_services': 'உடனடியாக அவசர சேவைகளை அனுப்புங்கள்.',
    'dispatch.plus_code': 'இட பிளஸ் குறியீடு',
    'dispatch.gps_coords': 'ஜிபிஎஸ் ஆயங்கள்',
  },
  te: {
    'dispatch.accident': '{{place}} వద్ద రోడ్డు ప్రమాదం.',
    'dispatch.injured_blocking': 'గాయపడిన వ్యక్తులు సంఘటనా స్థలంలో ఉన్నారు. వాహనం ట్రాఫిక్‌ను అడ్డుకుంటోంది.',
    'dispatch.injured_clear': 'గాయపడిన వ్యక్తులు సంఘటనా స్థలంలో ఉన్నారు. వాహనం ట్రాఫిక్‌ను అడ్డుకోవడం లేదు.',
    'dispatch.no_injury_blocking': 'గాయాలు లేవు. వాహనం ట్రాఫిక్‌ను అడ్డుకుంటోంది.',
    'dispatch.minor': 'చిన్న సంఘటన. గాయాలు లేవు.',
    'dispatch.send_services': 'దయచేసి వెంటనే అత్యవసర సేవలు పంపండి.',
    'dispatch.plus_code': 'స్థాన ప్లస్ కోడ్',
    'dispatch.gps_coords': 'జిపిఎస్ నిర్దేశాంకాలు',
  },
  bn: {
    'dispatch.accident': '{{place}}-এ সড়ক দুর্ঘটনা।',
    'dispatch.injured_blocking': 'ঘটনাস্থলে আহত ব্যক্তি আছেন। গাড়িটি ট্র্যাফিক আটকে দিচ্ছে।',
    'dispatch.injured_clear': 'ঘটনাস্থলে আহত ব্যক্তি আছেন। গাড়িটি ট্র্যাফিক আটকাচ্ছে না।',
    'dispatch.no_injury_blocking': 'কোনো আঘাত নেই। গাড়িটি ট্র্যাফিক আটকে দিচ্ছে।',
    'dispatch.minor': 'ছোটখাটো ঘটনা। কোনো আঘাত নেই।',
    'dispatch.send_services': 'অনুগ্রহ করে অবিলম্বে জরুরি সেবা পাঠান।',
    'dispatch.plus_code': 'অবস্থানের প্লাস কোড',
    'dispatch.gps_coords': 'জিপিএস স্থানাঙ্ক',
  },
  mr: {
    'dispatch.accident': '{{place}} येथे रस्ते अपघात.',
    'dispatch.injured_blocking': 'जखमी व्यक्ती घटनास्थळी आहेत. वाहन रहदारी अडवत आहे.',
    'dispatch.injured_clear': 'जखमी व्यक्ती घटनास्थळी आहेत. वाहन रहदारी अडवत नाही.',
    'dispatch.no_injury_blocking': 'कोणतीही जखम नाही. वाहन रहदारी अडवत आहे.',
    'dispatch.minor': 'किरकोळ घटना. कोणतीही जखम नाही.',
    'dispatch.send_services': 'कृपया ताबडतोब आपत्कालीन सेवा पाठवा.',
    'dispatch.plus_code': 'स्थान प्लस कोड',
    'dispatch.gps_coords': 'जीपीएस निर्देशांक',
  },
};

const EN_FALLBACK = {
  'dispatch.accident': 'Road accident at {{place}}.',
  'dispatch.injured_blocking': 'Injured persons on scene. Vehicle is blocking traffic.',
  'dispatch.injured_clear': 'Injured persons on scene. Vehicle is not blocking traffic.',
  'dispatch.no_injury_blocking': 'No injuries reported. Vehicle is blocking traffic.',
  'dispatch.minor': 'Minor incident. No injuries reported.',
  'dispatch.send_services': 'Please send emergency services immediately.',
  'dispatch.plus_code': 'Location plus code',
  'dispatch.gps_coords': 'GPS coordinates',
};

const files = fs.readdirSync(I18N_DIR).filter((f) => f.endsWith('.json') && f !== 'en.json');

let touched = 0;
for (const file of files) {
  const code = path.basename(file, '.json');
  const filePath = path.join(I18N_DIR, file);
  const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const overrides = TRANSLATIONS[code] || {};

  let changed = false;
  for (const [key, en] of Object.entries(EN_FALLBACK)) {
    if (json[key] === undefined) {
      json[key] = overrides[key] || en;
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
    touched++;
  }
}
console.log(`Updated ${touched}/${files.length} locale files`);

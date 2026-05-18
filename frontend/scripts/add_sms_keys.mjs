// Adds sos.sms_* keys for bilingual dispatch to all 47 non-English locale files.
import fs from 'node:fs';
import path from 'node:path';

const I18N_DIR = path.resolve('src/i18n');

// Native translations for major languages. Anything missing falls back to English.
const TRANSLATIONS = {
  hi: {
    'sos.sms_emergency': '🚨 आपातकाल — मुझे मदद चाहिए।',
    'sos.sms_name': 'नाम',
    'sos.sms_blood': 'रक्त समूह',
    'sos.sms_allergies': 'एलर्जी',
    'sos.sms_conditions': 'चिकित्सीय स्थितियाँ',
    'sos.sms_plus_code': 'प्लस कोड',
    'sos.sms_near': 'पास में',
    'sos.sms_coords': 'निर्देशांक',
    'sos.sms_footer': 'RoadSOS द्वारा स्वचालित रूप से भेजा गया।',
  },
  ta: {
    'sos.sms_emergency': '🚨 அவசரநிலை — எனக்கு உதவி தேவை.',
    'sos.sms_name': 'பெயர்',
    'sos.sms_blood': 'இரத்த வகை',
    'sos.sms_allergies': 'ஒவ்வாமைகள்',
    'sos.sms_conditions': 'மருத்துவ நிலைகள்',
    'sos.sms_plus_code': 'பிளஸ் கோட்',
    'sos.sms_near': 'அருகில்',
    'sos.sms_coords': 'ஆயங்கள்',
    'sos.sms_footer': 'RoadSOS ஆல் தானாக அனுப்பப்பட்டது.',
  },
  te: {
    'sos.sms_emergency': '🚨 అత్యవసర పరిస్థితి — నాకు సహాయం అవసరం.',
    'sos.sms_name': 'పేరు',
    'sos.sms_blood': 'రక్త రకం',
    'sos.sms_allergies': 'అలెర్జీలు',
    'sos.sms_conditions': 'వైద్య పరిస్థితులు',
    'sos.sms_plus_code': 'ప్లస్ కోడ్',
    'sos.sms_near': 'దగ్గర',
    'sos.sms_coords': 'అక్షాంశాలు',
    'sos.sms_footer': 'RoadSOS ద్వారా స్వయంచాలకంగా పంపబడింది.',
  },
  bn: {
    'sos.sms_emergency': '🚨 জরুরি অবস্থা — আমার সাহায্য দরকার।',
    'sos.sms_name': 'নাম',
    'sos.sms_blood': 'রক্তের ধরন',
    'sos.sms_allergies': 'অ্যালার্জি',
    'sos.sms_conditions': 'চিকিৎসা অবস্থা',
    'sos.sms_plus_code': 'প্লাস কোড',
    'sos.sms_near': 'কাছাকাছি',
    'sos.sms_coords': 'স্থানাঙ্ক',
    'sos.sms_footer': 'RoadSOS দ্বারা স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে।',
  },
  mr: {
    'sos.sms_emergency': '🚨 आणीबाणी — मला मदत हवी.',
    'sos.sms_name': 'नाव',
    'sos.sms_blood': 'रक्तगट',
    'sos.sms_allergies': 'ऍलर्जी',
    'sos.sms_conditions': 'वैद्यकीय स्थिती',
    'sos.sms_plus_code': 'प्लस कोड',
    'sos.sms_near': 'जवळ',
    'sos.sms_coords': 'निर्देशांक',
    'sos.sms_footer': 'RoadSOS द्वारे आपोआप पाठवले.',
  },
  gu: {
    'sos.sms_emergency': '🚨 કટોકટી — મને મદદ જોઈએ.',
    'sos.sms_name': 'નામ',
    'sos.sms_blood': 'લોહીનો પ્રકાર',
    'sos.sms_allergies': 'એલર્જી',
    'sos.sms_conditions': 'તબીબી સ્થિતિ',
    'sos.sms_plus_code': 'પ્લસ કોડ',
    'sos.sms_near': 'નજીક',
    'sos.sms_coords': 'કોઓર્ડિનેટ્સ',
    'sos.sms_footer': 'RoadSOS દ્વારા આપોઆપ મોકલ્યો.',
  },
  kn: {
    'sos.sms_emergency': '🚨 ತುರ್ತು — ನನಗೆ ಸಹಾಯ ಬೇಕು.',
    'sos.sms_name': 'ಹೆಸರು',
    'sos.sms_blood': 'ರಕ್ತದ ಗುಂಪು',
    'sos.sms_allergies': 'ಅಲರ್ಜಿಗಳು',
    'sos.sms_conditions': 'ವೈದ್ಯಕೀಯ ಪರಿಸ್ಥಿತಿಗಳು',
    'sos.sms_plus_code': 'ಪ್ಲಸ್ ಕೋಡ್',
    'sos.sms_near': 'ಹತ್ತಿರ',
    'sos.sms_coords': 'ನಿರ್ದೇಶಾಂಕಗಳು',
    'sos.sms_footer': 'RoadSOS ಮೂಲಕ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಕಳುಹಿಸಲಾಗಿದೆ.',
  },
  ml: {
    'sos.sms_emergency': '🚨 അടിയന്തരാവസ്ഥ — എനിക്ക് സഹായം വേണം.',
    'sos.sms_name': 'പേര്',
    'sos.sms_blood': 'രക്തഗ്രൂപ്പ്',
    'sos.sms_allergies': 'അലർജികൾ',
    'sos.sms_conditions': 'വൈദ്യ അവസ്ഥകൾ',
    'sos.sms_plus_code': 'പ്ലസ് കോഡ്',
    'sos.sms_near': 'അടുത്ത്',
    'sos.sms_coords': 'കോർഡിനേറ്റുകൾ',
    'sos.sms_footer': 'RoadSOS വഴി യാന്ത്രികമായി അയച്ചു.',
  },
  pa: {
    'sos.sms_emergency': '🚨 ਐਮਰਜੈਂਸੀ — ਮੈਨੂੰ ਮਦਦ ਚਾਹੀਦੀ ਹੈ।',
    'sos.sms_name': 'ਨਾਮ',
    'sos.sms_blood': 'ਖੂਨ ਦੀ ਕਿਸਮ',
    'sos.sms_allergies': 'ਐਲਰਜੀ',
    'sos.sms_conditions': 'ਡਾਕਟਰੀ ਸਥਿਤੀਆਂ',
    'sos.sms_plus_code': 'ਪਲੱਸ ਕੋਡ',
    'sos.sms_near': 'ਨੇੜੇ',
    'sos.sms_coords': 'ਕੋਆਰਡੀਨੇਟ',
    'sos.sms_footer': 'RoadSOS ਦੁਆਰਾ ਆਪਣੇ ਆਪ ਭੇਜਿਆ।',
  },
  ur: {
    'sos.sms_emergency': '🚨 ایمرجنسی — مجھے مدد چاہیے۔',
    'sos.sms_name': 'نام',
    'sos.sms_blood': 'خون کی قسم',
    'sos.sms_allergies': 'الرجی',
    'sos.sms_conditions': 'طبی حالات',
    'sos.sms_plus_code': 'پلس کوڈ',
    'sos.sms_near': 'قریب',
    'sos.sms_coords': 'کوآرڈینیٹ',
    'sos.sms_footer': 'RoadSOS کے ذریعے خودکار طریقے سے بھیجا گیا۔',
  },
  ar: {
    'sos.sms_emergency': '🚨 طوارئ — أحتاج إلى مساعدة.',
    'sos.sms_name': 'الاسم',
    'sos.sms_blood': 'فصيلة الدم',
    'sos.sms_allergies': 'الحساسية',
    'sos.sms_conditions': 'الحالات الطبية',
    'sos.sms_plus_code': 'الرمز الإضافي',
    'sos.sms_near': 'بالقرب من',
    'sos.sms_coords': 'الإحداثيات',
    'sos.sms_footer': 'أُرسل تلقائيًا بواسطة RoadSOS.',
  },
  es: {
    'sos.sms_emergency': '🚨 EMERGENCIA — Necesito ayuda.',
    'sos.sms_name': 'Nombre',
    'sos.sms_blood': 'Sangre',
    'sos.sms_allergies': 'Alergias',
    'sos.sms_conditions': 'Condiciones',
    'sos.sms_plus_code': 'Código Plus',
    'sos.sms_near': 'Cerca de',
    'sos.sms_coords': 'Coordenadas',
    'sos.sms_footer': 'Enviado automáticamente por RoadSOS.',
  },
  fr: {
    'sos.sms_emergency': '🚨 URGENCE — J\'ai besoin d\'aide.',
    'sos.sms_name': 'Nom',
    'sos.sms_blood': 'Sang',
    'sos.sms_allergies': 'Allergies',
    'sos.sms_conditions': 'Conditions',
    'sos.sms_plus_code': 'Code Plus',
    'sos.sms_near': 'Près de',
    'sos.sms_coords': 'Coordonnées',
    'sos.sms_footer': 'Envoyé automatiquement par RoadSOS.',
  },
  pt: {
    'sos.sms_emergency': '🚨 EMERGÊNCIA — Preciso de ajuda.',
    'sos.sms_name': 'Nome',
    'sos.sms_blood': 'Sangue',
    'sos.sms_allergies': 'Alergias',
    'sos.sms_conditions': 'Condições',
    'sos.sms_plus_code': 'Código Plus',
    'sos.sms_near': 'Perto de',
    'sos.sms_coords': 'Coordenadas',
    'sos.sms_footer': 'Enviado automaticamente pelo RoadSOS.',
  },
  de: {
    'sos.sms_emergency': '🚨 NOTFALL — Ich brauche Hilfe.',
    'sos.sms_name': 'Name',
    'sos.sms_blood': 'Blut',
    'sos.sms_allergies': 'Allergien',
    'sos.sms_conditions': 'Erkrankungen',
    'sos.sms_plus_code': 'Plus Code',
    'sos.sms_near': 'In der Nähe von',
    'sos.sms_coords': 'Koordinaten',
    'sos.sms_footer': 'Automatisch von RoadSOS gesendet.',
  },
  ru: {
    'sos.sms_emergency': '🚨 ЭКСТРЕННАЯ ПОМОЩЬ — Мне нужна помощь.',
    'sos.sms_name': 'Имя',
    'sos.sms_blood': 'Группа крови',
    'sos.sms_allergies': 'Аллергии',
    'sos.sms_conditions': 'Состояния здоровья',
    'sos.sms_plus_code': 'Плюс-код',
    'sos.sms_near': 'Рядом',
    'sos.sms_coords': 'Координаты',
    'sos.sms_footer': 'Отправлено автоматически через RoadSOS.',
  },
  zh: {
    'sos.sms_emergency': '🚨 紧急情况 — 我需要帮助。',
    'sos.sms_name': '姓名',
    'sos.sms_blood': '血型',
    'sos.sms_allergies': '过敏史',
    'sos.sms_conditions': '医疗状况',
    'sos.sms_plus_code': 'Plus码',
    'sos.sms_near': '附近',
    'sos.sms_coords': '坐标',
    'sos.sms_footer': '由RoadSOS自动发送。',
  },
  ja: {
    'sos.sms_emergency': '🚨 緊急 — 助けが必要です。',
    'sos.sms_name': '名前',
    'sos.sms_blood': '血液型',
    'sos.sms_allergies': 'アレルギー',
    'sos.sms_conditions': '病状',
    'sos.sms_plus_code': 'プラスコード',
    'sos.sms_near': '近く',
    'sos.sms_coords': '座標',
    'sos.sms_footer': 'RoadSOSにより自動送信されました。',
  },
};

const EN_FALLBACK = {
  'sos.sms_emergency': '🚨 EMERGENCY — I need help.',
  'sos.sms_name': 'Name',
  'sos.sms_blood': 'Blood',
  'sos.sms_allergies': 'Allergies',
  'sos.sms_conditions': 'Conditions',
  'sos.sms_plus_code': 'Plus Code',
  'sos.sms_near': 'Near',
  'sos.sms_coords': 'Coords',
  'sos.sms_footer': 'Sent automatically by RoadSOS.',
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

// Supported locales for RoadSOS — Indian regional + key global languages.
// `code`    — i18next key (2-char ISO 639-1).
// `native`  — language name in its own script (for the picker).
// `english` — language name in English.
// `bcp47`   — BCP-47 tag (used for speech/locale APIs if added later).
// `dir`     — text direction; 'rtl' triggers right-to-left layout.

export const LOCALES = [
  // Indian regional (matches reference project)
  { code: 'en', native: 'English',      english: 'English',    bcp47: 'en',    dir: 'ltr' },
  { code: 'hi', native: 'हिन्दी',         english: 'Hindi',      bcp47: 'hi-IN', dir: 'ltr' },
  { code: 'bn', native: 'বাংলা',          english: 'Bengali',    bcp47: 'bn-IN', dir: 'ltr' },
  { code: 'ta', native: 'தமிழ்',          english: 'Tamil',      bcp47: 'ta-IN', dir: 'ltr' },
  { code: 'te', native: 'తెలుగు',          english: 'Telugu',     bcp47: 'te-IN', dir: 'ltr' },
  { code: 'mr', native: 'मराठी',           english: 'Marathi',    bcp47: 'mr-IN', dir: 'ltr' },
  { code: 'gu', native: 'ગુજરાતી',          english: 'Gujarati',   bcp47: 'gu-IN', dir: 'ltr' },
  { code: 'kn', native: 'ಕನ್ನಡ',            english: 'Kannada',    bcp47: 'kn-IN', dir: 'ltr' },
  { code: 'ml', native: 'മലയാളം',         english: 'Malayalam',  bcp47: 'ml-IN', dir: 'ltr' },
  { code: 'pa', native: 'ਪੰਜਾਬੀ',          english: 'Punjabi',    bcp47: 'pa-IN', dir: 'ltr' },
  // Global
  { code: 'es', native: 'Español',      english: 'Spanish',    bcp47: 'es',    dir: 'ltr' },
  { code: 'fr', native: 'Français',     english: 'French',     bcp47: 'fr',    dir: 'ltr' },
  { code: 'pt', native: 'Português',    english: 'Portuguese', bcp47: 'pt',    dir: 'ltr' },
  { code: 'de', native: 'Deutsch',      english: 'German',     bcp47: 'de',    dir: 'ltr' },
  { code: 'zh', native: '中文',           english: 'Chinese',    bcp47: 'zh',    dir: 'ltr' },
  { code: 'ja', native: '日本語',         english: 'Japanese',   bcp47: 'ja',    dir: 'ltr' },
  { code: 'ru', native: 'Русский',      english: 'Russian',    bcp47: 'ru',    dir: 'ltr' },
  { code: 'ar', native: 'العربية',       english: 'Arabic',     bcp47: 'ar',    dir: 'rtl' },
];

export const getLocale = (code) => LOCALES.find((l) => l.code === code) || LOCALES[0];

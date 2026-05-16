import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import hi from './hi.json';
import bn from './bn.json';
import ta from './ta.json';
import te from './te.json';
import mr from './mr.json';
import gu from './gu.json';
import kn from './kn.json';
import ml from './ml.json';
import pa from './pa.json';
import es from './es.json';
import fr from './fr.json';
import pt from './pt.json';
import de from './de.json';
import zh from './zh.json';
import ja from './ja.json';
import ru from './ru.json';
import ar from './ar.json';

import { LOCALES, getLocale } from './locales';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  bn: { translation: bn },
  ta: { translation: ta },
  te: { translation: te },
  mr: { translation: mr },
  gu: { translation: gu },
  kn: { translation: kn },
  ml: { translation: ml },
  pa: { translation: pa },
  es: { translation: es },
  fr: { translation: fr },
  pt: { translation: pt },
  de: { translation: de },
  zh: { translation: zh },
  ja: { translation: ja },
  ru: { translation: ru },
  ar: { translation: ar },
};

const LS_KEY = 'roadsos:lang';

function detectInitialLanguage() {
  // 1. Explicit user choice from a previous session
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved && resources[saved]) return saved;
  } catch {}

  // 2. Browser preference (only if we ship that language)
  if (typeof navigator !== 'undefined') {
    const browserLang = (navigator.language || 'en').split('-')[0].toLowerCase();
    if (resources[browserLang]) return browserLang;
  }

  return 'en';
}

const initialLang = detectInitialLanguage();

i18n.use(initReactI18next).init({
  resources,
  lng: initialLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

// Keep document direction in sync (rtl/ltr) for Arabic etc.
function applyDir(code) {
  if (typeof document === 'undefined') return;
  const loc = getLocale(code);
  document.documentElement.lang = loc.bcp47 || code;
  document.documentElement.dir = loc.dir || 'ltr';
}

applyDir(initialLang);

export function changeLanguage(code) {
  if (!resources[code]) return;
  i18n.changeLanguage(code);
  try { localStorage.setItem(LS_KEY, code); } catch {}
  applyDir(code);
}

/** Whether the user has explicitly picked a language (used to gate first-run picker). */
export function hasUserChosenLanguage() {
  try { return !!localStorage.getItem(LS_KEY); } catch { return false; }
}

export { LOCALES };
export default i18n;

/**
 * Browser Web Speech Synthesis wrapper.
 * Free, offline, no API key. Works on Chrome, Safari, Firefox, Edge.
 * Uses the device's built-in TTS voices.
 */

// Maps our i18n locale codes to BCP-47 language tags accepted by SpeechSynthesis.
// Omit entries where the code is already valid (e.g. 'hi' → 'hi-IN' is optional;
// browsers accept both). Only add entries where the code differs meaningfully.
const LANG_TO_BCP47 = {
  en:  'en-IN',   // default to Indian English for emergency context
  hi:  'hi-IN',
  bn:  'bn-IN',
  ta:  'ta-IN',
  te:  'te-IN',
  mr:  'mr-IN',
  gu:  'gu-IN',
  kn:  'kn-IN',
  ml:  'ml-IN',
  pa:  'pa-IN',
  ur:  'ur-PK',
  or:  'or-IN',
  ne:  'ne-NP',
  ar:  'ar-SA',
  fa:  'fa-IR',
  he:  'he-IL',
  zh:  'zh-CN',
  ja:  'ja-JP',
  ko:  'ko-KR',
  pt:  'pt-BR',
  fr:  'fr-FR',
  de:  'de-DE',
  es:  'es-ES',
  ru:  'ru-RU',
  tr:  'tr-TR',
};

/**
 * Convert our i18n code to a BCP-47 tag suitable for SpeechSynthesisUtterance.
 * Falls back to 'en-IN' so TTS never silently breaks.
 */
export function langToBcp47(code) {
  if (!code) return 'en-IN';
  const base = code.split('-')[0].toLowerCase();
  return LANG_TO_BCP47[base] || base;
}

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Build a human-readable dispatch message from accident context.
 *
 * @param {{ landmark, lat, lon, plusCode, injured, blocking }} ctx
 * @param {function} [t] — optional i18n translate function; falls back to English
 */
export function buildDispatchText({ landmark, lat, lon, plusCode, injured, blocking }, t) {
  const _ = t || ((key, fallback) => fallback);

  const place = landmark
    ? landmark
    : `GPS ${lat?.toFixed(4)}, ${lon?.toFixed(4)}`;

  const parts = [_('dispatch.accident', `Road accident at ${place}.`).replace('{{place}}', place)];

  // Fall back to plain English strings when keys aren't found (offline / test env)
  if (injured && blocking) {
    parts.push(_('dispatch.injured_blocking', 'Injured persons on scene. Vehicle is blocking traffic.'));
  } else if (injured) {
    parts.push(_('dispatch.injured_clear', 'Injured persons on scene. Vehicle is not blocking traffic.'));
  } else if (blocking) {
    parts.push(_('dispatch.no_injury_blocking', 'No injuries reported. Vehicle is blocking traffic.'));
  } else {
    parts.push(_('dispatch.minor', 'Minor incident. No injuries reported.'));
  }

  parts.push(_('dispatch.send_services', 'Please send emergency services immediately.'));

  // Plus Code is dispatcher-friendly — speakable letter-by-letter and
  // recognized by Indian 112 ERSS. Speak it before raw GPS.
  if (plusCode) {
    parts.push(`${_('dispatch.plus_code', 'Location plus code')}: ${plusCode.split('').join(' ')}.`);
  }

  if (lat != null && lon != null) {
    parts.push(`${_('dispatch.gps_coords', 'GPS coordinates')}: ${lat.toFixed(4)}, ${lon.toFixed(4)}.`);
  }

  return parts.join(' ');
}

/**
 * Speak text aloud using Web Speech Synthesis.
 * Cancels any ongoing speech first.
 * Returns a Promise that resolves when speech ends.
 *
 * Pass `lang` as our i18n locale code (e.g. 'hi', 'ta', 'en') —
 * it will be converted to the right BCP-47 tag automatically.
 */
export function speakText(text, { rate = 0.88, pitch = 1.0, lang = 'en' } = {}) {
  return new Promise((resolve, reject) => {
    if (!isSpeechSupported()) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.lang = langToBcp47(lang);
    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e);

    window.speechSynthesis.speak(utterance);
  });
}

/** Stop any ongoing speech immediately. */
export function cancelSpeech() {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}

/** Returns true if speech is currently playing. */
export function isSpeaking() {
  return isSpeechSupported() && window.speechSynthesis.speaking;
}

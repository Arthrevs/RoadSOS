/**
 * Local-only Emergency Medical ID.
 *
 * Stores blood type, allergies, conditions, current medications, an
 * emergency contact, and organ-donor preference so a first responder
 * arriving at a crash scene can glance at the victim's phone and have
 * the critical info to start treatment.
 *
 * Design principles:
 * - 100% client-side: data lives in localStorage. Never sent to the
 *   server. No PII leaves the device. (Privacy is a real concern with
 *   medical info — we don't compromise on it.)
 * - Lockscreen-friendly format: the display modal is high-contrast,
 *   no auth required to view (matches Apple Health Medical ID).
 * - Survives uninstall? No — that's a trade-off we accept for privacy.
 */

const STORAGE_KEY = 'roadsos_medical_id_v1';

/** Schema: every field is optional so partial completion is fine. */
const EMPTY = {
  name: '',
  age: '',
  months: '',
  bloodType: '',          // O+, A-, etc.
  allergies: '',          // free text
  conditions: '',         // free text — diabetes, asthma, etc.
  medications: '',        // free text
  primaryContactName: '',
  primaryContactPhone: '',
  secondaryContactName: '',
  secondaryContactPhone: '',
  tertiaryContactName: '',
  tertiaryContactPhone: '',
  organDonor: false,
};

/**
 * Returns the list of configured emergency contacts (1–3) as
 * [{ name, phone }] with empties filtered out.
 */
export function getEmergencyContacts() {
  const m = getMedicalId();
  return [
    { name: m.primaryContactName,   phone: m.primaryContactPhone   },
    { name: m.secondaryContactName,  phone: m.secondaryContactPhone  },
    { name: m.tertiaryContactName,   phone: m.tertiaryContactPhone   },
  ].filter(c => c.phone && c.phone.trim().length > 0);
}

export function getMedicalId() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY };
  }
}

export function saveMedicalId(data) {
  try {
    // Only persist known fields — defends against accidental injection.
    const clean = {};
    for (const k of Object.keys(EMPTY)) {
      if (k in data) clean[k] = data[k];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    return true;
  } catch {
    return false;
  }
}

export function clearMedicalId() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

/** True if the user filled out at least one meaningful field. */
export function hasMedicalId() {
  const m = getMedicalId();
  return !!(
    m.name || m.bloodType || m.allergies || m.conditions
    || m.medications || m.primaryContactPhone
  );
}

export function getMedicalIdCompletion(data = null) {
  const m = data || getMedicalId();
  const keys = ["name", "age", "bloodType", "allergies", "conditions", "medications", "primaryContactName", "primaryContactPhone"];
  const count = keys.filter(k => (m[k] || "").toString().trim()).length;
  return Math.round((count / keys.length) * 100);
}

/**
 * Compose an SMS body for SOS-by-SMS, using the Medical ID + coordinates.
 *
 * @param {object} args
 * @param {number} args.lat
 * @param {number} args.lon
 * @param {string} args.plusCode
 * @param {string} [args.landmark]
 * @returns {string}
 */
/**
 * Build one SMS block (native or English) from medical data + location.
 * @param {object} m        — Medical ID object
 * @param {function} tFn    — i18n translate function (t) for this language
 * @param {number} lat
 * @param {number} lon
 * @param {string} [plusCode]
 * @param {string} [landmark]
 */
function buildSmsBlock(m, tFn, lat, lon, plusCode, landmark) {
  const lines = [];
  lines.push(tFn('sos.sms_emergency', '🚨 EMERGENCY — I need help.'));
  if (m.name)       lines.push(`${tFn('sos.sms_name', 'Name')}: ${m.name}${m.age ? `, age ${m.age}` : ''}`);
  if (m.bloodType)  lines.push(`${tFn('sos.sms_blood', 'Blood')}: ${m.bloodType}`);
  if (m.allergies)  lines.push(`${tFn('sos.sms_allergies', 'Allergies')}: ${m.allergies}`);
  if (m.conditions) lines.push(`${tFn('sos.sms_conditions', 'Conditions')}: ${m.conditions}`);
  lines.push('');
  if (plusCode) lines.push(`${tFn('sos.sms_plus_code', 'Plus Code')}: ${plusCode}`);
  if (landmark) lines.push(`${tFn('sos.sms_near', 'Near')}: ${landmark}`);
  lines.push(`${tFn('sos.sms_coords', 'Coords')}: ${lat.toFixed(5)}, ${lon.toFixed(5)}`);
  lines.push(`Map: https://maps.google.com/?q=${lat.toFixed(6)},${lon.toFixed(6)}`);
  lines.push('');
  lines.push(tFn('sos.sms_footer', 'Sent automatically by RoadSOS.'));
  return lines.join('\n');
}

/**
 * Build the SOS SMS body.
 *
 * When the user's chosen language is not English, the message contains
 * TWO blocks separated by a divider:
 *   1. Native language — readable by a local bystander or family member
 *   2. English         — readable by emergency dispatchers + paramedics
 *
 * When already in English, a single block is emitted to keep it concise.
 *
 * @param {{ lat, lon, plusCode, landmark }} opts
 * @param {function} [tNative] — i18n translate function for the user's language
 * @param {string}   [lang]    — BCP-47 language code (e.g. 'hi', 'ta', 'en')
 */
export function buildSosSmsBody({ lat, lon, plusCode, landmark }, tNative, lang) {
  const m = getMedicalId();

  // English-only fallback t() — returns the second argument as plain string
  const tEn = (key, fallback) => fallback;

  const currentLang = (lang || 'en').toLowerCase().split('-')[0];

  // If already English, or no native t() provided, emit single block
  if (currentLang === 'en' || !tNative) {
    return buildSmsBlock(m, tEn, lat, lon, plusCode, landmark);
  }

  const nativeBlock = buildSmsBlock(m, tNative, lat, lon, plusCode, landmark);
  const enBlock     = buildSmsBlock(m, tEn, lat, lon, plusCode, landmark);

  // Combine: native first (bystander/family), then English (paramedics/dispatch)
  return `${nativeBlock}\n\n——————————\n\n${enBlock}`;
}

/**
 * Compose an `sms:` URL the browser/OS will open in the native SMS app.
 * On iOS we use `&body=`, on Android `?body=`. Modern browsers handle
 * both — we use `?body=` which is more portable.
 */
export function buildSosSmsHref(phone, body) {
  // sms:+91XXX?body=encoded
  const clean = (phone || '').replace(/[^\d+]/g, '');
  return `sms:${clean}?body=${encodeURIComponent(body)}`;
}

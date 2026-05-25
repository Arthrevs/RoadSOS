import React, { useState, useEffect } from "react";
import { User, Droplets, Phone, Check, ArrowRight, Shield, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getMedicalId, saveMedicalId, hasMedicalId } from '../utils/medicalId';

const FONT = `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif`;
const MONO  = `'SF Mono', 'Fira Code', 'Consolas', monospace`;

const BLOOD_TYPES = ["O+", "O−", "A+", "A−", "B+", "B−", "AB+", "AB−", "Unknown"];

/* Organ donation — open palm holding a heart, matching reference */
function HandHeart({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M40 34 C40 34 24 22 24 14 C24 9 27.6 5 32 5 C35 5 37.8 6.8 40 10 C42.2 6.8 45 5 48 5 C52.4 5 56 9 56 14 C56 22 40 34 40 34Z"
        fill="#E8637A" stroke="#333333" strokeWidth="1.8" strokeLinejoin="round"
      />
      <path
        d="M16 52 C17 46 22 43 28 42 L40 40 L52 42 C58 43 63 46 64 52"
        fill="none" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M28 42 C26 38 25 33 27 30 C28.5 28 31 28.5 31 31 L31 40"
        fill="none" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M52 42 C54 38 55 33 53 30 C51.5 28 49 28.5 49 31 L49 40"
        fill="none" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M16 52 C15 55 15 59 18 61 L62 61 C65 59 65 55 64 52"
        fill="none" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M18 61 C18 64 20 67 24 68 L56 68 C60 67 62 64 62 61"
        fill="none" stroke="#333333" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

const css = `
.medical-id-fullscreen {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: transparent;
  z-index: 9999;
  overflow-y: auto;
}

.medical-id-fullscreen *, .medical-id-fullscreen *::before, .medical-id-fullscreen *::after {
  box-sizing: border-box; margin: 0; padding: 0;
  -webkit-tap-highlight-color: transparent;
  -webkit-font-smoothing: antialiased;
}

.medical-id-fullscreen .app {
  min-height: 100dvh;
  max-width: 430px;
  margin: 0 auto;
  background: #1E344F;
  padding-bottom: 24px;
  font-family: ${FONT};
}

/* ── Hero ─────────────────────────── */
.medical-id-fullscreen .hero {
  padding: 50px 18px 16px;
}
.medical-id-fullscreen .hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: rgba(29,78,216,0.18);
  border: 1px solid rgba(59,130,246,0.25);
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
  color: #60A5FA;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  margin-bottom: 10px;
}
.medical-id-fullscreen .hero-title {
  font-size: 24px;
  font-weight: 700;
  color: #C8DDEF;
  letter-spacing: -0.5px;
  line-height: 1.15;
  margin-bottom: 8px;
}
.medical-id-fullscreen .hero-title em { font-style: normal; color: #3B82F6; }
.medical-id-fullscreen .hero-desc {
  font-size: 12px;
  color: #5A80A8;
  line-height: 1.55;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.medical-id-fullscreen .hero-desc span { display: flex; align-items: center; gap: 5px; }
.medical-id-fullscreen .desc-dot { width: 4px; height: 4px; border-radius: 50%; background: #3B82F6; flex-shrink: 0; }

/* ── Privacy banner ──────────────── */
.medical-id-fullscreen .privacy-banner {
  margin: 10px 16px 18px;
  padding: 11px 14px;
  background: linear-gradient(135deg, #0D2545 0%, #0A1E3A 100%);
  border: 1px solid #1D4ED8;
  border-radius: 12px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.medical-id-fullscreen .privacy-icon-box {
  width: 30px; height: 30px;
  border-radius: 8px;
  background: #1D4ED8;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.medical-id-fullscreen .privacy-body { flex: 1; }
.medical-id-fullscreen .privacy-title {
  font-size: 12px;
  font-weight: 700;
  color: #93C5FD;
  margin-bottom: 3px;
  letter-spacing: 0.01em;
}
.medical-id-fullscreen .privacy-text {
  font-size: 11px;
  color: #4A7AB5;
  line-height: 1.55;
}
.medical-id-fullscreen .privacy-text strong { color: #60A5FA; font-weight: 600; }

/* ── Progress ─────────────────────── */
.medical-id-fullscreen .progress-label {
  margin: 0 18px 5px;
  font-size: 10px;
  font-weight: 500;
  color: #4A7AAC;
  display: flex;
  justify-content: space-between;
}
.medical-id-fullscreen .progress-bar {
  margin: 0 16px 20px;
  height: 3px;
  background: #2A4A6A;
  border-radius: 999px;
  overflow: hidden;
}
.medical-id-fullscreen .progress-fill {
  height: 100%;
  background: #22C55E;
  border-radius: 999px;
  transition: width 0.4s ease;
}

/* ── Section ──────────────────────── */
.medical-id-fullscreen .sec { margin: 0 0 18px; }
.medical-id-fullscreen .sec-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 18px 8px;
}
.medical-id-fullscreen .sec-icon {
  width: 24px; height: 24px;
  border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.medical-id-fullscreen .sec-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #93C5FD;
}

/* ── White card ───────────────────── */
.medical-id-fullscreen .card { background: #13273D; margin: 0 14px; border-radius: 14px; overflow: hidden; border: 1px solid #1C3652; }

.medical-id-fullscreen .field { padding: 10px 14px 0; border-bottom: 1px solid #1C3652; }
.medical-id-fullscreen .field:last-child { border-bottom: none; padding-bottom: 0; }

.medical-id-fullscreen .field-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #8AAAC8;
  margin-bottom: 4px;
}
.medical-id-fullscreen .field-input {
  width: 100%;
  border: none; outline: none;
  font-size: 15px;
  font-weight: 500;
  color: #E2E8F0;
  font-family: ${FONT};
  background: transparent;
  padding-bottom: 10px;
  appearance: none;
}
.medical-id-fullscreen .field-input::placeholder { color: #4A7AB5; font-weight: 400; }
.medical-id-fullscreen .field-select {
  width: 100%;
  border: none; outline: none;
  font-size: 15px;
  font-weight: 500;
  color: #E2E8F0;
  font-family: ${FONT};
  background: transparent;
  padding-bottom: 10px;
  appearance: none;
  cursor: pointer;
}
.medical-id-fullscreen .field-select option {
  background: #13273D;
  color: #E2E8F0;
}
.medical-id-fullscreen .field-select.ph { color: #4A7AB5; font-weight: 400; }

.medical-id-fullscreen .field-row { display: flex; }
.medical-id-fullscreen .field-row .field { flex: 1; }
.medical-id-fullscreen .field-row .field + .field { border-left: 1px solid #1C3652; }

.medical-id-fullscreen .field-note {
  font-size: 10px;
  color: #5A8AB5;
  padding: 8px 16px 6px;
  margin: 0 14px;
  background: rgba(255,255,255,0.06);
  border-radius: 0 0 10px 10px;
  font-style: italic;
  font-weight: 500;
  border-top: 1px solid #2A4A6A;
}

/* ── Contact cards ────────────────── */
.medical-id-fullscreen .contact-card {
  background: #13273D;
  margin: 0 14px 7px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #1C3652;
}
.medical-id-fullscreen .contact-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 13px 8px;
  border-bottom: 1px solid #1C3652;
  background: #0D1D2D;
}
.medical-id-fullscreen .contact-num {
  font-size: 10px;
  font-weight: 700;
  color: #93C5FD;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.medical-id-fullscreen .contact-optional {
  font-size: 9px;
  font-weight: 500;
  color: #5A8AB5;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 2px 7px;
  background: #091523;
  border-radius: 999px;
}
.medical-id-fullscreen .contact-field { padding: 9px 13px 0; border-bottom: 1px solid #1C3652; }
.medical-id-fullscreen .contact-field:last-child { border-bottom: none; padding-bottom: 0; }
.medical-id-fullscreen .contact-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #8AAAC8;
  margin-bottom: 3px;
}
.medical-id-fullscreen .contact-input {
  width: 100%;
  border: none; outline: none;
  font-size: 15px;
  font-weight: 500;
  color: #E2E8F0;
  font-family: ${FONT};
  background: transparent;
  padding-bottom: 9px;
}
.medical-id-fullscreen .contact-input::placeholder { color: #4A7AB5; font-weight: 400; }
.medical-id-fullscreen .phone-input { font-family: ${MONO}; font-size: 14px; letter-spacing: 0.04em; }

/* ── Organ donor ──────────────────── */
.medical-id-fullscreen .donor-card {
  margin: 0 14px;
  background: #13273D;
  border: 1px solid #1C3652;
  border-radius: 12px;
  padding: 13px 14px;
  display: flex;
  align-items: center;
  gap: 11px;
  cursor: pointer;
}
.medical-id-fullscreen .donor-icon {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: rgba(248, 113, 113, 0.15);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.medical-id-fullscreen .donor-body { flex: 1; }
.medical-id-fullscreen .donor-title { font-size: 14px; font-weight: 600; color: #E2E8F0; }
.medical-id-fullscreen .donor-sub   { font-size: 11px; color: #7A9CC0; margin-top: 1px; }

.medical-id-fullscreen .ios-switch {
  width: 44px; height: 26px;
  border-radius: 999px;
  background: #2A4A6A;
  position: relative;
  cursor: pointer;
  border: none; outline: none;
  transition: background 0.22s;
  flex-shrink: 0;
}
.medical-id-fullscreen .ios-switch.on { background: #1D4ED8; }
.medical-id-fullscreen .ios-switch::after {
  content: '';
  position: absolute;
  top: 3px; left: 3px;
  width: 20px; height: 20px;
  border-radius: 50%;
  background: #FFFFFF;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: transform 0.22s cubic-bezier(.34,1.56,.64,1);
}
.medical-id-fullscreen .ios-switch.on::after { transform: translateX(18px); }

/* ── Bottom bar ───────────────────── */
.medical-id-fullscreen .bottom-bar {
  padding: 18px 14px 32px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.medical-id-fullscreen .save-btn {
  width: 100%; height: 52px;
  background: #1D4ED8;
  border: none; border-radius: 13px;
  color: #fff;
  font-family: ${FONT};
  font-size: 15px; font-weight: 700;
  letter-spacing: -0.2px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: background 0.18s, transform 0.13s;
  box-shadow: 0 4px 18px rgba(29,78,216,0.35);
}
.medical-id-fullscreen .save-btn:hover  { background: #2563EB; }
.medical-id-fullscreen .save-btn:active { transform: scale(0.98); }
.medical-id-fullscreen .save-btn.saved  { background: #065F46; box-shadow: 0 4px 18px rgba(6,95,70,0.32); }

.medical-id-fullscreen .skip-btn {
  width: 100%; height: 36px;
  background: transparent; border: none;
  color: #4A7AAC;
  font-family: ${FONT};
  font-size: 13px; font-weight: 500;
  cursor: pointer; transition: color 0.15s;
}
.medical-id-fullscreen .skip-btn:hover { color: #334E72; }
`;

function calcProgress(data) {
  const keys = ["name","age","bloodType","allergies","conditions","medications","primaryContactName","primaryContactPhone"];
  const count = keys.filter(k => (data[k] || "").toString().trim()).length;
  return Math.round((count / keys.length) * 100);
}

const CONTACTS = [
  { prefix: "primary", labelKey: "medical_id.contact1_label", labelDef: "Contact 1", required: true  },
  { prefix: "secondary", labelKey: "medical_id.contact2_label", labelDef: "Contact 2", required: false },
  { prefix: "tertiary", labelKey: "medical_id.contact3_label", labelDef: "Contact 3", required: false },
];

export default function MedicalIdModal({ open, onClose, startInEdit = false, mapTheme = 'dark' }) {
  const { t } = useTranslation();
  const [data, setData] = useState(getMedicalId());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setData(getMedicalId());
      setSaved(false);
    }
  }, [open]);

  if (!open) return null;

  const set = (k, v) => setData(p => ({ ...p, [k]: v }));
  const pct = calcProgress(data);
  const numOnly = v => v.replace(/\D/g, "");

  const handleSave = () => {
    saveMedicalId(data);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      if (onClose) onClose();
    }, 1200);
  };

  return (
    <>
      <style>{css}</style>
      <div className="medical-id-fullscreen">
        <div className={`app theme-${mapTheme}`}>

          {/* Hero */}
          <div className="hero">
            <div className="hero-badge"><Shield size={10} strokeWidth={2.5} /> {t('medical_id.badge', 'Medical ID')}</div>
            <div className="hero-title">{t('medical_id.welcome_title', 'Set Up Your')}<br /><em>{t('medical_id.title', 'Medical Profile')}</em></div>
            <div className="hero-desc">
              <span><div className="desc-dot"/>{t('medical_id.welcome_subtitle', 'Paramedics can access this if you are unconscious')}</span>
              <span><div className="desc-dot"/>{t('medical_id.subtitle', 'Takes about 30 seconds · Stored only on this device')}</span>
            </div>
          </div>

          {/* Privacy banner — prominent */}
          <div className="privacy-banner">
            <div className="privacy-icon-box">
              <Shield size={15} color="#FFFFFF" strokeWidth={2} />
            </div>
            <div className="privacy-body">
              <div className="privacy-title">{t('medical_id.privacy_title', 'Your data never leaves this device')}</div>
              <div className="privacy-text">
                {t('medical_id.privacy_text', 'Stored locally only. Never uploaded to any server. Only shared with emergency services when SOS is activated.')}
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="progress-label">
            <span>{t('medical_id.profile_completion', 'Profile completion')}</span>
            <span style={{ color: "#22C55E", fontWeight: 700 }}>{pct}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>

          {/* ── Personal ── */}
          <div className="sec">
            <div className="sec-head">
              <div className="sec-icon" style={{ background: "rgba(29,78,216,0.15)" }}>
                <User size={13} color="#3B82F6" strokeWidth={2} />
              </div>
              <span className="sec-title">{t('medical_id.personal', 'Personal')}</span>
            </div>
            <div className="card">
              <div className="field">
                <div className="field-label">{t('medical_id.name', 'Full name')}</div>
                <input className="field-input" type="text" placeholder={t('medical_id.name_placeholder', 'e.g. Arjun Sharma')}
                  value={data.name || ""} onChange={e => set("name", e.target.value)} />
              </div>
              <div className="field-row">
                <div className="field">
                  <div className="field-label">{t('medical_id.age', 'Age (years)')}</div>
                  <input className="field-input" type="number" placeholder="e.g. 24"
                    min="0" max="180"
                    value={data.age || ""} onChange={e => {
                      const v = Math.min(180, Math.max(0, Number(e.target.value)));
                      set("age", v || "");
                    }} />
                </div>
                <div className="field">
                  <div className="field-label">{t('medical_id.months', 'Months')} <span style={{ fontWeight:400, textTransform:"none", letterSpacing:0, fontSize:9 }}>{t('medical_id.months_hint', '(if <1 yr)')}</span></div>
                  <input className="field-input" type="number" placeholder="0–11"
                    min="0" max="11"
                    value={data.months || ""} onChange={e => {
                      const v = Math.min(11, Math.max(0, Number(e.target.value)));
                      set("months", v || "");
                    }} />
                </div>
              </div>
              <div className="field-note">{t('medical_id.months_note', 'Months field — necessary for children less than 1 year')}</div>
            </div>
          </div>

          {/* ── Medical ── */}
          <div className="sec">
            <div className="sec-head">
              <div className="sec-icon" style={{ background: "rgba(220,38,38,0.12)" }}>
                <Droplets size={13} color="#F87171" strokeWidth={2} />
              </div>
              <span className="sec-title">{t('medical_id.medical_details', 'Medical Details')}</span>
            </div>
            <div className="card">
              <div className="field">
                <div className="field-label">{t('medical_id.blood_type', 'Blood type')}</div>
                <select className={`field-select${!data.bloodType ? " ph" : ""}`}
                  value={data.bloodType || ""} onChange={e => set("bloodType", e.target.value)}>
                  <option value="" disabled>{t('medical_id.select_blood_type', 'Select blood type')}</option>
                  {BLOOD_TYPES.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div className="field">
                <div className="field-label">{t('medical_id.allergies', 'Allergies')}</div>
                <input className="field-input" type="text" placeholder={t('medical_id.allergies_placeholder', 'e.g. penicillin, peanuts, latex')}
                  value={data.allergies || ""} onChange={e => set("allergies", e.target.value)} />
              </div>
              <div className="field">
                <div className="field-label">{t('medical_id.conditions', 'Medical conditions')}</div>
                <input className="field-input" type="text" placeholder={t('medical_id.conditions_placeholder', 'e.g. asthma, diabetes type 2')}
                  value={data.conditions || ""} onChange={e => set("conditions", e.target.value)} />
              </div>
              <div className="field">
                <div className="field-label">{t('medical_id.medications', 'Current medications')}</div>
                <input className="field-input" type="text" placeholder={t('medical_id.medications_placeholder', 'e.g. metformin, salbutamol')}
                  value={data.medications || ""} onChange={e => set("medications", e.target.value)} />
              </div>
            </div>
          </div>

          {/* ── Emergency Contacts ── */}
          <div className="sec">
            <div className="sec-head">
              <div className="sec-icon" style={{ background: "rgba(15,118,110,0.15)" }}>
                <Phone size={13} color="#14B8A6" strokeWidth={2} />
              </div>
              <span className="sec-title">{t('medical_id.contacts_label', 'Emergency Contacts')}</span>
            </div>
            <div style={{ padding:"0 18px 8px", fontSize:11, color:"#1A3A60", lineHeight:1.5 }}>
              {t('medical_id.contacts_hint', 'SOS messages will be sent to all contacts simultaneously.')}
            </div>
            {CONTACTS.map(({ prefix, labelKey, labelDef, required }) => (
              <div className="contact-card" key={prefix}>
                <div className="contact-head">
                  <span className="contact-num">{t(labelKey, labelDef)}</span>
                  {!required && <span className="contact-optional">{t('medical_id.optional', 'Optional')}</span>}
                </div>
                <div className="contact-field">
                  <div className="contact-label">{t('medical_id.name_label', 'Name')}</div>
                  <input className="contact-input" type="text"
                    placeholder={required ? t('medical_id.example_mum', 'e.g. Mum, Dad, Rahul') : t('medical_id.leave_blank', 'Leave blank to skip')}
                    value={data[`${prefix}ContactName`] || ""}
                    onChange={e => set(`${prefix}ContactName`, e.target.value)} />
                </div>
                <div className="contact-field">
                  <div className="contact-label">{t('medical_id.phone_label', 'Phone number')}</div>
                  <input className="contact-input phone-input"
                    type="tel" inputMode="numeric" placeholder={t('medical_id.phone_placeholder', 'e.g. 9198765432')}
                    value={data[`${prefix}ContactPhone`] || ""}
                    onChange={e => set(`${prefix}ContactPhone`, numOnly(e.target.value))}
                    maxLength={13} />
                </div>
              </div>
            ))}
          </div>

          {/* ── Organ Donor ── */}
          <div className="sec">
            <div className="sec-head">
              <div className="sec-icon" style={{ background: "rgba(220,38,38,0.1)" }}>
                <HandHeart size={13} />
              </div>
              <span className="sec-title">{t('medical_id.organ_donor_section', 'Organ Donation')}</span>
            </div>
            <div className="donor-card" onClick={() => set("organDonor", !data.organDonor)}>
              <div className="donor-icon">
                <HandHeart size={24} />
              </div>
              <div className="donor-body">
                <div className="donor-title">{t('medical_id.organ_donor', 'I am an organ donor')}</div>
                <div className="donor-sub">{t('medical_id.organ_donor_sub', 'Visible to emergency responders')}</div>
              </div>
              <button className={`ios-switch${data.organDonor ? " on" : ""}`}
                onClick={e => { e.stopPropagation(); set("organDonor", !data.organDonor); }} />
            </div>
          </div>

          {/* Bottom bar — inside .app so it flows after organ donation */}
          <div className="bottom-bar">
            <button className={`save-btn${saved ? " saved" : ""}`} onClick={handleSave}>
              {saved
                ? <><Check size={17} strokeWidth={2.5}/> {t('medical_id.saved', 'Medical ID Saved')}</>
                : <><ArrowRight size={16} strokeWidth={2.2}/> {t('medical_id.save', 'Save Medical ID')}</>}
            </button>
            <button className="skip-btn" onClick={() => onClose?.()}>
              {hasMedicalId() ? t('medical_id.close', 'Close') : t('medical_id.skip', 'Skip for now — set up later')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

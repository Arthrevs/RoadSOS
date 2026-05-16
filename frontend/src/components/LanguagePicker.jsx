import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LOCALES, changeLanguage } from '../i18n';

/**
 * First-launch language picker.
 *
 * Renders as a full-screen modal that gates the rest of the app until the
 * user explicitly picks a language. After a selection is saved to
 * localStorage, the picker is no longer shown on subsequent launches
 * (App reads `hasUserChosenLanguage()` to decide).
 *
 * Also accessible later via Medical ID modal's language switch.
 */
export default function LanguagePicker({ onConfirm }) {
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState(i18n.language || 'en');

  const handlePick = (code) => {
    setSelected(code);
    // Live preview — change language immediately so the user sees the
    // "Continue" button update in their chosen language before tapping it.
    changeLanguage(code);
  };

  const handleConfirm = () => {
    changeLanguage(selected);
    onConfirm?.(selected);
  };

  return (
    <div className="lang-picker-overlay" role="dialog" aria-modal="true">
      <div className="lang-picker-card">
        <div className="lang-picker-header">
          <div className="lang-picker-cross" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v20M2 12h20" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div className="lang-picker-title">{t('lang.title')}</div>
            <div className="lang-picker-subtitle">{t('lang.subtitle')}</div>
          </div>
        </div>

        <div className="lang-picker-grid">
          {LOCALES.map((loc) => (
            <button
              key={loc.code}
              type="button"
              className={`lang-picker-tile ${selected === loc.code ? 'is-selected' : ''}`}
              onClick={() => handlePick(loc.code)}
              aria-pressed={selected === loc.code}
              dir={loc.dir || 'ltr'}
            >
              <span className="lang-picker-native">{loc.native}</span>
              <span className="lang-picker-english">{loc.english}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="lang-picker-continue"
          onClick={handleConfirm}
        >
          {t('lang.continue')} →
        </button>
      </div>
    </div>
  );
}

import React from 'react';
import { Activity, ShieldAlert, Flame, PhoneCall } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { guardedTelDial } from '../utils/demoMode';
import './BottomNotch.css';

const EMERGENCY_CONFIG = [
  { key: 'ambulance', labelKey: 'Medical',  i18nKey: 'emergency.ambulance', Icon: Activity,   iconColor: '#F04438' },
  { key: 'police',    labelKey: 'Police',   i18nKey: 'emergency.police',    Icon: ShieldAlert, iconColor: '#1D62D3' },
  { key: 'fire',      labelKey: 'Fire',     i18nKey: 'emergency.fire',      Icon: Flame,      iconColor: '#F04438' },
  { key: 'general',   labelKey: 'Disaster', i18nKey: 'emergency.disaster',  Icon: PhoneCall,  iconColor: '#737373' },
];

export default function BottomNotch({
  numbers,
  onPrioritize,
  triaged,
  hidden,
}) {
  const { t } = useTranslation();

  if (!numbers) return null;

  const { police, ambulance, fire, general } = numbers;
  const vals = { police, ambulance, fire, general };

  /* Side cards (Medical / Police): icon on top → label → number, vertically stacked */
  const renderSideCard = (key) => {
    const config = EMERGENCY_CONFIG.find(c => c.key === key);
    if (!config) return null;
    const { labelKey, i18nKey, Icon, iconColor } = config;
    const num = vals[key];
    if (!num) return null;
    const label = t(i18nKey, labelKey);

    return (
      <a
        key={key}
        href={`tel:${num}`}
        className={`bn-card bn-card--side ${key}`}
        aria-label={`Call ${label}: ${num}`}
        onClick={(e) => guardedTelDial(e, num, label)}
        style={{ '--theme-color': iconColor }}
      >
        <div className="bn-card-bg-number">{num}</div>
        <Icon size={18} color={iconColor} strokeWidth={2.5} className="bn-side-icon" />
        <span className="bn-side-label">{labelKey}</span>
        <span className="bn-side-num" style={{ color: iconColor }}>{num}</span>
      </a>
    );
  };

  /* Center cards (Fire / Disaster): icon left → label right, number below */
  const renderCenterCard = (key) => {
    const config = EMERGENCY_CONFIG.find(c => c.key === key);
    if (!config) return null;
    const { labelKey, i18nKey, Icon, iconColor } = config;
    const num = vals[key];
    if (!num) return null;
    const label = t(i18nKey, labelKey);

    return (
      <a
        key={key}
        href={`tel:${num}`}
        className={`bn-card bn-card--center ${key}`}
        aria-label={`Call ${label}: ${num}`}
        onClick={(e) => guardedTelDial(e, num, label)}
        style={{ '--theme-color': iconColor }}
      >
        <div className="bn-card-bg-number">{num}</div>
        <div className="bn-center-row">
          <Icon size={12} color={iconColor} strokeWidth={2.5} />
          <span className="bn-center-label">{labelKey}</span>
        </div>
        <span className="bn-center-num" style={{ color: iconColor }}>{num}</span>
      </a>
    );
  };

  return (
    <div className={`bottom-notch-container ${hidden ? 'hidden' : ''}`}>
      <div className="bottom-notch">
        <div className="bn-layout">
          {renderSideCard('ambulance')}

          <div className="bn-center-col">
            <button className="bn-header-btn" onClick={onPrioritize}>
              {triaged ? t('actions.re_prioritise', 'Re-prioritize') : 'Prioritize My Situation'}
            </button>
            <div className="bn-center-grid">
              {renderCenterCard('fire')}
              {renderCenterCard('general')}
            </div>
          </div>

          {renderSideCard('police')}
        </div>
      </div>
    </div>
  );
}

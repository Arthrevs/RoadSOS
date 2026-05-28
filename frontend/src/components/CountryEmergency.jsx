import React from 'react';
import { Ambulance, Shield, Flame, Phone, Hospital, Truck, Disc, Car } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { guardedTelDial } from '../utils/demoMode';

const EMERGENCY_CONFIG = [
  { key: 'ambulance', i18nKey: 'emergency.ambulance', short: 'AMB', Icon: Ambulance, color: '#DC2626' },
  { key: 'police',    i18nKey: 'emergency.police',    short: 'POL', Icon: Shield,    color: '#1D4ED8' },
  { key: 'fire',      i18nKey: 'emergency.fire',      short: 'FIR', Icon: Flame,     color: '#F59E0B' },
  { key: 'general',   i18nKey: 'emergency.disaster',  short: 'DIS', Icon: Phone,     color: '#22C55E' },
];

// Rulebook lists six mandatory service categories. The four cards above
// cover police, ambulance and the disaster/general line. These four close
// the gap (hospital, towing, tyre, showroom) by surfacing the nearest
// contact's phone as a one-tap dial when /search returned one. If no
// contact in the category has a phone, the card is skipped (no fake dials).
const NEARBY_CONFIG = [
  { key: 'hospital', i18nKey: 'category.hospital', short: 'HOSP', Icon: Hospital, color: '#DC2626', match: ['hospital'] },
  { key: 'towing',   i18nKey: 'category.towing',   short: 'TOW',  Icon: Truck,    color: '#7C3AED', match: ['towing'] },
  { key: 'tyre',     i18nKey: 'category.puncture', short: 'TYRE', Icon: Disc,     color: '#0284C7', match: ['tyre', 'puncture'] },
  { key: 'showroom', i18nKey: 'category.showroom', short: 'SHOW', Icon: Car,      color: '#0F766E', match: ['showroom'] },
];

function pickPhoneForCategory(contacts, match) {
  if (!Array.isArray(contacts)) return null;
  for (const c of contacts) {
    if (!c?.phone) continue;
    const cat = (c.category || '').toLowerCase();
    if (match.includes(cat)) return c;
  }
  return null;
}

export default function CountryEmergency({ numbers, contacts }) {
  const { t } = useTranslation();
  if (!numbers) return null;

  const { police, ambulance, fire, general } = numbers;
  const vals = { police, ambulance, fire, general };

  const nearbyCards = NEARBY_CONFIG
    .map((cfg) => ({ cfg, contact: pickPhoneForCategory(contacts, cfg.match) }))
    .filter((row) => row.contact);

  return (
    <>
      <div className="national-grid">
        {EMERGENCY_CONFIG.map(({ key, i18nKey, short, Icon, color }) => {
          const num = vals[key];
          if (!num) return null;
          const label = t(i18nKey);

          return (
            <a
              key={key}
              href={`tel:${num}`}
              className="nat-card"
              id={`ce-btn-${key}`}
              data-num={num}
              aria-label={`Call ${label}: ${num}`}
              onClick={(e) => guardedTelDial(e, num, label)}
            >
              <div className="nat-icon" style={{ background: color + '22' }}>
                <Icon size={20} color={color} strokeWidth={2.3} />
              </div>
              <div className="nat-body">
                <div className="nat-label" data-short={short}>{label}</div>
                <div className="nat-num">{num}</div>
              </div>
            </a>
          );
        })}
      </div>

      {nearbyCards.length > 0 && (
        <div className="national-grid" style={{ marginTop: 8 }}>
          {nearbyCards.map(({ cfg, contact }) => {
            const { key, i18nKey, short, Icon, color } = cfg;
            const label = t(i18nKey);
            const phone = contact.phone;
            return (
              <a
                key={key}
                href={`tel:${phone}`}
                className="nat-card"
                id={`ce-btn-${key}`}
                data-num={phone}
                aria-label={`Call ${label}: ${contact.name || phone}`}
                title={contact.name || ''}
                onClick={(e) => guardedTelDial(e, phone, label)}
              >
                <div className="nat-icon" style={{ background: color + '22' }}>
                  <Icon size={20} color={color} strokeWidth={2.3} />
                </div>
                <div className="nat-body">
                  <div className="nat-label" data-short={short}>{label}</div>
                  <div
                    className="nat-num"
                    style={{ fontSize: 13, color, letterSpacing: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {phone}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </>
  );
}

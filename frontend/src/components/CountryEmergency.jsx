import React from 'react';
import { Ambulance, Shield, Flame, Phone } from 'lucide-react';
import { guardedTelDial } from '../utils/demoMode';

const EMERGENCY_CONFIG = [
  { key: 'ambulance', label: 'Ambulance', Icon: Ambulance, color: '#1D4ED8' },
  { key: 'police',    label: 'Police',    Icon: Shield,    color: '#4338CA' },
  { key: 'fire',      label: 'Fire',      Icon: Flame,     color: '#0369A1' },
  { key: 'general',   label: 'General',   Icon: Phone,     color: '#0F766E' },
];

export default function CountryEmergency({ numbers }) {
  if (!numbers) return null;

  const { police, ambulance, fire, general } = numbers;
  const vals = { police, ambulance, fire, general };

  return (
    <div className="national-grid">
      {EMERGENCY_CONFIG.map(({ key, label, Icon, color }) => {
        const num = vals[key];
        if (!num) return null;

        return (
          <a
            key={key}
            href={`tel:${num}`}
            className="nat-card"
            id={`ce-btn-${key}`}
            aria-label={`Call ${label}: ${num}`}
            onClick={(e) => guardedTelDial(e, num, label)}
          >
            <div className="nat-icon" style={{ background: color + '18' }}>
              <Icon size={17} color={color} strokeWidth={2} />
            </div>
            <div className="nat-body">
              <div className="nat-num">{num}</div>
              <div className="nat-label">{label}</div>
            </div>
            {/* accent strip */}
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: 3, borderRadius: '14px 0 0 14px', background: color
            }} />
          </a>
        );
      })}
    </div>
  );
}

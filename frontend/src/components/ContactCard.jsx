import React from 'react';
import { Hospital, Shield, Ambulance, Truck, Wrench, Cog, Car, PhoneCall, Zap } from 'lucide-react';
import { guardedTelDial } from '../utils/demoMode';

const CATEGORY_CONFIG = {
  hospital:  { Icon: Hospital,  dot: '#2563EB' },
  police:    { Icon: Shield,    dot: '#4338CA' },
  ambulance: { Icon: Ambulance, dot: '#0EA5E9' },
  towing:    { Icon: Truck,     dot: '#475569' },
  repair:    { Icon: Wrench,    dot: '#0F766E' },
  tyre:      { Icon: Cog,       dot: '#6366F1' },
  showroom:  { Icon: Car,       dot: '#10B981' },
};

export default function ContactCard({ contact, isLast }) {
  const { name, category, distance, phone, isOpen, aiReason } = contact;

  const phoneClean = phone ? phone.replace(/\s+/g, '') : null;
  const callHref   = phoneClean ? `tel:${phoneClean}` : null;

  const cat = (category || 'repair').toLowerCase();
  const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.repair;
  const { Icon, dot } = config;

  const distText = typeof distance === 'number' ? `${distance.toFixed(1)} km` : '';

  return (
    <div className="svc-card">
      {aiReason && (
        <div className="svc-ai">
          <Zap size={13} fill="currentColor" />
          <span>{aiReason}</span>
        </div>
      )}
      
      {/* Name row */}
      <div className="svc-main">
        <div className="svc-icon" style={{ background: dot + '18' }}>
          <Icon size={17} color={dot} strokeWidth={2} />
        </div>
        <div className="svc-info">
          <div className="svc-name">{name}</div>
          <div className="svc-status-row">
            {isOpen === true && (
              <>
                <div className="open-dot" />
                <span className="open-label">Open</span>
              </>
            )}
            {isOpen === false && (
              <>
                <div className="closed-dot" />
                <span className="closed-label">Closed</span>
              </>
            )}
            {isOpen === null && (
              <span className="svc-dist" style={{ fontSize: 11 }}>Status unknown</span>
            )}
          </div>
        </div>
        {distText && <span className="svc-dist">{distText}</span>}
      </div>

      {/* Call button row — big, unmissable */}
      <div className="call-row">
        {callHref ? (
          <a
            href={callHref}
            className="call-btn"
            id={`call-btn-${phoneClean}`}
            aria-label={`Call ${name} at ${phone}`}
            onClick={(e) => guardedTelDial(e, phoneClean, name)}
          >
            <PhoneCall size={15} color="#2563EB" strokeWidth={2.2} className="call-btn-icon" />
            <span className="call-btn-num">{phone}</span>
          </a>
        ) : (
          <div className="call-btn" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            <PhoneCall size={15} color="#2563EB" strokeWidth={2.2} className="call-btn-icon" />
            <span className="call-btn-num">No phone</span>
          </div>
        )}
      </div>

      {!isLast && <div className="svc-divider" />}
    </div>
  );
}

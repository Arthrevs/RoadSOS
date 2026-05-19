import React from 'react';
import { useTranslation } from 'react-i18next';
import { Hospital, Shield, Ambulance, Truck, Wrench, Cog, Car, PhoneCall, Navigation, Zap } from 'lucide-react';
import { guardedTelDial } from '../utils/demoMode';

const CATEGORY_CONFIG = {
  hospital:  { Icon: Hospital,  dot: '#DC2626' },
  police:    { Icon: Shield,    dot: '#1D4ED8' },
  ambulance: { Icon: Ambulance, dot: '#DC2626' },
  towing:    { Icon: Truck,     dot: '#0F766E' },
  repair:    { Icon: Wrench,    dot: '#0F766E' },
  tyre:      { Icon: Cog,       dot: '#6366F1' },
  showroom:  { Icon: Car,       dot: '#10B981' },
};

export default function ContactCard({ contact, isLast }) {
  const { t } = useTranslation();
  const { name, category, distance, phone, isOpen, aiReason, lat, lon } = contact;

  const phoneClean = phone ? phone.replace(/\s+/g, '') : null;
  const callHref   = phoneClean ? `tel:${phoneClean}` : null;

  const mapsHref = (typeof lat === 'number' && typeof lon === 'number')
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&destination_place_id=${encodeURIComponent(name || '')}`
    : null;

  const cat = (category || 'repair').toLowerCase();
  const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.repair;
  const { Icon, dot } = config;

  const kmValue = typeof distance === 'number' ? distance.toFixed(1) : '—';

  // Determine status for left border color (green=reachable, amber=open but far, slate=closed)
  let statusAttr = 'reachable';
  if (isOpen === false) statusAttr = 'closed';
  else if (typeof distance === 'number' && distance >= 4) statusAttr = 'far';

  return (
    <div className="svc-card" data-status={statusAttr}>
      <div className="svc-card-left">
        <div className="svc-card-dist">{kmValue}</div>
        <div className="svc-card-unit">KM</div>
      </div>
      
      <div className="svc-card-right">
        {aiReason && (
          <div className="svc-ai">
            <Zap size={13} fill="currentColor" />
            <span>{aiReason}</span>
          </div>
        )}

        <div className="svc-name">{name}</div>
        <div className="svc-status-row">
          {isOpen === true && (
            <>
              <div className="open-dot" />
              <span className="open-label">{t('card.open')}</span>
            </>
          )}
          {isOpen === false && (
            <>
              <div className="closed-dot" />
              <span className="closed-label">{t('card.closed')}</span>
            </>
          )}
          {isOpen === null && (
            <span style={{ fontSize: 10 }}>{t('card.unknown_status')}</span>
          )}
          <span style={{ color: 'var(--rs-slate-500)' }}>·</span>
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, fontSize: 10 }}>
            {t(`category.${cat === 'tyre' ? 'puncture' : cat}`, cat)}
          </span>
        </div>

        <div className="call-row">
          {callHref ? (
            <a
              href={callHref}
              className="call-btn"
              id={`call-btn-${phoneClean}`}
              aria-label={`Call ${name} at ${phone}`}
              onClick={(e) => guardedTelDial(e, phoneClean, name)}
            >
              <PhoneCall size={14} className="call-btn-icon" strokeWidth={2.4} fill="currentColor" />
              <span className="call-btn-num">{phone}</span>
            </a>
          ) : (
            <div className="call-btn" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
              <PhoneCall size={14} strokeWidth={2.4} fill="currentColor" />
              <span className="call-btn-num">{t('actions.no_phone')}</span>
            </div>
          )}

          {mapsHref && (
            <a
              href={mapsHref}
              className="maps-link"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open directions to ${name} in Google Maps`}
            >
              <Navigation size={12} color="currentColor" strokeWidth={2.4} />
              {t('actions.directions')}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

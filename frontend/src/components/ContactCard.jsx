import React from 'react';
import { useTranslation } from 'react-i18next';
import { Hospital, Shield, Ambulance, Truck, Wrench, Cog, Car, PhoneCall, Phone, Navigation, Zap } from 'lucide-react';
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

export default function ContactCard({ contact, isLast, variant }) {
  const { t } = useTranslation();
  const { name, category, distance, phone, isOpen, aiReason, lat, lon } = contact;

  const phoneClean = phone ? phone.replace(/\s+/g, '') : null;
  const callHref   = phoneClean ? `tel:${phoneClean}` : null;

  const mapsHref = (typeof lat === 'number' && typeof lon === 'number')
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`
    : null;

  const cat = (category || 'repair').toLowerCase();
  const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.repair;
  const { Icon, dot } = config;

  const kmValue = typeof distance === 'number' ? distance.toFixed(1) : '—';

  // Determine status for left border color (green=reachable, amber=open but far, slate=closed)
  let statusAttr = 'reachable';
  if (isOpen === false) statusAttr = 'closed';
  else if (typeof distance === 'number' && distance >= 4) statusAttr = 'far';

  if (variant === 'popup') {
    let catClass = 'cat-neutral';
    if (cat === 'hospital' || cat === 'ambulance') catClass = 'cat-medical';
    else if (cat === 'police') catClass = 'cat-police';
    else if (cat === 'fire') catClass = 'cat-fire';

    return (
      <div className={`rs-popup-card-v2 ${catClass}`}>
        <div className="card-name">{name}</div>
        <div className="card-rule"></div>
        <div className="card-actions">
          {callHref && (
            <>
              <button 
                className="ic-btn btn-call" 
                title="Call"
                onClick={(e) => guardedTelDial(e, phoneClean, name)}
              >
                <svg className="rs-popup-svg" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.06 6.06l.91-.91a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7a2 2 0 0 1 1.72 2.01z"/></svg>
              </button>
              <div className="ic-sep"></div>
            </>
          )}
          
          <button 
            className="ic-btn" 
            title="Directions"
            onClick={() => {
              if (mapsHref) window.open(mapsHref, '_blank');
            }}
          >
            <svg className="rs-popup-svg" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cc-card">
      {aiReason && (
        <div className="svc-ai" style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, fontSize: 10 }}>
          <Zap size={11} fill="currentColor" />
          <span>{aiReason}</span>
        </div>
      )}

      <div className="cc-row-top">
        <div className="cc-dist-block">
          <span className="cc-dist-num">{kmValue}</span>
          <span className="cc-dist-unit">{t('card.km', 'KM')}</span>
        </div>
        {mapsHref ? (
          <a href={mapsHref} className="cc-dir-btn" target="_blank" rel="noopener noreferrer" aria-label={`Open directions to ${name} in Google Maps`}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11"/>
            </svg>
            {t('actions.directions')}
          </a>
        ) : (
          <div className="cc-dir-btn" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11"/>
            </svg>
            {t('actions.directions')}
          </div>
        )}
      </div>

      <div className="cc-row-mid">
        <div className="cc-card-name">{name}</div>
        <div className="cc-card-tags">
          {isOpen === true && (
            <div className="cc-tag-status"><div className="cc-tag-dot open"></div>{t('card.open')}</div>
          )}
          {isOpen === false && (
            <div className="cc-tag-status"><div className="cc-tag-dot closed"></div>{t('card.closed')}</div>
          )}
          {isOpen === null && (
            <div className="cc-tag-status">{t('card.unknown_status')}</div>
          )}
          
          <div className="cc-tag-sep"></div>
          <span className="cc-tag-type">{t(`category.${cat === 'tyre' ? 'puncture' : cat}`, cat)}</span>
        </div>
      </div>

      {callHref ? (
        <a
          href={callHref}
          className="cc-call-btn"
          id={`call-btn-${phoneClean}`}
          aria-label={`Call ${name} at ${phone}`}
          onClick={(e) => guardedTelDial(e, phoneClean, name)}
        >
          <div className="cc-phone-icon-wrap">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.06 6.06l.91-.91a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7a2 2 0 0 1 1.72 2.01z"/>
            </svg>
          </div>
          <span className="cc-phone-num">{phone}</span>
        </a>
      ) : (
        <div className="cc-call-btn" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
          <div className="cc-phone-icon-wrap">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.06 6.06l.91-.91a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7a2 2 0 0 1 1.72 2.01z"/>
            </svg>
          </div>
          <span className="cc-phone-num">{t('actions.no_phone')}</span>
        </div>
      )}
    </div>
  );
}

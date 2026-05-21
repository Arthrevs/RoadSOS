import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Hospital, Shield, Ambulance, Truck, Car, PhoneCall, Siren, WifiOff, Map, AlertTriangle, Zap, Cog, Loader2, RotateCw, MapPin, Globe, Activity, Sun, Moon, Copy, Check, Link } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import RealMap from './RealMap';
import ManualLocationModal from './ManualLocationModal';
import { subscribeBackendStatus } from '../utils/backendWarmup';
import { setManualLocation, refreshGpsLocation } from '../hooks/useLocation';
import { getEmergencyContacts, buildSosSmsBody } from '../utils/medicalId';
import { encodePlusCode } from '../utils/plusCodes';
import { isWaCountry } from '../utils/sosDispatch';
import { triggerSOSAlert } from '../utils/sosAlert';
import { createTrackingSession } from '../utils/trackingSession';

const CAT_ICONS = {
  hospital: Hospital,
  ambulance: Ambulance,
  police: Shield,
  fire: Siren,
  towing: Truck,
  repair: Car,
  showroom: Car,
  tyre: Cog
};

const CAT_TONES = {
  hospital: 'red',
  ambulance: 'red',
  police: 'blue',
  fire: 'red',
  towing: 'teal',
  repair: 'teal',
  showroom: 'teal',
  tyre: 'teal'
};

const CAT_BG = {
  red: { bg: 'rgba(220,38,38,0.12)', fg: '#DC2626' },
  blue: { bg: 'rgba(29,78,216,0.12)', fg: '#1D4ED8' },
  teal: { bg: 'rgba(20,184,166,0.14)', fg: '#0F766E' },
};

function MiniContact({ contact, last }) {
  const { t } = useTranslation();
  const cat = (contact.category || 'repair').toLowerCase();
  // Backend's "tyre" category maps to the user-facing "puncture" label key
  // (CAT_ICONS/TONES still keyed by raw category name)
  const labelKey = cat === 'tyre' ? 'puncture' : cat;
  const Icon = CAT_ICONS[cat] || Hospital;
  const tone = CAT_TONES[cat] || 'teal';
  const colors = CAT_BG[tone];

  const phoneClean = contact.phone ? contact.phone.replace(/\s+/g, '') : null;
  const callHref = phoneClean ? `tel:${phoneClean}` : null;

  return (
    <a
      href={callHref || '#'}
      className="mh-mini-contact"
      style={{
        borderBottomLeftRadius: last ? 14 : 0,
        borderBottomRightRadius: last ? 14 : 0,
      }}
    >
      <span className="mh-mini-icon" style={{ background: colors.bg }}>
        <Icon size={13} color={colors.fg} strokeWidth={2.3} />
      </span>
      <span className="mh-mini-body">
        <span className="mh-mini-name">{contact.name}</span>
        <span className="mh-mini-meta">
          {t(`category.${labelKey}`, labelKey.charAt(0).toUpperCase() + labelKey.slice(1))}{' '}
          <span style={{ color: '#CBD5E1' }}>·</span>{' '}
          <span style={{ fontFamily: 'var(--rs-font-mono)' }}>
            {typeof contact.distance === 'number' ? contact.distance.toFixed(1) : '?'} km
          </span>
        </span>
      </span>
      <span className="mh-mini-call">
        <PhoneCall size={10} color="#1D4ED8" strokeWidth={2.4} fill="#1D4ED8" />
      </span>
    </a>
  );
}

/**
 * MapHero — the map-anchored home hero section.
 * Wraps map background, service markers, user dot, SOS button, and quick contacts dock.
 */
export default function MapHero({
  location,
  landmark,
  countryCode,
  contacts,
  topContact,
  isOnline,
  gpsLost,
  onFirstTap,
  // Action buttons
  onPlanTrip,
  onMedicalId,
  medicalIdConfigured,
  onTestCrash,
  demoMode,
  // Truthful status signals: even if /health returned 200, we shouldn't
  // claim ONLINE while the user is staring at bundled fallback data.
  searchLoading,
  usingFallbackData,
  onLanguagePicker,
  theme,
  onToggleTheme,
  onCopy,
}) {
  const { t } = useTranslation();
  // Pick up to 6 nearest contacts for markers on real map
  const [copied, setCopied] = useState(false);
  const markerContacts = (contacts || []).slice(0, 6);
  const dockContacts = (contacts || []).slice(0, 2);

  // Backend readiness — drives the warming-up state of the status pill.
  const [backendStatus, setBackendStatus] = useState('unknown');
  const [refreshing, setRefreshing] = useState(false);
  const [manualLocationOpen, setManualLocationOpen] = useState(false);
  const mapRef = useRef(null);
  useEffect(() => subscribeBackendStatus(setBackendStatus), []);

  // ── SOS State ──
  const [sosSent,       setSosSent]       = useState(false);
  const [sosDispatched, setSosDispatched] = useState(false);
  const [trackingUrl,   setTrackingUrl]   = useState(null);
  const [trackLoading,  setTrackLoading]  = useState(false);
  const [trackCopied,   setTrackCopied]   = useState(false);
  const tappedRef = useRef(false);

  const hasLocation = !!(location?.lat && location?.lon);
  const preferWA    = isWaCountry(countryCode);
  const emergencyContacts = getEmergencyContacts();
  const hasContacts = emergencyContacts.length > 0;

  const phonesKey = emergencyContacts.map(c => c.phone).join(',');
  const sosData = React.useMemo(() => {
    if (!hasLocation) return { body: '', primaryWaUrl: '', allSmsUrl: '', perContact: [] };
    const plusCode = encodePlusCode(location.lat, location.lon);
    const msgBody  = buildSosSmsBody({ lat: location.lat, lon: location.lon, plusCode, landmark });
    const waUrlFn  = (phone, body) => {
      const num = (phone || '').replace(/[^\d+]/g, '').replace(/^\+/, '');
      return `https://wa.me/${num}?text=${encodeURIComponent(body)}`;
    };
    const smsUrlFn = (phones, body) => {
      const nums = (Array.isArray(phones) ? phones : [phones])
        .map(p => (p || '').replace(/[^\d+]/g, '')).filter(Boolean).join(',');
      return `sms:${nums}?body=${encodeURIComponent(body)}`;
    };
    if (emergencyContacts.length === 0) {
      const enc = encodeURIComponent(msgBody);
      return { body: msgBody, primaryWaUrl: `https://wa.me/?text=${enc}`, allSmsUrl: `sms:?body=${enc}`, perContact: [], waUrlFn, smsUrlFn };
    }
    return {
      body: msgBody,
      primaryWaUrl: waUrlFn(emergencyContacts[0].phone, msgBody),
      allSmsUrl: smsUrlFn(emergencyContacts.map(c => c.phone), msgBody),
      perContact: emergencyContacts.map(c => ({
        name: c.name || c.phone,
        waHref: waUrlFn(c.phone, msgBody),
        smsHref: smsUrlFn([c.phone], msgBody),
      })),
      waUrlFn,
      smsUrlFn,
    };
  }, [hasLocation, location?.lat, location?.lon, landmark, phonesKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopyClick = async (e) => {
    e.stopPropagation();
    if (onCopy) {
      await onCopy();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSOS = () => {
    if (!tappedRef.current) { tappedRef.current = true; onFirstTap?.(); }
    if (!hasLocation) return;
    triggerSOSAlert();
    const { primaryWaUrl, allSmsUrl, perContact } = sosData;
    if (preferWA && hasContacts) {
      window.open(primaryWaUrl, '_blank');
    } else if (!preferWA && emergencyContacts.length > 1) {
      window.location.href = allSmsUrl;
    } else if (hasContacts) {
      const win = window.open(primaryWaUrl, '_blank');
      setTimeout(() => { if (!win || win.closed || win.closed === undefined) window.location.href = perContact[0]?.smsHref || allSmsUrl; }, 800);
    } else {
      const win = window.open(primaryWaUrl, '_blank');
      setTimeout(() => { if (!win || win.closed || win.closed === undefined) window.location.href = allSmsUrl; }, 800);
    }
    setSosSent(true);
    setSosDispatched(true);
    setTimeout(() => setSosSent(false), 2500);
    setTrackingUrl(null);
    setTrackLoading(true);
    createTrackingSession(location, landmark).then(url => {
      setTrackingUrl(url);
      setTrackLoading(false);
    });
    try {
      window.dispatchEvent(new CustomEvent('roadsos:sos-sent', {
        detail: { location, landmark, countryCode, contacts: emergencyContacts },
      }));
    } catch {}
  };

  const handleCopyTrackingUrl = async () => {
    if (!trackingUrl) return;
    try { await navigator.clipboard.writeText(trackingUrl); setTrackCopied(true); setTimeout(() => setTrackCopied(false), 2500); } catch {}
  };

  useEffect(() => {
    const handleOpen = () => setManualLocationOpen(true);
    window.addEventListener('open-manual-location', handleOpen);
    return () => window.removeEventListener('open-manual-location', handleOpen);
  }, []);

  // ── Manual location refresh (fixes stale browser geolocation cache on laptops) ──
  // Clears any manual override, then forces a fresh GPS acquisition via the
  // useLocation hook's GPS_REFRESH_EVENT — which commits the new position to
  // React state so activeLocation actually updates (previous version only
  // toggled the spinner without ever touching state).
  const handleRefreshLocation = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshGpsLocation();
    } finally {
      setRefreshing(false);
    }
  }, []);

  // ── Handle manual location set ──
  // setManualLocation() dispatches roadsos:manual-location which the running
  // useLocation() hook catches, updating App.jsx's activeLocation and
  // triggering a fresh /search call for the new coords.
  const handleSetManualLocation = useCallback((locData) => {
    setManualLocation(locData.lat, locData.lon, locData.landmark);
    setManualLocationOpen(false);
  }, []);

  const formatCoords = (loc) => {
    if (!loc?.lat || !loc?.lon) return t('location.waiting');
    const ns = loc.lat >= 0 ? 'N' : 'S';
    const ew = loc.lon >= 0 ? 'E' : 'W';
    return `${Math.abs(loc.lat).toFixed(4)}°${ns} · ${Math.abs(loc.lon).toFixed(4)}°${ew}`;
  };

  return (
    <div className="map-hero">
      {/* Real GPS-anchored map (Leaflet + OSM)
          - draggable: user can pan/pinch to explore
          - countryCode drives the Survey-of-India boundary overlay
            when the user is in India (full J&K + Aksai Chin shown) */}
      <RealMap
        ref={mapRef}
        location={location}
        contacts={markerContacts}
        countryCode={countryCode}
        gpsLost={gpsLost}
        draggable={true}
        zoom={15}
      />

      {/* Compact header */}
      <div className="map-hero-header">
        <div className="mh-top-row">
          <div className="mh-brand-shield">
            <Shield size={28} color="#3B82F6" fill="#3B82F6" style={{ position: 'absolute', top: 0, left: 0 }} />
            <Activity size={14} color="#ffffff" strokeWidth={2.5} style={{ position: 'relative', zIndex: 1, marginTop: '-1px' }} />
          </div>


        </div>

        <div className="mh-location" style={{ marginTop: '4px' }}>
          <div className="mh-location-name">{landmark || location?.landmark || t('location.finding')}</div>
          <div className="mh-location-coords">
            {formatCoords(location)}
            {gpsLost && ' · ' + t('location.cached')}
          </div>
        </div>
      </div>

      {/* Bottom dock gradient + Quick contacts */}
      <div className="map-hero-dock">
        {/* SOS Button — above tap-to-call card */}
        <div className="glass-sos-container">
          <div className="glass-sos-row" style={{ position: 'relative' }}>
            <button
              id="sos-main-btn"
              className={`glass-sos-btn${sosSent ? ' sent' : ''}${!hasLocation ? ' disabled' : ''}`}
              onClick={handleSOS}
              disabled={!hasLocation}
            >
              {!hasLocation ? '⏳ Waiting for GPS…' : sosSent ? '✓ SOS Sent' : '🆘 SOS — Send My Location'}
            </button>
            <div className="mh-copy-btn" onClick={handleCopyClick}>
              {copied ? (
                <Check size={16} color="#22C55E" strokeWidth={2.5} />
              ) : (
                <Copy size={16} color="rgba(255,255,255,0.7)" strokeWidth={2} />
              )}
            </div>
          </div>

          {/* Dispatch follow-up panel */}
          {sosDispatched && hasContacts && hasLocation && (
            <div className="sos-dispatch">
              <div className="sos-dispatch__header">
                {preferWA
                  ? `WhatsApp sent to ${sosData.perContact[0]?.name}. Also notify:`
                  : emergencyContacts.length > 1
                    ? `SMS sent to all ${emergencyContacts.length} contacts. Also via WhatsApp:`
                    : `Sent to ${sosData.perContact[0]?.name}. Also:`
                }
              </div>
              <div className="sos-dispatch__links">
                {sosData.perContact.map((c, i) => {
                  const showWa  = !preferWA || i > 0;
                  const showSms = preferWA || emergencyContacts.length === 1;
                  return (
                    <div key={i} className="sos-dispatch__row">
                      <span className="sos-dispatch__name">{c.name}</span>
                      <div className="sos-dispatch__btns">
                        {showWa && <a href={c.waHref} target="_blank" rel="noopener noreferrer" className="sos-dispatch__btn sos-dispatch__btn--wa">💬 WA</a>}
                        {showSms && <a href={c.smsHref} className="sos-dispatch__btn sos-dispatch__btn--sms">📱 SMS</a>}
                      </div>
                    </div>
                  );
                })}
                {preferWA && emergencyContacts.length > 0 && (
                  <a href={sosData.allSmsUrl} className="sos-dispatch__group-link">📱 SMS all {emergencyContacts.length} contacts at once</a>
                )}
              </div>
              <div className="sos-track-block">
                <span className="sos-track-label"><Link size={11} strokeWidth={2.3} />{t('track.share_prompt')}</span>
                {trackLoading && <span className="sos-track-creating"><Loader2 size={11} strokeWidth={2.4} className="sos-track-spin" />{t('track.creating')}</span>}
                {!trackLoading && trackingUrl && (
                  <div className="sos-track-url-row">
                    <span className="sos-track-url">{trackingUrl}</span>
                    <button className="sos-track-copy" onClick={handleCopyTrackingUrl}>
                      {trackCopied ? <><Check size={11} strokeWidth={2.5} /> {t('track.copied')}</> : <><Copy size={11} strokeWidth={2} /> {t('track.copy_link')}</>}
                    </button>
                  </div>
                )}
                {!trackLoading && !trackingUrl && <span className="sos-track-unavailable">{t('track.failed')}</span>}
              </div>
              <button className="sos-dispatch__done" onClick={() => setSosDispatched(false)}>✓ Done</button>
            </div>
          )}
        </div>

        {dockContacts.length > 0 && (
          <div className="mh-dock-card">
            <div className="mh-dock-header">
              <span className="mh-dock-kicker">{t('dock.nearest', { count: dockContacts.length })}</span>
              <a href="#nearby-services" className="mh-dock-seeall">{t('dock.see_all')} →</a>
            </div>
            {dockContacts.map((c, i) => (
              <MiniContact key={c.id || i} contact={c} last={i === dockContacts.length - 1} />
            ))}
          </div>
        )}
      </div>

      <ManualLocationModal
        open={manualLocationOpen}
        onClose={() => setManualLocationOpen(false)}
        onSetLocation={handleSetManualLocation}
        mapRef={mapRef}
      />
    </div>
  );
}

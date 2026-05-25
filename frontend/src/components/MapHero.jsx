import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Hospital, Shield, Ambulance, Truck, Car, PhoneCall, Siren, WifiOff, Map, AlertTriangle, Zap, Cog, Loader2, RotateCw, MapPin, Globe, Activity, Moon, Sun, X, Crosshair, ExternalLink, Info, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import RealMap from './RealMap';
import SOSButton from './SOSButton';
import ManualLocationModal from './ManualLocationModal';
import { subscribeBackendStatus } from '../utils/backendWarmup';
import { setManualLocation, refreshGpsLocation } from '../hooks/useLocation';

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
  const tone = CAT_TONES[cat] || 'teal';
  const colors = CAT_BG[tone];

  const phoneClean = contact.phone ? contact.phone.replace(/\s+/g, '') : null;
  const callHref = phoneClean ? `tel:${phoneClean}` : null;

  const kmText = typeof contact.distance === 'number' ? contact.distance.toFixed(1) + ' km' : '? km';
  const typeLabel = t(`category.${labelKey}`, labelKey.charAt(0).toUpperCase() + labelKey.slice(1));

  return (
    <div
      className="mh-row"
      onClick={() => { if (callHref) window.location.href = callHref; }}
      style={{
        borderBottomLeftRadius: last ? 16 : 0,
        borderBottomRightRadius: last ? 16 : 0,
      }}
    >
      <div className="mh-row-accent" style={{ background: colors.fg + '80' }}></div>
      <div className="mh-row-body">
        <div className="mh-row-top">
          <div className="mh-row-name">{contact.name}</div>
          <span className="mh-dist-pill">{kmText}</span>
        </div>
        <div className="mh-row-type">{typeLabel}</div>
        <div className="mh-row-num-line">
          <span className="mh-row-num">{contact.phone || t('actions.no_phone')}</span>
          <button
            className="mh-call-chip"
            onClick={(e) => { e.stopPropagation(); if (callHref) window.location.href = callHref; }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.06 6.06l.91-.91a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7a2 2 0 0 1 1.72 2.01z"/>
            </svg>
            {t('actions.call', 'Call')}
          </button>
        </div>
      </div>
    </div>
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
  medicalIdCompletion = 0,
  onTestCrash,
  demoMode,
  // Truthful status signals: even if /health returned 200, we shouldn't
  // show "Online" if the frontend is still showing cached/bundled fallback
  // because the live /search call hasn't succeeded yet.
  searchLoading,
  usingFallbackData,
  onLanguagePicker,
  mapTheme = 'dark',
  onToggleTheme,
  forceSidebarOpen,
  forceInfoOpen,
  onTutorialStart,
}) {
  const { t } = useTranslation();
  // Pick up to 6 nearest contacts for markers on real map
  const markerContacts = (contacts || []).slice(0, 6);
  const dockContacts = (contacts || []).slice(0, 3);

  // Backend readiness — drives the warming-up state of the status pill.
  // 'warming' / 'cold' downgrade the green online indicator to amber so
  // the user understands the search backend is still spinning up.
  const [backendStatus, setBackendStatus] = useState('unknown');
  const [refreshing, setRefreshing] = useState(false);
  const [manualLocationOpen, setManualLocationOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [showScrollArrow, setShowScrollArrow] = useState(true);
  const mapRef = useRef(null);
  const dockCardRef = useRef(null);

  // Observer to hide the down arrow when the first contact card is visible
  useEffect(() => {
    if (!dockCardRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // If the card is intersecting (visible), hide the arrow
        setShowScrollArrow(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(dockCardRef.current);
    return () => observer.disconnect();
  }, [dockContacts.length]);

  // Sync with tutorial props
  useEffect(() => {
    if (forceSidebarOpen !== undefined) {
      setSidebarOpen(forceSidebarOpen);
    }
  }, [forceSidebarOpen]);

  useEffect(() => {
    if (forceInfoOpen !== undefined) {
      setInfoModalOpen(forceInfoOpen);
    }
  }, [forceInfoOpen]);

  // Prevent background scrolling when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  useEffect(() => subscribeBackendStatus(setBackendStatus), []);

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
          - countryCode passed through for future locale-aware styling */}
      <RealMap
        ref={mapRef}
        location={location}
        contacts={markerContacts}
        countryCode={countryCode}
        gpsLost={gpsLost}
        draggable={true}
        zoom={15}
        theme={mapTheme}
        mapTheme={mapTheme}
        onToggleSidebar={() => setSidebarOpen(true)}
      />

      {/* Top gradient overlay for header readability */}
      <div className="map-hero-top-fade" />

      {/* Compact header */}
      <div className="map-hero-header">
        <div className="mh-top-row">
          {/* Action strip — Medical ID, Plan Trip, Refresh Location, Set Location, status pill */}
          <div className={`toolbar toolbar-${mapTheme}`}>
            <button
              className="btn-icon"
              onClick={handleRefreshLocation}
              disabled={refreshing}
              title={t('actions.refresh_location', 'Refresh location')}
              aria-label={t('actions.refresh_location', 'Refresh location')}
            >
              <RotateCw size={19} strokeWidth={1.8} className={refreshing ? 'mh-action-spin' : ''} />
              <span className="tip">Reload</span>
            </button>
            {onToggleTheme && (
              <button
                className="btn-icon"
                onClick={onToggleTheme}
                title="Toggle Dark/Light Mode"
                aria-label="Toggle Dark/Light Mode"
              >
                {mapTheme === 'light' ? <Moon size={19} strokeWidth={1.8} /> : <Sun size={19} strokeWidth={1.8} />}
                <span className="tip">Theme</span>
              </button>
            )}
            {onLanguagePicker && (
              <button
                className="btn-icon"
                onClick={onLanguagePicker}
                title={t('actions.change_language', 'Change Language')}
                aria-label={t('actions.change_language', 'Change Language')}
              >
                <Globe size={19} strokeWidth={1.8} />
                <span className="tip">Language</span>
              </button>
            )}
            <button
              className="btn-icon"
              onClick={() => setManualLocationOpen(true)}
              title={t('actions.set_location', 'Set location manually')}
              aria-label={t('actions.set_location', 'Set location manually')}
            >
              <MapPin size={19} strokeWidth={1.8} />
              <span className="tip">Location</span>
            </button>
            {onPlanTrip && (
              <button
                className="btn-icon"
                onClick={onPlanTrip}
                title={t('actions.plan_trip')}
                aria-label={t('actions.plan_trip')}
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
                <span className="tip">Map</span>
              </button>
            )}
            {demoMode && onTestCrash && (
              <button
                className="btn-icon"
                onClick={onTestCrash}
                title={t('tooltip.test_crash', 'Test crash alert')}
                aria-label={t('actions.test_crash', 'Test crash')}
              >
                <AlertTriangle size={19} strokeWidth={1.8} />
                <span className="tip">Crash</span>
              </button>
            )}

            <div className="sep"></div>

            {onMedicalId && (() => {
              const isMedicalIdComplete = medicalIdCompletion >= 63;
              const hasMedicalId = medicalIdCompletion > 0;
              return (
                <button
                  className={`btn-id ${isMedicalIdComplete ? 'btn-id--complete' : ''}`}
                  onClick={onMedicalId}
                  title={hasMedicalId ? t('actions.medical_id') : t('actions.medical_id_unset')}
                  aria-label={t('actions.medical_id')}
                >
                  <div className="id-dot" style={{ opacity: isMedicalIdComplete ? 1 : undefined, animation: hasMedicalId && !isMedicalIdComplete ? 'none' : undefined, display: isMedicalIdComplete ? 'none' : 'block' }}></div>
                  <span>ID</span>
                </button>
              );
            })()}
          {(() => {
            // Status pill reflects the WHOLE pipeline, not just /health:
            //   1. MANUAL    — user pinned location manually
            //   2. OFFLINE   — browser offline or GPS lost
            //   3. WAKING…   — search in flight, OR backend warmup pending
            //                  (covers Render free-tier cold start)
            //   4. FALLBACK  — backend never returned real data, showing
            //                  bundled directory (amber, NOT green)
            //   5. ONLINE    — backend healthy AND we have real search data
            if (location?.source === 'manual') {
              return (
                <div
                  className="btn-status mh-status-manual"
                  title={t('tooltip.manual_location', 'Using manually set location')}
                >
                  <MapPin size={11} strokeWidth={2.4} />
                  <span>{t('status.manual', 'MANUAL')}</span>
                </div>
              );
            }
            const isOffline = !isOnline || gpsLost;
            if (isOffline) {
              return (
                <div className="btn-status mh-status-offline">
                  <WifiOff size={11} strokeWidth={2.4} />
                  <span>{t('status.offline')}</span>
                </div>
              );
            }
              const backendNotReady =
                backendStatus === 'warming' ||
                backendStatus === 'cold' ||
                backendStatus === 'unknown';
                
              const hasLiveData = !searchLoading && contacts?.length > 0 && !usingFallbackData;

              if (!hasLiveData && (searchLoading || backendNotReady)) {
              return (
                <div
                  className="btn-status mh-status-warming"
                  title={t('tooltip.backend_warming', 'Waking the backend up — first request after idle can take 30–55s')}
                >
                  <Loader2 size={15} strokeWidth={2.6} className="mh-status-spin" style={{ flexShrink: 0 }} />
                  <span>{t('status.connecting', 'Connecting…')}</span>
                </div>
              );
            }
            if (usingFallbackData) {
              return (
                <div
                  className="btn-status mh-status-warming"
                  title={t('tooltip.backend_fallback', 'Backend did not return live data — showing pre-loaded directory while we retry')}
                >
                  <Loader2 size={15} strokeWidth={2.6} className="mh-status-spin" style={{ flexShrink: 0 }} />
                  <span>{t('status.connecting', 'Connecting…')}</span>
                </div>
              );
            }
            return (
              <div className="btn-status mh-status-online">
                <span className="mh-status-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                <span>{t('status.online')}</span>
              </div>
            );
          })()}
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

      {/* Bottom dock gradient + SOS + Quick contacts */}
      <div className="map-hero-dock">
        {showScrollArrow && (
          <div className="scroll-down-arrow" onClick={() => {
            if (dockCardRef.current) {
              dockCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
              window.scrollTo({ top: window.innerHeight * 0.9, behavior: 'smooth' });
            }
          }}>
            <div className="scroll-arrow-pill">
              <span>Take down</span>
              <ChevronDown size={16} strokeWidth={2.5} />
            </div>
          </div>
        )}
        <div className="dock-interactive-zone">
          <SOSButton
            location={location}
            landmark={landmark}
            topContact={topContact}
            countryCode={countryCode}
            onFirstTap={onFirstTap}
          />

          {dockContacts.length > 0 && (
            <div className="mh-dock-card" ref={dockCardRef}>
              <div className="mh-dock-header">
                <span className="mh-dock-kicker">{t('dock.nearest', { count: dockContacts.length })}</span>
                <a href="#nearby-services" className="mh-dock-seeall">{t('dock.see_all')} ↗</a>
              </div>
              {dockContacts.map((c, i) => (
                <MiniContact key={c.id || i} contact={c} last={i === dockContacts.length - 1} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="rs-sidebar-overlay" onClick={() => setSidebarOpen(false)}>
          <div className="rs-sidebar-container" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <span className="drawer-title">{t('sidebar.menu')}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="close-btn" style={{ background: 'transparent' }} onClick={() => setInfoModalOpen(true)} title="Information">
                  <Info size={16} strokeWidth={2.5} />
                </button>
                <button className="close-btn" onClick={() => setSidebarOpen(false)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {onMedicalId && (
                <button className="menu-item" onClick={() => { setSidebarOpen(false); onMedicalId(); }}>
                  <span className="m-num">1</span>
                  <div className="m-icon">
                    <span style={{ fontSize: '11px', fontWeight: '800', border: '2px solid currentColor', borderRadius: '4px', padding: '0 2px' }}>ID</span>
                  </div>
                  <span className="m-label">{t('sidebar.medical_card')}</span>
                  <div className="m-chevron"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>
                </button>
              )}
              {onLanguagePicker && (
                <button className="menu-item" onClick={() => { setSidebarOpen(false); onLanguagePicker(); }}>
                  <span className="m-num">2</span>
                  <div className="m-icon"><Globe size={18} strokeWidth={1.8} /></div>
                  <span className="m-label">{t('sidebar.language')}</span>
                  <div className="m-chevron"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>
                </button>
              )}
              {onPlanTrip && (
                <button className="menu-item" onClick={() => { setSidebarOpen(false); onPlanTrip(); }}>
                  <span className="m-num">3</span>
                  <div className="m-icon"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg></div>
                  <span className="m-label">{t('sidebar.plan_trip')}</span>
                  <div className="m-chevron"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>
                </button>
              )}
              <button className="menu-item" onClick={() => { setSidebarOpen(false); setManualLocationOpen(true); }}>
                <span className="m-num">4</span>
                <div className="m-icon"><MapPin size={18} strokeWidth={1.8} /></div>
                <span className="m-label">{t('sidebar.manual_location')}</span>
                <div className="m-chevron"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>
              </button>
              {onToggleTheme && (
                  <div className="menu-item" role="button" tabIndex="0" onClick={onToggleTheme}>
                    <span className="m-num">5</span>
                    <div className="m-icon">
                      {mapTheme === 'light' ? <Sun size={18} strokeWidth={1.8} /> : <Moon size={18} strokeWidth={1.8} />}
                    </div>
                    <span className="m-label" style={{ flex: 1 }}>{t('sidebar.toggle_theme')}</span>
                    <div className="theme-toggle">
                      <div className={`theme-toggle-knob ${mapTheme === 'dark' ? 'dark' : 'light'}`} />
                    </div>
                  </div>)}
              <button className="menu-item" onClick={() => { setSidebarOpen(false); if (mapRef.current) mapRef.current.recenter(); }}>
                <span className="m-num">6</span>
                <div className="m-icon"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg></div>
                <span className="m-label">{t('sidebar.recenter')}</span>
                <div className="m-chevron"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>
              </button>

              <button className="menu-item" onClick={() => { setSidebarOpen(false); if(onTutorialStart) onTutorialStart(); }}>
                <span className="m-num"></span>
                <div className="m-icon" style={{ opacity: 0 }}></div>
                <span className="m-label" style={{ fontWeight: 700 }}>{t('sidebar.tutorial')}</span>
              </button>

              <div className="divider"></div>

              <div className="info-block">
                <p className="info-shortcut">{t('sidebar.shortcut_info')}</p>
                <div className="info-sep"></div>
                <p className="info-demo-text">{t('sidebar.crash_test_info')}</p>
                <button 
                  onClick={() => { setSidebarOpen(false); window.open('https://roadsos-frontend.vercel.app/demo', '_blank'); }}
                  className="demo-btn"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  {t('sidebar.open_crash_test')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Info Modal */}
      {infoModalOpen && (
        <div 
          className="info-modal-overlay"
          style={{ position: 'fixed', inset: 0, zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} 
          onClick={() => setInfoModalOpen(false)}
        >
          <div className="modal" style={{ maxWidth: '340px', padding: '24px', textAlign: 'center', margin: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px 0', color: mapTheme === 'light' ? '#0F172A' : '#fff', fontFamily: 'var(--rs-font-display)', fontSize: '20px' }}>App Information</h3>
            <p style={{ margin: '0 0 24px 0', color: mapTheme === 'light' ? '#475569' : '#94A3B8', fontSize: '14px', lineHeight: 1.5 }}>This contains information on all available features and switches of our app.</p>
            <button className="btn-primary" onClick={() => setInfoModalOpen(false)} style={{ width: '100%', height: '44px', borderRadius: '12px' }}>Close</button>
          </div>
        </div>
      )}

      <ManualLocationModal
        open={manualLocationOpen}
        onClose={() => setManualLocationOpen(false)}
        onSetLocation={handleSetManualLocation}
        mapRef={mapRef}
      />
    </div>
  );
}

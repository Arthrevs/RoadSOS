import React, { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Navigation, ArrowRight, Download, X, Map, ChevronRight, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { prefetchRoute } from '../utils/routeCache';
import { searchPlaces, QUICK_PICK_CITIES } from '../utils/geocode';

const FONT = `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif`;
const MONO = `'SF Mono', 'Fira Code', 'Consolas', monospace`;

const css = `
*, *::before, *::after {
  box-sizing: border-box; margin: 0; padding: 0;
  -webkit-tap-highlight-color: transparent;
  -webkit-font-smoothing: antialiased;
}

.offline-trip-fullscreen {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  z-index: 9999;
}

.offline-trip-fullscreen .page {
  min-height: 100dvh;
  max-width: 430px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 0 0 28px;
  position: relative;
  font-family: ${FONT};
}
.offline-trip-fullscreen .page::before {
  content: '';
  position: fixed; inset: 0;
  background: rgba(6,14,28,0.55);
  backdrop-filter: blur(3px);
  pointer-events: none;
  z-index: -1;
}

/* ── Sheet ── */
.offline-trip-fullscreen .sheet {
  position: relative; z-index: 10;
  width: 100%;
  background: #FFFFFF;
  border-radius: 24px 24px 20px 20px;
  overflow: hidden;
  box-shadow: 0 -6px 40px rgba(0,0,0,0.35);
}
.offline-trip-fullscreen .handle-bar { display: flex; justify-content: center; padding: 12px 0 0; }
.offline-trip-fullscreen .handle { width: 36px; height: 4px; border-radius: 999px; background: #E2E8F0; }

/* ── Header ── */
.offline-trip-fullscreen .sheet-head {
  padding: 14px 18px 16px;
  border-bottom: 1px solid #F1F5F9;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.offline-trip-fullscreen .head-left { flex: 1; }
.offline-trip-fullscreen .head-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
  color: #1D4ED8;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.offline-trip-fullscreen .head-title {
  font-size: 20px;
  font-weight: 700;
  color: #0A1628;
  letter-spacing: -0.4px;
  line-height: 1.2;
  margin-bottom: 5px;
}
.offline-trip-fullscreen .head-sub {
  font-size: 12px;
  color: #94A3B8;
  line-height: 1.55;
  font-weight: 400;
}
.offline-trip-fullscreen .close-btn {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: #F1F5F9;
  border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: #94A3B8;
  flex-shrink: 0;
  margin-top: 2px;
  transition: background 0.15s;
}
.offline-trip-fullscreen .close-btn:hover { background: #E2E8F0; color: #64748B; }

/* ── Route inputs ── */
.offline-trip-fullscreen .route-block {
  padding: 16px 18px 0;
}
.offline-trip-fullscreen .route-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}
.offline-trip-fullscreen .route-spine {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 3px;
  gap: 0;
  flex-shrink: 0;
}
.offline-trip-fullscreen .spine-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  border: 2px solid #1D4ED8;
  background: #fff;
  flex-shrink: 0;
}
.offline-trip-fullscreen .spine-dot.filled { background: #1D4ED8; }
.offline-trip-fullscreen .spine-line {
  width: 2px;
  height: 32px;
  background: repeating-linear-gradient(
    to bottom,
    #CBD5E1 0px, #CBD5E1 4px,
    transparent 4px, transparent 8px
  );
  margin: 3px 0;
}
.offline-trip-fullscreen .route-field { flex: 1; position: relative; }
.offline-trip-fullscreen .route-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #94A3B8;
  margin-bottom: 5px;
}
.offline-trip-fullscreen .route-input-wrap {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 11px 13px;
  background: #F8FAFC;
  border: 1.5px solid #E2E8F0;
  border-radius: 12px;
  transition: border-color 0.15s, background 0.15s;
  position: relative;
}
.offline-trip-fullscreen .route-input-wrap:focus-within {
  border-color: #93C5FD;
  background: #FFFFFF;
}
.offline-trip-fullscreen .route-input {
  flex: 1;
  border: none; outline: none;
  font-size: 14px;
  font-weight: 500;
  color: #0F172A;
  font-family: ${FONT};
  background: transparent;
}
.offline-trip-fullscreen .route-input::placeholder { color: #CBD5E1; font-weight: 400; }
.offline-trip-fullscreen .route-input-icon { color: #CBD5E1; flex-shrink: 0; }
.offline-trip-fullscreen .route-input-wrap:focus-within .route-input-icon { color: #3B82F6; }

/* ── Dropdown Suggestions ── */
.offline-trip-fullscreen .route-suggest {
  position: absolute;
  top: calc(100% + 4px);
  left: 0; right: 0;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  list-style: none;
  overflow: hidden;
  z-index: 50;
  border: 1px solid #E2E8F0;
}
.offline-trip-fullscreen .route-suggest-item {
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  border-bottom: 1px solid #F1F5F9;
  font-family: ${FONT};
}
.offline-trip-fullscreen .route-suggest-item:last-child { border-bottom: none; }
.offline-trip-fullscreen .route-suggest-item:hover,
.offline-trip-fullscreen .route-suggest-item.is-active { background: #F8FAFC; }
.offline-trip-fullscreen .route-suggest-pin { font-size: 14px; }
.offline-trip-fullscreen .route-suggest-text { display: flex; flex-direction: column; }
.offline-trip-fullscreen .route-suggest-primary { font-size: 14px; font-weight: 500; color: #0F172A; }
.offline-trip-fullscreen .route-suggest-context { font-size: 11px; color: #94A3B8; }

/* Current location pill */
.offline-trip-fullscreen .use-location-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 12px;
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 600;
  color: #1D4ED8;
  font-family: ${FONT};
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.15s, border-color 0.15s;
  width: 100%;
  justify-content: center;
}
.offline-trip-fullscreen .use-location-btn:hover { background: #DBEAFE; border-color: #93C5FD; }
.offline-trip-fullscreen .use-location-btn:active { transform: scale(0.98); }

/* ── Divider ── */
.offline-trip-fullscreen .divider { height: 1px; background: #F1F5F9; margin: 14px 18px 0; }

/* ── Quick fill ── */
.offline-trip-fullscreen .quick-section { padding: 12px 18px 0; }
.offline-trip-fullscreen .quick-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #94A3B8;
  margin-bottom: 9px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.offline-trip-fullscreen .quick-label::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #F1F5F9;
}
.offline-trip-fullscreen .quick-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.offline-trip-fullscreen .quick-chip {
  padding: 6px 12px;
  background: #F8FAFC;
  border: 1.5px solid #E2E8F0;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  font-family: ${FONT};
  cursor: pointer;
  transition: all 0.15s;
}
.offline-trip-fullscreen .quick-chip:hover { background: #EFF6FF; border-color: #93C5FD; color: #1D4ED8; }
.offline-trip-fullscreen .quick-chip:active { transform: scale(0.96); }
.offline-trip-fullscreen .quick-chip.selected {
  background: #1D4ED8;
  border-color: #1D4ED8;
  color: #FFFFFF;
}

/* ── Info strip ── */
.offline-trip-fullscreen .info-strip {
  margin: 12px 18px 0;
  padding: 10px 13px;
  background: #F0FDF4;
  border: 1px solid #BBF7D0;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #15803D;
  font-weight: 500;
  line-height: 1.45;
}
.offline-trip-fullscreen .info-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #22C55E;
  flex-shrink: 0;
  animation: blink 2.5s ease-in-out infinite;
}
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }

/* ── Actions ── */
.offline-trip-fullscreen .actions {
  padding: 14px 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.offline-trip-fullscreen .cache-btn {
  width: 100%;
  height: 54px;
  background: #1D4ED8;
  border: none;
  border-radius: 14px;
  color: #FFFFFF;
  font-family: ${FONT};
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.1px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  transition: background 0.18s, transform 0.13s;
  box-shadow: 0 4px 18px rgba(29,78,216,0.32);
}
.offline-trip-fullscreen .cache-btn:hover  { background: #2563EB; }
.offline-trip-fullscreen .cache-btn:active { transform: scale(0.98); }
.offline-trip-fullscreen .cache-btn:disabled {
  background: #CBD5E1;
  box-shadow: none;
  cursor: default;
}
.offline-trip-fullscreen .cache-btn.cached { background: #065F46; box-shadow: 0 4px 18px rgba(6,95,70,0.32); }

.offline-trip-fullscreen .cancel-btn {
  width: 100%;
  height: 40px;
  background: transparent;
  border: none;
  border-radius: 10px;
  color: #94A3B8;
  font-family: ${FONT};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.offline-trip-fullscreen .cancel-btn:hover { background: #F8FAFC; color: #64748B; }
`;

function PlaceInput({ label, value, onChange, onGeocoded, geo, disabled, id, activeColor, onUseLocation, t }) {
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showList, setShowList] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const debounceRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = (value || '').trim();
    if (q.length < 1 || (geo && geo.query === q)) {
      setSuggestions([]);
      setShowList(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setBusy(true);
      const list = await searchPlaces(q, 5);
      setBusy(false);
      setSuggestions(list);
      setShowList(list.length > 0);
      setActiveIdx(-1);
    }, 200);
    return () => clearTimeout(debounceRef.current);
  }, [value, geo]);

  useEffect(() => {
    if (!showList) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowList(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showList]);

  const select = (s) => {
    onChange(s.shortName);
    onGeocoded({
      lat: s.lat, lon: s.lon,
      displayName: s.displayName,
      query: s.shortName,
    });
    setShowList(false);
    setSuggestions([]);
  };

  const handleKey = (e) => {
    if (!showList || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const pick = activeIdx >= 0 ? suggestions[activeIdx] : suggestions[0];
      if (pick) select(pick);
    } else if (e.key === 'Escape') {
      setShowList(false);
    }
  };

  const statusIcon = busy
    ? '\u23F3'
    : geo && geo.error
      ? '\u26A0\uFE0F'
      : geo && !geo.error
        ? '\u2713'
        : '';

  return (
    <div className="route-field" ref={wrapRef}>
      <div className="route-label">{label}</div>
      <div className="route-input-wrap">
        <MapPin size={14} strokeWidth={2} className="route-input-icon" style={activeColor ? { color: activeColor } : {}} />
        <input
          id={id}
          className="route-input"
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); onGeocoded(null); }}
          onFocus={() => { if (suggestions.length > 0) setShowList(true); }}
          onKeyDown={handleKey}
          placeholder={t('plan_trip.placeholder', 'City, town or landmark')}
          disabled={disabled}
          autoComplete="off"
          spellCheck="false"
        />
        {statusIcon && <span style={{ fontSize: 12, opacity: 0.6 }}>{statusIcon}</span>}

        {/* Dropdown of candidates */}
        {showList && suggestions.length > 0 && (
          <ul className="route-suggest">
            {suggestions.map((s, i) => (
              <li
                key={s.lat + ',' + s.lon}
                className={"route-suggest-item" + (i === activeIdx ? ' is-active' : '')}
                onMouseDown={(e) => { e.preventDefault(); select(s); }}
              >
                <span className="route-suggest-pin">{'\uD83D\uDCCD'}</span>
                <span className="route-suggest-text">
                  <span className="route-suggest-primary">{s.shortName}</span>
                  {s.context && <span className="route-suggest-context">{s.context}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {geo && geo.error && (
        <div style={{ fontSize: 10, color: '#DC2626', marginTop: 4 }}>{t('plan_trip.error_not_found', "Couldn't find that place.")}</div>
      )}
      {geo && !geo.error && !showList && (
        <div style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>
          {geo.displayName.length > 45 ? geo.displayName.slice(0, 42) + '\u2026' : geo.displayName}
        </div>
      )}

      {onUseLocation && (
        <button className="use-location-btn" onClick={onUseLocation}>
          <Navigation size={13} strokeWidth={2.2} />
          {t('plan_trip.use_current', 'Use current location')}
        </button>
      )}
    </div>
  );
}

export default function RoutePlanner({ open, onClose }) {
  const { t } = useTranslation();
  // Text + resolved geo state for each input
  const [originText, setOriginText] = useState('');
  const [originGeo, setOriginGeo] = useState(null);
  const [destText, setDestText] = useState('');
  const [destGeo, setDestGeo] = useState(null);

  const [progress, setProgress] = useState(null); // { done, total }
  const [status, setStatus] = useState('idle'); // idle | running | done | error
  const [polylineSource, setPolylineSource] = useState(null);

  // Reset when the modal opens
  useEffect(() => {
    if (open) {
      setOriginText(''); setOriginGeo(null);
      setDestText('');   setDestGeo(null);
      setProgress(null); setStatus('idle'); setPolylineSource(null);
    }
  }, [open]);

  const handleStart = useCallback(async () => {
    const isReady = originGeo && !originGeo.error && destGeo && !destGeo.error &&
                    !(originGeo.lat === destGeo.lat && originGeo.lon === destGeo.lon);
    if (!isReady) return;
    setStatus('running');
    setProgress({ done: 0, total: 6 });
    try {
      const result = await prefetchRoute(originGeo, destGeo, {
        waypoints: 6,
        onProgress: (p) => setProgress({ done: p.done, total: p.total }),
      });
      setPolylineSource(result.polylineSource);
      setStatus(result.cached > 0 ? 'done' : 'error');

      // Auto close after 2.5s on success
      if (result.cached > 0) {
        setTimeout(() => {
          onClose && onClose();
        }, 2500);
      }
    } catch (err) {
      setStatus('error');
    }
  }, [originGeo, destGeo, onClose]);

  const handleClose = useCallback(() => {
    if (status === 'running') return;
    onClose && onClose();
  }, [status, onClose]);

  if (!open) return null;

  const fillFromChip = (slot, city) => {
    const geo = {
      lat: city.lat, lon: city.lon,
      displayName: city.name, query: city.name,
    };
    if (slot === 'origin') {
      setOriginText(city.name); setOriginGeo(geo);
    } else {
      setDestText(city.name); setDestGeo(geo);
    }
  };

  const useCurrentForOrigin = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOriginText('Current location');
        setOriginGeo({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          displayName: 'Current location (' + pos.coords.latitude.toFixed(3) + ', ' + pos.coords.longitude.toFixed(3) + ')',
          query: 'current',
        });
      },
      () => { /* silent */ },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  };

  const ready = originGeo && !originGeo.error && destGeo && !destGeo.error &&
                !(originGeo.lat === destGeo.lat && originGeo.lon === destGeo.lon);

  const percent = progress ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <>
      <style>{css}</style>
      <div className="offline-trip-fullscreen" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
        <div className="page" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
          <div className="sheet">
            <div className="handle-bar"><div className="handle" /></div>

            {/* Header */}
            <div className="sheet-head">
              <div className="head-left">
                <div className="head-badge">
                  <Map size={10} strokeWidth={2.5} />
                  {t('plan_trip.offline_mode', 'Offline Mode')}
                </div>
                <div className="head-title">{t('plan_trip.title', 'Plan an Offline Trip')}</div>
                <div className="head-sub">
                  {t('plan_trip.subtitle', 'Cache hospitals and police along your route while online — works in cellular dead zones.')}
                </div>
              </div>
              <button className="close-btn" onClick={handleClose}>
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>

            {/* Route inputs */}
            <div className="route-block">

              {/* From */}
              <div className="route-row">
                <div className="route-spine">
                  <div className="spine-dot" />
                  <div className="spine-line" />
                </div>
                <PlaceInput
                  t={t}
                  id="route-origin"
                  label={t('plan_trip.from', 'From')}
                  value={originText}
                  onChange={setOriginText}
                  onGeocoded={setOriginGeo}
                  geo={originGeo}
                  disabled={status === 'running'}
                  onUseLocation={navigator.geolocation ? useCurrentForOrigin : undefined}
                />
              </div>

              {/* To */}
              <div className="route-row" style={{ marginBottom: 0 }}>
                <div className="route-spine" style={{ paddingTop: 3 }}>
                  <div className="spine-dot filled" />
                </div>
                <PlaceInput
                  t={t}
                  id="route-destination"
                  label={t('plan_trip.to', 'To')}
                  value={destText}
                  onChange={setDestText}
                  onGeocoded={setDestGeo}
                  geo={destGeo}
                  disabled={status === 'running'}
                  activeColor={destGeo && !destGeo.error ? "#1D4ED8" : undefined}
                />
              </div>

            </div>

            <div className="divider" />

            {/* Quick fill */}
            <div className="quick-section">
              <div className="quick-label">{t('plan_trip.quick_fill', 'Quick destinations')}</div>
              <div className="quick-chips">
                {QUICK_PICK_CITIES.map(city => {
                  const cityKey = `city.${city.name.toLowerCase()}`;
                  return (
                    <button
                      key={city.name}
                      className={"quick-chip" + (destGeo && destGeo.query === city.name ? " selected" : "")}
                      onClick={() => fillFromChip('destination', city)}
                    >
                      {t(cityKey, city.name)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Info strip — changes based on status */}
            {ready && status === 'idle' && (
              <div className="info-strip">
                <div className="info-dot" />
                <span>{t('plan_trip.info_idle', 'Hospitals, police stations and repair services along this route will be saved for offline use.')}</span>
              </div>
            )}
            {status === 'done' && (
              <div className="info-strip" style={{ background: '#F0FDF4', borderColor: '#BBF7D0', color: '#15803D' }}>
                <div className="info-dot" style={{ animation: 'none' }} />
                <span>{t('plan_trip.info_done', 'Route cached. Emergency contacts are now available without internet.')}</span>
              </div>
            )}
            {status === 'error' && (
              <div className="info-strip" style={{ background: '#FEF2F2', borderColor: '#FECACA', color: '#B91C1C' }}>
                <span style={{ fontSize: 14 }}>{'\u26A0\uFE0F'}</span>
                <span>{t('plan_trip.info_error', 'Could not cache any waypoints. Check connection and try again.')}</span>
              </div>
            )}

            {/* Actions */}
            <div className="actions">
              <button
                className={"cache-btn" + (status === 'done' ? " cached" : "")}
                disabled={!ready || status === 'running'}
                onClick={handleStart}
              >
                {status === 'running' && ('\u23F3 ' + t('plan_trip.caching', 'Caching...') + ' ' + percent + '%')}
                {status === 'done' && <><Check size={17} strokeWidth={2.5} /> {t('plan_trip.cached', 'Route Cached')}</>}
                {status !== 'running' && status !== 'done' && <><Download size={16} strokeWidth={2.2} /> {t('plan_trip.plan_offline', 'Plan Offline Trip')}</>}
              </button>
              <button className="cancel-btn" onClick={handleClose} disabled={status === 'running'}>
                {t('plan_trip.cancel', 'Cancel — go back')}
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, ZoomControl, useMap, Polyline, Popup } from 'react-leaflet';
import ContactCard from './ContactCard';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Real GPS-anchored map using Leaflet + OpenStreetMap tiles.
 *
 * Tile provider: CartoDB Dark Matter (free, no API key, matches our dark
 * theme). The tiles cover the entire globe — every country, every ocean.
 * OpenStreetMap tile data shows boundaries appropriate to the user's location.
 * Attribution is legally required for OSM — rendered in bottom-right at
 * small size.
 *
 * Props:
 *   - location: { lat, lon } user position (centers the map)
 *   - contacts: array of { id, name, category, lat, lon, distance, phone }
 *   - gpsLost: dim user dot if GPS is stale
 *   - draggable: pan/pinch enabled (default true)
 *   - zoom: initial zoom level (default 15 = neighbourhood)
 */

// Tone palette matches MapHero
const TONES = {
  red: '#EF4444',
  blue: '#3B82F6',
  teal: '#14B8A6',
};

const CAT_TONES = {
  hospital: 'red',
  ambulance: 'red',
  police: 'blue',
  fire: 'red',
  towing: 'teal',
  repair: 'teal',
  showroom: 'teal',
  tyre: 'teal',
};

const CAT_EMOJI = {
  hospital: '🏥',
  ambulance: '🚑',
  police: '🛡️',
  fire: '🔥',
  towing: '🚛',
  repair: '🔧',
  showroom: '🚗',
  tyre: '🛞',
};

/** Custom user-location divIcon — pulsing green dot with halo. */
function buildUserIcon(gpsLost) {
  const color = gpsLost ? '#94A3B8' : '#22C55E';
  return L.divIcon({
    className: 'rs-user-marker',
    html: `
      <div class="rs-user-halo" style="background: radial-gradient(circle, ${color}55 0%, transparent 70%);"></div>
      <div class="rs-user-pulse" style="background: ${color};"></div>
      <div class="rs-user-dot" style="background: ${color}; box-shadow: 0 4px 12px ${color}aa;"></div>
    `,
    iconSize: [110, 110],
    iconAnchor: [55, 55],
  });
}

/** Custom service-pin divIcon — colored circle + emoji + name+km chip above. */
function buildServiceIcon(contact) {
  const cat = (contact.category || 'repair').toLowerCase();
  const tone = CAT_TONES[cat] || 'teal';
  const color = TONES[tone];
  const emoji = CAT_EMOJI[cat] || '📍';
  const shortName = (contact.name || '').split(/[,·\-]/)[0].trim().substring(0, 16);
  const km = typeof contact.distance === 'number' ? contact.distance.toFixed(1) : '?';

  return L.divIcon({
    className: 'rs-service-marker',
    html: `
      <div class="rs-svc-chip">
        <span class="rs-svc-name">${shortName}</span>
        <span class="rs-svc-km">${km}km</span>
      </div>
      <div class="rs-svc-pin" style="background: ${color}; box-shadow: 0 4px 14px ${color}aa;">
        <span>${emoji}</span>
      </div>
      <div class="rs-svc-point"></div>
    `,
    iconSize: [60, 80],
    iconAnchor: [30, 80],
  });
}

/** Re-centers map when location prop changes (e.g., user moves or demo location switches). */
function MapRecenter({ lat, lon, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lon != null) {
      map.setView([lat, lon], zoom, { animate: true, duration: 0.6 });
    }
  }, [lat, lon, zoom, map]);
  return null;
}

/** Observes the map container size and fixes the "grey/blank gap" issue
 *  by invalidating size when layout changes (e.g. vh/svh shifts, load) */
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    // Invalidate size on mount to catch any immediate layout shifts
    setTimeout(() => map.invalidateSize(), 50);
    setTimeout(() => map.invalidateSize(), 300);
    
    // Watch the container for subsequent resizes
    const mapContainer = map.getContainer();
    if (!mapContainer || !window.ResizeObserver) return;
    
    const observer = new ResizeObserver(() => {
      // Use requestAnimationFrame to avoid ResizeObserver loop limit errors
      requestAnimationFrame(() => {
        map.invalidateSize();
      });
    });
    observer.observe(mapContainer);
    
    return () => observer.disconnect();
  }, [map]);
  return null;
}

/** Tile-load listener — flips off the loading shimmer when the first
 *  batch of CartoDB tiles has actually rendered. */
function TileLoadSignal({ onLoad }) {
  const map = useMap();
  useEffect(() => {
    // Wait for the next tile-layer's `load` event (fires after all visible
    // tiles in the current view have downloaded).
    const handler = (e) => {
      if (e.layer && typeof e.layer.on === 'function') {
        e.layer.once('load', () => onLoad?.());
      }
    };
    map.on('layeradd', handler);
    return () => map.off('layeradd', handler);
  }, [map, onLoad]);
  return null;
}

const RealMap = React.forwardRef(function RealMap(
  {
    location,
    contacts = [],
    countryCode = null,
    gpsLost = false,
    draggable = true,
    zoom = 15,
    mapTheme = 'dark',
    onToggleSidebar
  },
  externalRef
) {
  const internalMapRef = useRef(null);
  const [tilesLoaded, setTilesLoaded] = useState(false);

  // Default fallback (India centroid) until GPS arrives — better than a blank screen.
  const lat = location?.lat ?? 20.5937;
  const lon = location?.lon ?? 78.9629;
  const hasGps = location?.lat != null && location?.lon != null;

  const userIcon = useMemo(() => buildUserIcon(gpsLost), [gpsLost]);
  const serviceMarkers = useMemo(
    () =>
      contacts
        .filter((c) => typeof c.lat === 'number' && typeof c.lon === 'number')
        .slice(0, 6),
    [contacts],
  );

  return (
    <div className={`rs-real-map ${tilesLoaded ? 'is-loaded' : 'is-loading'}`}>
      {/* Loading shimmer — fades out once tiles render */}
      {!tilesLoaded && (
        <div className="rs-map-skeleton" aria-hidden="true">
          <div className="rs-map-skeleton-shimmer" />
          <div className="rs-map-skeleton-label">Loading map…</div>
        </div>
      )}

      <MapContainer
        ref={(map) => {
          internalMapRef.current = map;
          if (externalRef) {
            if (typeof externalRef === 'function') externalRef(map);
            else externalRef.current = map;
          }
        }}
        center={[lat, lon]}
        zoom={hasGps ? zoom : 4}
        maxZoom={20}
        zoomControl={false}
        scrollWheelZoom={draggable}
        dragging={draggable}
        doubleClickZoom={draggable}
        touchZoom={draggable}
        boxZoom={draggable}
        keyboard={draggable}
        attributionControl={true}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          key={mapTheme} // Force re-render of TileLayer when theme changes
          url={`https://{s}.basemaps.cartocdn.com/${mapTheme === 'light' ? 'light_all' : 'dark_all'}/{z}/{x}/{y}{r}.png`}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
          eventHandlers={{ load: () => setTilesLoaded(true) }}
        />

        <TileLoadSignal onLoad={() => setTilesLoaded(true)} />

        <MapResizer />
        <MapRecenter lat={lat} lon={lon} zoom={hasGps ? zoom : 4} />

        {hasGps && (
          <Marker position={[lat, lon]} icon={userIcon} interactive={false} />
        )}

        {serviceMarkers.map((c) => (
          <React.Fragment key={c.id || `${c.lat},${c.lon}`}>
            {hasGps && (
              <Polyline
                positions={[[lat, lon], [c.lat, c.lon]]}
                pathOptions={{
                  dashArray: '6, 8',
                  color: mapTheme === 'light' ? '#475569' : '#cbd5e1',
                  weight: 3,
                  opacity: 0.7
                }}
                interactive={false}
              />
            )}
            <Marker
              position={[c.lat, c.lon]}
              icon={buildServiceIcon(c)}
              interactive={true}
            >
              <Popup className="rs-custom-popup">
                <ContactCard contact={c} isLast={true} variant="popup" />
              </Popup>
            </Marker>
          </React.Fragment>
        ))}
      </MapContainer>

      {/* Custom Zoom Panel Overlay */}
      {draggable && (
        <div className="rs-zoom-panel">
          <button 
            className="rs-zoom-btn" 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); if(internalMapRef.current) internalMapRef.current.zoomIn(); }}
          >
            +
          </button>
          <button 
            className="rs-zoom-btn" 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); if(internalMapRef.current) internalMapRef.current.zoomOut(); }}
          >
            -
          </button>
          <button 
            className="rs-zoom-btn" 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (onToggleSidebar) onToggleSidebar(); }}
            title="Open Sidebar Menu"
            aria-label="Open Sidebar Menu"
          >
            &lt;
          </button>
        </div>
      )}

      {/* Recenter Button Overlay */}
      {hasGps && (
        <button 
          className="rs-recenter-btn" 
          title="Recenter"
          onClick={(e) => {
            e.preventDefault();
            if (internalMapRef.current) {
              const targetZoom = serviceMarkers?.length > 0 ? zoom + 1 : zoom;
              internalMapRef.current.setView([lat, lon], targetZoom, { animate: true, duration: 0.6 });
            }
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
        </button>
      )}
    </div>
  );
});

export default RealMap;

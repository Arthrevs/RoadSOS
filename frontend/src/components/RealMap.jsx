import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ContactCard from './ContactCard';

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
    popupAnchor: [0, -85],
  });
}

function MapRecenter({ lat, lon, zoom, markers = [] }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lon != null) {
      if (markers.length > 0) {
        const bounds = L.latLngBounds([[lat, lon]]);
        markers.forEach(m => bounds.extend([m.lat, m.lon]));
        // Add asymmetric padding to account for the top toolbar and the large bottom dock
        map.fitBounds(bounds, {
          paddingTopLeft: [40, 120],
          paddingBottomRight: [40, 350],
          maxZoom: zoom,
          animate: true,
          duration: 0.6
        });
      } else {
        map.setView([lat, lon], zoom, { animate: true, duration: 0.6 });
      }
    }
  }, [lat, lon, zoom, markers, map]);
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

/** Listens for clicks on the map background to clear the active route. */
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: () => onMapClick?.(),
  });
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
  const preTapViewRef = useRef(null); // saves { center, zoom } before marker tap
  const [tilesLoaded, setTilesLoaded] = useState(false);
  const [activeMarkerId, setActiveMarkerId] = useState(null);

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

  const handleMarkerClick = useCallback((contact) => {
    const cId = contact.id || `${contact.lat},${contact.lon}`;
    const map = internalMapRef.current;
    if (!map) return;
    
    // If same marker tapped again, just toggle off
    if (activeMarkerId === cId) {
      setActiveMarkerId(null);
      if (preTapViewRef.current) {
        map.setView(preTapViewRef.current.center, preTapViewRef.current.zoom, { animate: true, duration: 0.5 });
        preTapViewRef.current = null;
      }
      return;
    }
    
    // Save current map state before any changes
    if (!preTapViewRef.current) {
      preTapViewRef.current = { center: map.getCenter(), zoom: map.getZoom() };
    }
    
    setActiveMarkerId(cId);
    // Zoom in by 1 level (brings marker closer to user's view)
    const targetZoom = Math.min(map.getMaxZoom() || 18, map.getZoom() + 1);
    
    map.setView([contact.lat, contact.lon], targetZoom, { animate: true, duration: 0.5 });
  }, [activeMarkerId]);

  const clearActiveMarker = useCallback(() => {
    setActiveMarkerId(null);
    const map = internalMapRef.current;
    if (map && preTapViewRef.current) {
      map.setView(preTapViewRef.current.center, preTapViewRef.current.zoom, { animate: true, duration: 0.5 });
      preTapViewRef.current = null;
    }
  }, []);

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
        <MapRecenter lat={lat} lon={lon} zoom={hasGps ? zoom : 4} markers={serviceMarkers} />
        <MapClickHandler onMapClick={clearActiveMarker} />

        {hasGps && (
          <Marker position={[lat, lon]} icon={userIcon} interactive={false} />
        )}

        {serviceMarkers.map((c) => {
          const cId = c.id || `${c.lat},${c.lon}`;
          return (
            <React.Fragment key={cId}>
              <Marker
                position={[c.lat, c.lon]}
                icon={buildServiceIcon(c)}
                interactive={true}
                eventHandlers={{
                  click: () => handleMarkerClick(c),
                  popupclose: clearActiveMarker,
                }}
              >
                <Popup className="rs-custom-popup">
                  <ContactCard contact={c} isLast={true} variant="popup" />
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
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
            if (!internalMapRef.current) return;
            const map = internalMapRef.current;
            const container = map.getContainer();
            const containerH = container.offsetHeight;

            // Measure the top toolbar and bottom SOS bar heights
            const toolbar = document.querySelector('.toolbar');
            const sosBar = document.querySelector('.glass-sos-container') || document.querySelector('.dock-interactive-zone');
            const topH = toolbar ? toolbar.offsetHeight + toolbar.getBoundingClientRect().top - container.getBoundingClientRect().top : 56;
            const bottomH = sosBar ? containerH - (sosBar.getBoundingClientRect().top - container.getBoundingClientRect().top) : 80;

            // Visible area between top bar and SOS bar
            const visibleH = containerH - topH - bottomH;
            // The visible midpoint (from top of container) = topH + visibleH/2
            const visibleMid = topH + visibleH / 2;
            // The geometric center is containerH/2
            const geomCenter = containerH / 2;
            // panBy positive Y = viewport shifts down = dot moves UP on screen
            // We want the dot at visibleMid (above geomCenter), so offset is positive
            const offsetY = geomCenter - visibleMid;

            // Zoom in 25% more than base zoom
            const targetZoom = Math.min(zoom + 2, 18);

            // First center on the user location at the target zoom
            map.setView([lat, lon], targetZoom, { animate: true, duration: 0.6 });
            // Then shift by the offset so the dot is in the visible center
            setTimeout(() => {
              map.panBy([0, offsetY], { animate: true, duration: 0.3 });
            }, 650);
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
        </button>
      )}
    </div>
  );
});

export default RealMap;

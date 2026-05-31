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
  purple: '#9333ea',
};

const CAT_TONES = {
  hospital: 'red',
  ambulance: 'red',
  police: 'blue',
  fire: 'red',
  towing: 'purple',
  repair: 'purple',
  showroom: 'purple',
  tyre: 'purple',
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

const CAT_SVG = {
  towing: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#fafafa" rx="100" ry="100" />
  <g>
    <line x1="191" y1="305" x2="111" y2="130" stroke="black" stroke-width="34" stroke-linecap="round" />
    <circle cx="111" cy="130" r="5" fill="#fafafa" />
    <rect x="141" y="300" width="75" height="20" rx="6" ry="6" fill="black" />
    <line x1="111" y1="130" x2="111" y2="230" stroke="black" stroke-width="3" />
    <path d="M 111 230 L 111 254.8 A 15 15 0 1 1 100 250" stroke="black" stroke-width="6" stroke-linecap="round" fill="none" />
  </g>
  <path d="M 121 370 L 121 320 L 286 320 L 286 180 L 336 180 L 391 255 L 391 370 Z" fill="black" />
  <path d="M 301 195 L 301 275 L 371 275 L 326 195 Z" fill="#fafafa" />
  <circle cx="181" cy="370" r="38" fill="#fafafa" />
  <circle cx="326" cy="370" r="38" fill="#fafafa" />
  <circle cx="181" cy="370" r="28" fill="black" />
  <circle cx="326" cy="370" r="32" fill="black" />
</svg>`,
  police: `<svg width="100%" viewBox="0 0 680 680" role="img" xmlns="http://www.w3.org/2000/svg">
<defs>
  <radialGradient id="bgCircle" cx="45%" cy="38%" r="60%">
    <stop offset="0%" stop-color="#6db3d8"/>
    <stop offset="100%" stop-color="#2e6a90"/>
  </radialGradient>
  <radialGradient id="shieldFill" cx="40%" cy="28%" r="70%">
    <stop offset="0%" stop-color="#253f7a"/>
    <stop offset="100%" stop-color="#0e1c45"/>
  </radialGradient>
  <radialGradient id="starFill" cx="35%" cy="28%" r="65%">
    <stop offset="0%" stop-color="#f0c84a"/>
    <stop offset="100%" stop-color="#b07e10"/>
  </radialGradient>
  <radialGradient id="rimFill" cx="45%" cy="25%" r="65%">
    <stop offset="0%" stop-color="#b8d4e8"/>
    <stop offset="100%" stop-color="#2a5570"/>
  </radialGradient>
</defs>

<!-- Outer rim -->
<circle cx="340" cy="340" r="315" fill="url(#rimFill)"/>
<circle cx="340" cy="340" r="315" fill="none" stroke="#1a3a52" stroke-width="5"/>

<!-- Blue circle background -->
<circle cx="340" cy="340" r="298" fill="url(#bgCircle)"/>
<circle cx="340" cy="340" r="298" fill="none" stroke="#1e4a66" stroke-width="4"/>
<circle cx="340" cy="340" r="292" fill="none" stroke="#7ec0de" stroke-width="1.5" opacity="0.4"/>

<!-- Shield shape -->
<path d="M340,105 C390,105 460,128 492,152 L510,275 C510,385 428,455 340,500 C252,455 170,385 170,275 L188,152 C220,128 290,105 340,105 Z"
      fill="#0a1428"/>
<path d="M340,112 C388,112 456,134 487,157 L504,275 C504,382 424,450 340,494 C256,450 176,382 176,275 L193,157 C224,134 292,112 340,112 Z"
      fill="url(#shieldFill)"/>

<!-- Shield inner bevel line -->
<path d="M340,124 C383,124 446,144 474,165 L490,275 C490,372 416,435 340,477 C264,435 190,372 190,275 L206,165 C234,144 297,124 340,124 Z"
      fill="none" stroke="#3a5899" stroke-width="2" opacity="0.5"/>

<!-- POLICE DEPT label bar -->
<rect x="228" y="162" width="224" height="30" rx="4" fill="#0e1e50"/>
<rect x="228" y="162" width="224" height="30" rx="4" fill="none" stroke="#3a60a0" stroke-width="1"/>
<text x="340" y="183" font-family="Georgia, serif" font-size="13" font-weight="700" fill="#a0c0e8" text-anchor="middle" letter-spacing="3">POLICE DEPT</text>

<!-- Star outer shadow -->
<polygon points="340,218 364,292 442,292 380,336 404,410 340,366 276,410 300,336 238,292 316,292"
         fill="#6a4800"/>

<!-- Star main gold -->
<polygon points="340,222 362,292 438,292 377,334 400,406 340,363 280,406 303,334 242,292 318,292"
         fill="url(#starFill)"/>

<!-- Star inner raised polygon -->
<polygon points="340,238 358,294 412,294 369,322 385,376 340,348 295,376 311,322 268,294 322,294"
         fill="#c89020"/>

<!-- Star highlight top -->
<polygon points="340,222 362,292 340,272 318,292" fill="#f8e888" opacity="0.3"/>
</svg>`,
  showroom: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">

  <!-- Pin outer shape -->
  <path d="
    M200,20
    C100,20 30,90 30,190
    C30,270 80,330 130,370
    L200,480
    L270,370
    C320,330 370,270 370,190
    C370,90 300,20 200,20
    Z
  " fill="#9333ea"/>

  <!-- White circle cutout -->
  <circle cx="200" cy="185" r="130" fill="#ffffff"/>

  <!-- CART OUTLINES (Thin dark border) -->
  <polygon points="105,95 245,95 220,185 130,185" fill="none" stroke="#0a1217" stroke-width="3" stroke-linejoin="round"/>
  <path d="M 245,95 L 280,95 L 280,120" fill="none" stroke="#0a1217" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 115,215 L 255,215 A 15,15 0 0 0 255,185 L 240,185" fill="none" stroke="#0a1217" stroke-width="15" stroke-linecap="round"/>
  <circle cx="140" cy="255" r="18.5" fill="#0a1217"/>
  <circle cx="230" cy="255" r="18.5" fill="#0a1217"/>

  <!-- CART FILLS (Blue color) -->
  <polygon points="105,95 245,95 220,185 130,185" fill="#1c628a"/>
  <path d="M 245,95 L 280,95 L 280,120" fill="none" stroke="#1c628a" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 115,215 L 255,215 A 15,15 0 0 0 255,185 L 240,185" fill="none" stroke="#1c628a" stroke-width="12" stroke-linecap="round"/>
  <circle cx="140" cy="255" r="17" fill="#1c628a"/>
  <circle cx="230" cy="255" r="17" fill="#1c628a"/>

</svg>`,
  hospital: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
  <!-- Pin outer shape -->
  <path d="
    M200,20
    C100,20 30,90 30,190
    C30,270 80,330 130,370
    L200,480
    L270,370
    C320,330 370,270 370,190
    C370,90 300,20 200,20
    Z
  " fill="#16a34a"/>
  <!-- White circle cutout -->
  <circle cx="200" cy="185" r="130" fill="#ffffff"/>
  <!-- Medical Cross -->
  <rect x="165" y="100" width="70" height="170" fill="#16a34a"/>
  <rect x="115" y="150" width="170" height="70" fill="#16a34a"/>
</svg>`,
  ambulance: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
  <!-- Pin outer shape -->
  <path d="
    M200,20
    C100,20 30,90 30,190
    C30,270 80,330 130,370
    L200,480
    L270,370
    C320,330 370,270 370,190
    C370,90 300,20 200,20
    Z
  " fill="#c92a2a"/>
  <!-- White circle cutout -->
  <circle cx="200" cy="185" r="130" fill="#ffffff"/>
  <!-- Medical Cross -->
  <rect x="165" y="100" width="70" height="170" fill="#c92a2a"/>
  <rect x="115" y="150" width="170" height="70" fill="#c92a2a"/>
</svg>`,
  repair: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
  <!-- Pin outer shape -->
  <path d="
    M200,20
    C100,20 30,90 30,190
    C30,270 80,330 130,370
    L200,480
    L270,370
    C320,330 370,270 370,190
    C370,90 300,20 200,20
    Z
  " fill="#9333ea"/>
  <!-- White circle cutout -->
  <circle cx="200" cy="185" r="130" fill="#ffffff"/>
  
  <!-- Wrench -->
  <g transform="translate(200, 185) rotate(45) scale(1.15) translate(-200, -185)">
    <!-- Outer Outline (Dark Silver) -->
    <circle cx="200" cy="115" r="39" fill="#475569"/>
    <circle cx="200" cy="255" r="39" fill="#475569"/>
    <rect x="178" y="115" width="44" height="140" fill="#475569"/>
    
    <!-- Main Wrench (Silver) -->
    <circle cx="200" cy="115" r="35" fill="#94a3b8"/>
    <circle cx="200" cy="255" r="35" fill="#94a3b8"/>
    <rect x="182" y="115" width="36" height="140" fill="#94a3b8"/>
    
    <!-- Inner Outline (Dark Silver) -->
    <circle cx="200" cy="115" r="20" fill="#475569"/>
    <rect x="180" y="66" width="40" height="49" fill="#475569"/>
    <circle cx="200" cy="255" r="20" fill="#475569"/>
    
    <!-- White Cutouts -->
    <circle cx="200" cy="115" r="16" fill="#ffffff"/>
    <rect x="184" y="70" width="32" height="45" fill="#ffffff"/>
    <circle cx="200" cy="255" r="16" fill="#ffffff"/>
  </g>
</svg>`,
  fire: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
  <!-- Pin outer shape -->
  <path d="
    M200,20
    C100,20 30,90 30,190
    C30,270 80,330 130,370
    L200,480
    L270,370
    C320,330 370,270 370,190
    C370,90 300,20 200,20
    Z
  " fill="#c92a2a"/>
  <!-- White circle cutout -->
  <circle cx="200" cy="185" r="130" fill="#ffffff"/>
  
  <!-- Outer Flame -->
  <path d="M 200,250 
           C 130,250 140,150 190,90 
           C 190,110 200,130 210,140 
           C 215,135 220,125 230,120 
           C 250,160 270,250 200,250 Z" 
        fill="#c92a2a"/>
  <!-- Inner Cutout -->
  <path d="M 200,240 
           C 170,240 170,190 200,150 
           C 230,190 230,240 200,240 Z" 
        fill="#ffffff"/>
</svg>`,

  tyre: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
  <!-- Pin outer shape -->
  <path d="M 200,480 L 75,258 A 145,145 0 1,1 325,258 Z" fill="#9333ea"/>
  <!-- White circle cutout -->
  <circle cx="200" cy="185" r="135" fill="#ffffff"/>
  
  <!-- Tire Outer Ring -->
  <circle cx="200" cy="185" r="100" fill="#111827"/>
  <circle cx="200" cy="185" r="105" fill="none" stroke="#111827" stroke-width="10" stroke-dasharray="14 10"/>
  
  <!-- Tire Inner White -->
  <circle cx="200" cy="185" r="70" fill="#ffffff"/>
  
  <!-- 5 Spokes -->
  <g stroke="#111827" stroke-width="10" stroke-linecap="round">
    <line x1="200" y1="185" x2="200" y2="115" transform="rotate(0, 200, 185)"/>
    <line x1="200" y1="185" x2="200" y2="115" transform="rotate(72, 200, 185)"/>
    <line x1="200" y1="185" x2="200" y2="115" transform="rotate(144, 200, 185)"/>
    <line x1="200" y1="185" x2="200" y2="115" transform="rotate(216, 200, 185)"/>
    <line x1="200" y1="185" x2="200" y2="115" transform="rotate(288, 200, 185)"/>
  </g>
  <circle cx="200" cy="185" r="10" fill="#111827"/>
</svg>`
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
  const shortName = (contact.name || '').split(/[,·\-]/)[0].trim().substring(0, 16);
  const km = typeof contact.distance === 'number' ? contact.distance.toFixed(1) : '?';

  const svgContent = CAT_SVG[cat];
  const emoji = CAT_EMOJI[cat] || '📍';
  
  let pinHtml;
  if (cat === 'showroom' || cat === 'hospital' || cat === 'ambulance' || cat === 'repair' || cat === 'police' || cat === 'tyre' || cat === 'fire') {
    // These categories have their own full pin shape SVGs, don't wrap them in the default colored circle
    pinHtml = `<div style="width: 32px; height: 40px; margin: 0 auto; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));">${svgContent}</div>`;
  } else {
    const innerHtml = svgContent 
      ? `<div style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; overflow: hidden;">${svgContent}</div>` 
      : `<span>${emoji}</span>`;

    pinHtml = `
      <div class="rs-svc-pin" style="background: ${color}; box-shadow: 0 4px 14px ${color}aa;">
        ${innerHtml}
      </div>
      <div class="rs-svc-point"></div>
    `;
  }

  return L.divIcon({
    className: 'rs-service-marker',
    html: `
      <div class="rs-svc-chip">
        <span class="rs-svc-name">${shortName}</span>
        <span class="rs-svc-km">${km}km</span>
      </div>
      ${pinHtml}
    `,
    iconSize: [60, 80],
    iconAnchor: [30, 80],
    popupAnchor: [0, -85],
  });
}

function MapRecenter({ lat, lon, zoom, markers = [] }) {
  const map = useMap();
  const lastLocation = useRef({ lat: null, lon: null });
  const lastMarkersSignature = useRef("");

  useEffect(() => {
    if (lat == null || lon == null) return;
    
    const distLat = Math.abs(lat - (lastLocation.current.lat || 0));
    const distLon = Math.abs(lon - (lastLocation.current.lon || 0));
    const isBigJump = lastLocation.current.lat === null || (distLat > 0.005 || distLon > 0.005);
    
    const markersSig = markers.map(m => m.id || `${m.lat},${m.lon}`).join(',');
    const markersChanged = markersSig !== lastMarkersSignature.current;

    if (isBigJump || markersChanged) {
      lastLocation.current = { lat, lon };
      lastMarkersSignature.current = markersSig;

      if (markers.length > 0) {
        let maxDeltaLat = 0;
        let maxDeltaLon = 0;
        markers.forEach(m => {
          maxDeltaLat = Math.max(maxDeltaLat, Math.abs(m.lat - lat));
          maxDeltaLon = Math.max(maxDeltaLon, Math.abs(m.lon - lon));
        });
        
        // Ensure some minimum delta so it doesn't zoom infinitely if a marker is exactly at user location
        maxDeltaLat = Math.max(maxDeltaLat, 0.002);
        maxDeltaLon = Math.max(maxDeltaLon, 0.002);
        
        const bounds = L.latLngBounds(
          [lat - maxDeltaLat, lon - maxDeltaLon],
          [lat + maxDeltaLat, lon + maxDeltaLon]
        );
        
        map.fitBounds(bounds, {
          padding: [50, 50],
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

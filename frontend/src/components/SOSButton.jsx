import React, { useState } from 'react';
import { Signal, Check, Copy } from 'lucide-react';

/**
 * SOSButton — sticky bottom bar with:
 *   1. Blue SOS button with sonar pulse rings → WhatsApp deep link (SMS fallback)
 *   2. copy-coordinates button
 */

export function buildSOSMessage({ lat, lon, landmark, topContact }) {
  const latStr = typeof lat === 'number' ? lat.toFixed(5) : '?';
  const lonStr = typeof lon === 'number' ? lon.toFixed(5) : '?';

  const lines = [
    'ROAD ACCIDENT. I need help.',
    `Location: ${latStr}, ${lonStr}`,
    `Nearest landmark: ${landmark || 'unknown'}`,
  ];

  if (topContact?.name) {
    const phoneStr = topContact.phone ? ` at ${topContact.phone}` : '';
    lines.push(`Call: ${topContact.name}${phoneStr}`);
  }

  return lines.join('\n');
}

export default function SOSButton({ location, landmark, topContact, onFirstTap }) {
  const [copied, setCopied] = useState(false);
  const [sent,   setSent]   = useState(false);
  const tappedRef = React.useRef(false);

  const hasLocation = !!(location?.lat && location?.lon);

  // ── SOS tap ───────────────────────────────────────────────────────────────
  const handleSOS = () => {
    if (!tappedRef.current) {
      tappedRef.current = true;
      onFirstTap?.();
    }

    if (!hasLocation) return;

    const message  = buildSOSMessage({
      lat: location.lat,
      lon: location.lon,
      landmark,
      topContact,
    });
    const encoded  = encodeURIComponent(message);
    const waUrl    = `https://wa.me/?text=${encoded}`;
    const smsUrl   = `sms:?body=${encoded}`;

    const win = window.open(waUrl, '_blank');
    setSent(true);
    setTimeout(() => {
      if (!win || win.closed || win.closed === undefined) {
        window.location.href = smsUrl;
      }
      setSent(false);
    }, 800);
  };

  // ── Copy coords ───────────────────────────────────────────────────────────
  const handleCopyCoords = async () => {
    const text = hasLocation
      ? `${location.lat.toFixed(5)}, ${location.lon.toFixed(5)}`
      : "Searching for GPS coordinates...";

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard API unavailable
    }
  };

  return (
    <div className="glass-sos-container">
      <button
        id="sos-main-btn"
        className={`glass-sos-btn ${sent ? 'sent' : ''}`}
        onClick={handleSOS}
        aria-label="Send SOS with your location via WhatsApp"
      >
        {!sent && (
          <>
            <div className="glass-sonar" />
            <div className="glass-sonar" />
          </>
        )}
        {sent
          ? <><Check size={18} strokeWidth={2.5} /> Location Sent</>
          : <><Signal size={16} strokeWidth={2.2} /> {hasLocation ? 'SOS — Send Location' : 'SOS — Use Best Location'}</>
        }
      </button>

      <button
        id="copy-coords-btn"
        className="glass-copy-btn"
        onClick={handleCopyCoords}
        aria-label="Copy GPS coordinates to clipboard"
        title="Copy GPS coordinates"
      >
        {copied
          ? <Check size={18} strokeWidth={2.5} color="#22C55E" />
          : <Copy size={18} strokeWidth={1.8} />
        }
      </button>
    </div>
  );
}

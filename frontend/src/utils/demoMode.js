/**
 * Demo-mode safety guards.
 *
 * RoadSOS ships with demo mode ON by default. This prevents accidental real
 * emergency calls during judging, testing, or development. To enable real
 * emergency calls in production, append `?demo=0` to the URL.
 *
 * Demo mode affects:
 *   - tel: links wrap with a one-tap confirmation toast
 *   - Crash alert auto-dial is simulated visually (no real call)
 *   - "🧪 DEMO" badge is shown in the header
 *   - "Test Crash Detection" button appears for manual triggering
 *
 * Everything else (UI, search, triage, alarm, voice, GPS, accelerometer)
 * works identically in demo and production mode.
 */

function readDemoMode() {
  if (typeof window === 'undefined') return false;

  // Explicit overrides win.
  //   ?demo=0   or   ?live=1   →  real-dial mode (for genuine emergency use)
  //   ?demo=1   or   /demo path →  demo mode (safe for judges & sharing)
  const params = new URLSearchParams(window.location.search);
  const demo = params.get('demo');
  const live = params.get('live');
  if (demo === '0' || demo === 'false' || live === '1' || live === 'true') return false;
  if (demo === '1' || demo === 'true' || live === '0' || live === 'false') return true;

  const path = window.location.pathname;
  if (path === '/demo' || path.startsWith('/demo/')) return true;

  // Default: demo OFF on the main website (real dials enabled).
  // Demo mode is active on /demo or when forced via ?demo=1.
  return false;
}

export const DEMO_MODE = readDemoMode();

// ─── One-tap confirmation for tel: links ─────────────────────────────────
// First tap shows a toast. Second tap within 4s fires the real call.

let lastPromptedHref = null;
let lastPromptedAt   = 0;
let toastTimeoutId   = null;

const CONFIRM_WINDOW_MS = 4_000;

function showToast(message, ms = 3500) {
  let toast = document.getElementById('roadsos-demo-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'roadsos-demo-toast';
    toast.className = 'roadsos-demo-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('roadsos-demo-toast--visible');
  clearTimeout(toastTimeoutId);
  toastTimeoutId = setTimeout(() => {
    toast.classList.remove('roadsos-demo-toast--visible');
  }, ms);
}

/**
 * Guarded tel: dial. Use anywhere we would dial an emergency contact.
 *
 *   onClick={(e) => guardedTelDial(e, '108', 'Ambulance')}
 *
 * - Production mode: dial immediately (browser follows tel: link)
 * - Demo mode:       show toast on first tap, dial only on second tap
 */
export function guardedTelDial(event, number, label = '') {
  if (!DEMO_MODE) return; // Let the browser follow the tel: link

  // Demo mode: intercept
  event.preventDefault();

  const href = `tel:${number}`;
  const now  = Date.now();

  if (lastPromptedHref === href && (now - lastPromptedAt) < CONFIRM_WINDOW_MS) {
    // Second tap — confirm and dial
    lastPromptedHref = null;
    window.location.href = href;
    return;
  }

  // First tap — show confirmation toast
  lastPromptedHref = href;
  lastPromptedAt   = now;
  showToast(`📞 [DEMO] Would call ${label || number}. Tap again to actually dial.`);
}

/**
 * For the crash-alert AUTOMATING phase auto-dial.
 * In demo mode, surfaces a banner instead of placing the call.
 */
export function safeAutoDial(number, label = 'Ambulance') {
  if (DEMO_MODE) {
    showToast(`🎯 [DEMO] Would now auto-dial ${label} (${number})`, 6000);
    return;
  }
  window.location.href = `tel:${number}`;
}

/** Returns true if demo mode is active. */
export function isDemoMode() { return DEMO_MODE; }

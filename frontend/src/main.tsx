import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './i18n';
import './style.css';
import './final-design.css';

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// ── Service worker auto-update ─────────────────────────────────────────────
// When a new build deploys, the browser downloads the updated sw.js.
// skipWaiting() makes the new SW activate immediately; clients.claim()
// fires controllerchange on open pages.  We reload so the new bundle loads.
//
// IMPORTANT: capture hadController BEFORE adding the listener.
// On first SW install, controller is null → claim() fires controllerchange
// with null→SW transition.  We must NOT reload in that case or we get an
// infinite reload loop.  Only reload when there was already a controller
// (i.e. this is a genuine update from old SW → new SW).
if ('serviceWorker' in navigator) {
  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloading) {
      reloading = true;
      window.location.reload();
    }
  });

  // ── Force update check on every page load ──────────────────────────────
  // The browser's default SW update check happens at most every 24 h.
  // For a hackathon where deployments happen several times a day, that's
  // far too slow — users who opened the URL earlier see stale content.
  // Calling registration.update() forces an immediate byte-diff check
  // against the server's sw.js.  If the file changed, the new SW installs
  // and skipWaiting() + controllerchange triggers the reload above.
  navigator.serviceWorker.ready.then((registration) => {
    // Immediate check on load
    registration.update().catch(() => {});

    // Also check every 60 s while the tab is open — catches deploys that
    // land while the user is staring at the app.
    setInterval(() => {
      registration.update().catch(() => {});
    }, 60_000);
  });
}

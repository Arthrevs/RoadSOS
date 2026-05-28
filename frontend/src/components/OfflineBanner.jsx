import React from 'react';
import { useNetwork } from '../hooks/useNetwork';

/**
 * OfflineBanner — strip shown when the user is offline OR when the app is
 * serving fallback data (pre-loaded bundle / demo mock) even though the
 * browser reports the network as up. Without the second case, a flaky
 * backend produces a misleading "Online" banner while the contact list
 * is actually coming from disk.
 */
export default function OfflineBanner({ usingBundled = false, usingMock = false }) {
  const isOnline = useNetwork();

  if (isOnline && !usingBundled && !usingMock) return null;

  let message;
  if (!isOnline) {
    message = (
      <>
        <strong>You are offline.</strong>{' '}
        Showing last saved results. National emergency numbers always available.
      </>
    );
  } else if (usingMock) {
    message = (
      <>
        <strong>Server unreachable.</strong>{' '}
        Showing demo contacts — national emergency numbers above are accurate.
      </>
    );
  } else {
    message = (
      <>
        <strong>Server unreachable.</strong>{' '}
        Showing pre-loaded directory — national emergency numbers above are accurate.
      </>
    );
  }

  return (
    <div className="offline-banner" role="status" aria-live="polite">
      <span className="offline-banner__icon">⚡</span>
      <span className="offline-banner__text">{message}</span>
    </div>
  );
}

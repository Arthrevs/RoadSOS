import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { requestMotionPermission } from '../hooks/useLocation';
import './PermissionDisclaimer.css';

const DISCLAIMER_KEY = 'roadsos_permissions_acknowledged_v1';

export default function PermissionDisclaimer() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(DISCLAIMER_KEY)) {
        setVisible(true);
      }
    } catch (e) {
      // safe fallback
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const handleUnderstand = () => {
    // Request permissions on user gesture
    requestMotionPermission();
    import('../utils/sosAlert').then(m => m.requestCameraPermission());
    
    setVisible(false);
    try {
      localStorage.setItem(DISCLAIMER_KEY, '1');
    } catch (e) {}
  };

  return (
    <div className="permission-disclaimer">
      <div className="pd-icon">
        <Shield size={20} strokeWidth={2.5} />
      </div>
      <div className="pd-content">
        <p className="pd-text">
          <strong>Privacy first:</strong> We need location for dispatch and camera for crash photos. 
          Your data is <em>never</em> shared.
        </p>
      </div>
      <button className="pd-button" onClick={handleUnderstand}>
        Got it
      </button>
    </div>
  );
}

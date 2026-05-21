import React, { useState } from 'react';
import { MapPin, Map, Moon, RefreshCcw, Globe } from 'lucide-react';
import './TopNotch.css';


export default function TopNotch({
  onLocate, onId, onMap, onMoon, onRefresh, onLang,
  isOnline, gpsLost, locationSource, searchLoading,
  hidden
}) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async (e) => {
    e.stopPropagation();
    if (onRefresh && !refreshing) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
  };

  const handleLang = (e) => {
    e.stopPropagation();
    if (onLang) onLang();
  };

  const getStatus = () => {
    if (locationSource === 'manual') return { text: 'MANUAL', color: '#EAB308', dot: true };
    if (!isOnline || gpsLost) return { text: 'OFFLINE', color: '#EF4444', dot: false };
    if (searchLoading) return { text: 'CONNECTING...', color: '#F59E0B', dot: true };
    return { text: 'ONLINE', color: '#22C55E', dot: true };
  };

  const status = getStatus();

  return (
    <div className={`top-notch-container ${hidden ? 'hidden' : ''}`}>
      <div className="top-notch">
        {/* Left side */}
        <button className="tn-btn tn-btn-icon" onClick={onLocate}>
          <MapPin size={14} color="#EFF1F4" />
        </button>
        <button className="tn-btn tn-btn-text" onClick={onId}>
          <span style={{ color: '#1D62D3', fontWeight: 800, fontSize: '10px' }}>ID</span>
        </button>

        {/* Center buttons (now equal citizens) */}
        <button className={`tn-btn tn-btn-icon ${refreshing ? 'spin' : ''}`} onClick={handleRefresh} title="Refresh Location">
          <RefreshCcw size={14} color="#EFF1F4" strokeWidth={2} />
        </button>
        <button className="tn-btn tn-btn-icon" onClick={handleLang} title="Change Language">
          <Globe size={14} color="#EFF1F4" strokeWidth={2} />
        </button>

        {/* Right side */}
        <button className="tn-btn tn-btn-icon" onClick={onMap}>
          <Map size={14} color="#EFF1F4" />
        </button>
        <button className="tn-btn tn-btn-icon" onClick={onMoon}>
          <Moon size={14} color="#EFF1F4" fill="#EFF1F4" />
        </button>
      </div>

      {/* Extension Tab for Status */}
      <div className="top-notch-tab">
        <div className="tn-status-indicator">
          {status.dot && (
            <span
              className={`tn-status-dot ${searchLoading ? 'pulse' : ''}`}
              style={{ backgroundColor: status.color }}
            />
          )}
          {!status.dot && (
            <span style={{ color: status.color, marginRight: '4px', fontSize: '8px' }}>⚠️</span>
          )}
          <span style={{ color: status.color, fontWeight: 700, fontSize: '8px', letterSpacing: '0.05em' }}>
            {status.text}
          </span>
        </div>
      </div>
    </div>
  );
}


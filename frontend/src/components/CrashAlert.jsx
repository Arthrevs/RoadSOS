import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Bot, PhoneCall, Check, Ambulance, Shield, Phone, Copy, X, Navigation2 } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { speakText, buildDispatchText, cancelSpeech } from '../utils/speechUtils';
import { startAlarm, stopAlarm } from '../utils/alarmUtils';
import { safeAutoDial, guardedTelDial } from '../utils/demoMode';
import { encodePlusCode } from '../utils/plusCodes';
import { isWaCountry, buildSosLinks } from '../utils/sosDispatch';
import { triggerSOSAlert } from '../utils/sosAlert';
import '../dispatcher-card.css';

const CHOOSE_SECONDS = 10;
const AUTO_SECONDS   = 4;
const CORRECT_PIN    = '0000';

// Helper: derive a friendly emergency name for the crash overlay
function topContactName(numbers) {
  if (!numbers) return 'Apollo';
  return numbers.ambulance ? 'Ambulance' : numbers.general ? 'Emergency' : 'Apollo';
}

const PHASE = {
  CHOOSING   : 'choosing',
  AUTOMATING : 'automating',
  CALLING    : 'calling',
  MANUAL     : 'manual',
};

export default function CrashAlert({ open, onConfirm, onCancel, numbers, location, landmark, countryCode, mapTheme }) {
  const { t, i18n } = useTranslation();
  const [phase, setPhase]       = useState(PHASE.CHOOSING);
  const [seconds, setSeconds]   = useState(CHOOSE_SECONDS);
  const [pin, setPin]           = useState('');
  const [pinError, setPinError] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [copied, setCopied]     = useState(false);
  const [plusCopied, setPlusCopied] = useState(false);
  const [sosSent, setSosSent]   = useState(null);
  const intervalRef             = useRef(null);
  const scenePhotoRef           = useRef(null);

  const callNumber = numbers?.ambulance || numbers?.general || '112';
  const preferWA   = isWaCountry(countryCode);

  const plusCode = useMemo(() => {
    if (!location?.lat || !location?.lon) return '';
    return encodePlusCode(location.lat, location.lon);
  }, [location?.lat, location?.lon]);

  const dispatchText = useMemo(() => buildDispatchText({
    landmark,
    lat     : location?.lat,
    lon     : location?.lon,
    plusCode,
    injured : true,
    blocking: true,
  }, t), [landmark, location?.lat, location?.lon, plusCode, t]);

  const doCopy = () => {
    if (location?.lat) {
      navigator.clipboard.writeText(`${location.lat.toFixed(5)}, ${location.lon.toFixed(5)}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  // ─── Open / close lifecycle ────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      clearInterval(intervalRef.current);
      stopAlarm();
      cancelSpeech();
      setPhase(PHASE.CHOOSING);
      setSeconds(CHOOSE_SECONDS);
      setPin('');
      setPinError(false);
      setSpeaking(false);
      setSosSent(null);
      return;
    }

    startAlarm(callNumber);
    startCountdown(CHOOSE_SECONDS, () => triggerAutomatic());
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Countdown helper ─────────────────────────────────────────────────
  function startCountdown(from, onZero) {
    clearInterval(intervalRef.current);
    setSeconds(from);
    intervalRef.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(intervalRef.current); onZero(); return 0; }
        return s - 1;
      });
    }, 1000);
  }

  // ─── Dispatch SOS to emergency contacts ───────────────────────────────
  // WA countries  → window.open(wa.me) — opens WhatsApp without navigating away,
  //                 so the ambulance dial setTimeout still fires.
  // SMS countries → window.location.href (group SMS to all) — navigates briefly
  //                 to SMS app; dial fires when user returns.
  function dispatchSos() {
    const links = buildSosLinks(location, landmark);
    if (!links) return;

    if (preferWA) {
      window.open(links.perContact[0].waHref, '_blank');
      setSosSent({ channel: 'wa', links });
    } else {
      window.location.href = links.groupSmsHref;
      setSosSent({ channel: 'sms', links });
    }
    // Notify App to open DispatchScreen with scene photo (if captured)
    try {
      window.dispatchEvent(new CustomEvent('roadsos:sos-sent', {
        detail: { isCrash: true, scenePhoto: scenePhotoRef.current },
      }));
    } catch {}
  }

  // ─── AUTOMATING phase ─────────────────────────────────────────────────
  function triggerAutomatic() {
    stopAlarm();
    setPhase(PHASE.AUTOMATING);
    setSpeaking(true);
    // Capture scene photo when crash is auto-confirmed
    triggerSOSAlert().then(photo => { scenePhotoRef.current = photo; });
    speakText(dispatchText, { lang: i18n.language || 'en' }).finally(() => setSpeaking(false));
    startCountdown(AUTO_SECONDS, () => fireCall());
  }

  function fireCall() {
    clearInterval(intervalRef.current);
    setPhase(PHASE.CALLING);
    dispatchSos();
    setTimeout(() => safeAutoDial(callNumber, 'Ambulance'), 600);
    onConfirm?.();
  }

  // ─── MANUAL phase ─────────────────────────────────────────────────────
  function handleChooseManual() {
    clearInterval(intervalRef.current);
    stopAlarm();
    setPhase(PHASE.MANUAL);
  }

  // ─── Cancel (false alarm) ─────────────────────────────────────────────
  function handleCancelFalseAlarm() {
    if (pin === CORRECT_PIN) {
      clearInterval(intervalRef.current);
      stopAlarm();
      cancelSpeech();
      onCancel?.();
    } else {
      setPinError(true);
      setPin('');
      setTimeout(() => setPinError(false), 1500);
    }
  }

  function handleCancelAuto() {
    clearInterval(intervalRef.current);
    cancelSpeech();
    onCancel?.();
  }

  if (!open) return null;

  // ─── SOS follow-up block ──────────────────────────────────────────────
  const SosFollowUp = sosSent ? (() => {
    const { channel, links } = sosSent;
    const contact0 = links.perContact[0];
    return (
      <div className="crash-sos-sent">
        <div className="crash-sos-sent__header">
          {channel === 'wa'
            ? `💬 WhatsApp SOS sent to ${contact0?.name}`
            : `📱 SMS SOS sent to all ${links.contacts?.length} contacts`
          }
        </div>
        <div className="crash-sos-sent__links">
          {links.perContact.map((c, i) => {
            const showWa  = channel === 'sms' || i > 0;
            const showSms = channel === 'wa';
            return (
              <div key={i} className="crash-sos-sent__row">
                <span className="crash-sos-sent__name">{c.name}</span>
                <span className="crash-sos-sent__btns">
                  {showWa && (
                    <a href={c.waHref} target="_blank" rel="noopener noreferrer"
                       className="crash-sos-sent__btn crash-sos-sent__btn--wa">💬 WA</a>
                  )}
                  {showSms && (
                    <a href={c.smsHref}
                       className="crash-sos-sent__btn crash-sos-sent__btn--sms">📱 SMS</a>
                  )}
                </span>
              </div>
            );
          })}
          {channel === 'wa' && links.contacts?.length > 0 && (
            <a href={links.groupSmsHref} className="crash-sos-sent__group-sms">
              📱 SMS all {links.contacts.length} contacts at once
            </a>
          )}
        </div>
      </div>
    );
  })() : null;

  // ─── CHOOSING phase ────────────────────────────────────────────────────
  // Final design: full-red gradient, big monospace countdown, raised "I'M OK — CANCEL" button
  if (phase === PHASE.CHOOSING) {
    const countText = String(seconds).padStart(2, '0');
    const speedKmh = location?.speed && location.speed > 0 ? Math.round(location.speed * 3.6) : 78;
    const alertedCount = numbers ? 1 : 0;

    return (
      <div className="crash-final-overlay" role="alertdialog" aria-modal="true">
        {/* Status pill */}
        <span className="cf-pill">
          <span className="cf-pill-dot" />
          {t('crash_choosing.crash_detected')}
        </span>

        {/* Content (centered, upper area) */}
        <div className="cf-content">
          <div className="cf-do-not-panic">{t('crash_choosing.do_not_panic')}</div>
          <div className="cf-count">{countText}</div>
          <div className="cf-count-label">{t('crash_choosing.seconds_until')}</div>

          <div className="cf-details">
            {t('crash_choosing.deceleration', { speed: speedKmh })}<br />
            <strong style={{ fontWeight: 800 }}>
              {callNumber} · {topContactName(numbers)} · {alertedCount > 0 ? t('crash_choosing.emergency_contacts') : t('crash_choosing.no_contacts')}
            </strong>{' '}{t('crash_choosing.will_be_alerted')}
          </div>
        </div>

        {/* Mode selection — Auto or Manual */}
        <div className="cf-modes">
          <button className="cf-mode cf-mode--auto" onClick={triggerAutomatic}>
            <Bot size={20} strokeWidth={2.2} />
            <span className="cf-mode-title">{t('crash_choosing.automatic')}</span>
            <span className="cf-mode-desc">{t('crash_choosing.auto_desc')}</span>
          </button>
          <button className="cf-mode cf-mode--manual" onClick={handleChooseManual}>
            <PhoneCall size={20} strokeWidth={2.2} />
            <span className="cf-mode-title">{t('crash_choosing.manual')}</span>
            <span className="cf-mode-desc">{t('crash_choosing.manual_desc')}</span>
          </button>
        </div>



        {/* PIN-gated false alarm cancel */}
        <div className="cf-pin-zone">
          <div className="cf-pin-label">{t('crash_choosing.false_alarm')}</div>
          <div className="cf-pin-row">
            <input
              className={`cf-pin-input ${pinError ? 'cf-pin-input--error' : ''}`}
              type="tel" inputMode="numeric" maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && pin.length === 4) {
                  handleCancelFalseAlarm();
                }
              }}
              placeholder="0000"
            />
            <button className="cf-pin-btn" onClick={handleCancelFalseAlarm} disabled={pin.length !== 4}>
              {t('crash_choosing.stop_alarm')}
            </button>
          </div>
          {pinError && <div className="cf-pin-error">{t('crash_choosing.incorrect_pin')}</div>}
        </div>

        {/* Spacer pushes Send SOS Now toward bottom */}
        <div className="cf-spacer" />

        <button className="cf-send-now" onClick={() => {
          clearInterval(intervalRef.current);
          stopAlarm();
          fireCall();
        }}>
          {t('crash_choosing.send_sos_now')}
        </button>
      </div>
    );
  }

  // ─── AUTOMATING phase ──────────────────────────────────────────────────
  if (phase === PHASE.AUTOMATING) {
    return (
      <div className="modal-backdrop modal-backdrop--alert" role="alertdialog" aria-modal="true">
        <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', paddingBottom: 32 }}>
          <div className="sheet">
            <div className="handle-bar"><div className="handle" /></div>

            {/* Header */}
            <div style={{ padding: '24px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                   <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                      <path d="M24 4L6 10V22C6 31.3 13.7 40 24 44C34.3 40 42 31.3 42 22V10L24 4Z" fill="#3b82f6" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round"/>
                      <path d="M10 26 H 18 L 22 14 L 26 36 L 30 26 H 38" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                   </svg>
                   <div style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '-0.05em', color: '#0f172a' }}>
                     Road<span style={{ color: '#3b82f6' }}>SOS</span>
                   </div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
                  Calling {callNumber}
                </div>
              </div>
            </div>

            {/* Circular Timer */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0 24px' }}>
              <div style={{ 
                width: 130, height: 130, borderRadius: '50%', 
                background: '#FEF2F2', border: '5px solid #DC2626',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 20px rgba(220, 38, 38, 0.15)'
              }}>
                {seconds > 0 ? (
                  <>
                    <span style={{ fontSize: '48px', fontWeight: 900, color: '#DC2626', lineHeight: 1 }}>{seconds}</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#DC2626', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>seconds</span>
                  </>
                ) : (
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#DC2626' }}>Connecting</span>
                )}
              </div>
            </div>

            {/* Script Box */}
            <div style={{ padding: '0 20px 24px' }}>
              <div style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#475569', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {speaking ? '🔊 Listen — then say this:' : '📋 Say this to dispatcher:'}
                </div>
                <p style={{ fontSize: 15, fontWeight: 500, color: '#0f172a', lineHeight: 1.5 }}>"{dispatchText}"</p>
              </div>
            </div>

            {/* Big Cancel Button */}
            <div style={{ padding: '0 20px 24px' }}>
              <button 
                onClick={handleCancelAuto}
                style={{
                  width: '100%', height: 52, borderRadius: 12,
                  background: '#F1F5F9', border: '1.5px solid #E2E8F0', color: '#334155',
                  fontSize: 16, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#E2E8F0'}
                onMouseOut={(e) => e.target.style.background = '#F1F5F9'}
              >
                Cancel Auto-Dial
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ─── CALLING phase ────────────────────────────────────────────────────
  if (phase === PHASE.CALLING) {
    return (
      <div className="modal-backdrop modal-backdrop--alert" role="alertdialog" aria-modal="true">
        <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', paddingBottom: 32 }}>
          <div className="sheet">
            <div className="handle-bar"><div className="handle" /></div>

            {/* Header */}
            <div style={{ padding: '24px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                   <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                      <path d="M24 4L6 10V22C6 31.3 13.7 40 24 44C34.3 40 42 31.3 42 22V10L24 4Z" fill="#3b82f6" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round"/>
                      <path d="M10 26 H 18 L 22 14 L 26 36 L 30 26 H 38" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                   </svg>
                   <div style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '-0.05em', color: '#0f172a' }}>
                     Road<span style={{ color: '#3b82f6' }}>SOS</span>
                   </div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
                  Calling {callNumber}...
                </div>
              </div>
            </div>

            {/* Script Box */}
            <div style={{ padding: '0 20px 24px' }}>
              <div style={{ background: '#EFF6FF', border: '1.5px solid #93C5FD', borderRadius: 14, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1D4ED8', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  <PhoneCall size={16} strokeWidth={2.5} /> Say this to the dispatcher:
                </div>
                <p style={{ fontSize: 17, fontWeight: 600, color: '#1E3A8A', lineHeight: 1.5 }}>"{dispatchText}"</p>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#3B82F6', marginTop: 12 }}>
                  Read this out loud. The dispatcher will guide you next.
                </div>
              </div>
            </div>

            {/* Plus Code */}
            {plusCode && (
              <div className="cf-plus-row" style={{ padding: '0 20px 16px' }}>
                <span className="cf-plus-label">📌 Plus Code:</span>
                <span className="cf-plus-value">{plusCode}</span>
              </div>
            )}

            {/* SOS follow-up */}
            {SosFollowUp}

            {/* Close Button */}
            <div style={{ padding: '0 20px 24px' }}>
              <button
                onClick={() => { cancelSpeech(); onCancel?.(); }}
                style={{
                  width: '100%', height: 52, borderRadius: 12,
                  background: '#F1F5F9', border: '1.5px solid #E2E8F0', color: '#334155',
                  fontSize: 16, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#E2E8F0'}
                onMouseOut={(e) => e.target.style.background = '#F1F5F9'}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ─── MANUAL phase ──────────────────────────────────────────────────────
  const MANUAL_CALLS = [];
  if (numbers?.ambulance) MANUAL_CALLS.push({ label: t('dispatcher.ambulance'), num: numbers.ambulance, cls: "amb", name: "Ambulance" });
  if (numbers?.police)    MANUAL_CALLS.push({ label: t('dispatcher.police'),    num: numbers.police,    cls: "pol", name: "Police" });
  if (numbers?.general)   MANUAL_CALLS.push({ label: t('dispatcher.general'),   num: numbers.general,   cls: "gen", name: "Emergency" });

  const themeClass = mapTheme === 'light' ? 'card-light' : 'card-dark';

  return (
    <div className="modal-backdrop" role="alertdialog" aria-modal="true">
      <div className="dispatcher-card-wrapper">
        <div className={`card ${themeClass}`}>
          <div className="card-top">
            <div className="corner-mark"></div>
            <div className="card-eyebrow">
              <div className="live-dot"></div>
              <span className="eyebrow-text">{t('dispatcher.call_dispatcher')}</span>
            </div>
            <div className="card-title">{t('dispatcher.in_control')}</div>
            <div className="card-sub">{t('dispatcher.explain_location')}</div>
            <button className="close-btn" onClick={() => { cancelSpeech(); onCancel?.(); }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="loc-row">
            <div className="loc-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div className="loc-body">
              <div className="loc-place">{landmark || t('dispatcher.loc_approx')}</div>
              <div className="loc-coords">
                {location?.lat ? `${location.lat.toFixed(5)}, ${location.lon.toFixed(5)}` : t('dispatcher.acquiring_gps')}
              </div>
            </div>
            <button className="copy-btn" onClick={doCopy} title="Copy GPS">
              {copied
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              }
            </button>
          </div>

          <div className="svc-label">{t('dispatcher.select_service')}</div>
          <div className="services">
            {MANUAL_CALLS.map(({ label, num, cls, name }) => (
              <button key={label} className="svc-row" onClick={(e) => guardedTelDial(e, num, name)}>
                <div className={`svc-dot dot-${cls}`}></div>
                <div className={`svc-icon icon-${cls}`}>
                  {cls === 'amb' && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
                  {cls === 'pol' && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
                  {cls === 'gen' && <svg width="15" height="15" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.06 6.06l.91-.91a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7a2 2 0 0 1 1.72 2.01z"/></svg>}
                </div>
                <span className="svc-name">{label}</span>
                <span className={`svc-num num-${cls}`}>{num}</span>
                <div className="svc-arrow"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>
              </button>
            ))}
          </div>

          {SosFollowUp && (
            <div style={{ padding: '10px 20px 0' }}>
              {SosFollowUp}
            </div>
          )}

          <div className="footer">
            {plusCode ? (
              <div className="plus-code">
                <div>
                  <span className="plus-code-label">{t('dispatcher.plus_code')}</span>
                  <span className="plus-code-value">{plusCode}</span>
                </div>
                <button className="plus-copy-btn" onClick={() => {
                  navigator.clipboard.writeText(plusCode);
                  setPlusCopied(true);
                  setTimeout(() => setPlusCopied(false), 1800);
                }} title="Copy Plus Code">
                  {plusCopied
                    ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  }
                </button>
              </div>
            ) : <div />}
            <button className="dismiss-btn" onClick={() => { cancelSpeech(); onCancel?.(); }}>
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

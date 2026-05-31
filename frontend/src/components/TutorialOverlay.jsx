import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCw, Sun, Globe, MapPin, AlertTriangle, Activity, Truck, ArrowRight } from 'lucide-react';
import { DEMO_MODE } from '../utils/demoMode';

/* ── Inline icon helper — renders a lucide icon inline with text ── */
function I({ children, label }) {
  return (
    <span className="tut-inline-icon">
      <span className="tut-icon-circle">{children}</span>
      <span className="tut-icon-label">{label}</span>
    </span>
  );
}

export default function TutorialOverlay({ onComplete, theme = 'dark' }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState(null);
  const [stepIdx, setStepIdx] = useState(0);

  const QUICK_STEPS = [
    {
      titleFallback: t('tutorial.quick.title_1', 'The functional features'),
      bodyType: 'buttons-list',
    },
    {
      customHeader: (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <button 
            className="sos-bar"
            style={{ pointerEvents: 'none', width: '100%', maxWidth: '300px', margin: '0' }}
          >
            <div className="signal">
              <span></span><span></span><span></span><span></span>
            </div>
            <div className="vdiv"></div>
            <span className="sos-label">SOS</span>
            <span className="arrow-sep">→</span>
            <span className="sos-dest">Send Location</span>
          </button>
        </div>
      ),
      titleFallback: t('tutorial.quick.title_2', 'When to use SOS'),
      titleSmall: true,
      bodyType: 'steps-list',
      largeSteps: true,
      items: [
        { num: '1', text: t('tutorial.quick.step2_1', 'The blue button as given above is the SOS button') },
        { num: '2', text: t('tutorial.quick.step2_2', 'If you press it your location is send\n   a) to your contacts saved in Medical ID\n   b) to emergency service near you') },
        { num: '3', text: t('tutorial.quick.step2_3', 'Below SOS button there is nearest services and other contact for other services') },
      ],
      footer: t('tutorial.quick.footer_2', "That's it. Help is on the way."),
    },
    {
      customHeader: (isDark) => (
        <div className={isDark ? 'theme-dark' : 'theme-light'} style={{ pointerEvents: 'none', display: 'flex', justifyContent: 'center', height: '220px', overflow: 'hidden', marginBottom: '6px' }}>
          <div style={{ transform: 'scale(0.5)', transformOrigin: 'top center', width: '312px' }}>
            <div className="triage-sheet">
              <div className="triage-handle"><div className="triage-handle-bar"></div></div>
              <div className="triage-hd" style={{ padding: '12px 16px' }}>
                <div className="triage-hd-l">
                  <div className="triage-hd-tag" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Activity size={10} strokeWidth={2.5} /> QUICK TRIAGE
                  </div>
                  <div className="triage-hd-title" style={{ fontSize: '18px' }}>{t('tutorial.triage.title', 'What happened?')}</div>
                  <div className="triage-hd-sub" style={{ fontSize: '11px', maxWidth: '170px' }}>{t('tutorial.triage.sub', 'Two questions — we will prioritise the right help for your situation.')}</div>
                </div>
                <button className="triage-sos" style={{ height: '30px', fontSize: '12px', marginTop: '2px' }}>SOS</button>
              </div>
              <div className="triage-rule"></div>
              <div className="triage-qs" style={{ padding: '12px 16px', gap: '10px' }}>
                <div className="triage-qb">
                  <div className="triage-qrow" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="triage-qico"><Activity size={12} strokeWidth={2.2} /></div>
                    <span className="triage-qtxt" style={{ fontSize: '12px' }}>{t('tutorial.triage.q1', 'Is anyone injured?')}</span>
                  </div>
                  <div className="triage-pair">
                    <button className="triage-opt py" style={{ height: '38px', fontSize: '11px' }}>
                      <div className="triage-rc"><div className="triage-rc-inner"></div></div>{t('tutorial.triage.yes_injured', 'Yes, injured')}
                    </button>
                    <button className="triage-opt" style={{ height: '38px', fontSize: '11px' }}>
                      <div className="triage-rc"><div className="triage-rc-inner"></div></div>{t('tutorial.triage.no_injuries', 'No injuries')}
                    </button>
                  </div>
                </div>
                <div className="triage-qb">
                  <div className="triage-qrow" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="triage-qico"><Truck size={12} strokeWidth={2.2} /></div>
                    <span className="triage-qtxt" style={{ fontSize: '12px' }}>{t('tutorial.triage.q2', 'Is the vehicle blocking the road?')}</span>
                  </div>
                  <div className="triage-pair">
                    <button className="triage-opt" style={{ height: '38px', fontSize: '11px' }}>
                      <div className="triage-rc"><div className="triage-rc-inner"></div></div>{t('tutorial.triage.yes_blocking', 'Yes, blocking')}
                    </button>
                    <button className="triage-opt pn" style={{ height: '38px', fontSize: '11px' }}>
                      <div className="triage-rc"><div className="triage-rc-inner"></div></div>{t('tutorial.triage.road_clear', 'Road is clear')}
                    </button>
                  </div>
                </div>
              </div>
              <div className="triage-res ra" style={{ margin: '0 16px', padding: '10px', fontSize: '11px' }}>
                <AlertTriangle size={13} strokeWidth={2} style={{ flexShrink: 0 }} />
                <span>{t('tutorial.triage.alert', 'Injury reported — Ambulance (108) will be prioritised first.')}</span>
              </div>
              <button className="triage-fbtn on" style={{ height: '42px', fontSize: '12px', margin: '10px 16px 6px' }}>
                <ArrowRight size={12} strokeWidth={2.2} /> {t('tutorial.triage.get_help', 'Get Prioritised Help')}
              </button>
              <button className="triage-skip-btn" style={{ fontSize: '11px', marginBottom: '16px' }}>{t('tutorial.triage.skip', 'Skip — show all contacts')}</button>
            </div>
          </div>
        </div>
      ),
      titleFallback: t('tutorial.quick.title_3', 'Prioritize your situation'),
      titleSmall: true,
      bodyType: 'steps-list',
      largeSteps: true,
      items: [
        { num: '1', text: t('tutorial.quick.step3_1', 'It is the interface that appears of prioritize my situation button below call the nearest service area') },
        { num: '2', text: t('tutorial.quick.step3_2', 'Answer a few quick questions about your situation, and the system will prioritize the help you need based on urgency and potential risk.') },
      ],
    },
    {
      titleFallback: t('tutorial.quick.title_4', 'It Works Even If You Can\'t'),
      bodyType: 'steps-list',
      noBubble: true,
      items: [
        { num: '•', text: t('tutorial.quick.step4_1', 'A 10-second countdown starts') },
        { num: '•', text: t('tutorial.quick.step4_2', 'Your location is sent automatically') },
        { num: '•', text: t('tutorial.quick.step4_3', 'Your emergency contact gets a message') },
        { num: '•', text: t('tutorial.quick.step4_4', 'The emergency services are informed') },
      ],
      intro: t('tutorial.quick.intro_4', "If your phone detects a crash and you can't respond:"),
      footer: t('tutorial.quick.footer_4', "You don't need to do anything. The app handles it."),
    },
  ];

  const FULL_STEPS = [
    {
      titleFallback: t('tutorial.full.title_1', 'What You See On Screen'),
      bodyType: 'buttons-list',
      footer: t('tutorial.full.footer_1', "The dot on the right shows if you're online. Even with zero signal, you'll always see emergency numbers like 108, 100, 101, 112."),
    },
    {
      emoji: '📋',
      titleFallback: t('tutorial.full.title_2', 'Set This Up Once'),
      bodyType: 'two-sections',
      sections: [
        {
          heading: t('tutorial.full.heading_2_1', '① Tap the ID button'),
          lines: [
            t('tutorial.full.lines_2_1_1', 'Fill in: blood type, allergies, emergency contact'),
            t('tutorial.full.lines_2_1_2', "Paramedics can read this if you're unconscious"),
            t('tutorial.full.lines_2_1_3', 'It stays on your phone only — never uploaded'),
          ],
        },
        {
          heading: t('tutorial.full.heading_2_2', '② Tap Plan Offline Trip'),
          lines: [
            t('tutorial.full.lines_2_2_1', "If you're driving somewhere with bad signal"),
            t('tutorial.full.lines_2_2_2', 'It saves hospitals and police along your route'),
            t('tutorial.full.lines_2_2_3', 'So the data is ready before you lose signal'),
          ],
        },
      ],
    },
    {
      titleFallback: t('tutorial.full.title_3', 'When Something Happens'),
      bodyType: 'steps-list',
      intro: t('tutorial.full.intro_3', "Here's exactly what to do:"),
      headerWidget: (
        <button
          className="btn-prioritise"
          style={{ pointerEvents: 'none', width: '100%', margin: '8px 0 12px', padding: '0 16px' }}
        >
          {t('tutorial.full.prioritise_btn', 'Prioritise for my situation')}
          <span className="arrow">
            <ArrowRight size={14} strokeWidth={2.2} />
          </span>
        </button>
      ),
      items: [
        { num: '1', text: t('tutorial.full.step3_1', 'App finds your location automatically') },
        { num: '2', text: t('tutorial.full.step3_2', 'Answer 2 question using priortize my situation button') },
        { num: '3', text: t('tutorial.full.step3_3', 'The app puts the best help for you') },
      ],
      footer: t('tutorial.full.footer_3', '⏱️ Total time: under 10 seconds'),
    },
    {
      titleFallback: t('tutorial.quick.title_4', 'It Works Even If You Can\'t'),
      bodyType: 'steps-list',
      noBubble: true,
      items: [
        { num: '•', text: t('tutorial.quick.step4_1', 'A 10-second countdown starts') },
        { num: '•', text: t('tutorial.quick.step4_2', 'Your location is sent automatically') },
        { num: '•', text: t('tutorial.quick.step4_3', 'Your emergency contact gets a message') },
        { num: '•', text: t('tutorial.quick.step4_4', 'The emergency services are informed') },
      ],
      intro: t('tutorial.quick.intro_4', "If your phone detects a crash and you can't respond:"),
      footer: t('tutorial.quick.footer_4', "You don't need to do anything. The app handles it."),
    },
    {
      emoji: '📡',
      titleFallback: t('tutorial.full.title_4', 'No Internet? Still Works'),
      bodyType: 'steps-list',
      intro: t('tutorial.full.intro_4', 'The app has 4 backup layers:'),
      items: [
        { num: '1', text: t('tutorial.full.step4_1', 'Live search (when online)') },
        { num: '2', text: t('tutorial.full.step4_2', 'Saved results from last time') },
        { num: '3', text: t('tutorial.full.step4_3', 'Your offline trip data') },
        { num: '4', text: t('tutorial.full.step4_4', 'Emergency numbers built into the app') },
      ],
      footer: t('tutorial.full.footer_4', 'Even with zero internet, you\'ll always see: 📞 108 · 100 · 101 · 112. These work offline. Always.'),
    },
  ];

  const steps = mode === 'quick' ? QUICK_STEPS : mode === 'full' ? FULL_STEPS : [];
  const totalSteps = steps.length;
  const currentStep = steps[stepIdx];
  const isLastStep = stepIdx === totalSteps - 1;
  const progressPct = totalSteps > 0 ? ((stepIdx + 1) / totalSteps) * 100 : 0;

  const isDark = theme === 'dark';
  const iconSize = 14;
  const iconStroke = 2;

  /* ── The buttons list body (used in quick step 1 and full step 1) ── */
  const renderButtonsList = (footer) => (
    <div className="tut-buttons-list">
      <p className="tut-body-intro" style={{ marginBottom: '12px' }}>{t('tutorial.buttons_intro', 'The buttons on top bar of the screen')}</p>
      
      {/* Top bar image replica inside the square box area */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <div 
          className={`toolbar toolbar-${isDark ? 'light' : 'dark'}`} 
          style={{ 
            position: 'relative', 
            margin: 0, 
            pointerEvents: 'none',
            boxShadow: isDark ? '0 4px 16px rgba(255,255,255,0.1)' : '0 4px 16px rgba(0,0,0,0.15)'
          }}
        >
          <button className="btn-icon"><RotateCw size={19} strokeWidth={1.8} /></button>
          <button className="btn-icon"><Sun size={19} strokeWidth={1.8} /></button>
          <button className="btn-icon"><Globe size={19} strokeWidth={1.8} /></button>
          <button className="btn-icon"><MapPin size={19} strokeWidth={1.8} /></button>
          <button className="btn-icon">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
          </button>
          {DEMO_MODE && (
            <button className="btn-icon">
              <AlertTriangle size={16} strokeWidth={2} />
            </button>
          )}
          <div className="sep"></div>
          <button className="btn-id">
            <span>ID</span>
          </button>
        </div>
      </div>

      <div className="tut-icon-rows">
        <I label={t('tutorial.icon.refresh', 'Refreshes location and places')}><RotateCw size={iconSize} strokeWidth={iconStroke} /></I>
        <I label={t('tutorial.icon.theme', 'Dark/Light mode')}><Sun size={iconSize} strokeWidth={iconStroke} /></I>
        <I label={t('tutorial.icon.lang', 'Language')}><Globe size={iconSize} strokeWidth={iconStroke} /></I>
        <I label={t('tutorial.icon.location', 'Sets yours location manually and searches')}><MapPin size={iconSize} strokeWidth={iconStroke} /></I>
        {DEMO_MODE && (
          <I label={t('tutorial.icon.demo', 'Intialises a demo crash test reponse of app')}><AlertTriangle size={iconSize} strokeWidth={iconStroke} /></I>
        )}
        <I label={t('tutorial.icon.id', 'Medical ID holds your bio data and emergency contacts')}>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '-0.5px' }}>ID</span>
        </I>
        <I label={t('tutorial.icon.trip', 'Preload emergency services before your trip')}>
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" strokeWidth={iconStroke} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
        </I>
      </div>
      {footer && <p className="tut-body-footer">{footer}</p>}
    </div>
  );

  /* ── Steps list body ── */
  const renderStepsList = (step) => (
    <div className={`tut-steps-list ${step.largeSteps ? 'tut-steps-large' : ''}`}>
      {step.intro && <p className="tut-body-intro">{step.intro}</p>}
      {step.headerWidget && step.headerWidget}
      <div className="tut-numbered-items">
        {step.items.map((item, i) => (
          <div key={i} className="tut-numbered-item">
            <span className={`tut-num ${step.noBubble ? 'tut-num-plain' : ''}`}>{item.num}</span>
            <span className="tut-num-text" style={{ whiteSpace: 'pre-wrap' }}>{item.text}</span>
          </div>
        ))}
      </div>
      {step.footer && <p className="tut-body-footer">{step.footer}</p>}
    </div>
  );

  /* ── Two-section body ── */
  const renderTwoSections = (step) => (
    <div className="tut-two-sections">
      {step.sections.map((sec, i) => (
        <div key={i} className="tut-section-block">
          <div className="tut-section-heading">{sec.heading}</div>
          {sec.lines.map((line, j) => (
            <div key={j} className="tut-section-line">{line}</div>
          ))}
        </div>
      ))}
    </div>
  );

  /* ── Simple text body ── */
  const renderSimple = (step) => (
    <p className="tut-body" style={{ whiteSpace: 'pre-line' }}>{step.text}</p>
  );

  /* ── Body renderer ── */
  const renderBody = (step) => {
    switch (step.bodyType) {
      case 'buttons-list': return renderButtonsList(step.footer);
      case 'steps-list': return renderStepsList(step);
      case 'two-sections': return renderTwoSections(step);
      case 'simple': return renderSimple(step);
      default: return null;
    }
  };

  // ── Welcome screen ──
  const renderWelcome = () => (
    <div className="tut-card" style={{ animationName: 'tutSlideUp' }}>
      <h2 className="tut-title-big">
        {t('tutorial.welcome_title', 'Want a quick tour?')}
      </h2>
      <p className="tut-body">
        {t('tutorial.welcome_body', 'Welcome to RoadSOS. RoadSOS is a webapp that helps you to find nearby help in your time of emergency even if you are offline')}
      </p>
      <div className="tut-actions">
        <button className="tut-btn tut-btn-main" onClick={() => { setMode('quick'); setStepIdx(0); }}>
          {t('tutorial.quick_tour', 'Quick Tour — 1 minute')}
        </button>
        <button className="tut-btn tut-btn-outline" onClick={() => { setMode('full'); setStepIdx(0); }}>
          {t('tutorial.full_tour', 'Full Tour — 5 minutes')}
        </button>
        <button className="tut-btn tut-btn-skip" onClick={onComplete} style={{ fontWeight: 'bold' }}>
          {t('tutorial.skip', ' SKIP ')}
        </button>
      </div>
    </div>
  );

  // ── Step dialog ──
  const renderStepDialog = () => {

    return (
      <div className="tut-card" key={`${mode}-${stepIdx}`} style={{ animationName: 'tutSlideUp' }}>
        {/* Progress bar */}
        <div className="tut-progress-track">
          <div className="tut-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="tut-progress-label">
          {stepIdx + 1} / {totalSteps}
        </div>

        {/* Emoji + Title */}
        {currentStep.customHeader && (typeof currentStep.customHeader === 'function' ? currentStep.customHeader(isDark) : currentStep.customHeader)}
        {currentStep.emoji && <div className="tut-step-emoji">{currentStep.emoji}</div>}
        <h2 className={`tut-title-big ${currentStep.titleSmall ? 'tut-title-small' : ''}`}>
          {currentStep.titleFallback}
        </h2>

        {/* Body */}
        {renderBody(currentStep)}

        {/* Actions */}
        <div className="tut-actions">
          {isLastStep ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="tut-btn"
                style={{ flex: 1, backgroundColor: '#60a5fa', color: '#fff', border: 'none' }}
                onClick={() => setStepIdx(i => i - 1)}
              >
                ← {t('tutorial.back', 'Back')}
              </button>
              <button 
                className="tut-btn tut-btn-main" 
                style={{ flex: 1, backgroundColor: '#2563eb', color: '#fff', border: 'none' }}
                onClick={onComplete}
              >
                {t('tutorial.got_it', 'Got it — Done!')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="tut-btn"
                style={{ flex: 1, backgroundColor: '#60a5fa', color: '#fff', border: 'none' }}
                onClick={() => {
                  if (stepIdx === 0) setMode(null);
                  else setStepIdx(i => i - 1);
                }}
              >
                ← {t('tutorial.back', 'Back')}
              </button>
              <button
                className="tut-btn tut-btn-main"
                style={{ flex: 1, backgroundColor: '#2563eb', color: '#fff', border: 'none' }}
                onClick={() => setStepIdx(i => i + 1)}
              >
                {t('tutorial.next', 'Next')} →
              </button>
            </div>
          )}
          {!isLastStep && (
            <button
              className="tut-btn tut-btn-outline"
              style={{ marginTop: '10px' }}
              onClick={onComplete}
            >
              {t('tutorial.skip_x', 'Skip ✕')}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`tut-overlay ${isDark ? 'tut-dark' : 'tut-light'}`}>
      <style>{`
        .tut-overlay {
          position: fixed; inset: 0; z-index: 99999;
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          background: rgba(0,0,0,0.7);
          pointer-events: auto; overflow-y: auto;
        }

        .tut-card {
          width: 100%; max-width: 380px;
          border-radius: 24px; padding: 28px 24px 24px;
          display: flex; flex-direction: column;
          animation: tutSlideUp 0.4s ease-out both;
        }
        .tut-dark .tut-card {
          background: linear-gradient(165deg, rgba(30,34,50,0.97), rgba(18,20,32,0.99));
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04);
        }
        .tut-light .tut-card {
          background: linear-gradient(165deg, rgba(255,255,255,0.98), rgba(245,246,250,0.99));
          border: 1px solid rgba(0,0,0,0.06);
          box-shadow: 0 24px 64px rgba(0,0,0,0.12);
        }

        @keyframes tutSlideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── Progress ── */
        .tut-progress-track { width: 100%; height: 4px; border-radius: 2px; margin-bottom: 6px; overflow: hidden; }
        .tut-dark .tut-progress-track  { background: rgba(255,255,255,0.08); }
        .tut-light .tut-progress-track { background: rgba(0,0,0,0.06); }
        .tut-progress-fill { height: 100%; border-radius: 2px; transition: width 0.4s ease; background: linear-gradient(90deg, #3B82F6, #60A5FA); }
        .tut-progress-label { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; margin-bottom: 16px; }
        .tut-dark .tut-progress-label  { color: rgba(255,255,255,0.3); }
        .tut-light .tut-progress-label { color: rgba(0,0,0,0.25); }

        /* ── Emoji ── */
        .tut-welcome-emoji { font-size: 48px; margin-bottom: 12px; line-height: 1; }
        .tut-step-emoji { font-size: 36px; margin-bottom: 8px; line-height: 1; }

        /* ── Title ── */
        .tut-title-big {
          font-family: 'Outfit', sans-serif; font-size: 22px; font-weight: 800;
          letter-spacing: -0.03em; line-height: 1.2; margin: 0 0 14px 0; text-align: left;
        }
        .tut-dark .tut-title-big  { color: #f0f2fa; }
        .tut-light .tut-title-big { color: #0d0d14; }

        /* ── Body text ── */
        .tut-body {
          font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 450;
          line-height: 1.65; margin: 0 0 24px 0; text-align: left;
        }
        .tut-dark .tut-body  { color: rgba(255,255,255,0.82); }
        .tut-light .tut-body { color: rgba(15,23,42,0.82); }

        .tut-body-intro {
          font-family: 'Outfit', sans-serif; font-size: 13.5px; font-weight: 450;
          line-height: 1.5; margin: 0 0 14px 0;
        }
        .tut-dark .tut-body-intro  { color: rgba(255,255,255,0.7); }
        .tut-light .tut-body-intro { color: rgba(15,23,42,0.7); }

        .tut-body-footer {
          font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 450;
          line-height: 1.55; margin: 14px 0 20px 0;
        }
        .tut-dark .tut-body-footer  { color: rgba(255,255,255,0.5); }
        .tut-light .tut-body-footer { color: rgba(15,23,42,0.45); }

        /* ── Inline icon rows (buttons list) ── */
        .tut-icon-rows { display: flex; flex-direction: column; gap: 10px; margin-bottom: 4px; }
        .tut-inline-icon { display: flex; align-items: center; gap: 10px; }
        .tut-icon-circle {
          width: 30px; height: 30px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .tut-dark .tut-icon-circle { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
        .tut-light .tut-icon-circle { background: rgba(0,0,0,0.05); color: rgba(0,0,0,0.6); }
        .tut-icon-label {
          font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 500; line-height: 1.3;
        }
        .tut-dark .tut-icon-label  { color: rgba(255,255,255,0.82); }
        .tut-light .tut-icon-label { color: rgba(15,23,42,0.82); }

        /* ── Numbered items ── */
        .tut-numbered-items { display: flex; flex-direction: column; gap: 10px; margin-bottom: 4px; }
        .tut-numbered-item { display: flex; align-items: flex-start; gap: 10px; }
        .tut-num {
          width: 28px; height: 28px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 700;
        }
        .tut-dark .tut-num  { background: rgba(59,130,246,0.15); color: #60A5FA; }
        .tut-light .tut-num { background: rgba(37,99,235,0.08); color: #2563EB; }
        .tut-num-text {
          font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 500;
          line-height: 1.5; padding-top: 4px;
        }
        .tut-dark .tut-num-text  { color: rgba(255,255,255,0.82); }
        .tut-light .tut-num-text { color: rgba(15,23,42,0.82); }

        /* Plain bullet (no circle) */
        .tut-num-plain {
          background: none !important; width: auto !important; height: auto !important;
          border-radius: 0 !important; font-size: 18px !important; padding: 0 4px 0 0;
        }

        /* Large Steps Modifier */
        .tut-steps-large .tut-num {
          width: 32px; height: 32px; font-size: 14.5px;
        }
        .tut-steps-large .tut-num-text {
          font-size: 14.5px; line-height: 1.6; padding-top: 5px;
        }
        
        .tut-title-small {
          font-size: 20px !important; margin-bottom: 12px;
        }

        /* ── Two sections ── */
        .tut-two-sections { display: flex; flex-direction: column; gap: 18px; margin-bottom: 20px; }
        .tut-section-block { display: flex; flex-direction: column; gap: 4px; }
        .tut-section-heading {
          font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 700;
          margin-bottom: 4px;
        }
        .tut-dark .tut-section-heading  { color: #60A5FA; }
        .tut-light .tut-section-heading { color: #2563EB; }
        .tut-section-line {
          font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 450;
          line-height: 1.55; padding-left: 12px;
        }
        .tut-dark .tut-section-line  { color: rgba(255,255,255,0.72); }
        .tut-light .tut-section-line { color: rgba(15,23,42,0.72); }

        /* ── Actions ── */
        .tut-actions { display: flex; flex-direction: column; gap: 10px; margin-top: 24px; }
        .tut-btn {
          font-family: 'Outfit', sans-serif; border: none; border-radius: 14px;
          cursor: pointer; transition: opacity 0.15s, transform 0.12s;
          outline: none; width: 100%; text-align: center;
        }
        .tut-btn:active { transform: scale(0.97); }

        .tut-btn-main {
          height: 52px; font-size: 15px; font-weight: 700; letter-spacing: 0.01em;
        }
        .tut-btn-main:hover { opacity: 0.9; }
        .tut-dark .tut-btn-main { background: linear-gradient(135deg, #3B82F6, #2563EB); color: #fff; box-shadow: 0 4px 16px rgba(59,130,246,0.35); }
        .tut-light .tut-btn-main { background: linear-gradient(135deg, #2563EB, #1D4ED8); color: #fff; box-shadow: 0 4px 16px rgba(37,99,235,0.25); }

        .tut-btn-outline {
          height: 48px; font-size: 14px; font-weight: 600; background: transparent;
        }
        .tut-btn-outline:hover { opacity: 0.8; }
        .tut-dark .tut-btn-outline { color: rgba(255,255,255,0.85); border: 1.5px solid rgba(255,255,255,0.15); }
        .tut-light .tut-btn-outline { color: rgba(15,23,42,0.85); border: 1.5px solid rgba(0,0,0,0.12); }

        .tut-btn-skip {
          height: 40px; font-size: 13px; font-weight: 500; background: transparent;
        }
        .tut-btn-skip:hover { opacity: 0.6; }
        .tut-dark .tut-btn-skip  { color: #ffffff; }
        .tut-light .tut-btn-skip { color: #000000; }

        .tut-btn-back {
          height: 38px; font-size: 13px; font-weight: 500; background: transparent;
        }
        .tut-btn-back:hover { opacity: 0.6; }
        .tut-dark .tut-btn-back  { color: rgba(255,255,255,0.3); }
        .tut-light .tut-btn-back { color: rgba(0,0,0,0.25); }

        .tut-bottom-skip {
          position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%);
          font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600;
          border: none; border-radius: 20px; padding: 10px 28px; cursor: pointer; z-index: 100000;
          transition: opacity 0.15s;
        }
        .tut-bottom-skip:hover { opacity: 0.7; }
        .tut-dark .tut-bottom-skip { background: #ffffff; color: #000000; }
        .tut-light .tut-bottom-skip { background: #ffffff; color: #000000; }

        ${mode !== null && stepIdx === 0 ? `
          /* Removed top bar highlight hack */
        ` : ''}
      `}</style>


      {mode === null ? renderWelcome() : renderStepDialog()}
    </div>
  );
}

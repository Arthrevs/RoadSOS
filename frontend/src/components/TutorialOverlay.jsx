import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCw, Sun, Globe, MapPin, AlertTriangle } from 'lucide-react';

/* ── Inline icon helper — renders a lucide icon inline with text ── */
function I({ children, label }) {
  return (
    <span className="tut-inline-icon">
      <span className="tut-icon-circle">{children}</span>
      <span className="tut-icon-label">{label}</span>
    </span>
  );
}

/* ── Step data ── */
const QUICK_STEPS = [
  {
    emoji: '🔘',
    titleFallback: 'These Buttons Help You',
    bodyType: 'buttons-list',
  },
  {
    emoji: '🆘',
    titleFallback: 'Need Help? Do This',
    bodyType: 'steps-list',
    items: [
      { num: '1', text: 'Tap the big blue SOS button' },
      { num: '2', text: 'Your location is sent to your emergency contact' },
      { num: '3', text: 'Tap Call on the nearest hospital below' },
    ],
    footer: "That's it. Help is on the way.",
  },
  {
    emoji: '🛡️',
    titleFallback: 'It Works Even If You Can\'t',
    bodyType: 'steps-list',
    items: [
      { num: '⏱️', text: 'A 30-second countdown starts' },
      { num: '📤', text: 'Your location is sent automatically' },
      { num: '📱', text: 'Your emergency contact gets a message' },
    ],
    intro: "If your phone detects a crash and you can't respond:",
    footer: "You don't need to do anything. The app handles it.",
  },
];

const FULL_STEPS = [
  {
    emoji: '👀',
    titleFallback: 'What You See On Screen',
    bodyType: 'buttons-list',
    footer: "The dot on the right shows if you're online. Even with zero signal, you'll always see emergency numbers like 108, 100, 101, 112.",
  },
  {
    emoji: '📋',
    titleFallback: 'Set This Up Once',
    bodyType: 'two-sections',
    sections: [
      {
        heading: '① Tap the ID button',
        lines: [
          'Fill in: blood type, allergies, emergency contact',
          "Paramedics can read this if you're unconscious",
          'It stays on your phone only — never uploaded',
        ],
      },
      {
        heading: '② Tap Plan Offline Trip',
        lines: [
          "If you're driving somewhere with bad signal",
          'It saves hospitals and police along your route',
          'So the data is ready before you lose signal',
        ],
      },
    ],
  },
  {
    emoji: '⚡',
    titleFallback: 'When Something Happens',
    bodyType: 'steps-list',
    intro: "Here's exactly what to do:",
    items: [
      { num: '1', text: 'App finds your location automatically' },
      { num: '2', text: 'Answer 2 quick questions (what happened?)' },
      { num: '3', text: 'The app puts the best help at the top' },
      { num: '4', text: 'Tap Call on the first result' },
      { num: '5', text: 'Tap SOS to send your location' },
    ],
    footer: '⏱️ Total time: under 10 seconds',
  },
  {
    emoji: '🛡️',
    titleFallback: "If You Can't Respond",
    bodyType: 'steps-list',
    intro: 'Your phone watches for sudden stops. If it detects a crash:',
    items: [
      { num: '⏱️', text: 'A 30-second countdown starts' },
      { num: '📤', text: 'If you don\'t cancel, it auto-sends your location, road name, and crash alert' },
      { num: '📱', text: 'Sent via SMS and WhatsApp to your emergency contact' },
    ],
    footer: "You don't need to touch anything.",
  },
  {
    emoji: '📡',
    titleFallback: 'No Internet? Still Works',
    bodyType: 'steps-list',
    intro: 'The app has 4 backup layers:',
    items: [
      { num: '1', text: 'Live search (when online)' },
      { num: '2', text: 'Saved results from last time' },
      { num: '3', text: 'Your offline trip data' },
      { num: '4', text: 'Emergency numbers built into the app' },
    ],
    footer: 'Even with zero internet, you\'ll always see: 📞 108 · 100 · 101 · 112. These work offline. Always.',
  },
  {
    emoji: '🎬',
    titleFallback: 'Want To See a Demo?',
    bodyType: 'simple',
    text: 'We have a short video that shows how crash detection works in real life.\n\nWant to watch it?',
  },
];

export default function TutorialOverlay({ onComplete, theme = 'dark' }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState(null);
  const [stepIdx, setStepIdx] = useState(0);

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
      <p className="tut-body-intro">See the buttons at the top of your screen?</p>
      <div className="tut-icon-rows">
        <I label="Refresh — gets new nearby help"><RotateCw size={iconSize} strokeWidth={iconStroke} /></I>
        <I label="Dark / Light mode"><Sun size={iconSize} strokeWidth={iconStroke} /></I>
        <I label="Language — pick yours"><Globe size={iconSize} strokeWidth={iconStroke} /></I>
        <I label="Set location — if GPS doesn't work"><MapPin size={iconSize} strokeWidth={iconStroke} /></I>
        <I label="Crash alert — test it"><AlertTriangle size={iconSize} strokeWidth={iconStroke} /></I>
        <I label="Medical ID — your health info">
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '-0.5px' }}>ID</span>
        </I>
      </div>
      <p className="tut-body-footer">{footer || "The little dot on the right tells you if you're connected to the internet."}</p>
    </div>
  );

  /* ── Steps list body ── */
  const renderStepsList = (step) => (
    <div className="tut-steps-list">
      {step.intro && <p className="tut-body-intro">{step.intro}</p>}
      <div className="tut-numbered-items">
        {step.items.map((item, i) => (
          <div key={i} className="tut-numbered-item">
            <span className="tut-num">{item.num}</span>
            <span className="tut-num-text">{item.text}</span>
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
      <div className="tut-welcome-emoji">👋</div>
      <h2 className="tut-title-big">
        {t('tutorial.welcome_title', 'Want a quick tour?')}
      </h2>
      <p className="tut-body">
        {t('tutorial.welcome_body', 'This app can save your life in a road emergency. Let us show you how it works — takes less than a minute.')}
      </p>
      <div className="tut-actions">
        <button className="tut-btn tut-btn-main" onClick={() => { setMode('quick'); setStepIdx(0); }}>
          ⚡ {t('tutorial.quick_tour', 'Quick Tour — 1 minute')}
        </button>
        <button className="tut-btn tut-btn-outline" onClick={() => { setMode('full'); setStepIdx(0); }}>
          📖 {t('tutorial.full_tour', 'Full Tour — 5 minutes')}
        </button>
        <button className="tut-btn tut-btn-skip" onClick={onComplete}>
          {t('tutorial.skip', "Skip — I'll figure it out")}
        </button>
      </div>
    </div>
  );

  // ── Step dialog ──
  const renderStepDialog = () => {
    const isFullDemoStep = mode === 'full' && isLastStep;

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
        <div className="tut-step-emoji">{currentStep.emoji}</div>
        <h2 className="tut-title-big">{currentStep.titleFallback}</h2>

        {/* Body */}
        {renderBody(currentStep)}

        {/* Actions */}
        <div className="tut-actions">
          {isFullDemoStep ? (
            <>
              <button
                className="tut-btn tut-btn-main"
                onClick={() => { window.open('https://roadsos-frontend.vercel.app/demo', '_blank'); onComplete(); }}
              >
                🎬 {t('tutorial.watch_demo', 'Watch Demo Video')}
              </button>
              <button className="tut-btn tut-btn-outline" onClick={onComplete}>
                ✅ {t('tutorial.im_good', "I'm good — Done!")}
              </button>
            </>
          ) : isLastStep ? (
            <button className="tut-btn tut-btn-main" onClick={onComplete}>
              ✅ {t('tutorial.got_it', 'Got it — Done!')}
            </button>
          ) : (
            <button className="tut-btn tut-btn-main" onClick={() => setStepIdx(i => i + 1)}>
              {t('tutorial.next', 'Next')} →
            </button>
          )}

          {stepIdx > 0 && (
            <button className="tut-btn tut-btn-back" onClick={() => setStepIdx(i => i - 1)}>
              ← {t('tutorial.back', 'Back')}
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
          backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
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
        .tut-actions { display: flex; flex-direction: column; gap: 10px; }
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
        .tut-dark .tut-btn-skip  { color: rgba(255,255,255,0.28); }
        .tut-light .tut-btn-skip { color: rgba(0,0,0,0.25); }

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
        .tut-dark .tut-bottom-skip { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.4); }
        .tut-light .tut-bottom-skip { background: rgba(0,0,0,0.05); color: rgba(0,0,0,0.3); }
      `}</style>

      {mode !== null && (
        <button className="tut-bottom-skip" onClick={onComplete}>
          Skip ✕
        </button>
      )}

      {mode === null ? renderWelcome() : renderStepDialog()}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function TutorialOverlay({ 
  onComplete, 
  theme = 'dark',
  triggerSidebar,
  triggerInfo,
  onStepChange
}) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (onStepChange) onStepChange(step);
  }, [step, onStepChange]);

  // We use a slight animation for the cursor
  const cursorStyle = {
    position: 'absolute',
    zIndex: 10001,
    transition: 'all 0.5s ease',
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
    animation: 'bounce 1s infinite alternate'
  };

  const getStepContent = () => {
    switch (step) {
      case 1:
        return {
          title: t('tutorial.title', 'Want a quick tour?'),
          text: t('tutorial.step1', 'Do you want a tutorial of the app'),
          buttons: (
            <>
              <button className="tut-btn-primary" onClick={() => setStep(2)}>{t('tutorial.yes', 'YES')}</button>
              <button className="tut-btn-ghost" onClick={onComplete}>{t('tutorial.no', 'NO')}</button>
            </>
          ),
          boxStyle: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '232px' }
        };
      case 2:
        return {
          text: t('tutorial.step2', 'This is the top bar it consist of all functional buttons'),
          buttons: <button className="tut-btn-primary" onClick={() => setStep(3)}>{t('tutorial.next', 'Next')}</button>,
          boxStyle: { top: '70px', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '232px' }
        };
      case 3:
        return {
          text: t('tutorial.step3', 'Here you can check for the status of internet connection whether it is online, offline or connecting'),
          buttons: <button className="tut-btn-primary" onClick={() => setStep(4)}>{t('tutorial.next', 'Next')}</button>,
          boxStyle: { top: '70px', right: '16px', width: '90%', maxWidth: '232px' }
        };
      case 4:
        return {
          text: t('tutorial.step4', 'This is the side menu which contains features name, information and demo to our test crash'),
          buttons: <button className="tut-btn-primary" onClick={() => setStep(5)}>{t('tutorial.next', 'Next')}</button>,
          boxStyle: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '232px' },
          onEnter: () => triggerSidebar(true),
          onLeave: () => {} 
        };
      case 5:
        return {
          text: t('tutorial.step5', 'This contains information on all available features and switches of our app'),
          buttons: <button className="tut-btn-primary" onClick={() => setStep(6)}>{t('tutorial.next', 'Next')}</button>,
          boxStyle: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '232px' },
          onEnter: () => triggerInfo(true),
          onLeave: () => { triggerInfo(false); triggerSidebar(false); }
        };
      case 6:
        return {
          text: t('tutorial.step6', 'Would you like to see how the demo crash test works with the help of a video'),
          buttons: (
            <>
              <button className="tut-btn-primary" onClick={() => { window.open('https://roadsos-frontend.vercel.app/demo', '_blank'); onComplete(); }}>{t('tutorial.yes', 'YES')}</button>
              <button className="tut-btn-ghost" onClick={onComplete}>{t('tutorial.no', 'NO')}</button>
            </>
          ),
          boxStyle: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '232px' }
        };
      default:
        return {};
    }
  };

  const content = getStepContent();

  useEffect(() => {
    if (content.onEnter) content.onEnter();
    return () => {
      if (content.onLeave) content.onLeave();
    }
  }, [step]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999, // extremely high to overlay everything
      background: 'transparent',
      pointerEvents: 'auto'
    }}>
      <style>{`
        @keyframes bounce {
          from { transform: translateY(0); }
          to { transform: translateY(-8px); }
        }

        .tut-dialog {
          width: 232px;
          border-radius: 22px;
          padding: 22px 20px 18px;
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 1;
        }

        .tut-dialog-dark {
          background: rgba(22,26,38,0.92);
          border: 1px solid rgba(255,255,255,0.09);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.03),
            0 20px 50px rgba(0,0,0,0.6),
            0 4px 12px rgba(0,0,0,0.3);
          backdrop-filter: blur(20px);
        }
        .tut-dialog-light {
          background: rgba(255,255,255,0.94);
          border: 1px solid rgba(0,0,0,0.07);
          box-shadow:
            0 20px 50px rgba(0,0,0,0.12),
            0 4px 12px rgba(0,0,0,0.05);
          backdrop-filter: blur(20px);
        }

        .tut-dialog-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          margin-bottom: 14px;
          flex-shrink: 0;
        }
        .tut-dialog-dark  .tut-dialog-dot { background: rgba(255,255,255,0.25); }
        .tut-dialog-light .tut-dialog-dot { background: rgba(0,0,0,0.2); }

        .tut-dialog-title {
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.25;
          margin: 0 0 7px 0;
          text-align: left;
        }
        .tut-dialog-dark  .tut-dialog-title { color: #eef0f8; }
        .tut-dialog-light .tut-dialog-title { color: #0d0d12; }

        .tut-dialog-sub {
          font-size: 12px;
          font-weight: 500;
          line-height: 1.6;
          margin: 0 0 20px 0;
          text-align: left;
        }
        .tut-dialog-dark  .tut-dialog-sub { color: rgba(255,255,255,0.92); }
        .tut-dialog-light .tut-dialog-sub { color: rgba(15,23,42,0.92); }

        .tut-dialog-actions { display: flex; flex-direction: column; gap: 8px; }

        .tut-btn-primary {
          height: 42px;
          border-radius: 11px;
          border: none;
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.01em;
          cursor: pointer;
          transition: opacity 0.14s, transform 0.1s;
          outline: none;
          width: 100%;
        }
        .tut-btn-primary:active { transform: scale(0.97); }
        .tut-btn-primary:hover  { opacity: 0.88; }
        .tut-dialog-dark  .tut-btn-primary { background: #fff; color: #111; }
        .tut-dialog-light .tut-btn-primary { background: #0f0f14; color: #fff; }

        .tut-btn-ghost {
          height: 38px;
          border-radius: 11px;
          border: none;
          font-family: 'Outfit', sans-serif;
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.14s, transform 0.1s;
          outline: none;
          background: transparent;
          width: 100%;
          letter-spacing: 0.01em;
        }
        .tut-btn-ghost:active { transform: scale(0.97); }
        .tut-btn-ghost:hover  { opacity: 0.7; }
        .tut-dialog-dark  .tut-btn-ghost { color: rgba(255,255,255,0.3); }
        .tut-dialog-light .tut-btn-ghost { color: rgba(0,0,0,0.3); }
      `}</style>

      {/* Skip button */}
      <button 
        onClick={onComplete}
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: theme === 'light' ? '#000' : '#fff',
          color: theme === 'light' ? '#fff' : '#000',
          padding: '12px 32px',
          fontSize: '16px',
          borderRadius: '30px',
          border: 'none',
          fontWeight: 700,
          cursor: 'pointer',
          zIndex: 100000,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
        }}
      >
        {t('tutorial.skip', 'Skip')}
      </button>

      {/* Tutorial Box */}
      <div 
        className={`tut-dialog tut-dialog-${theme}`}
        style={{
          position: 'absolute',
          transition: 'all 0.3s ease',
          zIndex: 100000,
          ...content.boxStyle
        }}
      >
        <div className="tut-dialog-dot"></div>
        {content.title && <p className="tut-dialog-title">{content.title}</p>}
        <p className="tut-dialog-sub">{content.text}</p>
        <div className="tut-dialog-actions">
          {content.buttons}
        </div>
      </div>

      {/* Cursors removed in favor of CSS glowing highlights */}
    </div>
  );
}

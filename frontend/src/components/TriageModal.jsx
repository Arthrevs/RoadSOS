import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle, Info, Activity, ArrowRight, Truck } from "lucide-react";
import { buildSosSmsBody } from '../utils/medicalId';
import { encodePlusCode } from '../utils/plusCodes';
import { getEmergencyNumbers } from '../utils/emergencyNumbers';
import '../triage-modal.css';

export default function TriageModal({ open, loading, onSubmit, onSkip, location, landmark, topContact, countryCode }) {
  const { t } = useTranslation();
  const [ans, setAns] = useState({});

  if (!open) return null;

  const toggle = (qid, val) => {
    if (loading) return;
    setAns(prev => ({ ...prev, [qid]: prev[qid] === val ? undefined : val }));
  };

  const allAnswered = ans.injured !== undefined && ans.blocking !== undefined;

  const resolvedCountryCode = countryCode || location?.country_code || 'IN';
  const numbers = getEmergencyNumbers(resolvedCountryCode) || { ambulance: '108', police: '100' };

  // Determine Result state
  let result = null;
  if (allAnswered) {
    if (ans.injured) {
      result = {
        cls: 'ra',
        Icon: AlertTriangle,
        txt: t("triage.summary_injured_dyn", { defaultValue: `Injury reported — Ambulance (${numbers.ambulance}) will be prioritised first.`, num: numbers.ambulance })
      };
    } else if (ans.blocking) {
      result = {
        cls: 'rb',
        Icon: Info,
        txt: t("triage.summary_blocked_dyn", { defaultValue: `Road blocked — Police (${numbers.police}) and Towing recommended.`, num: numbers.police })
      };
    } else {
      result = {
        cls: 'rc2',
        Icon: CheckCircle,
        txt: t("triage.summary_clear", "No injury, road clear — Repair or Towing services suggested.")
      };
    }
  }

  const handleSubmit = () => {
    if (!allAnswered || loading) return;
    onSubmit({ injured: ans.injured, blocking: ans.blocking });
  };

  const handleMiniSOS = () => {
    if (!location?.lat || !location?.lon) {
      alert("GPS location not available yet.");
      return;
    }
    const plusCode = encodePlusCode(location.lat, location.lon);
    const message  = buildSosSmsBody({ lat: location.lat, lon: location.lon, plusCode, landmark });
    const encoded  = encodeURIComponent(message);
    const win = window.open(`https://wa.me/?text=${encoded}`, '_blank');
    setTimeout(() => {
      if (!win || win.closed || win.closed === undefined) {
        window.location.href = `sms:?body=${encoded}`;
      }
    }, 800);
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Quick triage">
      <div className="triage-sheet">
        <div className="triage-handle"><div className="triage-handle-bar"></div></div>
        
        <div className="triage-hd">
          <div className="triage-hd-l">
            <div className="triage-hd-tag">
              <Activity size={12} strokeWidth={2.5} />
              {t("triage.label", "Quick Triage")}
            </div>
            <div className="triage-hd-title">{t("triage.title", "What happened?")}</div>
            <div className="triage-hd-sub">{t("triage.subtitle", "Two questions — we'll prioritise the right help for you.")}</div>
          </div>
          <button className="triage-sos" onClick={handleMiniSOS}>{t("triage.sos_btn", "SOS")}</button>
        </div>
        
        <div className="triage-rule"></div>
        
        <div className="triage-qs">
          <div className="triage-qb">
            <div className="triage-qrow">
              <div className="triage-qico">
                <Activity size={14} strokeWidth={2.2} />
              </div>
              <span className="triage-qtxt">{t("triage.injured_q", "Is anyone injured?")}</span>
            </div>
            <div className="triage-pair">
              <button className={`triage-opt ${ans.injured === true ? 'py' : ''}`} onClick={() => toggle('injured', true)}>
                <div className="triage-rc"><div className="triage-rc-inner"></div></div>
                {t("triage.yes_injured", "Yes, injured")}
              </button>
              <button className={`triage-opt ${ans.injured === false ? 'pn' : ''}`} onClick={() => toggle('injured', false)}>
                <div className="triage-rc"><div className="triage-rc-inner"></div></div>
                {t("triage.no_injured", "No injuries")}
              </button>
            </div>
          </div>
          
          <div className="triage-qb">
            <div className="triage-qrow">
              <div className="triage-qico">
                <Truck size={14} strokeWidth={2.2} />
              </div>
              <span className="triage-qtxt">{t("triage.blocking_q", "Is the vehicle blocking the road?")}</span>
            </div>
            <div className="triage-pair">
              <button className={`triage-opt ${ans.blocking === true ? 'py' : ''}`} onClick={() => toggle('blocking', true)}>
                <div className="triage-rc"><div className="triage-rc-inner"></div></div>
                {t("triage.yes_blocking", "Yes, blocking")}
              </button>
              <button className={`triage-opt ${ans.blocking === false ? 'pn' : ''}`} onClick={() => toggle('blocking', false)}>
                <div className="triage-rc"><div className="triage-rc-inner"></div></div>
                {t("triage.no_blocking", "Road is clear")}
              </button>
            </div>
          </div>
        </div>
        
        {result ? (
          <div className={`triage-res ${result.cls}`}>
            <result.Icon size={15} strokeWidth={2} />
            <span>{result.txt}</span>
          </div>
        ) : (
          <div className="triage-res w">
            <Info size={15} strokeWidth={2} />
            <span>{t("triage.summary_idle", "Answer both questions to get a priority recommendation.")}</span>
          </div>
        )}
        
        <button 
          className={`triage-fbtn ${allAnswered ? 'on' : 'off'}`} 
          onClick={handleSubmit}
          disabled={!allAnswered || loading}
        >
          {loading ? (
            t("triage.prioritising", "⏳ Prioritising...")
          ) : allAnswered ? (
            <>
              <ArrowRight size={14} strokeWidth={2.2} />
              {t("triage.get_help", "Get priority help")}
            </>
          ) : (
            t("triage.answer_both", "Answer both questions")
          )}
        </button>

        <button className="triage-skip-btn" onClick={onSkip} disabled={loading}>
          {t("triage.skip", "Skip — show all contacts")}
        </button>
      </div>
    </div>
  );
}

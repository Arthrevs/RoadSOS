import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ContactCard from './ContactCard';
import { ChevronUp } from 'lucide-react';
import { CATS } from '../constants';

// Map filter chip keys to i18n keys. "All" + "Puncture" are filter-only;
// the rest already exist as category.* keys used elsewhere.
const FILTER_I18N = {
  All: 'filters.all',
  Hospital: 'category.hospital',
  Police: 'category.police',
  Repair: 'category.repair',
  Towing: 'category.towing',
  Fire: 'category.fire',
  Showroom: 'category.showroom',
  Puncture: 'filters.puncture',
};

export default function ContactList({ contacts, loading, error, cachedAt, cat, setCat }) {
  const { t } = useTranslation();

  // Memoize filtered contacts based on the selected category
  const filtered = useMemo(() => {
    if (!contacts) return [];
    if (cat === "All") return contacts;
    return contacts.filter(c => {
      const cCat = (c.category || 'repair').toLowerCase();
      const filterCat = cat === "Puncture" ? "tyre" : cat.toLowerCase();
      return cCat === filterCat;
    });
  }, [contacts, cat]);

  const [showTakeUp, setShowTakeUp] = useState(false);

  useEffect(() => {
    if (filtered.length <= 15) {
      setShowTakeUp(false);
      return;
    }
    
    // 25% threshold, e.g., 19 * 0.25 = 4.75 -> 5th card -> index 4
    let thresholdIndex = Math.ceil(filtered.length * 0.25) - 1;

    // Cap at the 30th card for large lists (> 120 cards)
    if (filtered.length > 120) {
      thresholdIndex = 29;
    }

    const handleScroll = () => {
      // Find the card element at the threshold index
      const cardEl = document.querySelector(`.svc-list > *:nth-child(${thresholdIndex + 1})`);
      if (cardEl) {
        const rect = cardEl.getBoundingClientRect();
        // Visible if the top of the card has come above the bottom of the viewport
        setShowTakeUp(rect.top < window.innerHeight);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initially
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [filtered.length]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="loading-box">
        <div className="spinner" aria-hidden="true" />
        <div style={{ fontWeight: 500, color: '#FFFFFF' }}>{t('loading.finding')}</div>
        <div style={{ fontSize: 11, marginTop: 4 }}>{t('loading.subtitle')}</div>
      </div>
    );
  }

  // ── Error state — only block if no fallback contacts available ───────────
  if (error && (!contacts || contacts.length === 0)) {
    return (
      <div className="loading-box" role="alert">
        <div style={{ fontSize: 24, marginBottom: 8 }}>⚠️</div>
        <div style={{ fontWeight: 500, color: '#FFFFFF' }}>{t('loading.error')}</div>
        <div style={{ fontSize: 11, marginTop: 4 }}>{error}</div>
      </div>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* Category Filters */}
      <div className="filters" style={{ marginBottom: 10 }}>
        {CATS.map(c => (
          <button
            key={c}
            className={`chip ${c === cat ? "chip-on" : "chip-off"}`}
            onClick={() => setCat(c)}
          >
            {t(FILTER_I18N[c] || c)}
          </button>
        ))}
      </div>

      {error && (
        <div className="cached-note" role="alert" style={{ background: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fbbf24' }}>
          ⚠️ {error}
        </div>
      )}

      {cachedAt && (
        <div className="cached-note">
          ⏱ {t('list.cached_results', { date: cachedAt })}
        </div>
      )}

      {/* Service List */}
      <div className="svc-list">
        {(!contacts || contacts.length === 0) ? (
          <div className="empty">{t('list.empty_all')}</div>
        ) : filtered.length === 0 ? (
          <div className="empty">{t('list.empty_category')}</div>
        ) : (
          filtered.map((c, idx) => (
            <ContactCard
              key={c.id || `contact-${idx}`}
              contact={c}
              isLast={idx === filtered.length - 1}
            />
          ))
        )}
      </div>

      {/* Floating Take Up Button */}
      {showTakeUp && (
        <div className="scroll-up-arrow" onClick={() => {
          const firstCard = document.querySelector('.svc-list > *:first-child');
          if (firstCard) {
            firstCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}>
          <div className="scroll-arrow-pill">
            <ChevronUp size={16} strokeWidth={2.5} />
            <span>Take up</span>
          </div>
        </div>
      )}
    </>
  );
}

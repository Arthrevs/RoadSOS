# RoadSOS — Claude Context

## What this is
RoadSOS is a road accident emergency PWA. When a crash is detected (or the user taps SOS), it finds the nearest hospitals, police stations, ambulances, towing and repair services, lets the user call them in one tap, and auto-sends an SOS WhatsApp/SMS to their emergency contacts.

## Repo layout
```
frontend/          React + Vite PWA (deployed on Vercel)
  src/
    App.jsx                  Root component — location, search, triage, modals
    components/
      CrashAlert.jsx         Full-screen crash overlay (auto-dial + auto-SOS)
      SOSButton.jsx          Fixed-bottom SOS bar (country-aware dispatch panel)
      MedicalIdModal.jsx     Medical ID onboarding + edit form (localStorage only)
      ContactList.jsx        Nearby services list
      CountryEmergency.jsx   Country emergency numbers strip
      TriageModal.jsx        Injured / blocking triage form
      OfflineBanner.jsx      Offline indicator
      RoutePlanner.jsx       Pre-cache trip waypoints
    hooks/
      useLocation.js         GPS watchPosition + IP fallback + crash detection
      useNetwork.js          Online/offline detection
    utils/
      sosDispatch.js         Shared SOS URL builder + country-aware auto-fire
      medicalId.js           localStorage Medical ID CRUD + SOS SMS body
      emergencyNumbers.js    Country → {ambulance, police, general} numbers
      googlePlaces.js        /triage API wrapper + offline rule-based triage
      overpass.js            /search API wrapper
      offlineDB.js           localStorage search result cache
      bundledFacilities.js   Offline-bundled Indian trauma centres / police
      plusCodes.js           Pure-JS Open Location Code encoder
      speechUtils.js         Text-to-speech dispatch text builder
      alarmUtils.js          Alarm sound on crash
      demoMode.js            DEMO_MODE flag + safeAutoDial guard
      backendWarmup.js       Pre-warm the Render cold-start

backend/           Python FastAPI (deployed on Render)
  main.py                    /search, /triage, /health endpoints
  services/
    overpass.py              Overpass API queries for nearby services
    google_places.py         Google Places fallback
    ai_triage.py             AI + rule-based triage
```

## Key design decisions

### Location
- `useLocation.js` uses `watchPosition` (GPS) + IP fallback (`ipapi.co`)
- 50 m distance gate prevents search re-fires on GPS jitter
- Crash detection: velocity collapse (≥25 km/h → ≤5 km/h in 2 s) + optional accelerometer confirmation
- `maximumAge: 0` to never use stale cached positions

### SOS dispatch (sosDispatch.js)
- WhatsApp-dominant countries (60+, incl. IN, GB, EU, LatAm) → `window.open(wa.me/contact1)` — non-navigating
- SMS-dominant countries (US, CA, AU, …) → `window.location.href = sms:all,contacts` — group SMS
- Mobile browsers allow ONE external-app redirect per user gesture
- Follow-up panel shows per-contact WA + SMS links after auto-fire

### Medical ID (medicalId.js)
- Lives entirely in `localStorage` — never sent to server
- Schema: name, age, bloodType, allergies, conditions, medications, 3 emergency contacts (primary/secondary/tertiary), organDonor
- First-launch onboarding: `roadsos_onboarded_v1` key gates whether MedicalIdModal auto-opens

### Auto-SOS triggers
1. Crash detected → `CrashAlert.dispatchSos()` fires in `fireCall()` and `handleChooseManual()`
2. Triage submitted with `injured || blocking` → `App.handleTriage()` calls `autoFireSos()`

### DEMO_MODE
- Controlled by `VITE_DEMO_MODE` env var (default: true in dev)
- Gates: demo location picker, simulated dialing (`safeAutoDial`), 🧪 test crash button
- In production (`DEMO_MODE=false`) real dialing is used and the picker is hidden

### Offline fallback chain (5 layers)
1. Live `/search` backend (Overpass + Google Places)
2. `localStorage` search result cache (seeded by prior searches or route planner)
3. `bundledFacilities.js` — ~80 verified Indian trauma centres + police stations
4. `MOCK_DATA` in App.jsx — always-non-empty demo contacts (Bengaluru)
5. Country emergency numbers (CountryEmergency strip) — always visible

## Branch
Active branch: `sarma` — all features merged here then PRed to `main`.

## Commands
```bash
# Frontend dev
cd frontend && npm run dev

# Run tests
cd frontend && npm test

# Backend dev  
cd backend && uvicorn main:app --reload
```

## Environment
- Frontend `.env`: `VITE_API_URL`, `VITE_DEMO_MODE`, `VITE_GOOGLE_MAPS_API_KEY`
- Backend `.env`: `GOOGLE_MAPS_API_KEY`
- Deployed: frontend → Vercel, backend → Render (cold-start warmup in `backendWarmup.js`)

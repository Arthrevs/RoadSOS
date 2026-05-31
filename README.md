# 🚨 RoadSOS

> [!IMPORTANT]
> **Judges:** Please visit [https://roadsos-frontend.vercel.app/demo](https://roadsos-frontend.vercel.app/demo) or `http://localhost:5173/demo` when running locally to see the full potential of RoadSOS.

### **The right emergency contact, in one tap, even with no signal.**

*A location-aware Progressive Web App that connects road accident victims and bystanders to the right help in under 10 seconds — globally, offline, and intelligently.*

---

[![Status](https://img.shields.io/badge/Status-Hackathon%20Build-c0392b?style=for-the-badge)](https://coers.iitm.ac.in/events/Hackathon/2026/rule_book/)
[![Hackathon](https://img.shields.io/badge/IIT%20Madras-Road%20Safety%202026-1a1f2e?style=for-the-badge)](https://coers.iitm.ac.in/)
[![PWA](https://img.shields.io/badge/PWA-Installable-5a0fc8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Offline](https://img.shields.io/badge/Works-Offline-27ae60?style=for-the-badge&logo=serviceworker&logoColor=white)](#-offline-architecture-4-tier-fallback)

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.3.3-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Gemini](https://img.shields.io/badge/Google-Gemini%202.5%20Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/gemini-api)
[![OSM](https://img.shields.io/badge/Data-OpenStreetMap-7EBC6F?logo=openstreetmap&logoColor=white)](https://www.openstreetmap.org/)

[![Backend Tests](https://github.com/Arthrevs/RoadSOS/actions/workflows/backend-tests.yml/badge.svg)](https://github.com/Arthrevs/RoadSOS/actions/workflows/backend-tests.yml)
[![Countries](https://img.shields.io/badge/Coverage-200%20Countries-3498db?style=flat-square)](#-international-coverage)
[![Languages](https://img.shields.io/badge/Languages-48-9b59b6?style=flat-square)](#-features)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](https://github.com/Arthrevs/RoadSOS/blob/main/LICENSE)

**[🎯 Problem](#-the-problem) · [⚡ Features](#-features) · [📊 Evaluation Criteria](#-how-roadsos-meets-each-evaluation-criterion) · [🏗 Architecture](#-architecture) · [🚀 Quick Start](#-quick-start) · [🎤 Walkthrough](#-three-minute-walkthrough) · [📘 Docs](https://github.com/Arthrevs/RoadSOS/blob/main/docs)**

---

## 📄 Documentation

| Document | Description |
| --- | --- |
| [**Technical Reference** (PDF)](https://github.com/Arthrevs/RoadSOS/blob/main/docs/TECHNICAL.pdf) | Full technical deep-dive: backend orchestration, search-phase budgets, offline tiers, crash detection, i18n, CI/CD, deployment, observability |
| [**Architecture Review** (Markdown)](https://github.com/Arthrevs/RoadSOS/blob/main/docs/ARCHITECTURE.md) | ADR-style architecture audit: system topology, service interactions, reliability patterns, known risks |
| [**Hackathon Submission** (PDF)](https://github.com/Arthrevs/RoadSOS/blob/main/docs/RoadSOS_Submission.pdf) | Judges' submission package: assumptions, software packages, architecture summary, full source code |

---

## 🎯 The Problem

> India records roughly **1.5 lakh road accident deaths every year.** Most are not killed by the crash itself — they are killed by **delay**.

Medical professionals call the first sixty minutes after a severe injury *the golden hour*. Survival rates collapse once that window closes. Yet at a real crash scene on NH-44 or NH-48, a bystander does this:

1. Opens Google Maps
2. Searches "hospital near me"
3. Scrolls through generic results
4. Tries to work out which one has a trauma unit
5. Searches separately for the phone number
6. Repeats for police, ambulance, towing

**Two to three minutes lost. Minutes that decide outcomes.**

This is not a hypothetical concern. On **29 May 2026**, hearing a petition by the road-safety NGO **SaveLIFE Foundation**, the **Supreme Court of India** held that trauma care is part of the Right to Life under **Article 21** and ordered all states to operationalise the single **112** emergency number nationwide, with GPS-connected ambulance dispatch. The Court also noted that bystanders frequently hesitate to help because of fear of police and legal hassle.

RoadSOS is built for exactly the gap that ruling identifies — the seconds between a crash and the *right* call, especially where the network is weak and the official GPS-dispatch backbone has not yet reached.

**RoadSOS does this in one screen:** one list of categorised contacts, sorted by what *this specific situation* needs, working with or without internet, in one tap.

> RoadSOS does **not** replace 112. It runs **in parallel** with it: call 112 while a bystander uses RoadSOS to see the nearest trauma centre's own number — even with no signal, where 112's smart dispatch can't reach. **Parallel response saves minutes.**

---

## ⚡ Features

| Feature | What it does |
| --- | --- |
| 📍 **Location-Aware, Instantly** | GPS detection with a 10-second timeout and automatic fallback to IP-based geolocation. The search starts the moment the app opens — no buttons, no menus. |
| 🤖 **AI-Prioritised Contacts** | Two questions — *injured? blocking traffic?* — and Gemini 2.5 Flash reorders the entire contact list for the situation. The top card states **why** it was prioritised. Deterministic rule-based fallback if the API is down. |
| 📶 **Genuinely Offline (4-tier)** | Service Worker + localStorage (7-day TTL, ~1.1 km grid) + a **bundled 938-facility directory across 200 countries** + **bundled national emergency numbers for 200 countries**. |
| 🗺 **Smart Spatial Caching** | The local device cache enforces a strict 5km safety limit to prevent serving irrelevant hospitals if you drive away. To solve dead-zones, the **"Save Area"** button actively fetches 7 overlapping zones in an 8km ring around you, guaranteeing zero blind spots. A dedicated **Offline Trip Planner** does the same by sampling waypoints along an OSRM driving route (e.g. pre-fetching Chennai → Bengaluru before you leave). |
| 🆔 **Emergency Medical ID** | Blood type, allergies, conditions, medications, and an emergency contact stored entirely on-device (localStorage — **nothing ever leaves the phone**). A first responder taps the persistent **🆔 Medical ID** button to see a high-contrast paramedic-friendly card. |
| 📍 **Plus Codes (Open Location Code)** | Every crash alert encodes the GPS into a dispatcher-friendly Plus Code like `7M5237MC+37` — far easier to read aloud than `13.0827, 80.2707`. Encoder is hand-written in pure JS (~80 LOC, **fully offline, zero deps**) in `frontend/src/utils/plusCodes.js`. |
| 📱 **SOS-by-SMS** | When voice fails but SMS still works (common in dead zones), one tap pre-composes an SMS to your emergency contact with blood type, allergies, Plus Code, GPS, and a Google Maps link. Uses the native `sms:` scheme — works on iOS and Android. |
| 🚨 **SOS Broadcast** | One tap composes a pre-filled WhatsApp message: GPS, nearest landmark, recommended contact. SMS fallback if WhatsApp is unavailable. Copy-coordinates button for verbal handoff. |
| 🛡 **GPS-Velocity Crash Detection** | Detects a collapse from sustained highway speed (≥40 km/h) to a standstill (≤5 km/h) within 2.5 s. An accelerometer spike (≥3.5 G) is used **only to confirm** what GPS already suspects — it never fires alone. **PIN-cancel** safety layer prevents accidental dismissal. |
| 📡 **Live GPS Tracking** | Visit `/track` to view active incident response routes. Three demo routes are available demonstrating real-time map plotting for emergency dispatch. |
| 🌍 **Globally Aware** | Reverse-geocode country detection. Cross the India–Nepal border and the emergency numbers switch from `108 / 100 / 101` to `102 / 100 / 101` automatically. |
| 🌐 **48 Languages, 6 RTL** | All 22 official Indian (Schedule VIII) languages plus 26 international languages. Full RTL layout for Arabic, Persian, Hebrew, Urdu, Kashmiri, and Sindhi. First-launch picker requires manual selection — no surveillance-style GPS auto-detection. |
| 🗺 **Real GPS-Anchored Map** | Leaflet + OpenStreetMap (CartoDB Dark Matter tiles, no API key). Your actual surroundings, not a stock illustration. Up to six nearest contacts pinned at real lat/lon with category-coloured markers (red = medical, blue = police, teal = mechanical). |

---

## 📊 How RoadSOS Meets Each Evaluation Criterion

The 2026 problem statement scores five things. Here is exactly where each is implemented.

| Criterion | How RoadSOS delivers it | Where to look |
| --- | --- | --- |
| **Reliability & data accuracy** | Every upstream call is wrapped so `/search` **never returns 5xx** — it degrades to an empty list with an honest `source` tag. Three Overpass mirrors raced concurrently (first healthy response wins). National emergency numbers for all 200 countries verified clean: **0 blank fields, 0 placeholders, 0 duplicate country codes.** India (112/100/108/101 + highway 1033) and demo countries (UK 999, Japan 110/119, Germany 110/112) confirmed against authoritative sources. | `backend/services/search_service.py`, `backend/data/emergency_seed.json` |
| **Number of contacts fetched** | OSM Overpass + Google Places fired in **parallel**; 7 service categories across ~13 OSM tag pairs. Auto-expand 8 km → 25 km when sparse. Top-6 phoneless results enriched via Google Place Details (capped at 6 calls/search). Typical urban result: **10–15 categorised, dialable contacts.** | `backend/services/overpass_service.py`, `googleplaces_service.py` |
| **Offline functionality** | 4-tier fallback (below). National emergency numbers render with **zero network** (they only need the country). Route results pre-fetched while online are cached 7 days. 938 bundled facilities give a last-resort nearest hospital with honest distance labels. | `frontend/src/App.jsx`, `utils/offlineDB.js`, `utils/bundledFacilities.js` |
| **Innovation & additional features** | AI triage with visible reasoning · offline Plus Codes · on-device Medical ID · SOS-by-SMS with medical payload · GPS-velocity crash detection with PIN-cancel · 48-language i18n with RTL. | `frontend/src/utils/`, `frontend/src/components/` |
| **Information integration across countries** | ISO-3166 country code from Nominatim reverse-geocoding switches the visible national numbers automatically. 200 countries pre-loaded. Demo-location picker (BLR / LON / TYO / BER / etc.) verifies cross-border behaviour live. | `frontend/src/utils/emergencyNumbers.js`, `frontend/src/App.jsx` |

---

## 🥊 How We're Different

| Scenario | Google Maps | Calling 112 | **RoadSOS** |
| --- | --- | --- | --- |
| Time to first emergency contact | 2–3 min (search + scroll + read) | 1 ring + dispatcher routing | **< 10 s** |
| Works without internet | ❌ | ✅ (voice only) | ✅ **(visual list + cached results + national numbers)** |
| Surfaces trauma units specifically | ❌ (lists all hospitals) | Indirect (dispatcher decides) | ✅ **(category-tagged)** |
| Prioritises by injury / traffic context | ❌ | Manual via dispatcher | ✅ **(AI triage)** |
| Works internationally without re-learning | Partial | Numbers change per country | ✅ **(200 countries pre-loaded)** |
| Broadcasts location to a contact | Manual | Voice only | ✅ **(WhatsApp / SMS deep link + Plus Code)** |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER (Browser / PWA)                        │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌──────────────┐      ┌──────────────┐      ┌────────────────┐
│ useLocation  │      │  Service     │      │ Bundled Static │
│ GPS → IP fb  │      │  Worker      │      │ Emergency DB   │
│ velocity +   │      │ NetworkFirst │      │ 200 countries  │
│ accel fusion │      │ + CacheFirst │      │ always offline │
└──────┬───────┘      └──────┬───────┘      └────────────────┘
       │                     │
       ▼                     │
┌──────────────────────────────────────────────────────────────┐
│                    FastAPI Backend (Render)                   │
├──────────────────────────────────────────────────────────────┤
│  In-memory TTL cache  (1 h Overpass · 1 h Google · 24 h geocode) │
│                                                               │
│  GET /search                                                  │
│   ├─ Overpass (OSM) + Google Places ── fired in PARALLEL      │
│   │   ├─ Overpass: 8 km, auto-expand to 25 km                 │
│   │   └─ Google Places fires unconditionally in parallel      │
│   ├─ Nominatim geocode ── parallel · landmark + ISO code      │
│   ├─ Merge + deduplicate ── by phone digits, then name        │
│   └─ Phone enrichment ── top-6 phoneless via Place Details    │
│                                                               │
│  POST /triage          ── Gemini 2.5 Flash + rule fallback    │
│  POST /dispatch-summary ── Gemini + template fallback         │
│  GET  /health          ── uptime · key status · cache stats   │
│  GET  /offline-pack    ── 200-country emergency numbers JSON  │
└──────────────────────────────────────────────────────────────┘
```

### 🔌 Offline Architecture (4-Tier Fallback)

```
ONLINE                                    OFFLINE
──────                                    ───────
GET /search ─────► Service Worker         Tier 1: Backend /search
                   │                              └─ unreachable
                   ├─ Cache (NetworkFirst,
                   │  8 s timeout, 24 h TTL) Tier 2: Service Worker
                   │                              + localStorage cache
                   └─ Forward to backend          (7-day TTL, ~1.1 km grid)
                                                  └─ no entry for this grid

                                          Tier 3: Bundled JSON
                                                  (938 facilities across
                                                  200 countries, haversine
                                                  search, 80 → 600 km, then
                                                  globally-nearest, labelled)

                                          Always: CountryEmergency banner
                                                  (national numbers,
                                                  no network ever)
```

---

## 🧰 Tech Stack

| Layer | Technology | Why |
| --- | --- | --- |
| **Frontend** | React 18.3 + Vite 7.3.3 + vite-plugin-pwa | Fast HMR, native PWA, mobile-first |
| **Map** | Leaflet 1.9 + react-leaflet + CartoDB Dark tiles | Real OSM map, no API key |
| **i18n** | i18next + react-i18next | 48 languages, RTL support |
| **Backend** | FastAPI 0.115 + httpx (async) | Async I/O for parallel upstream calls |
| **AI Triage** | Google Gemini 2.5 Flash (REST, no SDK) | Free tier (15 RPM / 1500 RPD), deterministic rule fallback |
| **Location Data** | OpenStreetMap Overpass + Google Places | OSM free + global; Places fills sparse regions, enriches phones |
| **Geocoding** | Nominatim (OSM) | Free, no key, returns ISO-3166 country code |
| **Offline cache** | Workbox SW + localStorage + bundled JSON | 4-tier: network → cache → bundled → mock |
| **CI** | GitHub Actions × 3 | Build/test on Node 20 & 22, pytest on Py 3.11 & 3.12, PR conflict guard |
| **Hosting** | Vercel (frontend) + Render (backend) | Free tier; auto-deploy from `main` |

---

## 🚀 Quick Start

> **Note for Judges / Local Development:** We do not provide our Google API keys in the repository for security reasons. The application is specifically designed to work flawlessly without them! If you run the app locally without setting any API keys in the `.env` file, it will automatically fallback to fetching contacts via OpenStreetMap (which is completely free) and will use a deterministic rule-based system instead of Gemini AI for triage. 

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux
pip install -r requirements.txt
cp .env.example .env           # set GEMINI_API_KEY (free at aistudio.google.com/apikey)
uvicorn main:app --reload
```

Smoke test: `http://localhost:8000/search?lat=12.9716&lon=77.5946`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. By default the frontend talks to the live backend at `https://roadsos-pl3k.onrender.com` (Google + Gemini keys loaded), so everything works with no API keys. To use a local backend, set `VITE_API_URL=\"http://localhost:8000\"` in `frontend/.env.local`.

> **💡 Tip for Judges: Test full AI & Google features locally!**
> If you want to experience the full Gemini AI Triage and Google Places parallelism locally without having to supply your own API keys, you can tell the local frontend to bypass your local backend and connect directly to our live production backend (which already has the keys securely loaded).
> Just create a file called `.env.local` inside the `frontend/` folder and add this exact line:
> `VITE_API_URL="https://roadsos-pl3k.onrender.com"`
> Then restart the frontend server.

---

## 🌍 International Coverage

**200 countries and territories pre-loaded.** GPS or IP-based country detection switches the visible national emergency numbers automatically. Every entry has police, ambulance, fire, and a general emergency number — no network required.

| Region | Countries covered |
| --- | --- |
| **Asia** | 49 |
| **Europe** | 45 |
| **Africa** | 55 |
| **Americas** | 35 |
| **Oceania** | 16 |
| **Total** | **200** |

The authoritative source is `backend/data/emergency_seed.json`. Both the backend `/offline-pack` endpoint and the frontend bundle (`frontend/src/utils/emergencyNumbers.js`) are generated from it.

---

## 🎤 Three-Minute Walkthrough

| Time | Action | What you should see |
| --- | --- | --- |
| 0:00 | Open Google Maps, search *"hospital near me"* | Baseline: 2–3 min of scrolling before a useful number appears |
| 0:30 | Open RoadSOS | National emergency numbers banner renders instantly from bundled data |
| 0:40 | Pick a language from the 48-language modal | UI re-renders in that language; RTL languages flip layout |
| 0:55 | Real Leaflet map centres on your GPS | Up to 6 nearest contacts pinned at their real lat/lon |
| 1:10 | Answer triage (injured? blocking?) | Top card carries a one-sentence AI reason for its priority |
| 1:40 | **Turn off WiFi. Reload.** | Cached results still render; numbers banner stays; map markers persist |
| 2:00 | Demo-location picker: London → Tokyo → Berlin | Numbers change 999 → 110/119 → 110/112; map glides to each city |
| 2:30 | Tap SOS | WhatsApp or SMS opens pre-filled with coordinates + landmark + Plus Code + top contact |

---

## 🛡 What We Deliberately Did NOT Build

Honesty about limits is part of building emergency software.

| Feature | Why |
| --- | --- |
| **Accelerometer-only crash detection** | Phone-drop forces (~40 m/s²) overlap with crash forces (20–80 m/s²) and potholes (15–30 m/s²). So we **never let the accelerometer fire alone** — it serves only as a confirmation signal layered on GPS-velocity collapse. |
| **Vehicle ECU / Smartcar integration** | India's connected-car API coverage is near zero. Any demo would be a mock. Out of scope for a phone-only PWA. |
| **Background passive monitoring** | iOS restricts background processes at the OS level. A feature that doesn't work on iOS isn't a feature. |
| **Real-time ambulance tracking** | Requires formal API agreements and live vehicle telemetry. Not achievable in the hackathon window. |
| **User accounts / login** | The worst possible moment to ask someone to log in is at a crash scene. |

---

## 🗺 Roadmap

**Phase 1 — Hackathon submission (current):** PWA shipped, AI triage live, 4-tier offline functional, 200 countries and 48 languages covered.

**Phase 2 — Production hardening:**
- [ ] Government API integration (108/112 dispatcher tie-ins, aligned with the 2026 Supreme Court ERSS mandate)
- [ ] Verified-source overlay (regional 108 services, government trauma-centre directories)
- [ ] Live ambulance tracking via dispatch partnerships
- [ ] Optional Bluetooth-dongle hardware crash detection
- [ ] Good-Samaritan guidance module (legal protections for bystanders)

**Phase 3 — Platform:**
- [ ] Hospital intake pre-notification (incoming-patient API at the trauma centre)
- [ ] Native iOS / Android apps with native Emergency SOS hooks

---

## 🚢 Deployment

**Backend → Render:** `render.yaml` is in the repo root. New → Blueprint → connect repo → set `GEMINI_API_KEY` (required) and `GOOGLE_PLACES_API_KEY` (optional) → deploy.

**Frontend → Vercel:** `vercel.json` is in the repo root. Import repo → set `VITE_API_URL` to your Render backend URL → deploy.

> **Demo note:** Render's free tier sleeps after 15 minutes of inactivity (30–60 s cold start). Keep an uptime pinger hitting `/health` every 5 minutes during judging, or warm the backend manually ~2 minutes before presenting.

---

## 📄 License

MIT — see [LICENSE](https://github.com/Arthrevs/RoadSOS/blob/main/LICENSE).

---

**Built for the National Road Safety Hackathon 2026 · CoERS × IIT Madras**

*Every design decision in this codebase serves one goal: shorten the time between an accident and the right call.*

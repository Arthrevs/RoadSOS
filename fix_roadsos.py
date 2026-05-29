#!/usr/bin/env python3
"""RoadSOS hackathon fixer. Run from the repo root: python fix_roadsos.py"""
import io, os

def repl(path, old, new, count=1, label=""):
    with io.open(path, encoding="utf-8") as f:
        s = f.read()
    n = s.count(old)
    if n != count:
        print(f"  !! {label or path}: expected {count} match(es), found {n} — SKIPPED (already patched?)")
        return False
    with io.open(path, "w", encoding="utf-8") as f:
        f.write(s.replace(old, new, count))
    print(f"  ok {label or path}")
    return True

# ── useLocation.js: constants ──────────────────────────────────────────────
repl("frontend/src/hooks/useLocation.js",
"""const VELOCITY_WINDOW_MS = 2_000;
const CRASH_SPEED_FROM_KMH = 25;   // was travelling at ≥ this speed
const CRASH_SPEED_TO_KMH   = 5;    // came to ≤ this speed""",
"""const VELOCITY_WINDOW_MS    = 6_000; // look back far enough to see sustained speed + the drop
const CRASH_SPEED_FROM_KMH  = 40;    // must have been at sustained highway speed...
const CRASH_SPEED_TO_KMH    = 5;     // ...then collapse to a near-standstill
const CRASH_DROP_MAX_MS     = 2_500; // the high→low collapse must happen this fast (rules out normal braking)
const MIN_SUSTAINED_SAMPLES = 2;     // ≥this many high-speed fixes (rules out single GPS glitches)""",
label="useLocation.js constants")

# ── useLocation.js: checkVelocityCollapse ──────────────────────────────────
repl("frontend/src/hooks/useLocation.js",
"""  const checkVelocityCollapse = useCallback((speedKmh, timestamp) => {
    const history = speedHistoryRef.current;
    history.push({ speedKmh, timestamp });
    const cutoff = timestamp - VELOCITY_WINDOW_MS;
    speedHistoryRef.current = history.filter(e => e.timestamp >= cutoff);

    const recent = speedHistoryRef.current;
    if (recent.length < 2) return;

    const oldest = recent[0];
    const newest = recent[recent.length - 1];
    if (oldest.speedKmh >= CRASH_SPEED_FROM_KMH && newest.speedKmh <= CRASH_SPEED_TO_KMH) {
      speedHistoryRef.current = [];
      gpsCollapseTimeRef.current = Date.now();

      // Check if accelerometer already spiked within the confirmation window
      const accelTime = accelSpikeTimeRef.current;
      if (accelTime && (Date.now() - accelTime) <= ACCEL_CONFIRM_MS) {
        fireCrash('gps+accel');   // both signals agree → high confidence
      } else {
        fireCrash('gps_velocity'); // GPS alone → still trigger (original behaviour)
      }
    }
  }, [fireCrash]);""",
"""  const checkVelocityCollapse = useCallback((speedKmh, timestamp) => {
    const history = speedHistoryRef.current;
    history.push({ speedKmh, timestamp });
    const cutoff = timestamp - VELOCITY_WINDOW_MS;
    speedHistoryRef.current = history.filter(e => e.timestamp >= cutoff);

    const recent = speedHistoryRef.current;
    if (recent.length < 2) return;

    const newest = recent[recent.length - 1];
    if (newest.speedKmh > CRASH_SPEED_TO_KMH) return; // not at a standstill yet

    // Must have been at sustained highway speed (rules out city crawl + GPS glitches).
    const fast = recent.filter(e => e.speedKmh >= CRASH_SPEED_FROM_KMH);
    if (fast.length < MIN_SUSTAINED_SAMPLES) return;

    // The drop from highway speed to standstill must be SUDDEN. A normal stop
    // (gentle deceleration over several seconds) is rejected here.
    const lastFast = fast[fast.length - 1];
    if (newest.timestamp - lastFast.timestamp > CRASH_DROP_MAX_MS) return;

    // Sudden collapse from sustained highway speed → likely crash.
    speedHistoryRef.current = [];
    gpsCollapseTimeRef.current = Date.now();

    const accelTime = accelSpikeTimeRef.current;
    if (accelTime && (Date.now() - accelTime) <= ACCEL_CONFIRM_MS) {
      fireCrash('gps+accel');   // both signals agree → high confidence
    } else {
      fireCrash('gps_velocity'); // sustained-speed sudden stop, no accel → still alert
    }
  }, [fireCrash]);""",
label="useLocation.js checkVelocityCollapse")

# ── ai_triage.py: align fallback with system prompt + add showroom ─────────
repl("backend/services/ai_triage.py",
'''    if injured and blocking:
        order = ["ambulance", "hospital", "police", "towing", "repair", "tyre"]
        reason = "Trauma care plus blocked road · ambulance, hospital, police listed first"
    elif injured:
        order = ["ambulance", "hospital", "police", "repair", "towing", "tyre"]
        reason = "Trauma care prioritised · ambulance and hospital listed first"
    elif blocking:
        order = ["police", "towing", "ambulance", "hospital", "repair", "tyre"]
        reason = "Vehicle blocking traffic · police and towing listed first"
    else:
        order = ["repair", "tyre", "police", "towing", "hospital", "ambulance"]
        reason = "No injuries reported · roadside repair services listed first"''',
'''    if injured and blocking:
        order = ["ambulance", "hospital", "police", "towing", "repair", "tyre", "showroom"]
        reason = "Trauma care plus blocked road · ambulance, hospital, police listed first"
    elif injured:
        order = ["ambulance", "hospital", "police", "repair", "towing", "tyre", "showroom"]
        reason = "Trauma care prioritised · ambulance and hospital listed first"
    elif blocking:
        order = ["police", "towing", "repair", "tyre", "hospital", "ambulance", "showroom"]
        reason = "Vehicle blocking traffic · police and towing listed first"
    else:
        order = ["repair", "tyre", "showroom", "police", "towing", "hospital", "ambulance"]
        reason = "No injuries reported · roadside repair services listed first"''',
label="ai_triage.py rule_based_triage")

# ── main.py: fix stale repo URL ────────────────────────────────────────────
repl("backend/main.py",
'    contact={"name": "RoadSOS Team", "url": "https://github.com/Arthrevs/RoadSOS"},',
'    contact={"name": "RoadSOS Team", "url": "https://github.com/Arthrevs/RoadSOS"},',
label="main.py contact URL")

# ── README edits ───────────────────────────────────────────────────────────
R = "README.md"
repl(R, "### 🌐 43 Languages, 6 RTL", "### 🌐 48 Languages, 6 RTL", label="README lang heading")
repl(R, "All 22 official Indian languages (Schedule VIII) plus 21 global languages covering every UN region.",
        "All 22 official Indian languages (Schedule VIII) plus 26 global languages covering every UN region.", label="README lang feature line")
repl(R, "| **i18n** | i18next 26 + react-i18next 17 | 43 languages, RTL support, browser-detect fallback |",
        "| **i18n** | i18next 26 + react-i18next 17 | 48 languages, RTL support, browser-detect fallback |", label="README i18n stack row")
repl(R, "│       ├── i18n/                     # 43 locales + RTL handler",
        "│       ├── i18n/                     # 48 locales + RTL handler", label="README tree i18n")
repl(R, "│       │   └── *.json                # 43 translation bundles",
        "│       │   └── *.json                # 48 translation bundles", label="README tree bundles")
repl(R, "| **Languages** | 43 locales — all 22 Indian Schedule-VIII languages + 21 global. RTL layout for Arabic, Persian, Hebrew, Urdu, Kashmiri, Sindhi. |",
        "| **Languages** | 48 locales — all 22 Indian Schedule-VIII languages + 26 global. Hindi, Tamil, Bengali, Telugu and the major global languages are fully localised; Bodo, Kashmiri and Manipuri are partially localised (all UI keys present, translation in progress). RTL layout for Arabic, Persian, Hebrew, Urdu, Kashmiri, Sindhi. |",
        label="README languages capability row")
repl(R, "Per-IP rate limiting (30/min `/search`, 20/min `/triage`).",
        "Per-IP rate limiting (120/min `/search`, 80/min `/triage`).", label="README rate limit")
repl(R, "Detects a collapse from highway speed (>25 km/h) to standstill (<5 km/h) within two seconds. **PIN-cancel** safety layer prevents accidental dismissal by an unconscious hand on a screen.",
        "Detects a sudden collapse from sustained highway speed (≥40 km/h) to a standstill (≤5 km/h) within ~2.5 seconds — optionally confirmed by an accelerometer spike (≥3.5 G) when motion permission is granted. Tuned to ignore ordinary braking and stop-and-go traffic. **PIN-cancel** safety layer prevents accidental dismissal by an unconscious hand on a screen.",
        label="README crash feature line")
repl(R, "| **Crash detection** | Two-signal fusion: GPS velocity collapse (≥25 km/h → ≤5 km/h within 2 s) AND accelerometer spike (≥3.5 G) within a 4-second alignment window. PIN-cancel safety layer. 12-second post-alert cooldown. |",
        "| **Crash detection** | GPS velocity collapse — sustained ≥40 km/h dropping to ≤5 km/h within ~2.5 s — optionally confirmed by an accelerometer spike (≥3.5 G) within a 4 s window. Tuned to reject ordinary braking and stop-and-go traffic. PIN-cancel safety layer. 12 s post-alert cooldown. |",
        label="README crash capability row")
repl(R, "| **Accelerometer crash detection** | Phone-drop forces (~40 m/s²) overlap with serious crash forces (20–80 m/s²) and large potholes (15–30 m/s²). Apple still gets false positives on roller coasters with dedicated hardware. Indian highways have continuous pothole jerks — false positive rate would make the app unusable. |\n",
        "", label="README delete false accelerometer row")
repl(R, "https://github.com/Arthrevs/RoadSOS/actions/workflows/backend-tests.yml/badge.svg)](https://github.com/Arthrevs/RoadSOS/actions/workflows/backend-tests.yml)",
        "https://github.com/Arthrevs/RoadSOS/actions/workflows/backend-tests.yml/badge.svg)](https://github.com/Arthrevs/RoadSOS/actions/workflows/backend-tests.yml)",
        label="README CI badge")
repl(R, "Roadproj/\n", "RoadSOS/\n", label="README project tree root")

# ── bundledFacilities.js header comment ────────────────────────────────────
repl("frontend/src/utils/bundledFacilities.js",
""" * search this in-bundle list of verified major hospitals and trauma
 * centres covering 39 countries across 6 continents.""",
""" * search this in-bundle list of verified major hospitals, trauma
 * centres and national emergency contacts covering 200 countries.""",
label="bundledFacilities.js comment (39 countries)")
repl("frontend/src/utils/bundledFacilities.js",
" * - 818 entries (349 hospitals + 469 national emergency contacts) across all 200 countries — every country with an\n *   emergency-numbers entry has at least one bundled hospital fallback.",
" * - 818 entries (318 hospitals/clinics + 500 national emergency & service\n *   contacts) across all 200 countries — every country with an emergency-numbers\n *   entry has at least one bundled fallback.",
label="bundledFacilities.js comment (counts)")

# ── Sweep ALL remaining stale repo references (docs, scripts, etc.) ─────────
def sweep(root="."):
    exts = (".py", ".md", ".js", ".jsx", ".mjs", ".ts", ".tsx", ".tex", ".json", ".yml", ".yaml")
    skip = {".git", "node_modules", "dist", "build"}
    fixed = 0
    for dp, dn, fn in os.walk(root):
        dn[:] = [d for d in dn if d not in skip]
        for name in fn:
            if name == "package-lock.json" or not name.endswith(exts):
                continue
            p = os.path.join(dp, name)
            try:
                with io.open(p, encoding="utf-8") as f:
                    s = f.read()
            except (UnicodeDecodeError, IsADirectoryError):
                continue
            if "Arthrevs/RoadSOS" in s:
                with io.open(p, "w", encoding="utf-8") as f:
                    f.write(s.replace("Arthrevs/RoadSOS", "Arthrevs/RoadSOS"))
                fixed += 1
                print(f"  ok  swept Roadproj -> RoadSOS in {p}")
    print(f"  ({fixed} file(s) swept)")

print("\nSweeping remaining 'Arthrevs/RoadSOS' references...")
sweep(".")

# ── Harden .gitignore so secrets never get committed again ─────────────────
with io.open(".gitignore", encoding="utf-8") as f:
    gi = f.read()
if "# RoadSOS: never commit any env file except the examples" not in gi:
    gi += ("\n# RoadSOS: never commit any env file except the examples\n"
           ".env\n.env.*\n!.env.example\n!**/.env.example\n")
    with io.open(".gitignore", "w", encoding="utf-8") as f:
        f.write(gi)
    print("  ok  hardened .gitignore (.env.*)")
else:
    print("  -- .gitignore already hardened")

print("\nALL AUTOMATED FIXES DONE.")

# ════════════════════════════════════════════════════════════════════════════
# PART 2 — remaining stale tokens in embedded source/tests + standalone docs
# ════════════════════════════════════════════════════════════════════════════

# offline_service.py: 59-country -> 200-country
repl("backend/services/offline_service.py",
'"""GET /offline-pack · serves the bundled 59-country emergency number database.',
'"""GET /offline-pack · serves the bundled 200-country emergency number database.',
label="offline_service.py docstring")
repl("backend/services/offline_service.py",
'@offline_router.get("/offline-pack", summary="Bundled 59-country emergency numbers")',
'@offline_router.get("/offline-pack", summary="Bundled 200-country emergency numbers")',
label="offline_service.py summary")

# rate_limiter.py: misleading default docstring
repl("backend/services/rate_limiter.py",
'    """Token-bucket per client IP. Default: 30 requests/minute, burst of 10."""',
'    """Token-bucket per client IP. Deployed limits: 120/min (search), 80/min (triage)."""',
label="rate_limiter.py docstring")

# routeCache.js: stale 30/min comment
repl("frontend/src/utils/routeCache.js",
" *   the backend's per-IP rate limiter (30/min) or burn API quota.",
" *   the backend's per-IP rate limiter (120/min) or burn API quota.",
label="routeCache.js comment")

# README: fabricated Plus Code example -> real Chennai code
repl("README.md",
"**dispatcher-friendly Plus Code** like `7M5CC9R6+VV` — recognized by Indian 112 ERSS",
"**dispatcher-friendly Plus Code** like `7M5237MC+37` — recognized by Indian 112 ERSS",
label="README Plus Code example")

# README: /offline-pack API reference still said 59-country
repl("README.md", "Returns the bundled 59-country emergency number database.",
                   "Returns the bundled 200-country emergency number database.", label="README /offline-pack ref")

# medicalId.test.js: fabricated fixture -> the REAL code for the test's own coords
repl("frontend/src/utils/__tests__/medicalId.test.js",
"      plusCode: '7J5CC9R6+VV',", "      plusCode: '7M5237MC+37',", label="medicalId.test fixture input")
repl("frontend/src/utils/__tests__/medicalId.test.js",
"    expect(body).toMatch(/7J5CC9R6\\+VV/);", "    expect(body).toMatch(/7M5237MC\\+37/);", label="medicalId.test assertion")

# build_submission_tex.py: hardcoded crash prose now matches the new code
repl("scripts/build_submission_tex.py",
'        "On auto-detected crash (velocity collapse ≥ 25 km/h → ≤ 5 km/h in 2 s confirmed by ≥ 3.5 G accelerometer spike), a 10 s cancellation window lets the user abort false positives.",',
'        "On auto-detected crash (sustained ≥ 40 km/h collapsing to ≤ 5 km/h within ~2.5 s, optionally confirmed by a ≥ 3.5 G accelerometer spike), a cancellation window lets the user abort false positives.",',
label="build_submission_tex.py assumptions crash line")
repl("scripts/build_submission_tex.py",
"""  \\item \\textbf{Signal 1} --- GPS velocity collapse: $\\geq$25\\,km/h $\\to$
        $\\leq$5\\,km/h within 2\\,s.
  \\item \\textbf{Signal 2} --- Accelerometer spike: peak magnitude $\\geq$3.5\\,G.
  \\item \\textbf{Confirmation}: both signals must occur within a 4\\,s alignment window.""",
"""  \\item \\textbf{Signal 1 (primary)} --- GPS velocity collapse: sustained $\\geq$40\\,km/h $\\to$
        $\\leq$5\\,km/h within ~2.5\\,s. Tuned to reject ordinary braking and stop-and-go traffic.
  \\item \\textbf{Signal 2 (optional)} --- Accelerometer spike: peak magnitude $\\geq$3.5\\,G.
  \\item \\textbf{Confirmation}: the accelerometer spike, when motion permission is granted, must align within a 4\\,s window; a sustained-speed sudden stop alone still triggers.""",
label="build_submission_tex.py crash signals block")

# ── Standalone docs (NOT regenerated by the script — fix directly) ─────────
repl("docs/TECHNICAL.tex", "internationalization across 43 languages,", "internationalization across 48 languages,", label="TECHNICAL.tex scope")
repl("docs/TECHNICAL.tex", "|   |- i18next 26       (43 languages, RTL support)             |",
                           "|   |- i18next 26       (48 languages, RTL support)             |", label="TECHNICAL.tex diagram")
repl("docs/TECHNICAL.tex", "i18n & i18next 26.2.0 + react-i18next 17.0.8; 43 locales \\\\",
                           "i18n & i18next 26.2.0 + react-i18next 17.0.8; 48 locales \\\\", label="TECHNICAL.tex stack table")
repl("docs/TECHNICAL.tex",
"On first launch, the user sees a full-screen modal listing all 43 languages, grouped into ``India'' (22) and ``World'' (21) sections.",
"On first launch, the user sees a full-screen modal listing all 48 languages, grouped into ``India'' (22) and ``World'' (26) sections.",
label="TECHNICAL.tex language modal")
repl("docs/TECHNICAL.tex",
"A velocity collapse is registered when a sample at $\\ge$ 25 km/h is followed within 2 seconds by a sample at $\\le$ 5 km/h.",
"A velocity collapse is registered when sustained samples at $\\ge$ 40 km/h are followed within ~2.5 seconds by a sample at $\\le$ 5 km/h (tuned to reject ordinary braking and stop-and-go traffic).",
label="TECHNICAL.tex crash algo prose")
repl("docs/TECHNICAL.tex",
"Crash detection --- velocity collapse threshold & $\\ge$25 km/h $\\rightarrow$ $\\le$5 km/h within 2 s \\\\",
"Crash detection --- velocity collapse threshold & sustained $\\ge$40 km/h $\\rightarrow$ $\\le$5 km/h within ~2.5 s \\\\",
label="TECHNICAL.tex crash threshold table")

repl("docs/ARCHITECTURE.md", "│  ├─ i18next (43 languages)                                          │",
                             "│  ├─ i18next (48 languages)                                          │", label="ARCHITECTURE.md diagram")
repl("docs/ARCHITECTURE.md",
"- **43 languages:** all 22 Indian Schedule-VIII languages + English + 20 global (Spanish, French, Portuguese, German, Italian, Dutch, Polish, Russian, Ukrainian, Romanian, Greek, Turkish, Arabic, Persian, Hebrew, Swahili, Amharic, Indonesian, Malay, Thai, Vietnamese, Chinese, Japanese, Korean, Filipino)",
"- **48 languages:** all 22 Indian Schedule-VIII languages + English + 25 global (Spanish, French, Portuguese, German, Italian, Dutch, Polish, Russian, Ukrainian, Romanian, Greek, Turkish, Arabic, Persian, Hebrew, Swahili, Amharic, Indonesian, Malay, Thai, Vietnamese, Chinese, Japanese, Korean, Filipino). Hindi, Tamil, Bengali, Telugu and the major global languages are fully localised; Bodo, Kashmiri and Manipuri are partially localised.",
label="ARCHITECTURE.md language list")
repl("docs/ARCHITECTURE.md",
"10. **43-language i18n with RTL.** Cover all 22 Indian Schedule-VIII languages plus 20 global.",
"10. **48-language i18n with RTL.** Cover all 22 Indian Schedule-VIII languages plus 25 global + English.",
label="ARCHITECTURE.md summary")
repl("docs/ARCHITECTURE.md",
"1. **GPS velocity collapse:** ≥25 km/h followed by ≤5 km/h within 2-second window",
"1. **GPS velocity collapse:** sustained ≥40 km/h followed by ≤5 km/h within ~2.5 s (rejects ordinary braking)",
label="ARCHITECTURE.md crash threshold")

repl("docs/PRESENTATION.md", "Bundled 196-Country DB", "Bundled 200-Country DB", label="PRESENTATION.md DB label")

print("\nPART 2 + DOCS DONE.")

# ════════════════════════════════════════════════════════════════════════════
# PART 2 — remaining stale tokens in embedded source/tests + standalone docs
# ════════════════════════════════════════════════════════════════════════════

# offline_service.py: 59-country -> 200-country
repl("backend/services/offline_service.py",
'"""GET /offline-pack · serves the bundled 59-country emergency number database.',
'"""GET /offline-pack · serves the bundled 200-country emergency number database.',
label="offline_service.py docstring")
repl("backend/services/offline_service.py",
'@offline_router.get("/offline-pack", summary="Bundled 59-country emergency numbers")',
'@offline_router.get("/offline-pack", summary="Bundled 200-country emergency numbers")',
label="offline_service.py summary")

# rate_limiter.py: misleading default docstring
repl("backend/services/rate_limiter.py",
'    """Token-bucket per client IP. Default: 30 requests/minute, burst of 10."""',
'    """Token-bucket per client IP. Deployed limits: 120/min (search), 80/min (triage)."""',
label="rate_limiter.py docstring")

# routeCache.js: stale 30/min comment
repl("frontend/src/utils/routeCache.js",
" *   the backend's per-IP rate limiter (30/min) or burn API quota.",
" *   the backend's per-IP rate limiter (120/min) or burn API quota.",
label="routeCache.js comment")

# README: fabricated Plus Code example -> real Chennai code
repl("README.md",
"**dispatcher-friendly Plus Code** like `7M5CC9R6+VV` — recognized by Indian 112 ERSS",
"**dispatcher-friendly Plus Code** like `7M5237MC+37` — recognized by Indian 112 ERSS",
label="README Plus Code example")

# README: /offline-pack API reference still said 59-country
repl("README.md", "Returns the bundled 59-country emergency number database.",
                   "Returns the bundled 200-country emergency number database.", label="README /offline-pack ref")

# medicalId.test.js: fabricated fixture -> the REAL code for the test's own coords
repl("frontend/src/utils/__tests__/medicalId.test.js",
"      plusCode: '7J5CC9R6+VV',", "      plusCode: '7M5237MC+37',", label="medicalId.test fixture input")
repl("frontend/src/utils/__tests__/medicalId.test.js",
"    expect(body).toMatch(/7J5CC9R6\\+VV/);", "    expect(body).toMatch(/7M5237MC\\+37/);", label="medicalId.test assertion")

# build_submission_tex.py: hardcoded crash prose now matches the new code
repl("scripts/build_submission_tex.py",
'        "On auto-detected crash (velocity collapse ≥ 25 km/h → ≤ 5 km/h in 2 s confirmed by ≥ 3.5 G accelerometer spike), a 10 s cancellation window lets the user abort false positives.",',
'        "On auto-detected crash (sustained ≥ 40 km/h collapsing to ≤ 5 km/h within ~2.5 s, optionally confirmed by a ≥ 3.5 G accelerometer spike), a cancellation window lets the user abort false positives.",',
label="build_submission_tex.py assumptions crash line")
repl("scripts/build_submission_tex.py",
"""  \\item \\textbf{Signal 1} --- GPS velocity collapse: $\\geq$25\\,km/h $\\to$
        $\\leq$5\\,km/h within 2\\,s.
  \\item \\textbf{Signal 2} --- Accelerometer spike: peak magnitude $\\geq$3.5\\,G.
  \\item \\textbf{Confirmation}: both signals must occur within a 4\\,s alignment window.""",
"""  \\item \\textbf{Signal 1 (primary)} --- GPS velocity collapse: sustained $\\geq$40\\,km/h $\\to$
        $\\leq$5\\,km/h within ~2.5\\,s. Tuned to reject ordinary braking and stop-and-go traffic.
  \\item \\textbf{Signal 2 (optional)} --- Accelerometer spike: peak magnitude $\\geq$3.5\\,G.
  \\item \\textbf{Confirmation}: the accelerometer spike, when motion permission is granted, must align within a 4\\,s window; a sustained-speed sudden stop alone still triggers.""",
label="build_submission_tex.py crash signals block")

# ── Standalone docs (NOT regenerated by the script — fix directly) ─────────
repl("docs/TECHNICAL.tex", "internationalization across 43 languages,", "internationalization across 48 languages,", label="TECHNICAL.tex scope")
repl("docs/TECHNICAL.tex", "|   |- i18next 26       (43 languages, RTL support)             |",
                           "|   |- i18next 26       (48 languages, RTL support)             |", label="TECHNICAL.tex diagram")
repl("docs/TECHNICAL.tex", "i18n & i18next 26.2.0 + react-i18next 17.0.8; 43 locales \\\\",
                           "i18n & i18next 26.2.0 + react-i18next 17.0.8; 48 locales \\\\", label="TECHNICAL.tex stack table")
repl("docs/TECHNICAL.tex",
"On first launch, the user sees a full-screen modal listing all 43 languages, grouped into ``India'' (22) and ``World'' (21) sections.",
"On first launch, the user sees a full-screen modal listing all 48 languages, grouped into ``India'' (22) and ``World'' (26) sections.",
label="TECHNICAL.tex language modal")
repl("docs/TECHNICAL.tex",
"A velocity collapse is registered when a sample at $\\ge$ 25 km/h is followed within 2 seconds by a sample at $\\le$ 5 km/h.",
"A velocity collapse is registered when sustained samples at $\\ge$ 40 km/h are followed within ~2.5 seconds by a sample at $\\le$ 5 km/h (tuned to reject ordinary braking and stop-and-go traffic).",
label="TECHNICAL.tex crash algo prose")
repl("docs/TECHNICAL.tex",
"Crash detection --- velocity collapse threshold & $\\ge$25 km/h $\\rightarrow$ $\\le$5 km/h within 2 s \\\\",
"Crash detection --- velocity collapse threshold & sustained $\\ge$40 km/h $\\rightarrow$ $\\le$5 km/h within ~2.5 s \\\\",
label="TECHNICAL.tex crash threshold table")

repl("docs/ARCHITECTURE.md", "│  ├─ i18next (43 languages)                                          │",
                             "│  ├─ i18next (48 languages)                                          │", label="ARCHITECTURE.md diagram")
repl("docs/ARCHITECTURE.md",
"- **43 languages:** all 22 Indian Schedule-VIII languages + English + 20 global (Spanish, French, Portuguese, German, Italian, Dutch, Polish, Russian, Ukrainian, Romanian, Greek, Turkish, Arabic, Persian, Hebrew, Swahili, Amharic, Indonesian, Malay, Thai, Vietnamese, Chinese, Japanese, Korean, Filipino)",
"- **48 languages:** all 22 Indian Schedule-VIII languages + English + 25 global (Spanish, French, Portuguese, German, Italian, Dutch, Polish, Russian, Ukrainian, Romanian, Greek, Turkish, Arabic, Persian, Hebrew, Swahili, Amharic, Indonesian, Malay, Thai, Vietnamese, Chinese, Japanese, Korean, Filipino). Hindi, Tamil, Bengali, Telugu and the major global languages are fully localised; Bodo, Kashmiri and Manipuri are partially localised.",
label="ARCHITECTURE.md language list")
repl("docs/ARCHITECTURE.md",
"10. **43-language i18n with RTL.** Cover all 22 Indian Schedule-VIII languages plus 20 global.",
"10. **48-language i18n with RTL.** Cover all 22 Indian Schedule-VIII languages plus 25 global + English.",
label="ARCHITECTURE.md summary")
repl("docs/ARCHITECTURE.md",
"1. **GPS velocity collapse:** ≥25 km/h followed by ≤5 km/h within 2-second window",
"1. **GPS velocity collapse:** sustained ≥40 km/h followed by ≤5 km/h within ~2.5 s (rejects ordinary braking)",
label="ARCHITECTURE.md crash threshold")

repl("docs/PRESENTATION.md", "Bundled 196-Country DB", "Bundled 200-Country DB", label="PRESENTATION.md DB label")

print("\nPART 2 + DOCS DONE.")

# ════════════════════════════════════════════════════════════════════════════
# PART 2 — remaining stale tokens in embedded source/tests + standalone docs
# ════════════════════════════════════════════════════════════════════════════

# offline_service.py: 59-country -> 200-country
repl("backend/services/offline_service.py",
'"""GET /offline-pack · serves the bundled 59-country emergency number database.',
'"""GET /offline-pack · serves the bundled 200-country emergency number database.',
label="offline_service.py docstring")
repl("backend/services/offline_service.py",
'@offline_router.get("/offline-pack", summary="Bundled 59-country emergency numbers")',
'@offline_router.get("/offline-pack", summary="Bundled 200-country emergency numbers")',
label="offline_service.py summary")

# rate_limiter.py: misleading default docstring
repl("backend/services/rate_limiter.py",
'    """Token-bucket per client IP. Default: 30 requests/minute, burst of 10."""',
'    """Token-bucket per client IP. Deployed limits: 120/min (search), 80/min (triage)."""',
label="rate_limiter.py docstring")

# routeCache.js: stale 30/min comment
repl("frontend/src/utils/routeCache.js",
" *   the backend's per-IP rate limiter (30/min) or burn API quota.",
" *   the backend's per-IP rate limiter (120/min) or burn API quota.",
label="routeCache.js comment")

# README: fabricated Plus Code example -> real Chennai code
repl("README.md",
"**dispatcher-friendly Plus Code** like `7M5CC9R6+VV` — recognized by Indian 112 ERSS",
"**dispatcher-friendly Plus Code** like `7M5237MC+37` — recognized by Indian 112 ERSS",
label="README Plus Code example")

# README: /offline-pack API reference still said 59-country
repl("README.md", "Returns the bundled 59-country emergency number database.",
                   "Returns the bundled 200-country emergency number database.", label="README /offline-pack ref")

# medicalId.test.js: fabricated fixture -> the REAL code for the test's own coords
repl("frontend/src/utils/__tests__/medicalId.test.js",
"      plusCode: '7J5CC9R6+VV',", "      plusCode: '7M5237MC+37',", label="medicalId.test fixture input")
repl("frontend/src/utils/__tests__/medicalId.test.js",
"    expect(body).toMatch(/7J5CC9R6\\+VV/);", "    expect(body).toMatch(/7M5237MC\\+37/);", label="medicalId.test assertion")

# build_submission_tex.py: hardcoded crash prose now matches the new code
repl("scripts/build_submission_tex.py",
'        "On auto-detected crash (velocity collapse ≥ 25 km/h → ≤ 5 km/h in 2 s confirmed by ≥ 3.5 G accelerometer spike), a 10 s cancellation window lets the user abort false positives.",',
'        "On auto-detected crash (sustained ≥ 40 km/h collapsing to ≤ 5 km/h within ~2.5 s, optionally confirmed by a ≥ 3.5 G accelerometer spike), a cancellation window lets the user abort false positives.",',
label="build_submission_tex.py assumptions crash line")
repl("scripts/build_submission_tex.py",
"""  \\item \\textbf{Signal 1} --- GPS velocity collapse: $\\geq$25\\,km/h $\\to$
        $\\leq$5\\,km/h within 2\\,s.
  \\item \\textbf{Signal 2} --- Accelerometer spike: peak magnitude $\\geq$3.5\\,G.
  \\item \\textbf{Confirmation}: both signals must occur within a 4\\,s alignment window.""",
"""  \\item \\textbf{Signal 1 (primary)} --- GPS velocity collapse: sustained $\\geq$40\\,km/h $\\to$
        $\\leq$5\\,km/h within ~2.5\\,s. Tuned to reject ordinary braking and stop-and-go traffic.
  \\item \\textbf{Signal 2 (optional)} --- Accelerometer spike: peak magnitude $\\geq$3.5\\,G.
  \\item \\textbf{Confirmation}: the accelerometer spike, when motion permission is granted, must align within a 4\\,s window; a sustained-speed sudden stop alone still triggers.""",
label="build_submission_tex.py crash signals block")

# ── Standalone docs (NOT regenerated by the script — fix directly) ─────────
repl("docs/TECHNICAL.tex", "internationalization across 43 languages,", "internationalization across 48 languages,", label="TECHNICAL.tex scope")
repl("docs/TECHNICAL.tex", "|   |- i18next 26       (43 languages, RTL support)             |",
                           "|   |- i18next 26       (48 languages, RTL support)             |", label="TECHNICAL.tex diagram")
repl("docs/TECHNICAL.tex", "i18n & i18next 26.2.0 + react-i18next 17.0.8; 43 locales \\\\",
                           "i18n & i18next 26.2.0 + react-i18next 17.0.8; 48 locales \\\\", label="TECHNICAL.tex stack table")
repl("docs/TECHNICAL.tex",
"On first launch, the user sees a full-screen modal listing all 43 languages, grouped into ``India'' (22) and ``World'' (21) sections.",
"On first launch, the user sees a full-screen modal listing all 48 languages, grouped into ``India'' (22) and ``World'' (26) sections.",
label="TECHNICAL.tex language modal")
repl("docs/TECHNICAL.tex",
"A velocity collapse is registered when a sample at $\\ge$ 25 km/h is followed within 2 seconds by a sample at $\\le$ 5 km/h.",
"A velocity collapse is registered when sustained samples at $\\ge$ 40 km/h are followed within ~2.5 seconds by a sample at $\\le$ 5 km/h (tuned to reject ordinary braking and stop-and-go traffic).",
label="TECHNICAL.tex crash algo prose")
repl("docs/TECHNICAL.tex",
"Crash detection --- velocity collapse threshold & $\\ge$25 km/h $\\rightarrow$ $\\le$5 km/h within 2 s \\\\",
"Crash detection --- velocity collapse threshold & sustained $\\ge$40 km/h $\\rightarrow$ $\\le$5 km/h within ~2.5 s \\\\",
label="TECHNICAL.tex crash threshold table")

repl("docs/ARCHITECTURE.md", "│  ├─ i18next (43 languages)                                          │",
                             "│  ├─ i18next (48 languages)                                          │", label="ARCHITECTURE.md diagram")
repl("docs/ARCHITECTURE.md",
"- **43 languages:** all 22 Indian Schedule-VIII languages + English + 20 global (Spanish, French, Portuguese, German, Italian, Dutch, Polish, Russian, Ukrainian, Romanian, Greek, Turkish, Arabic, Persian, Hebrew, Swahili, Amharic, Indonesian, Malay, Thai, Vietnamese, Chinese, Japanese, Korean, Filipino)",
"- **48 languages:** all 22 Indian Schedule-VIII languages + English + 25 global (Spanish, French, Portuguese, German, Italian, Dutch, Polish, Russian, Ukrainian, Romanian, Greek, Turkish, Arabic, Persian, Hebrew, Swahili, Amharic, Indonesian, Malay, Thai, Vietnamese, Chinese, Japanese, Korean, Filipino). Hindi, Tamil, Bengali, Telugu and the major global languages are fully localised; Bodo, Kashmiri and Manipuri are partially localised.",
label="ARCHITECTURE.md language list")
repl("docs/ARCHITECTURE.md",
"10. **43-language i18n with RTL.** Cover all 22 Indian Schedule-VIII languages plus 20 global.",
"10. **48-language i18n with RTL.** Cover all 22 Indian Schedule-VIII languages plus 25 global + English.",
label="ARCHITECTURE.md summary")
repl("docs/ARCHITECTURE.md",
"1. **GPS velocity collapse:** ≥25 km/h followed by ≤5 km/h within 2-second window",
"1. **GPS velocity collapse:** sustained ≥40 km/h followed by ≤5 km/h within ~2.5 s (rejects ordinary braking)",
label="ARCHITECTURE.md crash threshold")

repl("docs/PRESENTATION.md", "Bundled 196-Country DB", "Bundled 200-Country DB", label="PRESENTATION.md DB label")

print("\nPART 2 + DOCS DONE.")

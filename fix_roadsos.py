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

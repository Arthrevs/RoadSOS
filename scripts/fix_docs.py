# Run from repo root: python scripts/fix_docs.py
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

fixes = {
    "docs/ARCHITECTURE.md": [
        # TTL in 4-tier diagram
        (
            "(24h TTL, ~1.1km grid key)",
            "(7-day TTL, ~1.1km grid key)",
        ),
        # Tier 4: mock data was removed [U+2014] final fallback is now empty list
        (
            "4. MOCK_DATA (7 hardcoded contacts)",
            "4. Empty contacts list [U+2014] national numbers banner always renders",
        ),
        # Offline capability matrix TTL
        (
            "| `offlineDB.js` (localStorage) | Search results keyed by ~1.1km grid | 24h | manual `clearCache()` |",
            "| `offlineDB.js` (localStorage) | Search results keyed by ~1.1km grid | 7-day | manual `clearCache()` |",
        ),
        # "Offline gap" [U+2014] tiles ARE cached by sw.js CacheFirst since sw.js was updated
        (
            "**Offline gap:** OSM tile imagery is **not** cached [U+2014] the basemap goes blank when offline, but markers + UI still render.",
            "**Map tiles:** CartoDB Dark Matter tiles are cached at runtime via Workbox `CacheFirst` (250-tile LRU, 30-day TTL). Previously-viewed map areas render fully offline. First visit to a new area while offline shows a blank basemap, but all contact markers and the UI render normally.",
        ),
        # Known Risk #5 [U+2014] tile caching was implemented; mark it resolved
        (
            "| 5 | OSM tiles not cached for offline use | Medium | Add Workbox runtime caching rule for `cartocdn.com/dark_all` pattern |",
            "| 5 | ~~OSM tiles not cached for offline use~~ | ~~Medium~~ | **Resolved** [U+2014] Workbox `CacheFirst` route added in `public/sw.js` for `cartocdn.com/dark_all` (250-tile LRU, 30-day TTL) |",
        ),
    ],
    "docs/TECHNICAL.tex": [
        # Old repo name in project layout
        (
            "Roadproj/\n|- backend/",
            "RoadSOS/\n|- backend/",
        ),
        # Language count
        (
            "first-launch 43-language modal",
            "first-launch 48-language modal",
        ),
    ],
    "docs/DATA_SCHEMA.md": [
        (
            "| 8 | Browser localStorage | Per device | 1 entry per area | 24h TTL |",
            "| 8 | Browser localStorage | Per device | 1 entry per area | 7-day TTL |",
        ),
    ],
    "docs/PRESENTATION.md": [
        # TTL in offline criterion row
        (
            "localStorage 24h cache (1 km grid)",
            "localStorage 7-day TTL (1 km grid)",
        ),
        # Test count [U+2014] actual is 128 backend + 143 frontend = 271
        (
            "59 unit tests",
            "271 unit tests (128 backend [U+00B7] 143 frontend)",
        ),
    ],
}

for rel_path, replacements in fixes.items():
    path = ROOT / rel_path
    text = path.read_text(encoding="utf-8")
    changed = 0
    for old, new in replacements:
        if old in text:
            text = text.replace(old, new)
            changed += 1
        else:
            print(f"  WARN [U+2014] string not found in {rel_path}:")
            print(f"    {repr(old[:80])}")
    path.write_text(text, encoding="utf-8")
    print(f"✓ {rel_path} [U+2014] {changed}/{len(replacements)} replacements applied")

print("\nDone. Now do the 3 manual fixes below.")

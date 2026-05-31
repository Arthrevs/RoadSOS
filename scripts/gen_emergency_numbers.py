#!/usr/bin/env python3
"""Generate frontend/src/utils/emergencyNumbers.js from backend/data/emergency_seed.json.
Single source of truth. Run from repo root: python scripts/gen_emergency_numbers.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
seed = json.loads((ROOT / "backend/data/emergency_seed.json").read_text(encoding="utf-8"))

header = (
    "// Bundled offline — country code → emergency numbers. Always available, no network needed.\n"
    "// AUTO-GENERATED from backend/data/emergency_seed.json by scripts/gen_emergency_numbers.py.\n"
    "// DO NOT EDIT BY HAND. Run: python scripts/gen_emergency_numbers.py\n"
    "// Optional `highway` field carries a national road-assistance helpline (surfaced\n"
    "// as the towing card when no live towing contact is available).\n"
    "export const emergencyNumbersMap = {\n"
)
footer = (
    "};\n\n"
    "export function getEmergencyNumbers(countryCode) {\n"
    "  if (!countryCode) return null;\n"
    "  return emergencyNumbersMap[countryCode.toUpperCase()] || null;\n"
    "}\n"
)

lines = []
for r in seed:
    parts = [
        f'country: {json.dumps(r["country"])}',
        f'police: {json.dumps(str(r["police"]))}',
        f'ambulance: {json.dumps(str(r["ambulance"]))}',
        f'fire: {json.dumps(str(r["fire"]))}',
        f'general: {json.dumps(str(r["general"]))}',
    ]
    if str(r.get("highway", "")).strip():
        parts.append(f'highway: {json.dumps(str(r["highway"]))}')
    lines.append(f'  {r["country_code"]}: {{ ' + ", ".join(parts) + " },")

out = header + "\n".join(lines) + "\n" + footer
(ROOT / "frontend/src/utils/emergencyNumbers.js").write_text(out, encoding="utf-8")
print(f"Wrote {len(seed)} entries to frontend/src/utils/emergencyNumbers.js")

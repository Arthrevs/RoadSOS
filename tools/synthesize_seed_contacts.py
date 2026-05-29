#!/usr/bin/env python3
"""Synthesize national ambulance/police/fire contacts from emergency_seed.json.

Reads the backend seed data and generates one bundled_facilities.json entry per
(country × service) where a distinct phone number exists. Each entry is placed
at the country's capital centroid (hardcoded lookup) so haversine searches always
find at least one national contact per country.

Output is merged INTO the existing bundled_facilities.json — existing hospital
entries are preserved; only new synthesized contacts are appended.

Usage:
    python tools/synthesize_seed_contacts.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

SEED_PATH = Path(__file__).resolve().parent.parent / "backend" / "data" / "emergency_seed.json"
BUNDLE_PATH = (
    Path(__file__).resolve().parent.parent
    / "frontend"
    / "src"
    / "data"
    / "bundled_facilities.json"
)

# Capital centroids (lat, lon) for every country code in emergency_seed.json.
# These don't need to be millimetre-precise — they're used only to place
# synthesised national contacts so they're findable via haversine search.
CAPITALS: dict[str, tuple[float, float]] = {
    "AF": (34.5553, 69.2075),   # Kabul
    "AL": (41.3275, 19.8187),   # Tirana
    "DZ": (36.7538, 3.0588),    # Algiers
    "AD": (42.5063, 1.5218),    # Andorra la Vella
    "AO": (-8.8390, 13.2894),   # Luanda
    "AG": (17.1175, -61.8456),  # St. John's
    "AR": (-34.6037, -58.3816), # Buenos Aires
    "AM": (40.1792, 44.4991),   # Yerevan
    "AU": (-35.2809, 149.1300), # Canberra
    "AT": (48.2082, 16.3738),   # Vienna
    "AZ": (40.4093, 49.8671),   # Baku
    "BS": (25.0480, -77.3554),  # Nassau
    "BH": (26.2285, 50.5860),   # Manama
    "BD": (23.8103, 90.4125),   # Dhaka
    "BB": (13.0969, -59.6145),  # Bridgetown
    "BY": (53.9045, 27.5615),   # Minsk
    "BE": (50.8503, 4.3517),    # Brussels
    "BZ": (17.2510, -88.7590),  # Belmopan
    "BJ": (6.4969, 2.6289),     # Porto-Novo
    "BT": (27.4728, 89.6390),   # Thimphu
    "BO": (-16.4897, -68.1193), # La Paz
    "BA": (43.8563, 18.4131),   # Sarajevo
    "BW": (-24.6282, 25.9231),  # Gaborone
    "BR": (-15.7975, -47.8919), # Brasília
    "BN": (4.9031, 114.9398),   # Bandar Seri Begawan
    "BG": (42.6977, 23.3219),   # Sofia
    "BF": (12.3714, -1.5197),   # Ouagadougou
    "BI": (-3.3731, 29.3644),   # Gitega
    "CV": (14.9315, -23.5133),  # Praia
    "KH": (11.5564, 104.9282),  # Phnom Penh
    "CM": (3.8480, 11.5021),    # Yaoundé
    "CA": (45.4215, -75.6972),  # Ottawa
    "CF": (4.3947, 18.5582),    # Bangui
    "TD": (12.1348, 15.0557),   # N'Djamena
    "CL": (-33.4489, -70.6693), # Santiago
    "CN": (39.9042, 116.4074),  # Beijing
    "CO": (4.7110, -74.0721),   # Bogotá
    "KM": (-11.7172, 43.2473),  # Moroni
    "CG": (-4.2634, 15.2429),   # Brazzaville
    "CK": (-21.2367, -159.7777),# Avarua
    "CR": (9.9281, -84.0907),   # San José
    "HR": (45.8150, 15.9819),   # Zagreb
    "CU": (23.1136, -82.3666),  # Havana
    "CY": (35.1856, 33.3823),   # Nicosia
    "CZ": (50.0755, 14.4378),   # Prague
    "CI": (6.8276, -5.2893),    # Yamoussoukro
    "CD": (-4.4419, 15.2663),   # Kinshasa
    "DK": (55.6761, 12.5683),   # Copenhagen
    "DJ": (11.5721, 43.1456),   # Djibouti
    "DM": (15.3010, -61.3870),  # Roseau
    "DO": (18.4861, -69.9312),  # Santo Domingo
    "EC": (-0.1807, -78.4678),  # Quito
    "EG": (30.0444, 31.2357),   # Cairo
    "SV": (13.6929, -89.2182),  # San Salvador
    "GQ": (3.7504, 8.7371),     # Malabo
    "ER": (15.3229, 38.9251),   # Asmara
    "EE": (59.4370, 24.7536),   # Tallinn
    "SZ": (-26.3054, 31.1367),  # Mbabane
    "ET": (9.0250, 38.7469),    # Addis Ababa
    "FJ": (-18.1416, 178.4419), # Suva
    "FI": (60.1699, 24.9384),   # Helsinki
    "FR": (48.8566, 2.3522),    # Paris
    "GA": (0.4162, 9.4673),     # Libreville
    "GM": (13.4549, -16.5790),  # Banjul
    "GE": (41.7151, 44.8271),   # Tbilisi
    "DE": (52.5200, 13.4050),   # Berlin
    "GH": (5.6037, -0.1870),    # Accra
    "GR": (37.9838, 23.7275),   # Athens
    "GD": (12.0564, -61.7485),  # St. George's
    "GT": (14.6349, -90.5069),  # Guatemala City
    "GN": (9.6412, -13.5784),   # Conakry
    "GW": (11.8637, -15.5980),  # Bissau
    "GY": (6.8013, -58.1551),   # Georgetown
    "HT": (18.5944, -72.3074),  # Port-au-Prince
    "VA": (41.9029, 12.4534),   # Vatican City
    "HN": (14.0723, -87.1921),  # Tegucigalpa
    "HU": (47.4979, 19.0402),   # Budapest
    "IS": (64.1466, -21.9426),  # Reykjavik
    "IN": (28.6139, 77.2090),   # New Delhi
    "ID": (-6.2088, 106.8456),  # Jakarta
    "IR": (35.6892, 51.3890),   # Tehran
    "IQ": (33.3152, 44.3661),   # Baghdad
    "IE": (53.3498, -6.2603),   # Dublin
    "IL": (31.7683, 35.2137),   # Jerusalem
    "IT": (41.9028, 12.4964),   # Rome
    "JM": (18.1096, -77.2975),  # Kingston
    "JP": (35.6762, 139.6503),  # Tokyo
    "JO": (31.9454, 35.9284),   # Amman
    "KZ": (51.1694, 71.4491),   # Nur-Sultan
    "KE": (-1.2921, 36.8219),   # Nairobi
    "KI": (1.4518, 173.0186),   # Tarawa
    "KP": (39.0392, 125.7625),  # Pyongyang
    "KR": (37.5665, 126.9780),  # Seoul
    "KW": (29.3759, 47.9774),   # Kuwait City
    "KG": (42.8746, 74.5698),   # Bishkek
    "LA": (17.9757, 102.6331),  # Vientiane
    "LV": (56.9496, 24.1052),   # Riga
    "LB": (33.8938, 35.5018),   # Beirut
    "LS": (-29.3142, 27.4833),  # Maseru
    "LR": (6.2907, -10.7605),   # Monrovia
    "LY": (32.8872, 13.1913),   # Tripoli
    "LI": (47.1660, 9.5554),    # Vaduz
    "LT": (54.6872, 25.2797),   # Vilnius
    "LU": (49.6116, 6.1319),    # Luxembourg City
    "MG": (-18.8792, 47.5079),  # Antananarivo
    "MW": (-13.9626, 33.7741),  # Lilongwe
    "MY": (3.1390, 101.6869),   # Kuala Lumpur
    "MV": (4.1755, 73.5093),    # Malé
    "ML": (12.6392, -8.0029),   # Bamako
    "MT": (35.8989, 14.5146),   # Valletta
    "MH": (7.0897, 171.3803),   # Majuro
    "MR": (18.0735, -15.9582),  # Nouakchott
    "MU": (-20.1609, 57.5012),  # Port Louis
    "MX": (19.4326, -99.1332),  # Mexico City
    "FM": (6.9248, 158.1610),   # Palikir
    "MD": (47.0105, 28.8638),   # Chișinău
    "MC": (43.7384, 7.4246),    # Monaco
    "MN": (47.8864, 106.9057),  # Ulaanbaatar
    "ME": (42.4304, 19.2594),   # Podgorica
    "MA": (33.9716, -6.8498),   # Rabat
    "MZ": (-25.9692, 32.5732),  # Maputo
    "MM": (19.7633, 96.0785),   # Naypyidaw
    "NA": (-22.5609, 17.0658),  # Windhoek
    "NR": (-0.5477, 166.9209),  # Yaren
    "NP": (27.7172, 85.3240),   # Kathmandu
    "NL": (52.3676, 4.9041),    # Amsterdam
    "NZ": (-41.2866, 174.7756), # Wellington
    "NI": (12.1150, -86.2362),  # Managua
    "NE": (13.5127, 2.1128),    # Niamey
    "NG": (9.0765, 7.3986),     # Abuja
    "NU": (-19.0544, -169.8672),# Alofi
    "MK": (41.9973, 21.4280),   # Skopje
    "NO": (59.9139, 10.7522),   # Oslo
    "OM": (23.5880, 58.3829),   # Muscat
    "PK": (33.6844, 73.0479),   # Islamabad
    "PW": (7.5000, 134.6243),   # Ngerulmud
    "PA": (8.9824, -79.5199),   # Panama City
    "PG": (-6.3149, 143.9556),  # Port Moresby (approximate)
    "PY": (-25.2637, -57.5759), # Asunción
    "PE": (-12.0464, -77.0428), # Lima
    "PH": (14.5995, 120.9842),  # Manila
    "PL": (52.2297, 21.0122),   # Warsaw
    "PT": (38.7223, -9.1393),   # Lisbon
    "QA": (25.2854, 51.5310),   # Doha
    "RO": (44.4268, 26.1025),   # Bucharest
    "RU": (55.7558, 37.6173),   # Moscow
    "RW": (-1.9403, 29.8739),   # Kigali
    "KN": (17.3026, -62.7177),  # Basseterre
    "LC": (14.0101, -60.9870),  # Castries
    "VC": (13.1587, -61.2248),  # Kingstown
    "WS": (-13.8333, -171.7500),# Apia
    "SM": (43.9333, 12.4500),   # San Marino
    "ST": (0.1864, 6.6131),     # São Tomé
    "SA": (24.7136, 46.6753),   # Riyadh
    "SN": (14.7167, -17.4677),  # Dakar
    "RS": (44.7866, 20.4489),   # Belgrade
    "SC": (-4.6796, 55.4920),   # Victoria
    "SL": (8.4657, -13.2317),   # Freetown
    "SG": (1.3521, 103.8198),   # Singapore
    "SK": (48.1486, 17.1077),   # Bratislava
    "SI": (46.0569, 14.5058),   # Ljubljana
    "SB": (-9.4456, 160.0000),  # Honiara
    "SO": (2.0469, 45.3182),    # Mogadishu
    "ZA": (-25.7479, 28.2293),  # Pretoria
    "SS": (4.8517, 31.5825),    # Juba
    "ES": (40.4168, -3.7038),   # Madrid
    "LK": (6.9271, 79.8612),    # Colombo
    "SD": (15.5007, 32.5599),   # Khartoum
    "SR": (5.8520, -55.2038),   # Paramaribo
    "SE": (59.3293, 18.0686),   # Stockholm
    "CH": (46.9480, 7.4474),    # Bern
    "SY": (33.5138, 36.2765),   # Damascus
    "TW": (25.0330, 121.5654),  # Taipei
    "TJ": (38.5598, 68.7740),   # Dushanbe
    "TZ": (-6.7924, 39.2083),   # Dar es Salaam
    "TH": (13.7563, 100.5018),  # Bangkok
    "TL": (-8.5569, 125.5603),  # Dili
    "TG": (6.1256, 1.2254),     # Lomé
    "TO": (-21.2088, -175.1982),# Nuku'alofa
    "TT": (10.6918, -61.2225),  # Port of Spain
    "TN": (36.8065, 10.1815),   # Tunis
    "TR": (39.9334, 32.8597),   # Ankara
    "TM": (37.9601, 58.3261),   # Ashgabat
    "TV": (-8.5211, 179.1962),  # Funafuti
    "UG": (0.3476, 32.5825),    # Kampala
    "UA": (50.4501, 30.5234),   # Kyiv
    "AE": (24.4539, 54.3773),   # Abu Dhabi
    "GB": (51.5074, -0.1278),   # London
    "US": (38.9072, -77.0369),  # Washington, D.C.
    "UY": (-34.9011, -56.1645), # Montevideo
    "UZ": (41.2995, 69.2401),   # Tashkent
    "VU": (-17.7333, 168.3273), # Port Vila
    "VE": (10.4806, -66.9036),  # Caracas
    "VN": (21.0278, 105.8342),  # Hanoi
    "EH": (27.1536, -13.2034),  # Laayoune
    "YE": (15.3694, 44.1910),   # Sana'a
    "ZM": (-15.3875, 28.3228),  # Lusaka
    "ZW": (-17.8252, 31.0335),  # Harare
    "PS": (31.9522, 35.2332),   # Ramallah
    "XK": (42.6629, 21.1655),   # Pristina (Kosovo)
}


# Services to synthesize — each creates one bundled_facilities entry
# per country that has a distinct phone number for that service.
SERVICES = [
    {"seed_key": "ambulance", "category": "ambulance", "label": "National Ambulance"},
    {"seed_key": "police",    "category": "police",    "label": "National Police"},
    {"seed_key": "fire",      "category": "ambulance", "label": "National Fire/Rescue"},
]


def synthesize() -> list[dict]:
    """Read emergency_seed.json, return new contacts to merge."""
    with open(SEED_PATH, "r", encoding="utf-8") as f:
        seed = json.load(f)

    new_contacts = []
    seen: set[tuple[str, str]] = set()  # (country_code, phone) dedup

    for entry in seed:
        cc = entry.get("country_code", "")
        country = entry.get("country", "")
        calling_code = entry.get("calling_code", "")

        if cc not in CAPITALS:
            print(f"⚠ Skipping {cc} ({country}) — no capital centroid", file=sys.stderr)
            continue

        lat, lon = CAPITALS[cc]

        for svc in SERVICES:
            phone_raw = entry.get(svc["seed_key"], "")
            if not phone_raw:
                continue

            # Normalise: short national numbers stay as-is for tel: links.
            # If the number is ≤5 digits it's a national short code.
            phone = phone_raw.strip()

            # Dedup: same country + same phone → skip (e.g. 911 for all 3)
            dedup_key = (cc, phone)
            if dedup_key in seen:
                continue
            seen.add(dedup_key)

            contact = {
                "id": f"bf-nat-{svc['seed_key'][:3]}-{cc.lower()}",
                "name": f"{svc['label']} — {country}",
                "category": svc["category"],
                "lat": lat,
                "lon": lon,
                "phone": phone,
                "country_code": cc,
                "notes": f"National {svc['seed_key']} number for {country}",
            }
            new_contacts.append(contact)

    return new_contacts


def main():
    # Load existing bundle
    with open(BUNDLE_PATH, "r", encoding="utf-8") as f:
        existing = json.load(f)

    existing_ids = {e["id"] for e in existing}
    print(f"Existing bundle: {len(existing)} entries")

    # Generate new contacts
    new = synthesize()
    print(f"Synthesized: {len(new)} national contacts")

    # Merge — skip any that already exist (idempotent re-runs)
    added = 0
    for contact in new:
        if contact["id"] not in existing_ids:
            existing.append(contact)
            existing_ids.add(contact["id"])
            added += 1

    print(f"Added: {added} new entries (skipped {len(new) - added} duplicates)")
    print(f"Total bundle: {len(existing)} entries")

    # Write back
    with open(BUNDLE_PATH, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"✓ Written to {BUNDLE_PATH}")


if __name__ == "__main__":
    main()

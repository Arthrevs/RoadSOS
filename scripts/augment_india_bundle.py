# scripts/augment_india_bundle.py  — run from repo root: python scripts/augment_india_bundle.py
import json, time, requests

BUNDLE = "frontend/src/data/bundled_facilities.json"
PER_CATEGORY_CAP = 60   # keep payload small; quality > quantity

# India bbox (south, west, north, east)
BBOX = (8.0, 68.0, 35.5, 97.5)

QUERIES = {
    "hospital": '["amenity"="hospital"]["phone"]',
    "police":   '["amenity"="police"]["phone"]',
}

def overpass(filt):
    q = f'[out:json][timeout:60];node{filt}({BBOX[0]},{BBOX[1]},{BBOX[2]},{BBOX[3]});out;'
    r = requests.post("https://overpass-api.de/api/interpreter", data={"data": q}, headers={"User-Agent": "RoadSOS/1.0"}, timeout=90)
    r.raise_for_status()
    return r.json().get("elements", [])

def main():
    bundle = json.load(open(BUNDLE, encoding="utf-8"))
    have_phone = {"".join(c for c in (f.get("phone") or "") if c.isdigit()) for f in bundle}
    have_phone.discard("")
    added = 0
    for category, filt in QUERIES.items():
        kept = 0
        for el in overpass(filt):
            if kept >= PER_CATEGORY_CAP:
                break
            t = el.get("tags", {})
            phone = (t.get("phone") or "").strip()
            digits = "".join(c for c in phone if c.isdigit())
            name = t.get("name")
            if not name or not digits or digits in have_phone:
                continue
            bundle.append({
                "id": f"osm_{el['id']}",
                "name": name,
                "category": category,
                "lat": el["lat"],
                "lon": el["lon"],
                "phone": phone,
                "country_code": "IN",
                "notes": "OpenStreetMap (crowdsourced — not hand-verified)",
            })
            have_phone.add(digits)
            kept += 1
            added += 1
        time.sleep(2)  # respect Overpass; don't hammer it
    json.dump(bundle, open(BUNDLE, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"Added {added} phone-bearing IN facilities. New total: {len(bundle)}")

if __name__ == "__main__":
    main()

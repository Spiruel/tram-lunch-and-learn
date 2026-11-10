#!/usr/bin/env python3
"""Build compact, high-frame-rate presentation data bundles from Transit Time Machine
and Leeds Effective City Size primary outputs."""

import collections
import json
import math
import os
import urllib.request

SCRATCH = "/Users/sambancroft/.gemini/antigravity-cli/brain/4f72f7f8-52ca-4a91-8bff-77f70bfcd7ac/scratch/spiruel"
PROJECT = "/Users/sambancroft/Documents/tram-lunch-and-learn"
OUT_DATA = os.path.join(PROJECT, "public", "data")
OUT_SCANS = os.path.join(PROJECT, "public", "scans")
os.makedirs(OUT_DATA, exist_ok=True)
os.makedirs(OUT_SCANS, exist_ok=True)


def round_coords(coords, ndigits=5, stride=1):
    if not coords:
        return []
    if isinstance(coords[0], (int, float)):
        return [round(coords[0], ndigits), round(coords[1], ndigits)]
    if isinstance(coords[0], list) and coords[0] and isinstance(coords[0][0], (int, float)):
        pts = coords[::stride] if stride > 1 and len(coords) > 8 else coords
        if pts[-1] != coords[-1]:
            pts = list(pts) + [coords[-1]]
        return [[round(p[0], ndigits), round(p[1], ndigits)] for p in pts]
    return [round_coords(c, ndigits, stride) for c in coords]


def simplify_geojson_geom(geom, ndigits=4, min_dist_deg=0.00035):
    if not geom:
        return None
    gtype = geom.get("type")
    coords = geom.get("coordinates", [])

    def thin_ring(ring):
        if len(ring) <= 6:
            return [[round(p[0], ndigits), round(p[1], ndigits)] for p in ring]
        out = [ring[0]]
        for p in ring[1:-1]:
            dx = p[0] - out[-1][0]
            dy = p[1] - out[-1][1]
            if dx * dx + dy * dy >= min_dist_deg * min_dist_deg:
                out.append(p)
        out.append(ring[-1])
        return [[round(p[0], ndigits), round(p[1], ndigits)] for p in out]

    if gtype == "Polygon":
        return {"type": "Polygon", "coordinates": [thin_ring(r) for r in coords]}
    if gtype == "MultiPolygon":
        return {"type": "MultiPolygon", "coordinates": [[thin_ring(r) for r in poly] for poly in coords]}
    if gtype == "LineString":
        return {"type": "LineString", "coordinates": thin_ring(coords)}
    if gtype == "MultiLineString":
        return {"type": "MultiLineString", "coordinates": [thin_ring(r) for r in coords]}
    return geom


def simplify_fc(fc, ndigits=4, min_dist_deg=0.00035):
    if not fc:
        return []
    if isinstance(fc, dict) and "geom" in fc:
        g = simplify_geojson_geom(fc["geom"], ndigits, min_dist_deg)
        return [g] if g else []
    if isinstance(fc, dict) and fc.get("type") == "FeatureCollection":
        polys = []
        for f in fc.get("features", []):
            g = simplify_geojson_geom(f.get("geometry"), ndigits, min_dist_deg)
            if g:
                polys.append(g)
        return polys
    if isinstance(fc, dict) and "type" in fc and "coordinates" in fc:
        g = simplify_geojson_geom(fc, ndigits, min_dist_deg)
        return [g] if g else []
    return []


def convex_hull(points):
    """Monotone chain 2D convex hull of [[lon, lat], ...]."""
    pts = sorted(set((round(p[0], 5), round(p[1], 5)) for p in points))
    if len(pts) <= 2:
        return [list(p) for p in pts]

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    lower = []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    upper = []
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return [list(p) for p in (lower[:-1] + upper[:-1])]


def point_in_ring(lon, lat, ring):
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if ((yi > lat) != (yj > lat)) and (lon < (xj - xi) * (lat - yi) / (yj - yi + 1e-12) + xi):
            inside = not inside
        j = i
    return inside


def build_uk_outline():
    print("Fetching Natural Earth 50m countries for UK & Ireland outline...")
    url = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    data = json.loads(urllib.request.urlopen(req, timeout=25).read().decode("utf-8"))
    uk_rings = []
    ie_rings = []
    for feat in data["features"]:
        props = feat.get("properties", {})
        adm = props.get("ADMIN", "") or props.get("NAME", "")
        if adm not in ("United Kingdom", "Ireland"):
            continue
        geom = feat["geometry"]
        polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
        for poly in polys:
            outer = poly[0]
            lons = [p[0] for p in outer]
            lats = [p[1] for p in outer]
            if max(lats) < 49.5 or min(lats) > 59.5 or max(lons) < -11.0 or min(lons) > 3.0:
                continue
            if len(outer) < 8:
                continue
            rounded = [[round(p[0], 4), round(p[1], 4)] for p in outer]
            if adm == "United Kingdom":
                uk_rings.append(rounded)
            else:
                ie_rings.append(rounded)

    # Generate OlmoEarth GDOT-style land dot matrix across Great Britain & Ireland
    dots = []
    lat = 50.0
    row = 0
    while lat <= 58.8:
        lon_step = 0.14 / max(0.45, math.cos(math.radians(lat)))
        lon = -10.5 + (0.5 * lon_step if row % 2 else 0.0)
        while lon <= 1.9:
            in_uk = any(point_in_ring(lon, lat, r) for r in uk_rings)
            in_ie = False if in_uk else any(point_in_ring(lon, lat, r) for r in ie_rings)
            if in_uk or in_ie:
                dots.append([round(lon, 3), round(lat, 3), 1 if in_uk else 0])
            lon += lon_step
        lat += 0.11
        row += 1
    print(f"UK rings: {len(uk_rings)}, IE rings: {len(ie_rings)}, GDOT land dots: {len(dots)}")
    return {"ukRings": uk_rings, "ieRings": ie_rings, "dots": dots}


SUBURB_ANCHORS = {
    "leeds": [
        ("Middleton", -1.547, 53.751),
        ("Belle Isle & Hunslet", -1.522, 53.767),
        ("Harehills & Gipton", -1.497, 53.811),
        ("Chapeltown", -1.531, 53.823),
        ("Bramley & Armley", -1.622, 53.806),
    ],
    "liverpool": [
        ("Norris Green & Clubmoor", -2.918, 53.442),
        ("Wavertree & Edge Hill", -2.928, 53.399),
        ("Garston & Speke", -2.866, 53.348),
        ("Walton & Anfield", -2.957, 53.439),
    ],
    "manchester": [
        ("Harpurhey & Moston", -2.198, 53.516),
        ("Gorton & Openshaw", -2.172, 53.467),
        ("Moss Side & Hulme", -2.247, 53.456),
        ("Levenshulme & Longsight", -2.193, 53.446),
    ],
    "sheffield": [
        ("Burngreave & Firth Park", -1.442, 53.414),
        ("Darnall & Tinsley", -1.404, 53.389),
        ("Woodseats & Heeley", -1.477, 53.349),
        ("Walkley & Crookes", -1.506, 53.391),
    ],
}


def compute_underserved_clusters(slug, lsoas):
    underserved = [x for x in lsoas if x.get("underserved")]
    if not underserved:
        return []
    # Birmingham already has explicit neighbourhood names in underserved.neighbourhood!
    if slug == "birmingham":
        groups = collections.defaultdict(list)
        for x in underserved:
            u = x["underserved"]
            hood = u.get("neighbourhood") if isinstance(u, dict) else None
            if hood:
                groups[hood].append(x)
        ranked = sorted(groups.items(), key=lambda kv: sum(i.get("p", 0) for i in kv[1]), reverse=True)[:5]
        out = []
        for name, items in ranked:
            pts = [[i["lon"], i["lat"]] for i in items]
            cx = sum(p[0] for p in pts) / len(pts)
            cy = sum(p[1] for p in pts) / len(pts)
            wb = sum((i["underserved"].get("worseBy", 0) if isinstance(i["underserved"], dict) else (i["m"] - i["h"])) for i in items) / len(items)
            nc = sum(i.get("noCarPct") or 0 for i in items) / len(items)
            out.append({
                "name": name,
                "pop": int(sum(i.get("p", 0) for i in items)),
                "count": len(items),
                "worseBy": round(wb, 1),
                "noCarPct": round(nc, 1),
                "center": [round(cx, 5), round(cy, 5)],
                "hull": convex_hull(pts),
            })
        return out

    anchors = SUBURB_ANCHORS.get(slug, [])
    out = []
    for name, alon, alat in anchors:
        nearby = []
        for x in underserved:
            dx = (x["lon"] - alon) * 62.0
            dy = (x["lat"] - alat) * 111.0
            if dx * dx + dy * dy <= 2.6 * 2.6:  # within 2.6 km of suburb centre
                nearby.append(x)
        if len(nearby) < 3:
            continue
        pts = [[i["lon"], i["lat"]] for i in nearby]
        cx = sum(p[0] for p in pts) / len(pts)
        cy = sum(p[1] for p in pts) / len(pts)
        wb = sum(max(0.0, (i.get("m") or 0) - (i.get("h") or 0)) for i in nearby) / len(nearby)
        nc = sum(i.get("noCarPct") or 0 for i in nearby) / len(nearby)
        out.append({
            "name": name,
            "pop": int(sum(i.get("p", 0) for i in nearby)),
            "count": len(nearby),
            "worseBy": round(wb, 1),
            "noCarPct": round(nc, 1),
            "center": [round(cx, 5), round(cy, 5)],
            "hull": convex_hull(pts),
        })
    return out


def extract_routes(slug):
    pfile = os.path.join(SCRATCH, f"paths_{slug}_historical_combined.json")
    if not os.path.exists(pfile):
        return []
    pdata = json.load(open(pfile))
    meta = pdata.get("metadata", {})
    shapes = pdata.get("shapes", {})
    tree = pdata.get("tree", {})

    # Map stem -> longest shape
    stem_shapes = collections.defaultdict(set)
    for node in tree.values():
        st = node.get("stem")
        sh = node.get("shape")
        if st and sh and sh in shapes:
            stem_shapes[st].add(sh)

    # Also match shape names directly if not in tree
    for sh_id in shapes:
        for st in meta:
            if st in sh_id:
                stem_shapes[st].add(sh_id)

    routes = []
    for stem, m in meta.items():
        cand = list(stem_shapes.get(stem, []))
        best_coords = []
        if cand:
            best_sh = max(cand, key=lambda sid: len(shapes.get(sid, [])))
            best_coords = shapes[best_sh]
        if not best_coords:
            continue
        mode = m.get("mode")
        if not mode:
            ls = stem.lower()
            if "_tb" in ls:
                mode = "trolleybus"
            elif "_t" in ls or slug in ("sheffield",):
                mode = "tram"
            else:
                mode = "bus"
        stride = 2 if len(best_coords) > 80 else 1
        routes.append({
            "stem": stem,
            "name": m.get("route_name") or stem,
            "mode": mode,
            "imageUrl": m.get("image_url"),
            "linkLabel": m.get("link_label") or "Printed archival timetable",
            "sourceText": m.get("source_text") or "",
            "coords": round_coords(best_coords, 5, stride=stride),
        })
    return routes


def download_hero_scans():
    scans = [
        "scans/lds_p12-13.jpg",
        "scans/lds_p10-11.jpg",
        "scans/lds_p14.jpg",
        "scans/liv_10.jpg",
        "scans/liv_1.jpg",
        "scans/stk_t1.jpg",
        "scans/shf_weekday_p8.jpg",
        "scans/bhm_p13A.jpg",
        "scans/bhm_p27A.jpg",
    ]
    for s in scans:
        fname = os.path.basename(s)
        dest = os.path.join(OUT_SCANS, fname)
        if os.path.exists(dest) and os.path.getsize(dest) > 1000:
            continue
        url = f"https://spiruel.github.io/transit-time-machine/data/{s}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            img = urllib.request.urlopen(req, timeout=20).read()
            with open(dest, "wb") as f:
                f.write(img)
            print(f"Downloaded {fname} ({len(img)//1024} KB)")
        except Exception as e:
            print(f"Warning downloading {s}: {e}")


def main():
    uk = build_uk_outline()
    download_hero_scans()

    leeds_stats = json.load(open(os.path.join(SCRATCH, "leeds_analysis_stats.json")))
    leeds_ext = json.load(open(os.path.join(SCRATCH, "leeds_analysis_extended_stats.json")))

    overview_cities = []
    for slug in ["leeds", "liverpool", "manchester", "sheffield", "birmingham"]:
        raw = json.load(open(os.path.join(SCRATCH, f"city_{slug}.json")))

        # Extract 1943 times for Manchester if available
        era_1943 = None
        h1943_map = {}
        default_rob = None
        for e in raw.get("historicalEras", []):
            if e.get("key") == "default":
                default_rob = e.get("robustness")
            elif e.get("key") == "1943":
                era_1943 = {
                    "label": e.get("label"),
                    "year": 1943,
                    "populationCurve": e.get("populationCurve"),
                    "robustness": e.get("robustness"),
                    "isochrones": {
                        k: simplify_fc(v, 4, 0.0004)
                        for k, v in (e.get("isochrones") or {}).items()
                    },
                }
                h1943_map = e.get("histTimes") or {}

        # Compact LSOA array: [lon, lat, pop, h, m, underservedFlag(0/1), noCarPct, h1943_or_null]
        compact_lsoas = []
        underserved_count = 0
        underserved_pop = 0
        faster_hist_count = 0
        for item in raw.get("lsoa", []):
            u = 1 if item.get("underserved") else 0
            if u:
                underserved_count += 1
                underserved_pop += int(item.get("p") or 0)
            h = item.get("h")
            m = item.get("m")
            if h is not None and m is not None and h < m:
                faster_hist_count += 1
            h43 = h1943_map.get(item.get("c")) if h1943_map else None
            compact_lsoas.append([
                round(item["lon"], 5),
                round(item["lat"], 5),
                int(item.get("p") or 0),
                round(h, 1) if h is not None and h < 400 else None,
                round(m, 1) if m is not None and m < 400 else None,
                u,
                round(item.get("noCarPct") or 0, 1),
                round(h43, 1) if h43 is not None and h43 < 400 else None,
            ])

        tram_lines = []
        raw_tl = raw.get("tramLines") or {}
        for feat in raw_tl.get("features", []):
            if "coords" in feat and feat["coords"]:
                tram_lines.append(round_coords(feat["coords"], 5, stride=2))
            else:
                g = feat.get("geometry") or {}
                if g.get("type") == "LineString":
                    tram_lines.append(round_coords(g["coordinates"], 5, stride=2))
                elif g.get("type") == "MultiLineString":
                    for line in g["coordinates"]:
                        tram_lines.append(round_coords(line, 5, stride=2))

        modern_lines = []
        raw_ml = raw.get("modernLines") or {}
        for ml in raw_ml.get("lines", []):
            modern_lines.append({
                "name": ml.get("name"),
                "color": ml.get("color") or "#22d3ee",
                "coords": round_coords(ml.get("coords") or [], 5, stride=3),
            })

        isos = {"historical": {}, "modern": {}}
        for era_k in ("historical", "modern"):
            src_iso = (raw.get("isochrones") or {}).get(era_k) or {}
            for mins_k, fc in src_iso.items():
                isos[era_k][mins_k] = simplify_fc(fc, 4, 0.0004)

        coastline = simplify_fc(raw.get("coastline"), 4, 0.0004) if raw.get("coastline") else []
        clusters = compute_underserved_clusters(slug, raw.get("lsoa", []))
        routes = extract_routes(slug)

        city_out = {
            "slug": slug,
            "displayName": raw.get("displayName"),
            "code": raw.get("code"),
            "historicalYear": raw.get("historicalYear"),
            "historicalLabel": raw.get("historicalLabel"),
            "modernLabel": raw.get("modernLabel"),
            "fastModeLabel": raw.get("fastModeLabel"),
            "centre": raw.get("centre"),
            "totalPopulation": raw.get("totalPopulation"),
            "amPeakFactor": raw.get("amPeakFactor"),
            "methodology": raw.get("methodology"),
            "methodologyNote": raw.get("methodologyNote"),
            "populationCurve": raw.get("populationCurve"),
            "robustness": default_rob,
            "era1943": era_1943,
            "underservedCount": underserved_count,
            "underservedPop": underserved_pop,
            "fasterHistCount": faster_hist_count,
            "totalLsoas": len(compact_lsoas),
            "underservedClusters": clusters,
            "isochrones": isos,
            "tramLines": tram_lines,
            "modernLines": modern_lines,
            "coastline": coastline,
            "lsoas": compact_lsoas,
            "routes": routes,
        }
        if slug == "leeds":
            city_out["leedsExtended"] = {
                "stats": leeds_stats,
                "extended": leeds_ext,
            }

        out_path = os.path.join(OUT_DATA, f"{slug}.json")
        with open(out_path, "w") as f:
            json.dump(city_out, f, separators=(",", ":"))
        sz_kb = os.path.getsize(out_path) / 1024
        print(f"Wrote {slug}.json: {sz_kb:.1f} KB (tramLines={len(tram_lines)}, routes={len(routes)}, clusters={len(clusters)})")

        # Overview skeleton (super lightweight for immediate cover rendering)
        overview_cities.append({
            "slug": slug,
            "displayName": raw.get("displayName"),
            "code": raw.get("code"),
            "historicalYear": raw.get("historicalYear"),
            "historicalLabel": raw.get("historicalLabel"),
            "modernLabel": raw.get("modernLabel"),
            "centre": raw.get("centre"),
            "populationCurve": raw.get("populationCurve"),
            "robustness": {k: v for k, v in (default_rob or {}).items() if k != "curve"} if default_rob else None,
            "underservedCount": underserved_count,
            "underservedPop": underserved_pop,
            "fasterHistCount": faster_hist_count,
            "totalLsoas": len(compact_lsoas),
            "skeleton": [round_coords(line, 4, stride=4) for line in tram_lines[:90]],
        })

    overview = {
        "uk": uk,
        "cities": overview_cities,
        "leedsSummary": {
            "stats": leeds_stats,
            "extended": leeds_ext,
        },
    }
    ov_path = os.path.join(OUT_DATA, "overview.json")
    with open(ov_path, "w") as f:
        json.dump(overview, f, separators=(",", ":"))
    print(f"Wrote overview.json: {os.path.getsize(ov_path)/1024:.1f} KB")


if __name__ == "__main__":
    main()

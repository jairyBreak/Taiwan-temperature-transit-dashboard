import json

with open('data/taiwan.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# We want an inverted polygon.
# Outer ring (world)
world = [
    [90, -180], [90, 180], [-90, 180], [-90, -180], [90, -180]
]

holes = []

for feature in data.get('features', []):
    geom = feature.get('geometry')
    if not geom: continue
    gtype = geom.get('type')
    coords = geom.get('coordinates', [])
    
    # Decimate points: keep 1 out of 5 points for smaller file, 
    # but keep first and last to ensure closure.
    def process_ring(ring):
        new_ring = ring[::5]
        if new_ring[-1] != ring[-1]:
            new_ring.append(ring[-1])
        # leaflet needs [lat, lng] for L.polygon, but geojson is [lng, lat].
        # We will output as [lat, lng]
        return [[p[1], p[0]] for p in new_ring]
    
    if gtype == 'Polygon':
        for ring in coords:
            holes.append(process_ring(ring))
    elif gtype == 'MultiPolygon':
        for poly in coords:
            for ring in poly:
                holes.append(process_ring(ring))

# Form the final leaflet polygon data
leaflet_poly = [world] + holes

# Write to a JS file
out_js = f"export const TAIWAN_MASK = {json.dumps(leaflet_poly)};\n"
with open('data/taiwan_mask.js', 'w', encoding='utf-8') as f:
    f.write(out_js)

print("Mask generated successfully.")

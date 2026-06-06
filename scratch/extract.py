import json

with open('車站基本資料集.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Keep only a subset to avoid bloating (e.g. 1 out of every 4 stations)
subset = data[::4]

out = []
for st in subset:
    gps = st.get('gps', '')
    if not gps: continue
    parts = gps.split(' ')
    if len(parts) != 2: continue
    lat, lng = map(float, parts)
    name = st['stationName']
    
    # Simple temperature model: 
    # South is hotter (lat 22 is hotter than lat 25)
    lat_diff = 25.0 - lat
    base_temp = [16.0 + lat_diff*1.5, 17.0 + lat_diff*1.5, 19.0 + lat_diff*1.5, 
                 22.0 + lat_diff, 25.0 + lat_diff, 28.0 + lat_diff*0.5, 
                 29.0 + lat_diff*0.5, 29.0 + lat_diff*0.5, 27.5 + lat_diff, 
                 25.0 + lat_diff, 22.0 + lat_diff*1.5, 18.0 + lat_diff*1.5]
    
    temps_str = "[" + ", ".join(f"{t:.1f}" for t in base_temp) + "]"
    out.append(f'  {{ id: "tra-ext-{st["stationCode"]}", name: "{name}", lat: {lat:.3f}, lng: {lng:.3f}, temps: {temps_str} }}')

print(",\n".join(out))

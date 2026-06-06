import json

with open('車站基本資料集.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# All TRA stations
out = []
for st in data:
    gps = st.get('gps', '')
    if not gps: continue
    parts = gps.split(' ')
    if len(parts) != 2: continue
    lat, lng = map(float, parts)
    name = st['stationName']
    
    lat_diff = 25.0 - lat
    base_temp = [16.0 + lat_diff*1.5, 17.0 + lat_diff*1.5, 19.0 + lat_diff*1.5, 
                 22.0 + lat_diff, 25.0 + lat_diff, 28.0 + lat_diff*0.5, 
                 29.0 + lat_diff*0.5, 29.0 + lat_diff*0.5, 27.5 + lat_diff, 
                 25.0 + lat_diff, 22.0 + lat_diff*1.5, 18.0 + lat_diff*1.5]
    
    temps_str = "[" + ", ".join(f"{t:.1f}" for t in base_temp) + "]"
    out.append(f'  {{ id: "tra-ext-{st["stationCode"]}", name: "{name}", lat: {lat:.3f}, lng: {lng:.3f}, temps: {temps_str} }}')

print("const EXTRA_STATIONS = [")
print(",\n".join(out) + ",")

# Now add mountains
mountains = [
    ("太平山", 24.49, 121.53, 13.0), ("梨山", 24.25, 121.25, 15.0),
    ("合歡山", 24.14, 121.27, 5.0), ("奇萊山", 24.11, 121.32, 4.0),
    ("雪山", 24.38, 121.23, 3.0), ("大霸尖山", 24.46, 121.26, 4.0),
    ("南湖大山", 24.36, 121.44, 4.0), ("清境", 24.05, 121.16, 16.0),
    ("杉林溪", 23.63, 120.79, 15.0), ("溪頭", 23.67, 120.79, 16.0),
    ("秀姑巒山", 23.50, 121.06, 4.0), ("向陽山", 23.29, 121.03, 5.0),
    ("關山", 23.25, 120.87, 5.0), ("北大武山", 22.62, 120.75, 8.0),
    ("霧台", 22.74, 120.73, 20.0), ("茂林", 22.88, 120.66, 22.0),
    ("拉拉山", 24.71, 121.43, 14.0), ("司馬庫斯", 24.58, 121.33, 15.0),
    ("觀霧", 24.50, 121.11, 14.0), ("七星山", 25.17, 121.55, 16.0),
    ("大雪山", 24.28, 120.93, 10.0), ("八仙山", 24.23, 121.00, 12.0),
    ("藤枝", 22.72, 120.70, 20.0), ("南橫", 23.27, 120.94, 12.0),
    ("玉里山", 23.35, 121.25, 18.0), ("太魯閣大山", 24.12, 121.47, 8.0),
    ("能高山", 23.98, 121.26, 6.0), ("丹大山", 23.85, 121.23, 7.0),
    ("馬博拉斯山", 23.53, 121.03, 4.0), ("大水窟山", 23.48, 121.05, 5.0),
    ("新康山", 23.28, 121.03, 6.0), ("卑南主山", 22.95, 120.87, 7.0),
    ("知本主山", 22.75, 120.87, 10.0), ("大武山", 22.58, 120.76, 9.0)
]

out_m = []
for i, (name, lat, lng, avg_temp) in enumerate(mountains):
    temps = [
        avg_temp - 4.5, avg_temp - 3.5, avg_temp - 1.5,
        avg_temp + 1.0, avg_temp + 3.0, avg_temp + 4.5,
        avg_temp + 5.0, avg_temp + 4.8, avg_temp + 3.5,
        avg_temp + 1.0, avg_temp - 1.5, avg_temp - 3.5
    ]
    temps_str = "[" + ", ".join(f"{t:.1f}" for t in temps) + "]"
    out_m.append(f'  {{ id: "mt-ext-{i:03d}", name: "{name}", lat: {lat:.3f}, lng: {lng:.3f}, temps: {temps_str} }}')

print(",\n".join(out_m))
print("];")

print("""
EXTRA_STATIONS.forEach(st => {
  SPOTS_DATA.push({
    id: st.id,
    name: st.name,
    type: "semi-outdoor",
    typeName: "觀測節點",
    lat: st.lat,
    lng: st.lng,
    isHidden: true,
    monthly: st.temps.map((t, index) => ({
      month: index + 1,
      temp: t,
      flow: 100
    })),
    simulate: () => 100
  });
});
""")

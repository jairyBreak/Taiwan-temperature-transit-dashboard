import json

with open("data/mrt_2026_03.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Group by station
by_station = {}
for item in data:
    name = item["spot_name"]
    if name not in by_station:
        by_station[name] = []
    by_station[name].append((item["time"], item["temperature"], item["pedestrian_flow"]))

# Print unique values
for name, records in sorted(by_station.items()):
    temps = [r[1] for r in records]
    flows = [r[2] for r in records]
    unique_temps = set(temps)
    unique_flows = set(flows)
    print(f"{name}: unique_temps = {len(unique_temps)} (range: {min(temps)}~{max(temps)}), unique_flows = {len(unique_flows)} (range: {min(flows)}~{max(flows)})")

import json
import glob
import os

files = sorted(glob.glob("data/mrt_2026_*.json"))
for file_path in files:
    print(f"\n--- {file_path} ---")
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    station_temps = {}
    for item in data:
        name = item["spot_name"]
        temp = item["temperature"]
        if name not in station_temps:
            station_temps[name] = []
        station_temps[name].append(temp)
    
    for name, temps in sorted(station_temps.items()):
        avg_temp = sum(temps) / len(temps)
        print(f"{name}: avg_temp = {avg_temp:.2f}°C (total days: {len(temps)})")

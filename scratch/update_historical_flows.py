#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import random

# Seed with a fixed value for reproducible noise generation
random.seed(42)

NEW_STATIONS_FORMULAS = {
    "動物園捷運站": {
        "formula": lambda t: max(100, round(15000 - (t - 23) * 350 if t > 23 else 15000 - (23 - t) * 200)),
        "noise_range": (0.90, 1.10)
    },
    "中山捷運站": {
        "formula": lambda t: max(200, round(24000 + (t - 23) * 250 if t > 23 else 24000 + (23 - t) * 120)),
        "noise_range": (0.92, 1.08)
    },
    "公館捷運站": {
        "formula": lambda t: max(100, round(18000 - (t - 23) * 180 if t > 23 else 18000 - (23 - t) * 100)),
        "noise_range": (0.93, 1.07)
    },
    "板橋捷運站": {
        "formula": lambda t: max(200, round(28000 + (t - 23) * 150 if t > 23 else 28000 + (23 - t) * 80)),
        "noise_range": (0.94, 1.06)
    },
    "新店捷運站": {
        "formula": lambda t: max(50, round(10000 - (t - 23) * 250 if t > 23 else 10000 - (23 - t) * 150)),
        "noise_range": (0.90, 1.10)
    },
    "新北投捷運站": {
        "formula": lambda t: max(100, round(11000 + (25 - t) * 600 if t < 25 else 11000 - (t - 25) * 400)),
        "noise_range": (0.90, 1.10)
    }
}

def update_month_data(year, month):
    month_str = f"{month:02d}"
    file_path = f"data/mrt_{year}_{month_str}.json"
    if not os.path.exists(file_path):
        print(f"⚠️ File not found: {file_path}")
        return

    print(f"⚙️ Updating {file_path}...")
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    updated_count = 0
    for record in data:
        name = record.get("spot_name")
        if name in NEW_STATIONS_FORMULAS:
            t_val = record.get("temperature", 20.0)
            config = NEW_STATIONS_FORMULAS[name]
            
            # Compute new flow based on continuous formula
            base_flow = config["formula"](t_val)
            
            # Apply pseudo-random noise based on spot-name and date to keep it stable but realistic
            # We seed random for each record to make it deterministic if run multiple times
            seed_str = f"{name}_{record.get('time')}"
            rnd = random.Random(seed_str)
            noise_factor = rnd.uniform(config["noise_range"][0], config["noise_range"][1])
            
            new_flow = max(50, round(base_flow * noise_factor))
            
            # Update pedestrian flow
            record["pedestrian_flow"] = new_flow
            updated_count += 1

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"   ✅ Done. Updated {updated_count} records in {file_path}.")

if __name__ == "__main__":
    for m in [1, 2, 3, 4]:
        update_month_data(2026, m)

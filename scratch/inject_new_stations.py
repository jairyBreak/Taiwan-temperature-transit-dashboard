#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import urllib.request
import time
import calendar

NEW_STATIONS = {
    "動物園捷運站": {
        "lat": 25.026364,
        "lng": 121.577457,
        "simulate": lambda t, w: max(100, round(15000 - (t - 23) * 350 if t > 23 else 15000 - (23 - t) * 200)),
        "noise_range": (0.90, 1.10)
    },
    "中山捷運站": {
        "lat": 25.052685,
        "lng": 121.520387,
        "simulate": lambda t, w: max(200, round(24000 + (t - 23) * 250 if t > 23 else 24000 + (23 - t) * 120)),
        "noise_range": (0.92, 1.08)
    },
    "公館捷運站": {
        "lat": 25.013697,
        "lng": 121.534898,
        "simulate": lambda t, w: max(100, round(18000 - (t - 23) * 180 if t > 23 else 18000 - (23 - t) * 100)),
        "noise_range": (0.93, 1.07)
    },
    "板橋捷運站": {
        "lat": 25.013627,
        "lng": 121.462310,
        "simulate": lambda t, w: max(200, round(28000 + (t - 23) * 150 if t > 23 else 28000 + (23 - t) * 80)),
        "noise_range": (0.94, 1.06)
    },
    "新店捷運站": {
        "lat": 24.953716,
        "lng": 121.537233,
        "simulate": lambda t, w: max(50, round(10000 - (t - 23) * 250 if t > 23 else 10000 - (23 - t) * 150)),
        "noise_range": (0.90, 1.10)
    },
    "新北投捷運站": {
        "lat": 25.136894,
        "lng": 121.503073,
        "simulate": lambda t, w: max(100, round(11000 + (25 - t) * 600 if t < 25 else 11000 - (t - 25) * 400)),
        "noise_range": (0.90, 1.10)
    }
}

import random

def inject_month(year, month):
    month_str = f"{month:02d}"
    file_path = f"data/mrt_{year}_{month_str}.json"
    if not os.path.exists(file_path):
        print(f"⚠️ 找不到檔案: {file_path}")
        return

    print(f"🔍 處理 {file_path}...")
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 檢查是否已包含新站點
    existing_spots = set(x["spot_name"] for x in data)
    missing_stations = [name for name in NEW_STATIONS if name not in existing_spots]
    
    if not missing_stations:
        print("   ✅ 所有新站點均已存在，跳過。")
        return

    # 計算月份天數
    days_in_month = calendar.monthrange(year, month)[1]
    
    # 針對缺少的站點，撈取溫度並生成模擬資料
    new_records = []
    for name in missing_stations:
        coords = NEW_STATIONS[name]
        lat, lng = coords["lat"], coords["lng"]
        noise_range = coords["noise_range"]
        
        # 串接 Open-Meteo
        url = (
            f"https://archive-api.open-meteo.com/v1/archive?"
            f"latitude={lat}&longitude={lng}&"
            f"start_date={year}-{month_str}-01&end_date={year}-{month_str}-{days_in_month:02d}&"
            f"daily=temperature_2m_mean&timezone=Asia%2FTaipei"
        )
        print(f"   正在獲取 [{name}] 氣溫資料... ", end="", flush=True)
        
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as response:
                res_data = json.loads(response.read().decode())
                times = res_data["daily"]["time"]
                temps = res_data["daily"]["temperature_2m_mean"]
                
                for t, temp in zip(times, temps):
                    parts = t.split("-")
                    date_label = f"{parts[1]}/{parts[2]}"
                    t_val = float(temp) if temp is not None else 20.0
                    
                    # 計算模擬流量 (含隨機噪聲)
                    seed_str = f"{name}_{date_label}"
                    rnd = random.Random(seed_str)
                    noise_factor = rnd.uniform(noise_range[0], noise_range[1])
                    base_flow = coords["simulate"](t_val, "sunny")
                    flow = max(50, round(base_flow * noise_factor))
                    
                    new_records.append({
                        "spot_name": name,
                        "latitude": lat,
                        "longitude": lng,
                        "temperature": round(t_val, 1),
                        "pedestrian_flow": flow,
                        "time": date_label
                    })
                print("成功 ✅")
            time.sleep(0.3)
        except Exception as e:
            print(f"失敗 ❌ | 原因: {e}")
            # 填入預設值
            for d in range(1, days_in_month + 1):
                date_label = f"{month_str}/{d:02d}"
                t_val = 20.0
                seed_str = f"{name}_{date_label}"
                rnd = random.Random(seed_str)
                noise_factor = rnd.uniform(noise_range[0], noise_range[1])
                base_flow = coords["simulate"](t_val, "sunny")
                flow = max(50, round(base_flow * noise_factor))
                
                new_records.append({
                    "spot_name": name,
                    "latitude": lat,
                    "longitude": lng,
                    "temperature": t_val,
                    "pedestrian_flow": flow,
                    "time": date_label
                })

    if new_records:
        data.extend(new_records)
        # 重新排序 (按日期，再按站點名稱)
        data.sort(key=lambda x: (x["time"], x["spot_name"]))
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"   🎉 已將 {len(new_records)} 筆新站點記錄寫入 {file_path}。")

if __name__ == "__main__":
    # 處理 1、2、3、4 月的 JSON 檔案
    for m in [1, 2, 3, 4]:
        inject_month(2026, m)

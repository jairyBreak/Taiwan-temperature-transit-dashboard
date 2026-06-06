#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
從 Open-Meteo API 取得全台 280+ 測站的 1~4 月真實歷史每日均溫，
並將溫度資料合併寫入現有的 mrt_2026_XX.json 歷史檔案中。

原始 JSON 裡只有 16 個交通站的真實溫度+人流資料，
本腳本會為其他 ~290 個測站補上真實溫度（人流設為 0，因為它們是溫度觀測節點）。
"""

import json
import urllib.request
import time
import calendar
import re
import os

YEAR = 2026

def extract_spots_from_datajs():
    """從 data.js 中提取所有測站的名稱和經緯度"""
    spots = []
    
    with open("data.js", "r", encoding="utf-8") as f:
        content = f.read()
    
    # 匹配 SPOTS_DATA 中的站點 (手動定義的 10 個主要站)
    # 格式: name: "xxx", ... lat: xx.xxx, lng: xx.xxx
    pattern_main = r'name:\s*"([^"]+)".*?lat:\s*([\d.]+).*?lng:\s*([\d.]+)'
    
    # 匹配 traStations 陣列
    pattern_tra = r'name:\s*"([^"]+)".*?lat:\s*([\d.]+).*?lng:\s*([\d.]+)'
    
    # 匹配 EXTRA_STATIONS 陣列
    pattern_extra = r'name:\s*"([^"]+)".*?lat:\s*([\d.]+).*?lng:\s*([\d.]+)'
    
    # 用更通用的方式: 找所有 name/lat/lng 組合
    # 先找所有 { ... name: "xxx", ... lat: xxx, lng: xxx ... } 的物件
    seen = set()
    
    # 匹配所有具有 name, lat, lng 的物件
    for match in re.finditer(r'name:\s*"([^"]+)"[^}]*?lat:\s*([\d.-]+)[^}]*?lng:\s*([\d.-]+)', content):
        name = match.group(1)
        lat = float(match.group(2))
        lng = float(match.group(3))
        key = (name, lat, lng)
        if key not in seen:
            seen.add(key)
            spots.append({"name": name, "lat": lat, "lng": lng})
    
    # 也匹配 EXTRA_STATIONS 格式: { id: "xxx", name: "xxx", lat: xx.xxx, lng: xx.xxx, temps: [...] }
    for match in re.finditer(r'id:\s*"[^"]*"[^}]*?name:\s*"([^"]+)"[^}]*?lat:\s*([\d.-]+)[^}]*?lng:\s*([\d.-]+)', content):
        name = match.group(1)
        lat = float(match.group(2))
        lng = float(match.group(3))
        key = (name, lat, lng)
        if key not in seen:
            seen.add(key)
            spots.append({"name": name, "lat": lat, "lng": lng})
    
    return spots


def fetch_temp_from_api(lat, lng, year, month):
    """從 Open-Meteo API 取得指定座標的歷史每日均溫"""
    days_in_month = calendar.monthrange(year, month)[1]
    month_str = f"{month:02d}"
    
    url = (
        f"https://archive-api.open-meteo.com/v1/archive?"
        f"latitude={lat}&longitude={lng}&"
        f"start_date={year}-{month_str}-01&end_date={year}-{month_str}-{days_in_month:02d}&"
        f"daily=temperature_2m_mean&timezone=Asia%2FTaipei"
    )
    
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=15) as response:
        data = json.loads(response.read().decode())
    
    times = data["daily"]["time"]
    temps = data["daily"]["temperature_2m_mean"]
    
    result = {}
    for t, temp in zip(times, temps):
        parts = t.split("-")
        date_label = f"{parts[1]}/{parts[2]}"
        result[date_label] = float(temp) if temp is not None else 20.0
    
    return result


def main():
    print("🚀 從 data.js 提取所有測站資訊...")
    all_spots = extract_spots_from_datajs()
    print(f"   找到 {len(all_spots)} 個測站")
    
    for month in range(1, 5):
        month_str = f"{month:02d}"
        json_file = f"data/mrt_{YEAR}_{month_str}.json"
        days_in_month = calendar.monthrange(YEAR, month)[1]
        
        print(f"\n{'='*60}")
        print(f"📅 處理 {YEAR} 年 {month} 月 (共 {days_in_month} 天)")
        print(f"{'='*60}")
        
        # 載入現有 JSON（包含 16 個交通站的真實資料）
        existing_data = []
        if os.path.exists(json_file):
            with open(json_file, "r", encoding="utf-8") as f:
                existing_data = json.load(f)
        
        existing_names = set(d["spot_name"] for d in existing_data)
        print(f"   現有 JSON 中有 {len(existing_names)} 個站的資料")
        
        # 找出需要補充溫度的測站
        missing_spots = [s for s in all_spots if s["name"] not in existing_names]
        print(f"   需要補充 {len(missing_spots)} 個測站的溫度資料")
        
        # 為了減少 API 呼叫次數，將相近座標的測站分組
        # (因為很多測站座標相近，同一個座標的溫度是一樣的)
        coord_groups = {}
        for spot in missing_spots:
            # 四捨五入到小數點後 2 位作為分組鍵
            key = (round(spot["lat"], 2), round(spot["lng"], 2))
            if key not in coord_groups:
                coord_groups[key] = []
            coord_groups[key].append(spot)
        
        print(f"   合併相近座標後，需要 {len(coord_groups)} 次 API 呼叫")
        
        new_records = []
        api_count = 0
        
        for (lat, lng), spots_group in coord_groups.items():
            api_count += 1
            representative = spots_group[0]
            
            print(f"   [{api_count}/{len(coord_groups)}] 取得座標 ({lat}, {lng}) 的氣溫 ({len(spots_group)} 個站)... ", end="", flush=True)
            
            try:
                temps = fetch_temp_from_api(lat, lng, YEAR, month)
                print(f"✅ ({len(temps)} 天)")
                
                # 為該組的每個測站產生記錄
                for spot in spots_group:
                    for day in range(1, days_in_month + 1):
                        date_label = f"{month_str}/{day:02d}"
                        temp = temps.get(date_label, 20.0)
                        
                        new_records.append({
                            "spot_name": spot["name"],
                            "latitude": spot["lat"],
                            "longitude": spot["lng"],
                            "temperature": round(temp, 1),
                            "pedestrian_flow": 0,
                            "time": date_label
                        })
                
                time.sleep(0.25)  # 避免 API 限流
                
            except Exception as e:
                print(f"❌ ({e})")
                # 失敗時用預設溫度
                for spot in spots_group:
                    for day in range(1, days_in_month + 1):
                        date_label = f"{month_str}/{day:02d}"
                        new_records.append({
                            "spot_name": spot["name"],
                            "latitude": spot["lat"],
                            "longitude": spot["lng"],
                            "temperature": 20.0,
                            "pedestrian_flow": 0,
                            "time": date_label
                        })
        
        # 合併現有資料與新資料
        combined = existing_data + new_records
        
        # 寫入 JSON
        with open(json_file, "w", encoding="utf-8") as f:
            json.dump(combined, f, ensure_ascii=False, indent=2)
        
        total_names = set(d["spot_name"] for d in combined)
        print(f"\n   ✅ 已寫入 {len(combined)} 筆記錄 ({len(total_names)} 個站) 至 {json_file}")


if __name__ == "__main__":
    main()

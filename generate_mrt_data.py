#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import csv
import json
import urllib.request
import time
import calendar

# ==============================================================================
# 設定與參數
# ==============================================================================
YEAR = 2026
MONTH = 1
MONTH_STR = f"{MONTH:02d}"
DAYS_IN_MONTH = calendar.monthrange(YEAR, MONTH)[1]

MRT_CSV_FILE = f"臺北捷運每日分時各站OD流量統計資料_{YEAR}{MONTH_STR}.csv"
TRA_FLOW_FILE = f"每日各站進出站人數-{YEAR}.json"
TRA_STATIONS_FILE = "車站基本資料集.json"

OUTPUT_JSON_FILE = f"data/mrt_{YEAR}_{MONTH_STR}.json"
MONTHS_LIST_FILE = "data/months.json"

# 4 個台北捷運站點對應的經緯度與名稱映射
MRT_STATIONS = {
    "西門": {
        "spot_name": "西門捷運站",
        "lat": 25.042385,
        "lng": 121.508319
    },
    "台北101/世貿": {
        "spot_name": "台北101世貿站",
        "lat": 25.032958,
        "lng": 121.565456
    },
    "士林": {
        "spot_name": "士林捷運站",
        "lat": 25.093155,
        "lng": 121.526279
    },
    "淡水": {
        "spot_name": "淡水捷運站",
        "lat": 25.167812,
        "lng": 121.444747
    }
}

# 12 個台鐵車站名稱映射 (中文 -> 儀表板站名)
TRA_NAMES_MAPPING = {
    "基隆": "基隆車站",
    "桃園": "桃園車站",
    "新竹": "新竹車站",
    "臺中": "台中車站",
    "彰化": "彰化車站",
    "嘉義": "嘉義車站",
    "臺南": "台南車站",
    "高雄": "高雄車站",
    "屏東": "屏東車站",
    "宜蘭": "宜蘭車站",
    "花蓮": "花蓮車站",
    "臺東": "台東車站"
}

def main():
    print("🚀 開始處理 2026 年 3 月的氣溫與交通數據...")

    # --------------------------------------------------------------------------
    # 步驟 1: 解析台鐵車站基本資料集取得站點經緯度與代碼
    # --------------------------------------------------------------------------
    print("\n🔍 1. 載入台鐵車站基本資料集...")
    if not os.path.exists(TRA_STATIONS_FILE):
        print(f"❌ 找不到台鐵車站基本資料檔案: {TRA_STATIONS_FILE}")
        return

    tra_stations_info = {}
    with open(TRA_STATIONS_FILE, "r", encoding="utf-8-sig") as f:
        stations_list = json.load(f)
        for s in stations_list:
            name = s.get("stationName")
            if name in TRA_NAMES_MAPPING:
                gps = s.get("gps", "").split()
                if len(gps) == 2:
                    code = s.get("stationCode")
                    tra_stations_info[code] = {
                        "station_name": name,
                        "spot_name": TRA_NAMES_MAPPING[name],
                        "lat": float(gps[0]),
                        "lng": float(gps[1])
                    }
    
    print(f"   已成功讀取 {len(tra_stations_info)} 個台鐵目標車站的代碼與 GPS 資料。")

    # --------------------------------------------------------------------------
    # 步驟 2: 解析台鐵每日各站進出站人數 JSON
    # --------------------------------------------------------------------------
    print("\n🔍 2. 解析台鐵每日進出站人數...")
    if not os.path.exists(TRA_FLOW_FILE):
        print(f"❌ 找不到台鐵每日進出站人數檔案: {TRA_FLOW_FILE}")
        return

    # 結構: {(spot_name, mm_dd): flow}
    tra_daily_flows = {}
    with open(TRA_FLOW_FILE, "r", encoding="utf-8-sig") as f:
        flow_data = json.load(f)
        target_date_prefix = f"{YEAR}{MONTH_STR}" # "202603"
        
        for item in flow_data:
            date_str = item.get("trnOpDate", "")
            if date_str.startswith(target_date_prefix):
                code = item.get("staCode")
                if code in tra_stations_info:
                    # 日期格式轉換: "20260301" -> "03/01"
                    day_part = date_str[6:8]
                    date_label = f"{MONTH_STR}/{day_part}"
                    
                    # 使用 gateOutGoingCnt (出站人數) 作為流量指標 (與 April 對齊)
                    flow = int(item.get("gateOutGoingCnt", 0))
                    
                    spot_name = tra_stations_info[code]["spot_name"]
                    tra_daily_flows[(spot_name, date_label)] = flow

    print(f"   已提取台鐵在 2026/03 的進出站日運量數據，共 {len(tra_daily_flows)} 筆記錄。")

    # --------------------------------------------------------------------------
    # 步驟 3: 解析捷運每日分時各站 OD 流量 CSV (300MB+ 大檔案，採用串流讀取)
    # --------------------------------------------------------------------------
    print("\n🔍 3. 讀取並加總捷運大數據 CSV (這可能需要 5-15 秒，請稍候)...")
    if not os.path.exists(MRT_CSV_FILE):
        print(f"❌ 找不到捷運 OD 流量 CSV 檔案: {MRT_CSV_FILE}")
        return

    # 結構: {(spot_name, mm_dd): flow}
    mrt_daily_flows = {}
    
    with open(MRT_CSV_FILE, "r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        header = next(reader) # 略過標題列: 日期,時段,進站,出站,人次
        
        # 尋找欄位索引
        idx_date = header.index("日期")
        idx_entry = header.index("進站")
        idx_count = header.index("人次")
        
        for row in reader:
            if not row:
                continue
            entry_station = row[idx_entry]
            if entry_station in MRT_STATIONS:
                date_str = row[idx_date] # 格式為 "2026-03-01"
                # 轉成 "03/01"
                parts = date_str.split("-")
                if len(parts) == 3:
                    date_label = f"{parts[1]}/{parts[2]}"
                    flow_cnt = int(row[idx_count])
                    
                    spot_name = MRT_STATIONS[entry_station]["spot_name"]
                    key = (spot_name, date_label)
                    
                    mrt_daily_flows[key] = mrt_daily_flows.get(key, 0) + flow_cnt

    print(f"   已提取捷運目標站點的日總進站運量，共 {len(mrt_daily_flows)} 筆記錄。")

    # --------------------------------------------------------------------------
    # 步驟 4: 線上查詢 16 個站點對應的 Open-Meteo 歷史氣象均溫
    # --------------------------------------------------------------------------
    print("\n🔍 4. 串接 Open-Meteo API 獲取 16 個車站的 2026 年 3 月歷史每日均溫...")
    
    # 收集 16 個站點的經緯度與名稱
    all_spots = {}
    # 加入 MRT
    for k, v in MRT_STATIONS.items():
        all_spots[v["spot_name"]] = {"lat": v["lat"], "lng": v["lng"]}
    # 加入 TRA
    for code, info in tra_stations_info.items():
        all_spots[info["spot_name"]] = {"lat": info["lat"], "lng": info["lng"]}

    # 儲存溫度資料，結構為: {spot_name: {date_label: temp}}
    spots_temperature = {}

    for spot_name, coords in all_spots.items():
        lat, lng = coords["lat"], coords["lng"]
        url = (
            f"https://archive-api.open-meteo.com/v1/archive?"
            f"latitude={lat}&longitude={lng}&"
            f"start_date={YEAR}-{MONTH_STR}-01&end_date={YEAR}-{MONTH_STR}-{DAYS_IN_MONTH:02d}&"
            f"daily=temperature_2m_mean&timezone=Asia%2FTaipei"
        )
        print(f"   正在獲取 [{spot_name}] 氣溫資料... ", end="", flush=True)
        
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())
                
                times = data["daily"]["time"]
                temps = data["daily"]["temperature_2m_mean"]
                
                spot_temps = {}
                for t, temp in zip(times, temps):
                    # "2026-03-01" -> "03/01"
                    parts = t.split("-")
                    date_label = f"{parts[1]}/{parts[2]}"
                    # 若 API 缺值則給予合理預設 20.0 度
                    spot_temps[date_label] = float(temp) if temp is not None else 20.0
                
                spots_temperature[spot_name] = spot_temps
                print("成功 ✅")
            
            # 避免對 API 伺服器造成負擔，稍微延遲
            time.sleep(0.3)
        except Exception as e:
            print(f"失敗 ❌ (使用預設均溫 20.0°C) | 原因: {e}")
            # 建立預設值
            spot_temps = {}
            for d in range(1, DAYS_IN_MONTH + 1):
                date_label = f"{MONTH_STR}/{d:02d}"
                spot_temps[date_label] = 20.0
            spots_temperature[spot_name] = spot_temps

    # --------------------------------------------------------------------------
    # 步驟 5: 合併數據並寫入最終的目標 JSON 檔案
    # --------------------------------------------------------------------------
    print(f"\n🔍 5. 合併交通與氣候數據，生成 {OUTPUT_JSON_FILE}...")
    
    result_data = []
    
    # 產生該月份的所有日期標記
    days_in_month = [f"{MONTH_STR}/{d:02d}" for d in range(1, DAYS_IN_MONTH + 1)]
    
    for date_label in days_in_month:
        # 對於每一天，依序寫入 16 個站點的資料 (排序可以確保前後一致性)
        for spot_name in sorted(all_spots.keys()):
            coords = all_spots[spot_name]
            
            # 取得溫度
            temp = spots_temperature.get(spot_name, {}).get(date_label, 20.0)
            
            # 取得流量 (捷運或台鐵)
            is_mrt = spot_name in [v["spot_name"] for v in MRT_STATIONS.values()]
            if is_mrt:
                flow = mrt_daily_flows.get((spot_name, date_label), 0)
            else:
                flow = tra_daily_flows.get((spot_name, date_label), 0)
            
            result_data.append({
                "spot_name": spot_name,
                "latitude": coords["lat"],
                "longitude": coords["lng"],
                "temperature": round(temp, 1),
                "pedestrian_flow": flow,
                "time": date_label
            })
            
    # 寫入 JSON
    os.makedirs(os.path.dirname(OUTPUT_JSON_FILE), exist_ok=True)
    with open(OUTPUT_JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(result_data, f, ensure_ascii=False, indent=2)
        
    print(f"   🎉 成功寫入 {len(result_data)} 筆觀測紀錄至 {OUTPUT_JSON_FILE}。")

    # --------------------------------------------------------------------------
    # 步驟 6: 更新 data/months.json 註冊新月份
    # --------------------------------------------------------------------------
    print("\n🔍 6. 註冊新月份至 data/months.json 中...")
    
    months_list = []
    if os.path.exists(MONTHS_LIST_FILE):
        try:
            with open(MONTHS_LIST_FILE, "r", encoding="utf-8") as f:
                months_list = json.load(f)
        except Exception:
            pass

    # 檢查是否已存在該月份，若無則新增
    new_entry = {"year": YEAR, "month": MONTH}
    if new_entry not in months_list:
        months_list.append(new_entry)
        # 按時間先後排序
        months_list.sort(key=lambda x: (x["year"], x["month"]))
        
        with open(MONTHS_LIST_FILE, "w", encoding="utf-8") as f:
            json.dump(months_list, f, ensure_ascii=False, indent=2)
        print("   ✅ 已成功註冊「2026 年 3 月」至月份選單。")
    else:
        print("   ℹ️ 「2026 年 3 月」已存在於選單中，無需重複註冊。")

    print("\n✨ 全部處理程序已完成！您現在可以重新啟動網頁並選擇觀測「2026 年 03 月」！")

if __name__ == "__main__":
    main()

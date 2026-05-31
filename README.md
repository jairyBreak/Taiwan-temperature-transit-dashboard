# Taiwan Transit & Weather Dashboard 🇹🇼🚆
(台灣交通與氣象動態預測戰情室)

這是一個以資料科學為基礎的「台灣大眾運輸與氣候關聯」視覺化戰情室。
我們整合了台北市政府的**捷運分時大數據**、交通部的**台鐵每日運量資料**，以及德國 **Open-Meteo** 的歷史精準氣象數據，並透過現代化的高質感動態介面，為您揭開氣候與人流之間的隱藏密碼！

## 🌟 專案亮點 (Key Features)

- **深色科技感戰情室**：採用極致黑與霓虹配色，搭載發光特效與玻璃擬態 (Glassmorphism)，呈現頂級資料科學質感的 UI。
- **全台 16 大樞紐分析**：收錄西門、台北車站、士林等 16 個重點捷運與火車站的真實數據。
- **純靜態神速載入**：已將數百 MB 的巨量政府開放資料，透過後端清洗濃縮為數十 KB 的輕量化 JSON。前端採純靜態部署，0.1 秒瞬間載入！
- **動態地圖展示**：整合 Leaflet 地圖，點擊站點自動飛躍聚焦，並即時渲染該站點的專屬圖表。

## 🛠️ 技術架構 (Tech Stack)

- **前端 (Frontend)**: 原生 HTML / CSS / Vanilla JavaScript
- **視覺化庫 (Libraries)**: Chart.js (圖表), Leaflet.js (地圖)
- **資料處理 (Data Pipeline)**: Python (`server.py`) - *負責向政府 API 請求上百 MB 的 CSV/JSON 並對齊氣象資料，產出最終的靜態 JSON。*

## 🚀 如何在本地運行 (Local Development)

由於專案已經轉換為純靜態架構，您可以使用任何靜態伺服器來預覽：

```bash
# 使用 Python 內建的伺服器
python -m http.server 8000

# 或使用 Node.js 的 live-server
npx live-server
```
然後在瀏覽器開啟 `http://localhost:8000` 即可。

## 📦 如何產生新的月份資料？ (Data Generation)

本專案 `data/` 資料夾中已經包含處理好的展示用靜態檔。如果您希望擴充其他月份（例如 2025 年的數據）：
1. 確保您的電腦有 Python 環境。
2. 執行 `python server.py` 啟動資料處理後端。
3. 執行 `fetch_all.py` 或發送 API 請求以觸發資料下載與運算。
4. 系統會自動將幾百 MB 的資料運算完畢並存入 `cache/`，再將需要的檔案複製到 `data/` 資料夾中提供靜態展示。

## 📄 資料來源聲明 (Data Sources)
- [政府資料開放平台 - 台北捷運客運量](https://data.gov.tw/)
- [交通部台鐵每日各站進出站人數](https://ods.railway.gov.tw/)
- [Open-Meteo Historical Weather API](https://open-meteo.com/)

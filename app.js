import { SPOTS_DATA, calculateCorrelation, calculateRegression, getCorrelationText } from './data.js?v=5.1';
import { TAIWAN_MASK } from './data/taiwan_mask.js';

// ==========================================================================
// 1. 全域應用程式狀態 (State)
// ==========================================================================
const STATE = {
  mode: 'simulation', // 'simulation' 或 'live'
  spots: SPOTS_DATA.map(spot => ({ ...spot })), // 複製預設景點資料並保留模擬函數
  selectedSpotId: 'taipei101',
  tempAdj: 0, // 氣溫調整值 (相對於各站基底溫度的 +/- 偏差)
  simWeather: 'sunny',
  charts: {
    scatter: null,
    line: null
  },
  map: null,
  mapMarkers: {},
  idwLayer: null,
  showTempOverlay: true, // 預設開啟區域氣溫著色
  activeDataType: 'hourly', // 'hourly' 或 'monthly'
  historyViewMode: 'model', // 'model' (動態推算) 或 'real' (靜態歷史平均)
  historyMonth: null, // 當前歷史模式載入的月份
  customDataActive: false,
  rawCustomCSVData: null
};

// ==========================================================================
// 2. 初始化與進入點
// ==========================================================================
window.addEventListener('DOMContentLoaded', () => {
  initUI();
  initMap();
  checkApiKeyAndInitMode();
  setupEventListeners();
  loadHistoricalMonths().then(() => {
    initBaseSimulation();
  });
});

// 初始化 UI 元件的預設顯示
function initUI() {
  renderSpotsList();
  updateSliderDisplay(STATE.tempAdj);
}

// ==========================================================================
// 3. 地圖管理 (Leaflet.js)
// ==========================================================================
function initMap() {
  // 建立台北市中心的 Leaflet 地圖
  STATE.map = L.map('map', {
    center: [23.5, 120.5],
    zoom: 7.5,
    minZoom: 7,
    maxZoom: 14,
    zoomControl: false // 我們自訂位置
  });

  // 加入深色底圖
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  }).addTo(STATE.map);

  // 初始化遮罩層 (用來遮蓋海上的 IDW 漸層，只露出台灣本島)
  STATE.maskLayer = L.polygon(TAIWAN_MASK, {
    color: 'transparent',
    fillColor: '#202020', // 符合深色地圖的深灰黑色
    fillOpacity: 1,
    interactive: false
  }).addTo(STATE.map);

  // 繪製地圖標記
  updateMapMarkers();
}

// 根據目前狀態與模擬數據更新地圖標記的大小與顏色，並可選繪製區域氣溫著色
function updateMapMarkers() {
  const tempAdj = STATE.tempAdj;
  const currentWeather = STATE.simWeather;
  
  let dynamicAdj = 0;
  if (STATE.mode === 'history') {
    let sumDiff = 0, count = 0;
    STATE.spots.forEach(spot => {
      if (!spot.isHidden && spot.historyData && spot.historyData.length > 0) {
        const hist = spot.historyData;
        const avgTemp = hist.reduce((sum, d) => sum + d.temp, 0) / hist.length;
        const simBase = getSpotSimulatedTemp(spot, 0);
        sumDiff += (avgTemp - simBase);
        count++;
      }
    });
    if (count > 0) dynamicAdj = sumDiff / count;
  }

  const idwPoints = [];

  STATE.spots.forEach(spot => {
    // 檢查歷史模式是否有數據
    if (STATE.mode === 'history') {
      const hist = spot.historyData || [];
      if (hist.length === 0) {
        if (STATE.mapMarkers[spot.id]) {
          STATE.map.removeLayer(STATE.mapMarkers[spot.id]);
          delete STATE.mapMarkers[spot.id];
        }
        return;
      }
    }

    // 計算模擬、即時或歷史人流量 (根據檢視模式)
    let flow, temp;
    
    if (STATE.mode === 'history') {
      const hist = spot.historyData || [];
      if (hist.length === 0) {
        // 沒有歷史數據的背景節點，直接從其內建的「月平均氣候資料庫」讀取該月份的基準溫度
        const monthData = spot.monthly && STATE.historyMonth ? spot.monthly.find(m => m.month === STATE.historyMonth) : null;
        if (monthData) {
          temp = monthData.temp + (STATE.historyViewMode === 'model' ? tempAdj : 0);
        } else {
          temp = getSpotSimulatedTemp(spot, dynamicAdj + (STATE.historyViewMode === 'model' ? tempAdj : 0));
        }
        flow = spot.simulate(temp, STATE.simWeather);
      } else {
        const sumTemp = hist.reduce((sum, d) => sum + d.temp && !isNaN(d.temp) ? sum + d.temp : sum, 0);
        const validHistCount = hist.filter(d => !isNaN(d.temp)).length || 1;
        const avgTemp = sumTemp / validHistCount;
        
        if (STATE.historyViewMode === 'real') {
          const sumFlow = hist.reduce((sum, d) => sum + d.flow && !isNaN(d.flow) ? sum + d.flow : sum, 0);
          temp = avgTemp;
          flow = Math.round(sumFlow / validHistCount);
        } else {
          // 'model' 動態推算模式：基底為當地歷史均溫 + 滑桿相對調整值
          temp = avgTemp + tempAdj;
          flow = spot.simulate(temp, STATE.simWeather);
        }
      }
    } else {
      const simTemp = getSpotSimulatedTemp(spot, tempAdj);
      flow = STATE.mode === 'live' && spot.liveFlow !== undefined 
        ? spot.liveFlow 
        : spot.simulate(simTemp, currentWeather);
        
      temp = STATE.mode === 'live' && spot.liveTemp !== undefined 
        ? spot.liveTemp 
        : simTemp;
    }

    // 防呆機制：若溫度因為任何原因算出 NaN，退回預設模擬氣溫
    if (isNaN(temp)) {
      temp = getSpotSimulatedTemp(spot, 0);
    }
    if (isNaN(flow)) {
      flow = spot.simulate(temp, STATE.simWeather);
    }

    // IDW 演算法不允許數值 <= 0，否則會變成全透明造成地圖「缺口」。
    // 將所有溫度平移 +20，使範圍 (-20°C ~ 40°C) 映射為正數 (0 ~ 60)
    let shiftedTemp = temp + 20;
    // 確保即使異常極寒，也不會小於或等於 0
    if (shiftedTemp <= 0.1) shiftedTemp = 0.1;
    
    idwPoints.push([spot.lat, spot.lng, shiftedTemp]);

    if (spot.isHidden) return; // 不建立 Marker 和 Popup樣式

    // 計算自訂 Marker 樣式
    // 溫度色彩插值 (HSL: 220 藍色 -> 0 紅色)
    const minT = 10;
    const maxT = 40;
    const constrainedT = Math.max(minT, Math.min(maxT, temp));
    const ratio = (constrainedT - minT) / (maxT - minT);
    const hue = 220 - ratio * 220; // 220 (藍) 變到 0 (紅)
    const markerColor = `hsl(${hue}, 100%, 55%)`;

    // 依據人流量計算波紋與圓圈大小
    const baseSize = spot.type === 'indoor' ? 14 : 14;
    const isDailyFlow = spot.id !== 'yangmingshan';
    const divisor = isDailyFlow ? 1200 : 35;
    const pulseScale = Math.min(60, 15 + (flow / divisor));
    const markerTypeBorder = spot.type === 'indoor' ? '#f472b6' : '#34d399'; // 粉色代表室內，綠色代表戶外

    // 自訂 HTML Marker 結構
    const customIconHtml = `
      <div class="pulse-marker-container" id="marker-${spot.id}">
        <div class="pulse-marker-ring" style="border-color: ${markerColor}; width: ${pulseScale}px; height: ${pulseScale}px; margin-top: -${pulseScale/2}px; margin-left: -${pulseScale/2}px;"></div>
        <div class="pulse-marker-dot" style="background-color: ${markerColor}; border-color: ${markerTypeBorder};"></div>
      </div>
    `;

    const customIcon = L.divIcon({
      html: customIconHtml,
      className: 'custom-leaflet-icon',
      iconSize: [20, 20]
    });

    const labelTemp = STATE.mode === 'history' && STATE.historyViewMode === 'real' ? '歷史月均氣溫' : (STATE.mode === 'live' ? '測站溫度' : '模擬氣溫');
    const labelFlow = isDailyFlow ? (STATE.mode === 'history' ? (STATE.historyViewMode === 'real' ? '歷史日均人流' : '模型預估日人流') : '估計日人流') : '估計時人流';
    const unitFlow = isDailyFlow ? '人次/日' : '人次/小時';
    const popupContent = `
      <div style="font-family: var(--font-primary); font-size: 0.85rem; padding: 4px;">
        <strong style="font-size: 0.95rem; color: #fff; border-bottom: 1px solid var(--accent-primary); display:block; padding-bottom:4px; margin-bottom:6px;">${spot.name}</strong>
        <div>${labelTemp}：<strong style="color: ${markerColor}">${temp.toFixed(1)}°C</strong></div>
        <div>${labelFlow}：<strong style="color: var(--accent-secondary)">${flow.toLocaleString()} ${unitFlow}</strong></div>
        <div style="margin-top: 4px; font-size: 0.72rem; color: var(--text-muted);">${spot.typeName}</div>
      </div>
    `;

    // 如果該標記已存在，則更新其位置與圖示及 Popup
    if (STATE.mapMarkers[spot.id]) {
      STATE.mapMarkers[spot.id].setIcon(customIcon);
      STATE.mapMarkers[spot.id].setPopupContent(popupContent);
    } else {
      // 建立新標記
      const marker = L.marker([spot.lat, spot.lng], { icon: customIcon }).addTo(STATE.map);
      marker.bindPopup(popupContent, { closeButton: false, offset: [0, -5] });

      // 點擊標記切換景點
      marker.on('click', () => {
        selectSpot(spot.id);
      });

      // 懸浮展示 Popup
      marker.on('mouseover', function (e) {
        this.openPopup();
      });
      
      STATE.mapMarkers[spot.id] = marker;
    }

  });

  // 更新或建立 IDW 溫度圖層
  if (STATE.showTempOverlay) {
    if (!STATE.idwLayer) {
      STATE.idwLayer = L.idwLayer(idwPoints, {
        opacity: 0.45,
        maxZoom: 18,
        cellSize: 6,
        exp: 4.0, // 極高權重指數，讓高山等極端測站的局部影響力極強，避免被平地測站全域平均掉
        max: 60, // 將最大值設為 60，對應平移後的最高溫 (40°C + 20)
        range: 0.0, // 移除內插範圍限制，保證外島或偏遠海域絕對不會出現未被覆蓋的「缺口」
        gradient: {
          // 公式: 鍵值 = (原始溫度 + 20) / 60
          0.16: 'hsl(240, 100%, 55%)', // -10C
          0.33: 'hsl(220, 100%, 55%)', // 0C
          0.50: 'hsl(180, 100%, 55%)', // 10C
          0.58: 'hsl(140, 100%, 55%)', // 15C
          0.73: 'hsl(90, 100%, 55%)',  // 24C (黃綠)
          0.76: 'hsl(60, 100%, 55%)',  // 26C (正黃)
          0.80: 'hsl(35, 100%, 55%)',  // 28C (橘)
          0.83: 'hsl(15, 100%, 55%)',  // 30C (紅橘)
          0.90: 'hsl(0, 100%, 55%)',   // 34C (正紅)
          1.00: 'hsl(330, 100%, 45%)'  // 40C (紫紅)
        }
      });
      STATE.idwLayer.addTo(STATE.map);
    } else {
      STATE.idwLayer.setLatLngs(idwPoints);
      if (!STATE.map.hasLayer(STATE.idwLayer)) {
        STATE.idwLayer.addTo(STATE.map);
      }
    }
    
    // 確保遮罩層始終在 IDW 漸層圖層之上
    if (STATE.maskLayer) {
      STATE.maskLayer.bringToFront();
    }
  } else {
    if (STATE.idwLayer && STATE.map.hasLayer(STATE.idwLayer)) {
      STATE.map.removeLayer(STATE.idwLayer);
    }
  }

  // 動態連動顯示/隱藏左下角的溫度對照竿
  const legend = document.getElementById('temp-color-legend');
  if (legend) {
    if (STATE.showTempOverlay) {
      legend.classList.remove('hidden');
    } else {
      legend.classList.add('hidden');
    }
  }
}

// ==========================================================================
// 4. 即時 API 串接與模式檢查 (CWA API)
// ==========================================================================
function checkApiKeyAndInitMode() {
  const localKey = localStorage.getItem('cwa_api_key');
  const badge = document.getElementById('mode-badge');
  const badgeText = badge.querySelector('.badge-text');

  if (localKey) {
    // 嘗試進行即時資料請求
    fetchLiveWeatherData(localKey)
      .then(success => {
        if (success) {
          STATE.mode = 'live';
          badge.className = 'badge badge-live';
          badgeText.textContent = '即時 API 模式';
          // 隱藏模擬控制器的部分按鈕，提示即時模式
          document.getElementById('temp-slider').disabled = true;
          document.querySelectorAll('.weather-btn').forEach(b => b.disabled = true);
          document.getElementById('temp-desc').textContent = '即時 API';
          showToast('成功讀取中央氣象署即時觀測資料！', 'success');
        } else {
          fallbackToSimulation('金鑰可能無效，已降級為模擬模式');
        }
      })
      .catch(() => {
        fallbackToSimulation('網路連線或 API 請求失敗，已切換為模擬模式');
      });
  } else {
    fallbackToSimulation();
  }
}

function fallbackToSimulation(msg) {
  STATE.mode = 'simulation';
  const badge = document.getElementById('mode-badge');
  const badgeText = badge.querySelector('.badge-text');
  if (badge) badge.className = 'badge badge-sim';
  if (badgeText) badgeText.textContent = '模擬展示模式';
  
  const slider = document.getElementById('temp-slider');
  if (slider) {
    slider.disabled = false;
    slider.value = 0;
  }
  
  document.querySelectorAll('.weather-btn:not(.history-toggle-btn)').forEach(b => {
    b.disabled = false;
    if (b.dataset.weather === 'sunny') {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });
  
  const historyToggle = document.getElementById('history-mode-toggle');
  if (historyToggle) historyToggle.classList.add('hidden');
  
  STATE.tempAdj = 0;
  STATE.simWeather = 'sunny';
  updateSliderDisplay(STATE.tempAdj);
  
  if (msg) showToast(msg, 'warning');
}

// 抓取氣象局 API
async function fetchLiveWeatherData(apiKey) {
  try {
    // 透過 server.py 的 Proxy 請求綜觀氣象站實測資料 (O-A0003-001)
    // 附加 Authorization 參數，server.py 會透傳給氣象署
    const response = await fetch(`/api/cwa/v1/rest/datastore/O-A0003-001?Authorization=${apiKey}`);
    if (!response.ok) return false;

    const data = await response.json();
    const locations = data.records?.Station;
    if (!locations || locations.length === 0) return false;

    // 將氣象站資料解析，並映射至景點
    let matchedCount = 0;
    STATE.spots.forEach(spot => {
      // 搜尋 stationId 相符的氣象站
      const matchedStation = locations.find(loc => loc.StationId === spot.stationId);
      if (matchedStation) {
        // 抓取目前的溫度與氣象資訊
        const temp = parseFloat(matchedStation.WeatherElement.AirTemperature);
        const weatherName = matchedStation.WeatherElement.Weather || 'Sunny';
        
        // 若溫度正常 (有些站故障會顯示 -99 等異常值)
        if (temp > -50 && temp < 60) {
          spot.liveTemp = temp;
          // 解析大概的天氣狀況以計算估計人流
          let mappedWeather = 'sunny';
          if (weatherName.includes('雨')) mappedWeather = 'rainy';
          else if (temp < 15) mappedWeather = 'cold';
          
          spot.liveFlow = spot.simulate(temp, mappedWeather);
          matchedCount++;
        }
      }
    });

    if (matchedCount > 0) {
      // 如果處於即時模式，計算當前選中景點的即時溫度調整偏差
      const activeSpot = STATE.spots.find(s => s.id === STATE.selectedSpotId);
      if (activeSpot && activeSpot.liveTemp !== undefined) {
        const localBase = 25 + getSpotOffset(activeSpot);
        STATE.tempAdj = activeSpot.liveTemp - localBase;
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('Fetch live weather data error:', error);
    return false;
  }
}

// ==========================================================================
// 5. 數據分析與儀表板渲染 (Dashboard & Charts)
// ==========================================================================
function updateDashboard() {
  const spot = STATE.spots.find(s => s.id === STATE.selectedSpotId);
  if (!spot) return;

  // A. 更新文字與標記
  document.getElementById('active-spot-badge').textContent = spot.name;
  
  // 更新當前人流量顯示卡
  let currentTemp, flow;
  
  if (STATE.mode === 'history') {
    const hist = spot.historyData || [];
    const sumTemp = hist.reduce((sum, d) => sum + d.temp, 0);
    const avgTemp = hist.length > 0 ? (sumTemp / hist.length) : 0;
    
    if (STATE.historyViewMode === 'real') {
      const sumFlow = hist.reduce((sum, d) => sum + d.flow, 0);
      currentTemp = avgTemp;
      flow = hist.length > 0 ? Math.round(sumFlow / hist.length) : 0;
    } else {
      // 'model' 模式：基準為當地月均溫 + 滑桿相對調整溫
      currentTemp = avgTemp + STATE.tempAdj;
      flow = spot.simulate(currentTemp, STATE.simWeather);
    }
  } else {
    const simTemp = getSpotSimulatedTemp(spot, STATE.tempAdj);
    currentTemp = STATE.mode === 'live' && spot.liveTemp !== undefined ? spot.liveTemp : simTemp;
    flow = STATE.mode === 'live' && spot.liveFlow !== undefined 
      ? spot.liveFlow 
      : spot.simulate(simTemp, STATE.simWeather);
  }

  // 更新左側控制面板滑桿顯示與文字，使其與當前選中地區氣溫同步，避免不同縣市顯示同一溫度
  const slider = document.getElementById('temp-slider');
  const sliderLabel = document.querySelector('.slider-header span');
  
  if (STATE.mode === 'history') {
    if (STATE.historyViewMode === 'real') {
      if (slider) slider.value = 0; // 歷史唯讀，滑桿歸 0
      document.getElementById('temp-val-display').textContent = `${currentTemp.toFixed(1)}°C (無調整)`;
      if (sliderLabel) {
        sliderLabel.innerHTML = `歷史平均氣溫 (<span id="temp-val-display">${currentTemp.toFixed(1)}°C</span>)`;
      }
    } else {
      // 歷史模型模式：支援相對滑桿氣溫調整，基準為該月當地均溫
      if (slider) slider.value = STATE.tempAdj;
      updateSliderDisplay(STATE.tempAdj);
      if (sliderLabel) {
        const sign = STATE.tempAdj >= 0 ? '+' : '';
        sliderLabel.innerHTML = `模擬氣溫調整 (<span id="temp-val-display">${sign}${STATE.tempAdj.toFixed(1)}°C</span>)`;
      }
    }
  } else if (STATE.mode === 'live') {
    if (slider) slider.value = 0; // 即時 API 唯讀，滑桿歸 0
    document.getElementById('temp-val-display').textContent = `${currentTemp.toFixed(1)}°C`;
    if (sliderLabel) {
      sliderLabel.innerHTML = `測站實測氣溫 (<span id="temp-val-display">${currentTemp.toFixed(1)}°C</span>)`;
    }
  } else {
    // 模擬模式
    if (slider) slider.value = STATE.tempAdj;
    updateSliderDisplay(STATE.tempAdj);
    if (sliderLabel) {
      const sign = STATE.tempAdj >= 0 ? '+' : '';
      sliderLabel.innerHTML = `模擬氣溫調整 (<span id="temp-val-display">${sign}${STATE.tempAdj.toFixed(1)}°C</span>)`;
    }
  }

  const descSpan = document.getElementById('temp-desc');
  if (descSpan) {
    updateSliderCategory(currentTemp, descSpan);
  }

  // 雙軸圖已改為 120 天日資料，因此切換器一律隱藏
  const dataTypeToggle = document.getElementById('chart-datatype-toggle');
  if (dataTypeToggle) {
    dataTypeToggle.classList.add('hidden');
  }

  // 動態更新折線圖標題
  const lineChartTitle = document.getElementById('line-chart-title');
  if (lineChartTitle) {
    if (STATE.mode === 'history') {
      lineChartTitle.innerHTML = `<i class="fa-solid fa-chart-area"></i> 時間維度變化特徵 (選擇月份每日趨勢)`;
    } else {
      lineChartTitle.innerHTML = `<i class="fa-solid fa-chart-area"></i> 時間維度變化特徵 (四個月每日歷史與模擬)`;
    }
  }
    
  const cardTitle = document.querySelector('#stat-simulated h3');
  const cardTrend = document.querySelector('#stat-simulated .stat-trend');
  const isDailyFlow = spot.id !== 'yangmingshan';

  if (STATE.mode === 'history') {
    if (cardTitle) cardTitle.textContent = STATE.historyViewMode === 'real' ? '真實歷史平均人流量' : '模型推算人流量';
    if (cardTrend) cardTrend.textContent = isDailyFlow ? '單位：日出站人次' : '單位：預估參訪人次 / 小時';
  } else {
    if (cardTitle) cardTitle.textContent = isDailyFlow ? '當前估計日人流量' : '當前估計人流量';
    if (cardTrend) cardTrend.textContent = isDailyFlow ? '單位：預估日出站人次' : '單位：預估參訪人次 / 小時';
  }
  
  document.getElementById('val-sim-flow').textContent = flow.toLocaleString();

  // B. 重新整理景點列表右側顯示的流量
  renderSpotsList();

  // C. 進行統計學相關性分析
  // 決定使用小時資料(hourly)、月份資料(monthly)或歷史資料(historyData)作為分析集
  let dataset;
  if (STATE.mode === 'history') {
    const hist = spot.historyData || [];
    if (STATE.historyViewMode === 'real') {
      dataset = hist.map(d => ({
        temp: d.temp,
        flow: d.flow,
        timeLabel: d.timeLabel
      }));
    } else {
      // 'model' 模式：應用相對氣溫調整，並重新推估每天的流量
      dataset = hist.map(d => {
        const adjustedTemp = d.temp + STATE.tempAdj;
        return {
          temp: adjustedTemp,
          flow: spot.simulate(adjustedTemp, STATE.simWeather),
          timeLabel: d.timeLabel
        };
      });
    }
    dataset.sort((a, b) => a.timeLabel.localeCompare(b.timeLabel));
  } else {
    // 模擬模式：採用四個月每日的氣溫與流量資料 (120天日資料)
    dataset = (spot.allHistoryData || []).map(d => {
      const adjustedTemp = d.temp + STATE.tempAdj;
      // 計算模擬的比例變化：基於當日實際氣溫與模擬氣溫的預估流量比例
      const baseEstimate = spot.simulate(d.temp, 'sunny');
      const adjustedEstimate = spot.simulate(adjustedTemp, STATE.simWeather);
      const ratio = baseEstimate > 0 ? (adjustedEstimate / baseEstimate) : 1;
      return {
        temp: adjustedTemp,
        flow: Math.max(0, Math.round(d.flow * ratio)),
        timeLabel: d.timeLabel
      };
    });
    dataset.sort((a, b) => a.timeLabel.localeCompare(b.timeLabel));
  }
  const temperatures = dataset.map(d => d.temp);
  const flows = dataset.map(d => d.flow);

  // 計算相關性與迴歸
  const stats = calculateRegression(temperatures, flows);
  const rVal = stats.r !== undefined ? stats.r : 0;
  const r2Val = stats.r2 !== undefined ? stats.r2 : 0;
  const slopeVal = stats.slope !== undefined ? stats.slope : 0;
  const interceptVal = stats.intercept !== undefined ? stats.intercept : 0;

  // 更新分析儀表板
  document.getElementById('val-corr').textContent = rVal.toFixed(3);
  document.getElementById('val-r2').textContent = r2Val.toFixed(3);
  
  // 迴歸方程式字串格式化 (y = ax + b)
  const equation = `y = ${slopeVal.toFixed(2)}x ${interceptVal >= 0 ? '+' : '-'} ${Math.abs(interceptVal).toFixed(1)}`;
  document.getElementById('val-reg').textContent = equation;

  // 皮爾森相關係數狀態說明
  const corrDesc = document.getElementById('desc-corr');
  const absR = Math.abs(rVal);
  if (absR >= 0.7) {
    corrDesc.textContent = rVal > 0 ? '強烈正相關' : '強烈負相關';
    corrDesc.style.color = rVal > 0 ? 'var(--color-success)' : 'var(--color-danger)';
  } else if (absR >= 0.4) {
    corrDesc.textContent = rVal > 0 ? '中度正相關' : '中度負相關';
    corrDesc.style.color = 'var(--color-warning)';
  } else {
    corrDesc.textContent = '弱相關/無相關';
    corrDesc.style.color = 'var(--text-muted)';
  }

  // 自動寫入分析報告
  document.getElementById('insight-text').innerHTML = `
    <p style="margin-bottom: 8px;"><strong>${spot.name} (${spot.typeName})</strong>：${spot.description}</p>
    <p style="margin-top: 8px;">📊 <strong>統計分析結果：</strong></p>
    <ul style="padding-left: 20px; margin: 8px 0; font-size: 0.85rem; color: var(--text-muted);">
      <li>分析數據週期：${STATE.mode === 'history' ? '歷史月份每日氣溫與實際日運量' : '四個月 (1～4月) 每日氣溫與人流量'}</li>
      <li>相關性強度：${getCorrelationText(rVal, spot.typeName, spot.name)}</li>
      <li>決定係數 ($R^2$ = ${r2Val.toFixed(3)})：代表氣溫變化可以解釋大約 **${(r2Val * 100).toFixed(1)}%** 的人流量起伏。</li>
    </ul>
    <p style="margin-top: 8px; font-size: 0.85rem;"><i class="fa-solid fa-chart-line" style="color: var(--color-primary-light);"></i> <strong>氣象關聯特徵分析：</strong> 
    ${spot.type === 'indoor' 
      ? '此站點在極端氣溫（如盛夏高溫或冬季寒流）下人流量通常呈現增長趨勢，顯示該區域具有顯著的室內避暑或避寒效應。在統計分析中，氣溫與人流量常呈現正向響應，反映出天候波動對大眾運輸使用者在室內商業空間群聚行為的影響。' 
      : '此站點屬於戶外型區域，氣溫上升與降雨對其運量常有顯著的負向衝擊。統計數據顯示，當氣溫過高或天候不佳時，人流量有明顯下降趨勢，表現出較高的氣候敏感度。此特徵在交通規劃與人流調控中，是關鍵的分析評估指標。'}
    </p>
  `;

  // D. 更新圖表
  renderScatterChart(temperatures, flows, stats, spot.name);
  renderLineChart(dataset, spot.name);
}

// 繪製散佈圖 (Scatter Plot) 與迴歸線
function renderScatterChart(xData, yData, stats, spotName) {
  const ctx = document.getElementById('scatterChart').getContext('2d');
  
  if (STATE.charts.scatter) {
    STATE.charts.scatter.destroy();
  }
 
  // 整理散佈圖點資料
  const scatterPoints = xData.map((x, i) => ({ x: x, y: yData[i] }));
 
  // 計算迴歸線兩端的點 (以 x 的極小值和極大值繪製線條)
  let linePoints = [];
  if (xData.length > 0) {
    const minX = Math.min(...xData) - 1;
    const maxX = Math.max(...xData) + 1;
    linePoints = [
      { x: minX, y: stats.slope * minX + stats.intercept },
      { x: maxX, y: stats.slope * maxX + stats.intercept }
    ];
  }
 
  // 計算當前模擬預測點
  const currentSpot = STATE.spots.find(s => s.id === STATE.selectedSpotId);
  const simTemp = getSpotSimulatedTemp(currentSpot, STATE.tempAdj);
  const simFlow = currentSpot ? currentSpot.simulate(simTemp, STATE.simWeather) : 0;
  const simPoint = (STATE.mode === 'history' && STATE.historyViewMode === 'real') ? [] : [{ x: simTemp, y: simFlow }];
 
  const showScatterPoints = STATE.mode === 'history' || STATE.mode === 'simulation';
  const isDailyFlow = currentSpot && currentSpot.id !== 'yangmingshan';
 
  STATE.charts.scatter = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: '實際/歷史觀測點',
          data: scatterPoints,
          backgroundColor: STATE.selectedSpotId === 'taipei101' ? '#f472b6' : '#34d399',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1,
          pointRadius: showScatterPoints ? 6 : 0,
          pointHoverRadius: showScatterPoints ? 8 : 0,
          zIndex: 2
        },
        {
          label: `趨勢線 (y = ${stats.slope.toFixed(2)}x ${stats.intercept >= 0 ? '+' : '-'} ${Math.abs(stats.intercept).toFixed(1)})`,
          data: linePoints,
          type: 'line',
          borderColor: 'rgba(99, 102, 241, 0.85)',
          borderWidth: showScatterPoints ? 2 : 0,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
          zIndex: 1
        },
        {
          label: '當前模擬預測點',
          data: simPoint,
          backgroundColor: '#fbbf24',
          borderColor: '#fff',
          borderWidth: 2,
          pointRadius: 8,
          pointHoverRadius: 10,
          pointStyle: 'rectRot',
          zIndex: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#f3f4f6',
            font: { family: 'Outfit, Noto Sans TC' },
            filter: function(item, chartData) {
              // 在非歷史/非模擬模式下，隱藏實際/歷史觀測點與趨勢線的圖例
              if (!showScatterPoints) {
                return item.text.includes('當前模擬預測點');
              }
              return true;
            }
          }
        },
        tooltip: {
          filter: function(tooltipItem) {
            // 在非歷史/非模擬模式下，只顯示當前模擬預測點的 tooltip 資訊
            if (!showScatterPoints) {
              return tooltipItem.datasetIndex === 2;
            }
            return true;
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: '氣溫 (°C)', color: '#9ca3af' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9ca3af' }
        },
        y: {
          title: { display: true, text: isDailyFlow ? '人流量 (日出站人次)' : '人流量 (人次/小時)', color: '#9ca3af' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9ca3af' }
        }
      }
    }
  });
}

// 繪製雙軸折線圖 (Line Chart)
function renderLineChart(dataset, spotName) {
  const ctx = document.getElementById('lineChart').getContext('2d');
  
  if (STATE.charts.line) {
    STATE.charts.line.destroy();
  }

  // 取得 X 軸標籤與雙軸 Y 資料 (在兩種模式下皆為日資料，以 timeLabel 作為 X 軸標籤)
  const labels = dataset.map(d => d.timeLabel);
  const tempFlow = dataset.map(d => d.flow);
  const tempWeatherData = dataset.map(d => d.temp);

  STATE.charts.line = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: STATE.mode === 'history' ? '日出站人流量' : '模擬日人流量',
          data: tempFlow,
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6, 182, 212, 0.1)',
          fill: true,
          tension: 0.3,
          yAxisID: 'y'
        },
        {
          label: STATE.mode === 'history' ? '日均溫 (°C)' : '模擬日均溫 (°C)',
          data: tempWeatherData,
          borderColor: '#f59e0b',
          backgroundColor: 'transparent',
          tension: 0.1,
          borderWidth: 2,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#f3f4f6', font: { family: 'Outfit, Noto Sans TC' } }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9ca3af' }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: { display: true, text: '人流量', color: '#9ca3af' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9ca3af' }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: { display: true, text: '溫度 (°C)', color: '#9ca3af' },
          ticks: { color: '#9ca3af' },
          grid: { drawOnChartArea: false } // 避免雙網格重疊混亂
        }
      }
    }
  });
}

// 渲染景點列表清單
function renderSpotsList() {
  const listContainer = document.getElementById('spots-list');
  if (!listContainer) return;

  listContainer.innerHTML = '';
  STATE.spots.forEach(spot => {
    if (spot.isHidden) return;
    // 取得當前人流
    let flow;
    if (STATE.mode === 'history') {
      const hist = spot.historyData || [];
      if (hist.length > 0) {
        const sumFlow = hist.reduce((sum, d) => sum + d.flow, 0);
        flow = Math.round(sumFlow / hist.length);
      } else {
        return; // 歷史模式下，隱藏無資料站點 (如陽明山)
      }
    } else {
      const simTemp = getSpotSimulatedTemp(spot, STATE.tempAdj);
      flow = STATE.mode === 'live' && spot.liveFlow !== undefined 
        ? spot.liveFlow 
        : spot.simulate(simTemp, STATE.simWeather);
    }

    const isActive = spot.id === STATE.selectedSpotId;
    const item = document.createElement('div');
    item.className = `spot-item ${isActive ? 'active' : ''}`;
    item.dataset.id = spot.id;
    
    // 設定類別標籤的樣式
    const typeLabelStyle = spot.type === 'indoor' 
      ? 'color: var(--color-indoor);' 
      : 'color: var(--color-outdoor);';

    item.innerHTML = `
      <div class="spot-item-info">
        <span class="spot-item-name">${spot.name}</span>
        <span class="spot-item-type" style="${typeLabelStyle}">
          <i class="fa-solid ${spot.type === 'indoor' ? 'fa-building' : 'fa-tree'}"></i> ${spot.typeName}
        </span>
      </div>
      <div class="spot-item-flow">
        <i class="fa-solid fa-users-line"></i>
        <span>${flow}</span>
      </div>
    `;

    item.addEventListener('click', () => selectSpot(spot.id));
    listContainer.appendChild(item);
  });
}

function selectSpot(spotId) {
  STATE.selectedSpotId = spotId;
  
  // 更新列表標記
  document.querySelectorAll('.spot-item').forEach(item => {
    item.classList.toggle('active', item.dataset.id === spotId);
  });

  const spot = STATE.spots.find(s => s.id === spotId);
  if (spot && STATE.map) {
    // 平滑移動地圖中心至點選位置
    STATE.map.panTo([spot.lat, spot.lng]);
    STATE.mapMarkers[spot.id].openPopup();
  }

  updateDashboard();
}

// ==========================================================================
// 6. 事件監聽設定 (Event Listeners)
// ==========================================================================
function setupEventListeners() {
  // A. 溫度滑桿連動
  const slider = document.getElementById('temp-slider');
  slider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    STATE.tempAdj = val;
    updateSliderDisplay(val);
    updateMapMarkers();
    updateDashboard();
  });

  // A-2. 區域氣溫著色勾選連動
  const chkTempOverlay = document.getElementById('chk-temp-overlay');
  if (chkTempOverlay) {
    chkTempOverlay.addEventListener('change', (e) => {
      STATE.showTempOverlay = e.target.checked;
      updateMapMarkers();
    });
  }

  // B. 天氣按鈕連動 (過濾掉 toggle 按鈕)
  document.querySelectorAll('.weather-btn:not(.history-toggle-btn)').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // 移除其他天氣按鈕 active
      document.querySelectorAll('.weather-btn:not(.history-toggle-btn)').forEach(b => b.classList.remove('active'));
      const weatherBtn = e.currentTarget;
      weatherBtn.classList.add('active');
      
      STATE.simWeather = weatherBtn.dataset.weather;
      updateMapMarkers();
      updateDashboard();
    });
  });

  // B-2. 歷史模式檢視切換連動
  document.querySelectorAll('.history-toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.history-toggle-btn').forEach(b => b.classList.remove('active'));
      const toggleBtn = e.currentTarget;
      toggleBtn.classList.add('active');
      
      STATE.historyViewMode = toggleBtn.dataset.view;
      
      // 控制模擬器的鎖定狀態
      const isReal = STATE.historyViewMode === 'real';
      document.getElementById('temp-slider').disabled = isReal;
      document.querySelectorAll('.weather-btn:not(.history-toggle-btn)').forEach(b => b.disabled = isReal);
      
      const select = document.getElementById('mrt-month-select');
      const val = select ? select.value.replace('-', '/') : '';
      const badgeText = document.querySelector('#mode-badge .badge-text');
      if (badgeText) {
        badgeText.textContent = isReal ? `真實歷史平均 (${val})` : `真實模型預測 (${val})`;
      }

      updateMapMarkers();
      updateDashboard();
    });
  });

  // C. API 設定面板控制
  const btnSettings = document.getElementById('btn-toggle-settings');
  const panelSettings = document.getElementById('settings-panel');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const btnSaveKey = document.getElementById('btn-save-key');
  const btnClearKey = document.getElementById('btn-clear-key');
  const keyInput = document.getElementById('cwa-key-input');

  btnSettings.addEventListener('click', () => {
    // 預填當前金鑰
    keyInput.value = localStorage.getItem('cwa_api_key') || '';
    panelSettings.classList.remove('hidden');
  });

  btnCloseSettings.addEventListener('click', () => {
    panelSettings.classList.add('hidden');
  });

  btnSaveKey.addEventListener('click', () => {
    const key = keyInput.value.trim();
    if (key) {
      localStorage.setItem('cwa_api_key', key);
      panelSettings.classList.add('hidden');
      checkApiKeyAndInitMode();
    } else {
      showToast('請輸入金鑰授權碼！', 'warning');
    }
  });

  btnClearKey.addEventListener('click', () => {
    localStorage.removeItem('cwa_api_key');
    keyInput.value = '';
    panelSettings.classList.add('hidden');
    // 清除即時資料快取並切回模擬
    STATE.spots.forEach(s => {
      delete s.liveTemp;
      delete s.liveFlow;
    });
    fallbackToSimulation('已清除金鑰，切換回模擬展示模式');
    updateMapMarkers();
    updateDashboard();
  });

  // D. 檔案上傳 (CSV Drag & Drop)
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('csv-file-input');
  const btnSample = document.getElementById('btn-download-sample');
  const btnResetUpload = document.getElementById('btn-reset-upload');

  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  ['dragleave', 'dragend'].forEach(evt => {
    dropZone.addEventListener(evt, () => dropZone.classList.remove('dragover'));
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleCSVFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleCSVFile(e.target.files[0]);
    }
  });

  // 下載範例 CSV 格式
  btnSample.addEventListener('click', downloadSampleCSV);

  // 重置 CSV 上傳
  btnResetUpload.addEventListener('click', () => {
    STATE.spots = SPOTS_DATA.map(spot => ({ ...spot }));
    STATE.customDataActive = false;
    btnResetUpload.classList.add('hidden');
    
    // 清除月份下拉選單的選擇
    const select = document.getElementById('mrt-month-select');
    if (select) select.value = '';

    fallbackToSimulation('已回復為預設模擬展示資料！');
    
    // 切換回預設並重新加載地圖與看板
    selectSpot('taipei101');
    initBaseSimulation();
  });

  // E. 載入真實歷史數據按鈕事件
  const btnLoadRealData = document.getElementById('btn-load-real-data');
  if (btnLoadRealData) {
    btnLoadRealData.addEventListener('click', () => {
      const select = document.getElementById('mrt-month-select');
      const val = select ? select.value : '';
      if (!val) {
        showToast('請先選擇要載入的年份與月份！', 'warning');
        return;
      }
      const [year, month] = val.split('-');
      loadRealMrtData(parseInt(year), parseInt(month));
    });
  }

  // F. 圖表資料類型切換 (逐時 / 月度)
  const chartTypeToggle = document.getElementById('chart-datatype-toggle');
  if (chartTypeToggle) {
    chartTypeToggle.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        chartTypeToggle.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        const targetBtn = e.currentTarget;
        targetBtn.classList.add('active');
        
        STATE.activeDataType = targetBtn.dataset.type;
        updateDashboard();
      });
    });
  }
}

// ==========================================================================
// 7. CSV 解析器與上傳處理 (CSV Upload Engine)
// ==========================================================================
function handleCSVFile(file) {
  if (!file.name.endsWith('.csv')) {
    showToast('格式錯誤，僅支援上傳 .csv 格式檔案！', 'danger');
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    parseAndApplyCSV(text);
  };
  reader.readAsText(file, 'utf-8');
}

function parseAndApplyCSV(text) {
  try {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) throw new Error('CSV 檔案行數不足！');

    // 解析標頭行
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // 檢查必填欄位 (spot_name, latitude, longitude, temperature, pedestrian_flow)
    const requiredCols = ['spot_name', 'latitude', 'longitude', 'temperature', 'pedestrian_flow'];
    const colIndices = {};
    
    requiredCols.forEach(col => {
      const idx = headers.indexOf(col);
      if (idx === -1) throw new Error(`CSV 遺失必要欄位：${col}`);
      colIndices[col] = idx;
    });

    // 選擇性欄位
    const timeIdx = headers.indexOf('time'); // 例如 '09:00' 或 '1月' 等標示

    // 建立臨時儲存景點的容器
    const parsedSpots = {};

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(',');
      const spotName = cols[colIndices['spot_name']].trim();
      const lat = parseFloat(cols[colIndices['latitude']]);
      const lng = parseFloat(cols[colIndices['longitude']]);
      const temp = parseFloat(cols[colIndices['temperature']]);
      const flow = parseInt(cols[colIndices['pedestrian_flow']]);

      if (isNaN(lat) || isNaN(lng) || isNaN(temp) || isNaN(flow)) {
        continue; // 略過錯誤或缺漏行
      }

      // 生成 Spot ID
      const spotId = 'custom_' + spotName.replace(/\s+/g, '_').toLowerCase();

      if (!parsedSpots[spotId]) {
        parsedSpots[spotId] = {
          id: spotId,
          name: spotName,
          type: 'custom',
          typeName: '自訂上傳區',
          lat: lat,
          lng: lng,
          stationId: 'custom',
          stationName: '自訂',
          description: `此為使用者上傳的自訂觀測數據集。`,
          hourly: [],
          monthly: [],
          simulate: function(t, w) {
            // 自訂數據使用簡單的一元線性迴歸作模擬預估
            const stats = calculateRegression(
              this.hourly.map(h => h.temp),
              this.hourly.map(h => h.flow)
            );
            const est = stats.slope * t + stats.intercept;
            // 根據天氣稍微增減
            let mod = 1.0;
            if (w === 'rainy') mod = 0.8;
            if (w === 'typhoon') mod = 0.05;
            return Math.max(0, Math.round(est * mod));
          }
        };
      }

      const timeVal = timeIdx !== -1 && cols[timeIdx] ? cols[timeIdx].trim() : `${parsedSpots[spotId].hourly.length + 1}點`;

      parsedSpots[spotId].hourly.push({
        hour: parsedSpots[spotId].hourly.length, // 用索引代表時間
        timeLabel: timeVal,
        temp: temp,
        flow: flow
      });
    }

    const newSpots = Object.values(parsedSpots);
    if (newSpots.length === 0) throw new Error('無有效數據列！');

    // 清除地圖舊的自訂 Marker 與著色圈
    Object.keys(STATE.mapMarkers).forEach(key => {
      STATE.map.removeLayer(STATE.mapMarkers[key]);
    });
    STATE.mapMarkers = {};
    if (STATE.idwLayer && STATE.map.hasLayer(STATE.idwLayer)) {
      STATE.map.removeLayer(STATE.idwLayer);
    }
    STATE.idwLayer = null;

    // 套用新景點資料
    STATE.spots = newSpots;
    STATE.customDataActive = true;
    
    // 顯示「回復預設」按鈕
    document.getElementById('btn-reset-upload').classList.remove('hidden');

    showToast(`成功匯入 ${newSpots.length} 個自訂站點數據！`, 'success');
    
    // 切換到第一個解析到的自訂站點
    selectSpot(newSpots[0].id);
    updateMapMarkers();

  } catch (error) {
    showToast(`CSV 解析失敗：${error.message}`, 'danger');
    console.error(error);
  }
}

// 建立並下載範例 CSV 格式檔案
function downloadSampleCSV() {
  const csvContent = 
`spot_name,latitude,longitude,temperature,pedestrian_flow,time
自訂公園,25.0424,121.5135,22,500,10點
自訂公園,25.0424,121.5135,24,620,11點
自訂公園,25.0424,121.5135,26,750,12點
自訂公園,25.0424,121.5135,28,880,13點
自訂公園,25.0424,121.5135,27,810,14點
自訂公園,25.0424,121.5135,25,650,15點
自訂商場,25.0336,121.5648,22,300,10點
自訂商場,25.0336,121.5648,24,350,11點
自訂商場,25.0336,121.5648,26,450,12點
自訂商場,25.0336,121.5648,28,580,13點
自訂商場,25.0336,121.5648,27,510,14點
自訂商場,25.0336,121.5648,25,480,15點`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'cwa_pedestrian_sample.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ==========================================================================
// 8. 輔助函數 (Helper Functions)
// ==========================================================================
// 取得各個觀測站點相對於台北主測站 (taipei101) 的氣溫偏差值
function getSpotOffset(spot) {
  if (!spot) return 0;
  const taipeiSpot = STATE.spots.find(s => s.id === 'taipei101');
  if (!taipeiSpot || !taipeiSpot.monthly || !spot.monthly) return 0;
  
  const taipeiAvg = taipeiSpot.monthly.reduce((sum, m) => sum + m.temp, 0) / taipeiSpot.monthly.length;
  const spotAvg = spot.monthly.reduce((sum, m) => sum + m.temp, 0) / spot.monthly.length;
  
  return spotAvg - taipeiAvg;
}

// 依邊界基底氣溫與偏差值，推估點選地區的模擬氣溫
function getSpotSimulatedTemp(spot, tempAdj) {
  const baseTemp = 25; // 台北核心舒適基準溫
  return baseTemp + getSpotOffset(spot) + tempAdj;
}

function updateSliderDisplay(val) {
  const sign = val >= 0 ? '+' : '';
  document.getElementById('temp-val-display').textContent = `${sign}${val.toFixed(1)}°C`;
}

function updateSliderCategory(val, descSpan) {
  if (val < 15) {
    descSpan.textContent = '寒冷';
    descSpan.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
    descSpan.style.color = '#60a5fa';
  } else if (val >= 15 && val <= 28) {
    descSpan.textContent = '舒適';
    descSpan.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
    descSpan.style.color = '#34d399';
  } else if (val > 28 && val <= 33) {
    descSpan.textContent = '炎熱';
    descSpan.style.backgroundColor = 'rgba(245, 158, 11, 0.2)';
    descSpan.style.color = '#fbbf24';
  } else {
    descSpan.textContent = '酷熱';
    descSpan.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
    descSpan.style.color = '#f87171';
  }
}


// Toast 吐司提示訊息
function showToast(message, type = 'info') {
  // 建立 Toast 元素並加入 DOM
  const toast = document.createElement('div');
  toast.className = `toast-message toast-${type}`;
  
  let icon = 'info-circle';
  if (type === 'success') icon = 'circle-check';
  if (type === 'warning') icon = 'exclamation-triangle';
  if (type === 'danger') icon = 'circle-exclamation';

  toast.innerHTML = `
    <i class="fa-solid fa-${icon}"></i>
    <span>${message}</span>
  `;
  
  // 樣式注入 (避免污染 style.css 並動態排版)
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    backgroundColor: 'var(--bg-darker)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 20px',
    color: '#fff',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    zIndex: 9999,
    boxShadow: 'var(--shadow-lg)',
    animation: 'toast-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards'
  });

  // 動態添加樣式邊框
  if (type === 'success') toast.style.borderLeft = '4px solid var(--color-success)';
  if (type === 'warning') toast.style.borderLeft = '4px solid var(--color-warning)';
  if (type === 'danger') toast.style.borderLeft = '4px solid var(--color-danger)';
  if (type === 'info') toast.style.borderLeft = '4px solid var(--color-info)';

  document.body.appendChild(toast);

  // 3 秒後自動淡出銷毀
  setTimeout(() => {
    toast.style.animation = 'toast-out 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// 將 CSS 動態動畫加入
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes toast-in {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes toast-out {
  from { transform: translateY(0); opacity: 1; }
  to { transform: translateY(20px); opacity: 0; }
}
`;
document.head.appendChild(styleSheet);

// ==========================================================================
// 9. 歷史運量資料載入與處理
// ==========================================================================

// 載入可選月份列表
async function loadHistoricalMonths() {
  const select = document.getElementById('mrt-month-select');
  if (!select) return;

  try {
    const response = await fetch('./data/months.json?v=5.1');
    if (!response.ok) throw new Error('無法取得月份清單');
    const months = await response.json();

    select.innerHTML = '';
    
    const placeholderOpt = document.createElement('option');
    placeholderOpt.value = '';
    placeholderOpt.textContent = '請選擇年份與月份...';
    select.appendChild(placeholderOpt);

    months.forEach(m => {
      const opt = document.createElement('option');
      opt.value = `${m.year}-${m.month}`;
      opt.textContent = `${m.year} 年 ${m.month.toString().padStart(2, '0')} 月`;
      select.appendChild(opt);
    });
  } catch (error) {
    console.error('載入月份清單出錯:', error);
    select.innerHTML = '<option value="">載入失敗，請重新整理</option>';
    showToast('載入捷運歷史月份清單失敗！', 'danger');
  }
}
// 從後端載入所有已註冊的真實歷史資料，重新建構預設的模擬迴歸算法
async function initBaseSimulation() {
  const select = document.getElementById('mrt-month-select');
  if (!select) return;

  try {
    const response = await fetch('./data/months.json?v=5.1');
    if (!response.ok) throw new Error('無法取得月份清單');
    const months = await response.json();
    
    // 初始化所有 spots 的 allHistoryData 用於合併
    STATE.spots.forEach(s => s.allHistoryData = []);

    // 依序抓取所有可用月份的 JSON
    for (const m of months) {
      const monthStr = m.month.toString().padStart(2, '0');
      const url = `./data/mrt_${m.year}_${monthStr}.json?v=5.1`;
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          data.forEach(item => {
            const spotId = mapStationNameToId(item.spot_name);
            if (spotId) {
              const spot = STATE.spots.find(s => s.id === spotId);
              if (spot) {
                if (!spot.allHistoryData) spot.allHistoryData = [];
                spot.allHistoryData.push({
                  temp: item.temperature,
                  flow: item.pedestrian_flow,
                  timeLabel: item.time
                });
              }
            }
          });
        }
      } catch (err) {
        console.error(`載入 ${m.year}/${monthStr} 的基礎資料失敗:`, err);
      }
    }

    // 計算各站線性迴歸，並覆寫其模擬預測算法與小時/月份數據
    STATE.spots.forEach(spot => {
      if (spot.allHistoryData && spot.allHistoryData.length > 0) {
        const temps = spot.allHistoryData.map(h => h.temp);
        const flows = spot.allHistoryData.map(h => h.flow);
        const stats = calculateRegression(temps, flows);
        
        // 1. 覆寫預設模擬函數 (直套日流量線性迴歸)
        spot.simulate = (t, w) => {
          const est = stats.slope * t + stats.intercept;
          let mod = 1.0;
          if (w === 'rainy') mod = 0.8;
          if (w === 'typhoon') mod = 0.1;
          if (w === 'cold') mod = 0.9;
          return Math.max(0, Math.round(est * mod));
        };

        // 2. 重新對齊預設的 hourly 數據集 (將估算日流量除以 24 作為逐時平均值呈現)
        if (spot.hourly) {
          spot.hourly = spot.hourly.map(h => ({
            hour: h.hour,
            temp: h.temp,
            flow: Math.round(spot.simulate(h.temp, 'sunny') / 24)
          }));
        }

        // 3. 重新對齊預設的 monthly 數據集 (直接使用日運量)
        if (spot.monthly) {
          spot.monthly = spot.monthly.map(m => {
            // 如果該月份有真實資料，直接使用真實資料的平均日運量
            const monthStr = m.month.toString().padStart(2, '0');
            const monthData = spot.allHistoryData.filter(h => h.timeLabel.startsWith(monthStr + '/'));
            if (monthData.length > 0) {
              const avgFlow = monthData.reduce((sum, d) => sum + d.flow, 0) / monthData.length;
              const avgTemp = monthData.reduce((sum, d) => sum + d.temp, 0) / monthData.length;
              return {
                month: m.month,
                temp: Math.round(avgTemp * 10) / 10,
                flow: Math.round(avgFlow)
              };
            } else {
              // 沒有真實資料的月份，採用迴歸預測日運量
              return {
                month: m.month,
                temp: m.temp,
                flow: spot.simulate(m.temp, 'sunny')
              };
            }
          });
        }
      }
    });

    // 重新更新地圖標記與看板，使網頁啟動即呈現基於現實的迴歸預估
    updateMapMarkers();
    updateDashboard();
    console.log("✨ 已成功根據 2026 現實歷史資料初始化迴歸模擬預測模型！");
  } catch (error) {
    console.error('資源初始化現實資料迴歸模擬出錯:', error);
  }
}

// 從後端載入真實 MRT 資料與氣溫資料
async function loadRealMrtData(year, month) {
  const overlay = document.getElementById('loading-overlay');
  const statusEl = document.getElementById('loading-status');
  const titleEl = document.getElementById('loading-title');
  
  if (overlay) {
    overlay.classList.remove('hidden');
    if (titleEl) titleEl.textContent = `載入歷史數據 (${year}/${month.toString().padStart(2, '0')})`;
    if (statusEl) statusEl.textContent = '正在發送請求至後端伺服器...';
  }

  // 設置定時提示點點點
  let dotCount = 0;
  const statusInterval = setInterval(() => {
    dotCount = (dotCount + 1) % 4;
    const dots = '.'.repeat(dotCount);
    if (statusEl) {
      statusEl.textContent = `伺服器正在下載大數據與對齊氣候資料中${dots}\n(首次載入約需 5-10 秒，完成快取後僅需 0.05 秒)`;
    }
  }, 3000);

  try {
    const monthStr = month.toString().padStart(2, '0');
    const url = `./data/mrt_${year}_${monthStr}.json?v=5.1`;
    
    console.log(`Fetching static data from: ${url}`);
    const response = await fetch(url);
    clearInterval(statusInterval);
    
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `伺服器回傳錯誤: ${response.status}`);
    }

    const data = await response.json();
    if (statusEl) statusEl.textContent = '資料處理完成，正在載入前端...';
    
    // 初始化或複製一份景點資料，以便能填入歷史數據
    STATE.spots = SPOTS_DATA.map(spot => ({ ...spot }));
    STATE.spots.forEach(s => s.historyData = []);
    STATE.historyMonth = month;

    data.forEach(item => {
      const spotId = mapStationNameToId(item.spot_name);
      if (spotId) {
        const spot = STATE.spots.find(s => s.id === spotId);
        if (spot) {
          if (!spot.historyData) spot.historyData = [];
          spot.historyData.push({
            temp: item.temperature,
            flow: item.pedestrian_flow,
            timeLabel: item.time
          });
        }
      }
    });

    // 檢查是否有有效載入數據
    const totalDataPoints = STATE.spots.reduce((sum, s) => sum + (s.historyData ? s.historyData.length : 0), 0);
    if (totalDataPoints === 0) {
      throw new Error('未在回傳資料中找到目標捷運站點的數據！');
    }

    // 動態覆寫歷史資料的 simulate 模型
    STATE.spots.forEach(spot => {
      if (spot.historyData && spot.historyData.length > 0) {
        const temps = spot.historyData.map(h => h.temp);
        const flows = spot.historyData.map(h => h.flow);
        const stats = calculateRegression(temps, flows);
        
        spot.simulate = (t, w) => {
          const est = stats.slope * t + stats.intercept;
          let mod = 1.0;
          if (w === 'rainy') mod = 0.8;
          if (w === 'typhoon') mod = 0.1;
          if (w === 'cold') mod = 0.9;
          return Math.max(0, Math.round(est * mod));
        };
      }
    });

    // 更新狀態
    STATE.mode = 'history';
    STATE.historyViewMode = 'real';
    
    // 顯示檢視模式切換器並預設選中「真實歷史平均」
    const togglePanel = document.getElementById('history-mode-toggle');
    if (togglePanel) togglePanel.classList.remove('hidden');
    document.querySelectorAll('.history-toggle-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === 'real');
    });
    
    const badge = document.getElementById('mode-badge');
    const badgeText = badge.querySelector('.badge-text');
    badge.className = 'badge badge-live';
    badgeText.textContent = `真實歷史平均 (${year}/${monthStr})`;
    
    // 鎖定模擬器 (因為此時為真實歷史平均，不能模擬)
    document.getElementById('temp-slider').disabled = true;
    document.querySelectorAll('.weather-btn:not(.history-toggle-btn)').forEach(b => b.disabled = true);
    
    // 將拉桿調整值重設為 0
    STATE.tempAdj = 0;

    // 顯示「回復預設」按鈕以利重置
    const btnResetUpload = document.getElementById('btn-reset-upload');
    if (btnResetUpload) btnResetUpload.classList.remove('hidden');

    // 歷史模式下如果選取了沒有數據的景點（例如陽明山），則自動切換至有數據的捷運站點
    const activeSpot = STATE.spots.find(s => s.id === STATE.selectedSpotId);
    if (!activeSpot || !activeSpot.historyData || activeSpot.historyData.length === 0) {
      const nextSpot = STATE.spots.find(s => s.historyData && s.historyData.length > 0);
      if (nextSpot) {
        STATE.selectedSpotId = nextSpot.id;
      }
    }

    // 更新地圖與圖表儀表板
    updateMapMarkers();
    updateDashboard();

    showToast(`成功載入 ${year} 年 ${month} 月之台北捷運運量與氣候歷史數據！`, 'success');
  } catch (error) {
    clearInterval(statusInterval);
    console.error('載入真實歷史數據出錯:', error);
    showToast(`歷史資料載入失敗：${error.message}`, 'danger');
  } finally {
    if (overlay) {
      overlay.classList.add('hidden');
    }
  }
}

// 站點名稱到 ID 映射
function mapStationNameToId(name) {
  // 1. 特殊規則或精確名稱映射 (台鐵簡稱對應到主要車站 ID)
  const traMapping = {
    '基隆': 'tra-keelung',
    '基隆車站': 'tra-keelung',
    '桃園': 'tra-taoyuan',
    '桃園車站': 'tra-taoyuan',
    '新竹': 'tra-hsinchu',
    '新竹車站': 'tra-hsinchu',
    '台中': 'tra-taichung',
    '臺中': 'tra-taichung',
    '台中車站': 'tra-taichung',
    '臺中車站': 'tra-taichung',
    '彰化': 'tra-changhua',
    '彰化車站': 'tra-changhua',
    '嘉義': 'tra-chiayi',
    '嘉義車站': 'tra-chiayi',
    '台南': 'tra-tainan',
    '臺南': 'tra-tainan',
    '台南車站': 'tra-tainan',
    '臺南車站': 'tra-tainan',
    '高雄': 'tra-kaohsiung',
    '高雄車站': 'tra-kaohsiung',
    '屏東': 'tra-pingtung',
    '屏東車站': 'tra-pingtung',
    '宜蘭': 'tra-yilan',
    '宜蘭車站': 'tra-yilan',
    '花蓮': 'tra-hualien',
    '花蓮車站': 'tra-hualien',
    '台東': 'tra-taitung',
    '臺東': 'tra-taitung',
    '台東車站': 'tra-taitung',
    '臺東車站': 'tra-taitung',
    '苗栗': 'tra-miaoli',
    '苗栗車站': 'tra-miaoli',
    '斗六': 'tra-douliu',
    '斗六車站': 'tra-douliu'
  };

  if (traMapping[name]) return traMapping[name];

  if (name.includes('西門')) return 'ximending';
  if (name.includes('101')) return 'taipei101';
  if (name.includes('士林')) return 'shilin';
  if (name.includes('淡水')) return 'tamsui';
  if (name.includes('動物園')) return 'zoo';
  if (name.includes('中山')) return 'zhongshan';
  if (name.includes('公館')) return 'gongguan';
  if (name.includes('板橋')) return 'banqiao';
  if (name.includes('新店')) return 'xindian';
  if (name.includes('北投')) return 'xinbeitou';

  // 2. 如果都不是簡稱，再精確比對測站 (包含隱藏的氣象觀測點，使其能載入歷史溫度數據)
  const exactSpot = STATE.spots.find(s => s.name === name);
  if (exactSpot) return exactSpot.id;

  return null;
}

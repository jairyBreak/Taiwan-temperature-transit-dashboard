import { SPOTS_DATA, calculateCorrelation, calculateRegression, getCorrelationText } from './data.js';

// ==========================================================================
// 1. 全域應用程式狀態 (State)
// ==========================================================================
const STATE = {
  mode: 'simulation', // 'simulation' 或 'live'
  spots: SPOTS_DATA.map(spot => ({ ...spot })), // 複製預設景點資料並保留模擬函數
  selectedSpotId: 'taipei101',
  simTemp: 25,
  simWeather: 'sunny',
  charts: {
    scatter: null,
    line: null
  },
  map: null,
  mapMarkers: {},
  activeDataType: 'hourly', // 'hourly' 或 'monthly'
  historyViewMode: 'model', // 'model' (動態推算) 或 'real' (靜態歷史平均)
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
  updateDashboard();
  setupEventListeners();
  loadHistoricalMonths();
});

// 初始化 UI 元件的預設顯示
function initUI() {
  renderSpotsList();
  updateSliderDisplay(STATE.simTemp);
}

// ==========================================================================
// 3. 地圖管理 (Leaflet.js)
// ==========================================================================
function initMap() {
  // 建立台北市中心的 Leaflet 地圖
  STATE.map = L.map('map', {
    zoomControl: true,
    attributionControl: false
  }).setView([25.085, 121.515], 11.5);

  // 使用 CartoDB Dark Matter 暗色系圖磚，符合本站酷炫深色美學
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 20
  }).addTo(STATE.map);

  // 繪製地圖標記
  updateMapMarkers();
}

// 根據目前狀態與模擬數據更新地圖標記的大小與顏色
function updateMapMarkers() {
  const currentTemp = STATE.simTemp;
  const currentWeather = STATE.simWeather;

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
    
    if (STATE.mode === 'history' && STATE.historyViewMode === 'real') {
      const hist = spot.historyData || [];
      const sumTemp = hist.reduce((sum, d) => sum + d.temp, 0);
      const sumFlow = hist.reduce((sum, d) => sum + d.flow, 0);
      temp = sumTemp / hist.length;
      flow = Math.round(sumFlow / hist.length);
    } else {
      flow = STATE.mode === 'live' && spot.liveFlow !== undefined 
        ? spot.liveFlow 
        : spot.simulate(currentTemp, currentWeather);
        
      temp = STATE.mode === 'live' && spot.liveTemp !== undefined 
        ? spot.liveTemp 
        : currentTemp;
    }

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
    const pulseScale = STATE.mode === 'history'
      ? Math.min(60, 15 + (flow / 1200)) // 歷史日均人流量較大，除以較大常數
      : Math.min(60, 15 + (flow / 35)); // 限制最大波紋半徑
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
    const labelFlow = STATE.mode === 'history' ? (STATE.historyViewMode === 'real' ? '歷史日均人流' : '模型預估日人流') : '估計時人流';
    const unitFlow = STATE.mode === 'history' ? '人次/日' : '人次/小時';
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
  badge.className = 'badge badge-sim';
  badgeText.textContent = '模擬展示模式';
  document.getElementById('temp-slider').disabled = false;
  document.querySelectorAll('.weather-btn:not(.history-toggle-btn)').forEach(b => b.disabled = false);
  document.getElementById('history-mode-toggle').classList.add('hidden');
  updateSliderDisplay(STATE.simTemp);
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
      // 如果處於即時模式，將「模擬氣溫」拉桿值移至當前選中景點的即時氣溫
      const activeSpot = STATE.spots.find(s => s.id === STATE.selectedSpotId);
      if (activeSpot && activeSpot.liveTemp !== undefined) {
        STATE.simTemp = activeSpot.liveTemp;
        document.getElementById('temp-slider').value = STATE.simTemp.toFixed(1);
        document.getElementById('temp-val-display').textContent = STATE.simTemp.toFixed(1);
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
  
  if (STATE.mode === 'history' && STATE.historyViewMode === 'real') {
    const hist = spot.historyData || [];
    const sumTemp = hist.reduce((sum, d) => sum + d.temp, 0);
    const sumFlow = hist.reduce((sum, d) => sum + d.flow, 0);
    currentTemp = sumTemp / hist.length;
    flow = Math.round(sumFlow / hist.length);
  } else {
    currentTemp = STATE.mode === 'live' && spot.liveTemp !== undefined ? spot.liveTemp : STATE.simTemp;
    flow = STATE.mode === 'live' && spot.liveFlow !== undefined 
      ? spot.liveFlow 
      : spot.simulate(STATE.simTemp, STATE.simWeather);
  }
    
  const cardTitle = document.querySelector('#stat-simulated h3');
  const cardTrend = document.querySelector('#stat-simulated .stat-trend');

  if (STATE.mode === 'history') {
    if (cardTitle) cardTitle.textContent = STATE.historyViewMode === 'real' ? '真實歷史平均人流量' : '模型推算人流量';
    if (cardTrend) cardTrend.textContent = '單位：日出站人次';
  } else {
    if (cardTitle) cardTitle.textContent = '當前估計人流量';
    if (cardTrend) cardTrend.textContent = '單位：預估參訪人次 / 小時';
  }
  
  document.getElementById('val-sim-flow').textContent = flow.toLocaleString();

  // B. 重新整理景點列表右側顯示的流量
  renderSpotsList();

  // C. 進行統計學相關性分析
  // 決定使用小時資料(hourly)、月份資料(monthly)或歷史資料(historyData)作為分析集
  const dataset = STATE.mode === 'history' ? (spot.historyData || []) : (STATE.activeDataType === 'hourly' ? spot.hourly : spot.monthly);
  const temperatures = dataset.map(d => d.temp);
  const flows = dataset.map(d => d.flow);

  // 計算相關性與迴歸
  const stats = calculateRegression(temperatures, flows);

  // 更新分析儀表板
  document.getElementById('val-corr').textContent = stats.r.toFixed(3);
  document.getElementById('val-r2').textContent = stats.r2.toFixed(3);
  
  // 迴歸方程式字串格式化 (y = ax + b)
  const equation = `y = ${stats.slope.toFixed(2)}x ${stats.intercept >= 0 ? '+' : '-'} ${Math.abs(stats.intercept).toFixed(1)}`;
  document.getElementById('val-reg').textContent = equation;

  // 皮爾森相關係數狀態說明
  const corrDesc = document.getElementById('desc-corr');
  const absR = Math.abs(stats.r);
  if (absR >= 0.7) {
    corrDesc.textContent = stats.r > 0 ? '強烈正相關' : '強烈負相關';
    corrDesc.style.color = stats.r > 0 ? 'var(--color-success)' : 'var(--color-danger)';
  } else if (absR >= 0.4) {
    corrDesc.textContent = stats.r > 0 ? '中度正相關' : '中度負相關';
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
      <li>分析數據週期：${STATE.mode === 'history' ? '歷史月份每日氣溫與實際捷運運量 (日資料)' : (STATE.activeDataType === 'hourly' ? '今日逐時氣溫與預估人流 (24H)' : '歷史月份平均氣溫與統計人流 (12個月)')}</li>
      <li>相關性強度：${getCorrelationText(stats.r, spot.typeName, spot.name)}</li>
      <li>決定係數 ($R^2$ = ${stats.r2.toFixed(3)})：代表氣溫變化可以解釋大約 **${(stats.r2 * 100).toFixed(1)}%** 的人流量起伏。</li>
    </ul>
    <p style="margin-top: 8px; font-size: 0.85rem;"><i class="fa-solid fa-lightbulb" style="color: var(--color-warning);"></i> <strong>決策建議：</strong> 
    ${spot.type === 'indoor' 
      ? '在極端氣溫（盛夏或酷寒）下，此區域人流顯著飆升。建議百貨商場適度調降室內空調溫度，並在戶外入口安排引導，甚至搭配雨天/高溫折扣活動以引導流量。' 
      : '此為典型戶外景區，高溫與降雨是人潮的最大殺手。建議景區管理處多增設遮陽棚、飲水機、以及室內休息站，或規劃低溫與下雨特製的黃昏與夜間遊程，以調節極端天氣帶來的人流衝擊。'}
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
  const minX = Math.min(...xData) - 1;
  const maxX = Math.max(...xData) + 1;
  const linePoints = [
    { x: minX, y: stats.slope * minX + stats.intercept },
    { x: maxX, y: stats.slope * maxX + stats.intercept }
  ];

  // 計算當前模擬預測點
  const currentSpot = STATE.spots.find(s => s.id === STATE.selectedSpotId);
  const simFlow = currentSpot ? currentSpot.simulate(STATE.simTemp, STATE.simWeather) : 0;
  const simPoint = (STATE.mode === 'history' && STATE.historyViewMode === 'real') ? [] : [{ x: STATE.simTemp, y: simFlow }];

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
          pointRadius: 6,
          pointHoverRadius: 8,
          zIndex: 2
        },
        {
          label: `趨勢線 (y = ${stats.slope.toFixed(2)}x ${stats.intercept >= 0 ? '+' : '-'} ${Math.abs(stats.intercept).toFixed(1)})`,
          data: linePoints,
          type: 'line',
          borderColor: 'rgba(99, 102, 241, 0.85)',
          borderWidth: 2,
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
          labels: { color: '#f3f4f6', font: { family: 'Outfit, Noto Sans TC' } }
        }
      },
      scales: {
        x: {
          title: { display: true, text: '氣溫 (°C)', color: '#9ca3af' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9ca3af' }
        },
        y: {
          title: { display: true, text: '人流量 (人次/小時)', color: '#9ca3af' },
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

  // 取得 X 軸標籤與雙軸 Y 資料
  let labels;
  if (STATE.mode === 'history') {
    labels = dataset.map(d => d.timeLabel);
  } else {
    labels = STATE.activeDataType === 'hourly' 
      ? dataset.map(d => `${d.hour}點`) 
      : dataset.map(d => `${d.month}月`);
  }
    
  const tempFlow = dataset.map(d => d.flow);
  const tempWeatherData = dataset.map(d => d.temp);

  STATE.charts.line = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: STATE.mode === 'history' ? '捷運出站運量' : '人流量',
          data: tempFlow,
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6, 182, 212, 0.1)',
          fill: true,
          tension: 0.3,
          yAxisID: 'y'
        },
        {
          label: '氣溫 (°C)',
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
      flow = STATE.mode === 'live' && spot.liveFlow !== undefined 
        ? spot.liveFlow 
        : spot.simulate(STATE.simTemp, STATE.simWeather);
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
    STATE.simTemp = val;
    updateSliderDisplay(val);
    updateMapMarkers();
    updateDashboard();
  });

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
    updateMapMarkers();
    updateDashboard();
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

    // 清除地圖舊的自訂 Marker
    Object.keys(STATE.mapMarkers).forEach(key => {
      STATE.map.removeLayer(STATE.mapMarkers[key]);
    });
    STATE.mapMarkers = {};

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
function updateSliderDisplay(val) {
  document.getElementById('temp-val-display').textContent = val.toFixed(1);
  const descSpan = document.getElementById('temp-desc');
  
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
    const response = await fetch('./data/months.json');
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
    const url = `./data/mrt_${year}_${monthStr}.json`;
    
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
    STATE.historyViewMode = 'model';
    
    // 顯示檢視模式切換器並預設選中「模型推算」
    const togglePanel = document.getElementById('history-mode-toggle');
    if (togglePanel) togglePanel.classList.remove('hidden');
    document.querySelectorAll('.history-toggle-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === 'model');
    });
    
    const badge = document.getElementById('mode-badge');
    const badgeText = badge.querySelector('.badge-text');
    badge.className = 'badge badge-live';
    badgeText.textContent = `真實模型預測 (${year}/${month.toString().padStart(2, '0')})`;
    
    // 解除模擬器鎖定
    document.getElementById('temp-slider').disabled = false;
    document.querySelectorAll('.weather-btn:not(.history-toggle-btn)').forEach(b => b.disabled = false);
    
    // 將拉桿更新至真實歷史資料的平均溫度作為初始值
    const validSpots = STATE.spots.filter(s => s.historyData && s.historyData.length > 0);
    if (validSpots.length > 0) {
      const allHistTemp = validSpots.map(s => s.historyData.map(h => h.temp)).flat();
      const avgHistTemp = allHistTemp.reduce((a, b) => a + b, 0) / allHistTemp.length;
      STATE.simTemp = Math.round(avgHistTemp * 10) / 10;
      document.getElementById('temp-slider').value = STATE.simTemp;
      updateSliderDisplay(STATE.simTemp);
    }

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
  if (name.includes('西門')) return 'ximending';
  if (name.includes('101')) return 'taipei101';
  if (name.includes('士林')) return 'shilin';
  if (name.includes('淡水')) return 'tamsui';
  
  // 台鐵車站映射
  const traMapping = {
    '基隆車站': 'tra-keelung',
    '桃園車站': 'tra-taoyuan',
    '新竹車站': 'tra-hsinchu',
    '台中車站': 'tra-taichung',
    '彰化車站': 'tra-changhua',
    '嘉義車站': 'tra-chiayi',
    '台南車站': 'tra-tainan',
    '高雄車站': 'tra-kaohsiung',
    '屏東車站': 'tra-pingtung',
    '宜蘭車站': 'tra-yilan',
    '花蓮車站': 'tra-hualien',
    '台東車站': 'tra-taitung'
  };
  
  if (traMapping[name]) return traMapping[name];
  
  return null;
}

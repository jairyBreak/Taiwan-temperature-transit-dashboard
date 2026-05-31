// 台北市景點氣溫與人流特徵資料集
export const SPOTS_DATA = [
  {
    id: "taipei101",
    name: "台北 101 商圈",
    type: "indoor",
    typeName: "室內商業區",
    lat: 25.033976,
    lng: 121.564478,
    stationId: "466920", // 臺北測站
    stationName: "臺北",
    description: "信義計畫區核心，集購物中心、觀景台與商辦於一體。高溫或雨天時具有強烈的避暑避雨效應，人流量不減反增。",
    hourly: [
      { hour: 9, temp: 28, flow: 320 },
      { hour: 10, temp: 30, flow: 580 },
      { hour: 11, temp: 32, flow: 950 },
      { hour: 12, temp: 33, flow: 1200 }, // 午餐避暑尖峰
      { hour: 13, temp: 34, flow: 1150 },
      { hour: 14, temp: 35, flow: 1300 }, // 下午酷熱，室內人流湧入
      { hour: 15, temp: 34, flow: 1450 },
      { hour: 16, temp: 33, flow: 1380 },
      { hour: 17, temp: 32, flow: 1250 },
      { hour: 18, temp: 31, flow: 1500 }, // 下班晚餐人流
      { hour: 19, temp: 30, flow: 1650 },
      { hour: 20, temp: 29, flow: 1400 },
      { hour: 21, temp: 29, flow: 980 },
      { hour: 22, temp: 28, flow: 450 }
    ],
    monthly: [
      { month: 1, temp: 16.1, flow: 1100 },
      { month: 2, temp: 16.5, flow: 1250 }, // 台北燈會效應
      { month: 3, temp: 18.5, flow: 1050 },
      { month: 4, temp: 21.9, flow: 1120 },
      { month: 5, temp: 25.2, flow: 1080 },
      { month: 6, temp: 28.2, flow: 1280 },
      { month: 7, temp: 29.6, flow: 1480 }, // 暑期冷氣效應
      { month: 8, temp: 29.2, flow: 1420 },
      { month: 9, temp: 27.4, flow: 1150 },
      { month: 10, temp: 24.5, flow: 1220 },
      { month: 11, temp: 21.5, flow: 1350 }, // 百貨週年慶
      { month: 12, temp: 17.9, flow: 1750 }  // 跨年活動極限人流
    ],
    // 溫度與人流模擬公式 (室內特徵：高溫人流上升)
    simulate: (temp, weather) => {
      let baseFlow = 800;
      
      // 溫度效應：溫度高於28度，冷氣吸引人潮；溫度低於16度，室內避寒人潮
      if (temp > 28) {
        baseFlow += (temp - 28) * 45;
      } else if (temp < 18) {
        baseFlow += (18 - temp) * 20;
      } else {
        baseFlow -= (temp - 18) * 12; // 舒適氣溫，大家去戶外，室內人流略降
      }
      
      // 天氣修正：下雨對室內商場影響極小，甚至可能略微增加避雨人潮；颱風全館打折或休息人流歸零
      if (weather === "rainy") {
        baseFlow *= 1.08; 
      } else if (weather === "typhoon") {
        baseFlow *= 0.05;
      } else if (weather === "cold") {
        baseFlow *= 1.15; // 寒流加成避寒
      }
      
      return Math.max(50, Math.round(baseFlow));
    }
  },
  {
    id: "ximending",
    name: "西門町徒步區",
    type: "semi-outdoor",
    typeName: "半戶外商圈",
    lat: 25.042385,
    lng: 121.508319,
    stationId: "466920", // 臺北測站
    stationName: "臺北",
    description: "台北代表性潮流商圈，以街區徒步區為主。氣溫適中時人潮最多；炎夏中午人流會縮減，但傍晚與夜間會快速回補。對降雨極度敏感。",
    hourly: [
      { hour: 9, temp: 28, flow: 150 },
      { hour: 10, temp: 30, flow: 320 },
      { hour: 11, temp: 32, flow: 580 },
      { hour: 12, temp: 33, flow: 720 },
      { hour: 13, temp: 34, flow: 680 }, // 高溫炎熱，人流微幅下降
      { hour: 14, temp: 35, flow: 650 },
      { hour: 15, temp: 34, flow: 780 },
      { hour: 16, temp: 33, flow: 920 }, // 溫度稍降，人流回升
      { hour: 17, temp: 32, flow: 1150 },
      { hour: 18, temp: 31, flow: 1480 },
      { hour: 19, temp: 30, flow: 1720 }, // 夜間高峰
      { hour: 20, temp: 29, flow: 1600 },
      { hour: 21, temp: 29, flow: 1200 },
      { hour: 22, temp: 28, flow: 650 }
    ],
    monthly: [
      { month: 1, temp: 16.1, flow: 1200 },
      { month: 2, temp: 16.5, flow: 1380 }, // 春節寒假效應
      { month: 3, temp: 18.5, flow: 1100 },
      { month: 4, temp: 21.9, flow: 1250 },
      { month: 5, temp: 25.2, flow: 1050 }, // 梅雨季影響
      { month: 6, temp: 28.2, flow: 1180 },
      { month: 7, temp: 29.6, flow: 1400 }, // 暑假學生潮
      { month: 8, temp: 29.2, flow: 1350 },
      { month: 9, temp: 27.4, flow: 1120 },
      { month: 10, temp: 24.5, flow: 1300 }, // 氣候舒適
      { month: 11, temp: 21.5, flow: 1210 },
      { month: 12, temp: 17.9, flow: 1550 } // 年底節慶
    ],
    simulate: (temp, weather) => {
      let baseFlow = 1100;
      
      // 溫度效應：極佳適溫為 22~26 度；過高(>32)或過低(<14)都會減少逛街意願
      if (temp > 26) {
        baseFlow -= (temp - 26) * 30;
      } else if (temp < 22) {
        baseFlow -= (22 - temp) * 20;
      }
      
      // 天氣修正：下雨會顯著減少街區逛街人潮，颱風天幾乎清空
      if (weather === "rainy") {
        baseFlow *= 0.55;
      } else if (weather === "typhoon") {
        baseFlow *= 0.02;
      } else if (weather === "cold") {
        baseFlow *= 0.75;
      }
      
      return Math.max(30, Math.round(baseFlow));
    }
  },
  {
    id: "yangmingshan",
    name: "陽明山國家公園 (竹子湖)",
    type: "outdoor",
    typeName: "戶外自然景區",
    lat: 25.155829,
    lng: 121.547633,
    stationId: "466930", // 竹子湖測站
    stationName: "竹子湖",
    description: "台北近郊的避暑勝地，春季賞花（海芋、繡球花）為爆發期。氣溫高於 30°C 時山下炎熱，上山避暑人流增加；但若山上遭遇低溫寒流或大雨，遊客會急遽減少。",
    hourly: [
      { hour: 8, temp: 20, flow: 250 },
      { hour: 9, temp: 22, flow: 450 },
      { hour: 10, temp: 24, flow: 650 },
      { hour: 11, temp: 25, flow: 780 },
      { hour: 12, temp: 26, flow: 820 }, // 中午陽光普照高峰
      { hour: 13, temp: 26, flow: 790 },
      { hour: 14, temp: 25, flow: 720 },
      { hour: 15, temp: 24, flow: 550 },
      { hour: 16, temp: 22, flow: 380 }, // 下午開始降溫下山
      { hour: 17, temp: 21, flow: 180 },
      { hour: 18, temp: 20, flow: 80 }
    ],
    monthly: [
      { month: 1, temp: 11.8, flow: 150 }, // 嚴冬淡季
      { month: 2, temp: 12.3, flow: 380 }, // 櫻花季開始
      { month: 3, temp: 14.3, flow: 850 }, // 海芋季爆發
      { month: 4, temp: 17.8, flow: 980 },
      { month: 5, temp: 21.0, flow: 1200 }, // 繡球花季高峰
      { month: 6, temp: 23.8, flow: 650 },
      { month: 7, temp: 25.2, flow: 580 }, // 暑假避暑
      { month: 8, temp: 24.9, flow: 540 },
      { month: 9, temp: 23.3, flow: 410 },
      { month: 10, temp: 20.3, flow: 460 }, // 秋季芒草季
      { month: 11, temp: 17.3, flow: 320 },
      { month: 12, temp: 13.5, flow: 180 }
    ],
    simulate: (temp, weather) => {
      let baseFlow = 500;
      
      // 溫度效應：對山上而言，最舒適溫度在 18~24 度。低於 12 度冷得要命遊客銳減，高於 28 度（以竹子湖而言算高溫）也會減少戶外曝曬活動
      if (temp > 24) {
        baseFlow -= (temp - 24) * 25;
      } else if (temp < 18) {
        baseFlow -= (18 - temp) * 35;
      } else {
        baseFlow += (temp - 18) * 30; // 舒適氣溫加成
      }
      
      // 天氣修正：山區下雨會起大霧且道路濕滑，人潮直接暴跌；颱風警戒則封山歸零
      if (weather === "rainy") {
        baseFlow *= 0.20; 
      } else if (weather === "typhoon") {
        baseFlow *= 0.0;
      } else if (weather === "cold") {
        baseFlow *= 0.30; // 寒流使得高山結霜或太冷，人流極少
      }
      
      return Math.max(5, Math.round(baseFlow));
    }
  },
  {
    id: "tamsui",
    name: "淡水老街",
    type: "outdoor",
    typeName: "海岸戶外景區",
    lat: 25.170669,
    lng: 121.439818,
    stationId: "466900", // 淡水測站
    stationName: "淡水",
    description: "位於淡水河口，結合歷史街區與河岸景觀。受海風影響，冬季寒冷刺骨時遊客極少。最舒適季節為春秋傍晚賞落日；盛夏中午曝曬高溫會使人流下滑，但傍晚會回溫。",
    hourly: [
      { hour: 10, temp: 29, flow: 220 },
      { hour: 11, temp: 31, flow: 380 },
      { hour: 12, temp: 33, flow: 410 },
      { hour: 13, temp: 34, flow: 360 }, // 烈日曝曬，中午人流略降
      { hour: 14, temp: 34, flow: 450 },
      { hour: 15, temp: 33, flow: 680 },
      { hour: 16, temp: 31, flow: 980 },  // 黃昏前開始湧入
      { hour: 17, temp: 29, flow: 1450 }, // 夕陽黃金高峰
      { hour: 18, temp: 28, flow: 1200 },
      { hour: 19, temp: 27, flow: 950 },
      { hour: 20, temp: 27, flow: 650 },
      { hour: 21, temp: 26, flow: 320 }
    ],
    monthly: [
      { month: 1, temp: 15.2, flow: 320 }, // 冬季東北季風冷颼颼
      { month: 2, temp: 15.6, flow: 450 },
      { month: 3, temp: 17.6, flow: 680 },
      { month: 4, temp: 21.3, flow: 850 }, // 春暖花開
      { month: 5, temp: 24.7, flow: 800 },
      { month: 6, temp: 27.6, flow: 720 },
      { month: 7, temp: 29.1, flow: 890 }, // 暑期假日落日熱潮
      { month: 8, temp: 28.8, flow: 860 },
      { month: 9, temp: 27.1, flow: 750 },
      { month: 10, temp: 24.1, flow: 920 }, // 最舒適月份 (秋高氣爽)
      { month: 11, temp: 21.0, flow: 620 },
      { month: 12, temp: 17.1, flow: 410 }
    ],
    simulate: (temp, weather) => {
      let baseFlow = 700;
      
      // 溫度效應：極佳適溫為 22~27 度。高溫(>31)會因為無遮蔽曝曬而減少白天意願；低溫(<15)海風刺骨，人流急跌
      if (temp > 27) {
        baseFlow -= (temp - 27) * 20;
      } else if (temp < 22) {
        baseFlow -= (22 - temp) * 30;
      }
      
      // 天氣修正：下雨使得河岸活動無法進行，人流砍半以上；颱風封鎖河濱
      if (weather === "rainy") {
        baseFlow *= 0.40;
      } else if (weather === "typhoon") {
        baseFlow *= 0.01;
      } else if (weather === "cold") {
        baseFlow *= 0.50; // 寒流加強海風效應，人潮極冷清
      }
      
      return Math.max(10, Math.round(baseFlow));
    }
  },
  {
    id: "shilin",
    name: "士林夜市",
    type: "outdoor",
    typeName: "夜間戶外商圈",
    lat: 25.087920,
    lng: 121.524145,
    stationId: "466920", // 臺北測站
    stationName: "臺北",
    description: "台北最具指標性的觀光夜市，主要在夜間活動（17:00 - 24:00）。受氣溫的季節性波動影響中等，但對突發性降雨敏感度極高（多數為露天攤商）。",
    hourly: [
      { hour: 16, temp: 32, flow: 120 },
      { hour: 17, temp: 31, flow: 350 }, // 傍晚攤位陸續開張
      { hour: 18, temp: 30, flow: 850 },
      { hour: 19, temp: 29, flow: 1450 },
      { hour: 20, temp: 28, flow: 1800 }, // 晚餐消夜巔峰
      { hour: 21, temp: 28, flow: 1600 },
      { hour: 22, temp: 27, flow: 1100 },
      { hour: 23, temp: 27, flow: 580 },
      { hour: 0, temp: 26, flow: 150 }
    ],
    monthly: [
      { month: 1, temp: 16.1, flow: 850 },
      { month: 2, temp: 16.5, flow: 980 }, // 年貨與燈會延伸
      { month: 3, temp: 18.5, flow: 880 },
      { month: 4, temp: 21.9, flow: 950 },
      { month: 5, temp: 25.2, flow: 820 },
      { month: 6, temp: 28.2, flow: 910 },
      { month: 7, temp: 29.6, flow: 1100 }, // 暑期夜生活盛行
      { month: 8, temp: 29.2, flow: 1050 },
      { month: 9, temp: 27.4, flow: 890 },
      { month: 10, temp: 24.5, flow: 1020 }, // 氣候舒適
      { month: 11, temp: 21.5, flow: 900 },
      { month: 12, temp: 17.9, flow: 1150 } // 冬季熱食吸引力
    ],
    simulate: (temp, weather) => {
      let baseFlow = 1000;
      
      // 溫度效應：夜市氣溫越適中越好 (20~26度)。炎熱夏夜(>30)人流微降且集中於冷氣店面；寒冷冬夜(<15)吃藥膳排骨人潮會出來，但整體逛街人流仍微降
      if (temp > 26) {
        baseFlow -= (temp - 26) * 15;
      } else if (temp < 20) {
        baseFlow -= (20 - temp) * 10;
      }
      
      // 天氣修正：下雨對夜市打擊巨大，露天攤商多數收攤，人流大減
      if (weather === "rainy") {
        baseFlow *= 0.35;
      } else if (weather === "typhoon") {
        baseFlow *= 0.01;
      } else if (weather === "cold") {
        baseFlow *= 0.80; // 寒冬夜市人流微減，但比雨天好很多
      }
      
      return Math.max(20, Math.round(baseFlow));
    }
  }
];

const MOCK_TRA_HOURLY = [
  { hour: 9, temp: 28, flow: 1500 }, { hour: 10, temp: 30, flow: 2100 },
  { hour: 11, temp: 32, flow: 2500 }, { hour: 12, temp: 33, flow: 2700 },
  { hour: 13, temp: 34, flow: 2600 }, { hour: 14, temp: 35, flow: 2500 },
  { hour: 15, temp: 34, flow: 2800 }, { hour: 16, temp: 33, flow: 3200 },
  { hour: 17, temp: 32, flow: 4500 }, { hour: 18, temp: 31, flow: 5200 },
  { hour: 19, temp: 30, flow: 4100 }, { hour: 20, temp: 29, flow: 2900 },
  { hour: 21, temp: 29, flow: 1800 }, { hour: 22, temp: 28, flow: 1100 }
];
const MOCK_TRA_MONTHLY = [
  { month: 1, temp: 16, flow: 55000 }, { month: 2, temp: 17, flow: 60000 },
  { month: 3, temp: 20, flow: 52000 }, { month: 4, temp: 24, flow: 51000 },
  { month: 5, temp: 26, flow: 48000 }, { month: 6, temp: 29, flow: 45000 },
  { month: 7, temp: 30, flow: 58000 }, { month: 8, temp: 29, flow: 57000 },
  { month: 9, temp: 28, flow: 49000 }, { month: 10, temp: 25, flow: 53000 },
  { month: 11, temp: 22, flow: 54000 }, { month: 12, temp: 18, flow: 62000 }
];

const traStations = [
  { id: "tra-keelung", name: "基隆車站", lat: 25.132, lng: 121.740 },
  { id: "tra-taoyuan", name: "桃園車站", lat: 24.989, lng: 121.313 },
  { id: "tra-hsinchu", name: "新竹車站", lat: 24.801, lng: 120.971 },
  { id: "tra-taichung", name: "台中車站", lat: 24.137, lng: 120.686 },
  { id: "tra-changhua", name: "彰化車站", lat: 24.081, lng: 120.538 },
  { id: "tra-chiayi", name: "嘉義車站", lat: 23.479, lng: 120.440 },
  { id: "tra-tainan", name: "台南車站", lat: 22.997, lng: 120.212 },
  { id: "tra-kaohsiung", name: "高雄車站", lat: 22.639, lng: 120.302 },
  { id: "tra-pingtung", name: "屏東車站", lat: 22.669, lng: 120.486 },
  { id: "tra-yilan", name: "宜蘭車站", lat: 24.754, lng: 121.758 },
  { id: "tra-hualien", name: "花蓮車站", lat: 23.993, lng: 121.601 },
  { id: "tra-taitung", name: "台東車站", lat: 22.793, lng: 121.123 }
];

traStations.forEach(st => {
  SPOTS_DATA.push({
    id: st.id,
    name: st.name,
    type: "semi-outdoor",
    typeName: "交通樞紐",
    lat: st.lat,
    lng: st.lng,
    stationId: "tra",
    stationName: "台鐵",
    description: "台鐵都會區主要交通樞紐，通勤與觀光人潮眾多。",
    hourly: MOCK_TRA_HOURLY,
    monthly: MOCK_TRA_MONTHLY,
    simulate: (temp, weather) => {
      let baseFlow = 2500;
      if (temp > 30) baseFlow -= (temp - 30) * 50;
      if (weather === "rainy") baseFlow *= 0.8;
      if (weather === "typhoon") baseFlow *= 0.2;
      return Math.max(0, Math.round(baseFlow));
    }
  });
});

// 計算兩個陣列的皮爾森相關係數 (Pearson's r)
export function calculateCorrelation(x, y) {
  const n = x.length;
  if (n === 0 || n !== y.length) return 0;
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  
  const avgX = sumX / n;
  const avgY = sumY / n;
  
  let num = 0;
  let denX = 0;
  let denY = 0;
  
  for (let i = 0; i < n; i++) {
    const diffX = x[i] - avgX;
    const diffY = y[i] - avgY;
    num += diffX * diffY;
    denX += diffX * diffX;
    denY += diffY * diffY;
  }
  
  if (denX === 0 || denY === 0) return 0;
  return num / Math.sqrt(denX * denY);
}

// 計算一元線性迴歸 (y = ax + b)
export function calculateRegression(x, y) {
  const n = x.length;
  if (n === 0 || n !== y.length) return { slope: 0, intercept: 0, r2: 0 };
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  
  const avgX = sumX / n;
  const avgY = sumY / n;
  
  let num = 0;
  let den = 0;
  
  for (let i = 0; i < n; i++) {
    num += (x[i] - avgX) * (y[i] - avgY);
    den += Math.pow(x[i] - avgX, 2);
  }
  
  const slope = den === 0 ? 0 : num / den;
  const intercept = avgY - slope * avgX;
  
  // 計算決定係數 R-squared
  const r = calculateCorrelation(x, y);
  const r2 = Math.pow(r, 2);
  
  return { slope, intercept, r2, r };
}

// 根據相關係數生成中文語意化分析
export function getCorrelationText(r, typeName, spotName) {
  const absR = Math.abs(r);
  let degree = "";
  let direction = r > 0 ? "正相關" : "負相關";
  
  if (absR >= 0.7) degree = "強烈";
  else if (absR >= 0.4) degree = "中度";
  else if (absR >= 0.2) degree = "低度";
  else return `在 ${spotName}，氣溫與人流量之間**幾乎沒有線性相關性**（$r$ = ${r.toFixed(2)}）。人流可能主要受時間段、節假日或特定活動影響。`;
  
  let explanation = "";
  if (r > 0) {
    if (typeName === "室內商業區") {
      explanation = "這符合典型室內商圈的「避暑/避寒效應」，當氣溫升得越高（例如炎夏）或跌得越低，人們越傾向待在有冷氣/暖氣的室內，因此人流量隨氣溫攀升而增加。";
    } else {
      explanation = "顯示氣溫升高有助於活絡該地區人潮。";
    }
  } else {
    if (typeName.includes("戶外")) {
      explanation = "這反映了典型的「戶外避熱/避寒特徵」。隨著氣溫飆高，烈日曝曬會降低遊客前往露天戶外景點的意願；同理，若遇到冬天的低溫，寒冷的氣候也會阻礙人們出門，進而導致人流量隨氣溫劇烈增減。";
    } else {
      explanation = "顯示氣溫升高反而會使人流量降低。";
    }
  }
  
  return `在 ${spotName}，氣溫與人流量呈現 **${degree}${direction}**（相關係數 $r$ = **${r.toFixed(2)}**）。${explanation}`;
}

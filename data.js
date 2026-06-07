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
      
      // 溫度效應：極佳適溫為 24 度；過高(>24)或過低(<24)都會減少逛街意願
      if (temp > 24) {
        baseFlow -= (temp - 24) * 30;
      } else {
        baseFlow -= (24 - temp) * 20;
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
    isHidden: true,
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
      { month: 1, temp: 11.8, flow: 1500 }, // 嚴冬淡季
      { month: 2, temp: 12.3, flow: 3800 }, // 櫻花季開始
      { month: 3, temp: 14.3, flow: 8500 }, // 海芋季爆發
      { month: 4, temp: 17.8, flow: 9800 },
      { month: 5, temp: 21.0, flow: 12000 }, // 繡球花季高峰
      { month: 6, temp: 23.8, flow: 6500 },
      { month: 7, temp: 25.2, flow: 5800 }, // 暑假避暑
      { month: 8, temp: 24.9, flow: 5400 },
      { month: 9, temp: 23.3, flow: 4100 },
      { month: 10, temp: 20.3, flow: 4600 }, // 秋季芒草季
      { month: 11, temp: 17.3, flow: 3200 },
      { month: 12, temp: 13.5, flow: 1800 }
    ],
    simulate: (temp, weather) => {
      let baseFlow = 5000;
      
      // 溫度效應：對山上而言，最舒適溫度在 18~24 度。低於 12 度冷得要命遊客銳減，高於 28 度（以竹子湖而言算高溫）也會減少戶外曝曬活動
      if (temp > 24) {
        baseFlow -= (temp - 24) * 250;
      } else if (temp < 18) {
        baseFlow -= (18 - temp) * 350;
      } else {
        baseFlow += (temp - 18) * 300; // 舒適氣溫加成
      }
      
      // 天氣修正：山區下雨會起大霧且道路濕滑，人潮直接暴跌；颱風警戒則封山歸零
      if (weather === "rainy") {
        baseFlow *= 0.20; 
      } else if (weather === "typhoon") {
        baseFlow *= 0.0;
      } else if (weather === "cold") {
        baseFlow *= 0.30; // 寒流使得高山結霜或太冷，人流極少
      }
      
      return Math.max(50, Math.round(baseFlow));
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
      
      // 溫度效應：極佳適溫為 24 度。高溫(>24)會因為無遮蔽曝曬而減少白天意願；低溫(<24)海風刺骨，人流急跌
      if (temp > 24) {
        baseFlow -= (temp - 24) * 20;
      } else {
        baseFlow -= (24 - temp) * 30;
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
      
      // 溫度效應：夜市氣溫越適中越好 (23度)。炎熱夏夜(>23)人流微降且集中於冷氣店面；寒冷冬夜(<23)吃藥膳排骨人潮會出來，但整體逛街人流仍微降
      if (temp > 23) {
        baseFlow -= (temp - 23) * 15;
      } else {
        baseFlow -= (23 - temp) * 10;
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
  },
  {
    id: "zoo",
    name: "動物園捷運站",
    type: "outdoor",
    typeName: "戶外生態景區",
    lat: 25.026364,
    lng: 121.577457,
    stationId: "466910",
    stationName: "臺北",
    description: "臺北市立動物園與貓空纜車樞紐。假日與晴天時家庭遊客極多，大雨或極端氣溫時人潮顯著減少。",
    hourly: [
      { hour: 9, temp: 28, flow: 800 },
      { hour: 10, temp: 30, flow: 1200 },
      { hour: 11, temp: 32, flow: 1500 },
      { hour: 12, temp: 33, flow: 1300 },
      { hour: 13, temp: 34, flow: 1100 },
      { hour: 14, temp: 35, flow: 1200 },
      { hour: 15, temp: 34, flow: 1600 },
      { hour: 16, temp: 33, flow: 1400 },
      { hour: 17, temp: 31, flow: 700 },
      { hour: 18, temp: 30, flow: 200 }
    ],
    monthly: [
      { month: 1, temp: 15.5, flow: 4500 },
      { month: 2, temp: 15.9, flow: 6800 },
      { month: 3, temp: 17.9, flow: 8500 },
      { month: 4, temp: 21.3, flow: 12000 },
      { month: 5, temp: 24.6, flow: 9500 },
      { month: 6, temp: 27.6, flow: 7500 },
      { month: 7, temp: 29.0, flow: 11000 },
      { month: 8, temp: 28.6, flow: 10500 },
      { month: 9, temp: 26.8, flow: 7800 },
      { month: 10, temp: 23.9, flow: 11500 },
      { month: 11, temp: 20.9, flow: 9000 },
      { month: 12, temp: 17.3, flow: 6000 }
    ],
    simulate: (temp, weather) => {
      let baseFlow = 15000;
      if (temp > 23) {
        baseFlow -= (temp - 23) * 350;
      } else {
        baseFlow -= (23 - temp) * 200;
      }
      
      if (weather === "rainy") {
        baseFlow *= 0.25;
      } else if (weather === "typhoon") {
        baseFlow *= 0.01;
      } else if (weather === "cold") {
        baseFlow *= 0.50;
      }
      return Math.max(100, Math.round(baseFlow));
    }
  },
  {
    id: "zhongshan",
    name: "中山捷運站",
    type: "semi-outdoor",
    typeName: "流行商圈",
    lat: 25.052685,
    lng: 121.520387,
    stationId: "466920",
    stationName: "臺北",
    description: "心中山線形公園與南西商圈。高溫或降雨時人們會湧入兩側百貨，舒適天氣則吸引大量人流聚集於戶外市集與公園。",
    hourly: [
      { hour: 11, temp: 31, flow: 800 },
      { hour: 12, temp: 33, flow: 1200 },
      { hour: 13, temp: 34, flow: 1400 },
      { hour: 14, temp: 35, flow: 1800 },
      { hour: 15, temp: 34, flow: 2100 },
      { hour: 16, temp: 33, flow: 2500 },
      { hour: 17, temp: 32, flow: 3200 },
      { hour: 18, temp: 31, flow: 3800 },
      { hour: 19, temp: 30, flow: 4200 },
      { hour: 20, temp: 29, flow: 3800 },
      { hour: 21, temp: 29, flow: 2500 },
      { hour: 22, temp: 28, flow: 1200 }
    ],
    monthly: [
      { month: 1, temp: 16.1, flow: 18000 },
      { month: 2, temp: 16.5, flow: 21000 },
      { month: 3, temp: 18.5, flow: 19000 },
      { month: 4, temp: 21.9, flow: 22000 },
      { month: 5, temp: 25.2, flow: 20000 },
      { month: 6, temp: 28.2, flow: 21500 },
      { month: 7, temp: 29.6, flow: 25000 },
      { month: 8, temp: 29.2, flow: 24000 },
      { month: 9, temp: 27.4, flow: 20500 },
      { month: 10, temp: 24.5, flow: 23000 },
      { month: 11, temp: 21.5, flow: 22500 },
      { month: 12, temp: 17.9, flow: 28000 }
    ],
    simulate: (temp, weather) => {
      let baseFlow = 24000;
      if (temp > 23) {
        baseFlow += (temp - 23) * 250;
      } else {
        baseFlow += (23 - temp) * 120;
      }
      
      if (weather === "rainy") {
        baseFlow *= 0.85;
      } else if (weather === "typhoon") {
        baseFlow *= 0.05;
      } else if (weather === "cold") {
        baseFlow *= 0.95;
      }
      return Math.max(200, Math.round(baseFlow));
    }
  },
  {
    id: "gongguan",
    name: "公館捷運站",
    type: "semi-outdoor",
    typeName: "大學校園商圈",
    lat: 25.013697,
    lng: 121.534898,
    stationId: "466920",
    stationName: "臺北",
    description: "鄰近臺灣大學的大學城商圈。平日以學生通勤與日常消費為主，假日吸引逛街與運動休閒人潮，大雨時人潮減半。",
    hourly: [
      { hour: 11, temp: 31, flow: 600 },
      { hour: 12, temp: 33, flow: 1100 },
      { hour: 13, temp: 34, flow: 900 },
      { hour: 14, temp: 35, flow: 1000 },
      { hour: 15, temp: 34, flow: 1300 },
      { hour: 16, temp: 33, flow: 1600 },
      { hour: 17, temp: 32, flow: 2400 },
      { hour: 18, temp: 31, flow: 2800 },
      { hour: 19, temp: 30, flow: 3100 },
      { hour: 20, temp: 29, flow: 2600 },
      { hour: 21, temp: 29, flow: 1700 },
      { hour: 22, temp: 28, flow: 800 }
    ],
    monthly: [
      { month: 1, temp: 16.1, flow: 13000 },
      { month: 2, temp: 16.5, flow: 11000 },
      { month: 3, temp: 18.5, flow: 16000 },
      { month: 4, temp: 21.9, flow: 17000 },
      { month: 5, temp: 25.2, flow: 15500 },
      { month: 6, temp: 28.2, flow: 14000 },
      { month: 7, temp: 29.6, flow: 15000 },
      { month: 8, temp: 29.2, flow: 14500 },
      { month: 9, temp: 27.4, flow: 17500 },
      { month: 10, temp: 24.5, flow: 18000 },
      { month: 11, temp: 21.5, flow: 16500 },
      { month: 12, temp: 17.9, flow: 19000 }
    ],
    simulate: (temp, weather) => {
      let baseFlow = 17000;
      if (temp > 23) {
        baseFlow -= (temp - 23) * 180;
      } else {
        baseFlow -= (23 - temp) * 100;
      }
      
      if (weather === "rainy") {
        baseFlow *= 0.60;
      } else if (weather === "typhoon") {
        baseFlow *= 0.05;
      } else if (weather === "cold") {
        baseFlow *= 0.80;
      }
      return Math.max(100, Math.round(baseFlow));
    }
  },
  {
    id: "banqiao",
    name: "板橋捷運站",
    type: "semi-outdoor",
    typeName: "新北核心商圈",
    lat: 25.013627,
    lng: 121.462310,
    stationId: "466880",
    stationName: "板橋",
    description: "新板特區商圈與板橋車站樞紐。平日通勤人流極高，週末假日百貨商圈繁榮，冬季新北歡樂耶誕城期間人潮暴增。",
    hourly: [
      { hour: 11, temp: 31, flow: 1200 },
      { hour: 12, temp: 33, flow: 1800 },
      { hour: 13, temp: 34, flow: 1500 },
      { hour: 14, temp: 35, flow: 1600 },
      { hour: 15, temp: 34, flow: 2000 },
      { hour: 16, temp: 33, flow: 2400 },
      { hour: 17, temp: 32, flow: 3500 },
      { hour: 18, temp: 31, flow: 4500 },
      { hour: 19, temp: 30, flow: 4800 },
      { hour: 20, temp: 29, flow: 4000 },
      { hour: 21, temp: 29, flow: 2800 },
      { hour: 22, temp: 28, flow: 1500 }
    ],
    monthly: [
      { month: 1, temp: 16.1, flow: 25000 },
      { month: 2, temp: 16.5, flow: 23000 },
      { month: 3, temp: 18.5, flow: 26000 },
      { month: 4, temp: 21.9, flow: 28000 },
      { month: 5, temp: 25.2, flow: 27000 },
      { month: 6, temp: 28.2, flow: 26000 },
      { month: 7, temp: 29.6, flow: 29000 },
      { month: 8, temp: 29.2, flow: 28500 },
      { month: 9, temp: 27.4, flow: 27500 },
      { month: 10, temp: 24.5, flow: 29000 },
      { month: 11, temp: 21.5, flow: 32000 },
      { month: 12, temp: 17.9, flow: 48000 }
    ],
    simulate: (temp, weather) => {
      let baseFlow = 28000;
      if (temp > 23) {
        baseFlow += (temp - 23) * 150;
      } else {
        baseFlow += (23 - temp) * 80;
      }
      
      if (weather === "rainy") {
        baseFlow *= 0.85;
      } else if (weather === "typhoon") {
        baseFlow *= 0.05;
      } else if (weather === "cold") {
        baseFlow *= 0.95;
      }
      return Math.max(200, Math.round(baseFlow));
    }
  },
  {
    id: "xindian",
    name: "新店捷運站",
    type: "outdoor",
    typeName: "水岸自然景區",
    lat: 24.953716,
    lng: 121.537233,
    stationId: "466920",
    stationName: "臺北",
    description: "碧潭風景區與新店溪水岸，是台北都會區南側著名的遊憩景點。假日與晴天吸引大量遊客散步、踩天鵝船，雨天或天冷時人潮大幅減少。",
    hourly: [
      { hour: 9, temp: 27, flow: 500 },
      { hour: 10, temp: 29, flow: 800 },
      { hour: 11, temp: 31, flow: 1000 },
      { hour: 12, temp: 32, flow: 900 },
      { hour: 13, temp: 33, flow: 800 },
      { hour: 14, temp: 34, flow: 900 },
      { hour: 15, temp: 33, flow: 1200 },
      { hour: 16, temp: 32, flow: 1500 },
      { hour: 17, temp: 30, flow: 1600 },
      { hour: 18, temp: 29, flow: 1100 },
      { hour: 19, temp: 28, flow: 600 }
    ],
    monthly: [
      { month: 1, temp: 15.6, flow: 6000 },
      { month: 2, temp: 16.0, flow: 7500 },
      { month: 3, temp: 18.0, flow: 9000 },
      { month: 4, temp: 21.4, flow: 12000 },
      { month: 5, temp: 24.7, flow: 10000 },
      { month: 6, temp: 27.7, flow: 8500 },
      { month: 7, temp: 29.1, flow: 11500 },
      { month: 8, temp: 28.7, flow: 11000 },
      { month: 9, temp: 26.9, flow: 9500 },
      { month: 10, temp: 24.0, flow: 11000 },
      { month: 11, temp: 21.0, flow: 8500 },
      { month: 12, temp: 17.4, flow: 7000 }
    ],
    simulate: (temp, weather) => {
      let baseFlow = 10000;
      if (temp > 23) {
        baseFlow -= (temp - 23) * 250;
      } else {
        baseFlow -= (23 - temp) * 150;
      }
      
      if (weather === "rainy") {
        baseFlow *= 0.30;
      } else if (weather === "typhoon") {
        baseFlow *= 0.01;
      } else if (weather === "cold") {
        baseFlow *= 0.60;
      }
      return Math.max(50, Math.round(baseFlow));
    }
  },
  {
    id: "xinbeitou",
    name: "新北投捷運站",
    type: "outdoor",
    typeName: "溫泉歷史景區",
    lat: 25.136894,
    lng: 121.503073,
    stationId: "466910",
    stationName: "臺北",
    description: "北投溫泉博物館、地熱谷與溫泉旅館群。此地區因溫泉特色，低溫寒流時遊客反而大幅暴增，炎熱的夏季則是淡季。",
    hourly: [
      { hour: 10, temp: 28, flow: 600 },
      { hour: 11, temp: 29, flow: 800 },
      { hour: 12, temp: 30, flow: 1000 },
      { hour: 13, temp: 31, flow: 900 },
      { hour: 14, temp: 31, flow: 1100 },
      { hour: 15, temp: 30, flow: 1400 },
      { hour: 16, temp: 29, flow: 1800 },
      { hour: 17, temp: 28, flow: 2000 },
      { hour: 18, temp: 27, flow: 2200 },
      { hour: 19, temp: 26, flow: 2500 },
      { hour: 20, temp: 25, flow: 2100 },
      { hour: 21, temp: 25, flow: 1300 }
    ],
    monthly: [
      { month: 1, temp: 15.1, flow: 18000 },
      { month: 2, temp: 15.5, flow: 16000 },
      { month: 3, temp: 17.5, flow: 13000 },
      { month: 4, temp: 20.9, flow: 10000 },
      { month: 5, temp: 24.2, flow: 8000 },
      { month: 6, temp: 27.2, flow: 6500 },
      { month: 7, temp: 28.6, flow: 6000 },
      { month: 8, temp: 28.2, flow: 6200 },
      { month: 9, temp: 26.4, flow: 7500 },
      { month: 10, temp: 23.5, flow: 11000 },
      { month: 11, temp: 20.5, flow: 14000 },
      { month: 12, temp: 16.9, flow: 19500 }
    ],
    simulate: (temp, weather) => {
      let baseFlow = 11000;
      if (temp < 25) {
        baseFlow += (25 - temp) * 600;
      } else {
        baseFlow -= (temp - 25) * 400;
      }
      
      if (weather === "rainy") {
        baseFlow *= 0.70;
      } else if (weather === "typhoon") {
        baseFlow *= 0.05;
      } else if (weather === "cold") {
        baseFlow *= 1.30;
      }
      return Math.max(100, Math.round(baseFlow));
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
  { id: "tra-keelung", name: "基隆車站", lat: 25.132, lng: 121.740, dailyFlow: 9221, temps: [15.0, 15.5, 17.5, 21.0, 24.0, 27.0, 28.5, 28.2, 26.5, 23.5, 20.5, 17.0] },
  { id: "tra-taoyuan", name: "桃園車站", lat: 24.989, lng: 121.313, dailyFlow: 27532, temps: [15.5, 16.0, 18.0, 21.5, 24.8, 27.8, 29.2, 28.8, 27.0, 24.0, 21.0, 17.5] },
  { id: "tra-hsinchu", name: "新竹車站", lat: 24.801, lng: 120.971, dailyFlow: 20947, temps: [15.2, 15.6, 17.8, 21.2, 24.5, 27.5, 29.0, 28.5, 26.8, 23.8, 20.8, 17.2] },
  { id: "tra-taichung", name: "台中車站", lat: 24.137, lng: 120.686, dailyFlow: 24895, temps: [16.6, 17.3, 19.8, 23.2, 26.0, 28.0, 29.0, 28.6, 27.8, 25.2, 22.0, 18.5] },
  { id: "tra-changhua", name: "彰化車站", lat: 24.081, lng: 120.538, dailyFlow: 14312, temps: [16.5, 17.2, 19.7, 23.1, 25.9, 27.9, 28.9, 28.5, 27.7, 25.1, 21.9, 18.4] },
  { id: "tra-chiayi", name: "嘉義車站", lat: 23.479, lng: 120.440, dailyFlow: 10708, temps: [17.0, 18.0, 20.5, 24.0, 26.8, 28.5, 29.2, 28.8, 28.0, 25.8, 22.5, 19.0] },
  { id: "tra-tainan", name: "台南車站", lat: 22.997, lng: 120.212, dailyFlow: 26204, temps: [17.8, 18.8, 21.5, 25.0, 27.8, 29.2, 29.8, 29.4, 28.8, 26.8, 23.5, 19.8] },
  { id: "tra-kaohsiung", name: "高雄車站", lat: 22.639, lng: 120.302, dailyFlow: 16146, temps: [19.5, 20.5, 23.0, 26.0, 28.5, 29.5, 30.0, 29.6, 29.0, 27.5, 24.5, 21.0] },
  { id: "tra-pingtung", name: "屏東車站", lat: 22.669, lng: 120.486, dailyFlow: 11673, temps: [20.0, 21.0, 23.5, 26.5, 28.8, 29.8, 30.2, 29.8, 29.2, 27.8, 25.0, 21.5] },
  { id: "tra-yilan", name: "宜蘭車站", lat: 24.754, lng: 121.758, dailyFlow: 4052, temps: [15.4, 15.9, 17.9, 21.2, 24.2, 27.1, 28.8, 28.4, 26.6, 23.4, 20.4, 17.1] },
  { id: "tra-hualien", name: "花蓮車站", lat: 23.993, lng: 121.601, dailyFlow: 10533, temps: [17.2, 17.6, 19.5, 22.5, 25.2, 27.6, 29.1, 28.8, 27.5, 25.0, 22.0, 18.8] },
  { id: "tra-taitung", name: "台東車站", lat: 22.793, lng: 121.123, dailyFlow: 5486, temps: [18.5, 19.0, 21.0, 23.8, 26.2, 28.2, 29.5, 29.2, 28.1, 25.8, 23.0, 20.0] },
  { id: "tra-miaoli", name: "苗栗", lat: 24.564, lng: 120.821, dailyFlow: 5546, temps: [15.2, 16.0, 18.0, 22.0, 25.0, 27.0, 28.5, 28.2, 27.0, 24.5, 21.0, 17.0] },
  { id: "tra-douliu", name: "斗六", lat: 23.71157, lng: 120.54117, dailyFlow: 5581, temps: [16.0, 17.0, 19.5, 23.0, 26.0, 28.0, 29.0, 28.8, 27.5, 25.0, 22.0, 18.0] },
  { id: "tra-nantou", name: "南投(日月潭)", lat: 23.881, lng: 120.908, dailyFlow: 3500, temps: [14.0, 15.0, 17.0, 19.5, 21.5, 23.0, 23.5, 23.0, 22.0, 20.0, 18.0, 15.0] },
  { id: "tra-alishan", name: "阿里山", lat: 23.510, lng: 120.801, dailyFlow: 4000, temps: [6.5, 7.5, 9.5, 12.0, 13.5, 14.5, 15.0, 15.0, 14.0, 12.5, 10.5, 7.5] },
  { id: "tra-yushan", name: "玉山", lat: 23.470, lng: 120.957, dailyFlow: 500, temps: [-1.5, -0.5, 1.5, 4.0, 6.0, 7.5, 8.5, 8.0, 7.0, 5.5, 3.0, 0.0] },
  { id: "tra-hengchun", name: "恆春", lat: 22.002, lng: 120.745, dailyFlow: 6500, temps: [21.0, 22.0, 24.0, 26.0, 27.5, 28.5, 29.0, 28.5, 28.0, 26.5, 24.5, 22.0] },
  { id: "tra-suao", name: "蘇澳", lat: 24.594, lng: 121.848, dailyFlow: 486, temps: [16.0, 16.5, 18.0, 21.0, 24.0, 27.0, 28.5, 28.2, 26.5, 24.0, 21.0, 17.5] },
  { id: "tra-dawu", name: "大武", lat: 22.348, lng: 120.898, dailyFlow: 226, temps: [20.0, 20.5, 22.5, 25.0, 27.0, 28.5, 29.5, 29.0, 28.0, 26.0, 24.0, 21.5] }
];

traStations.forEach(st => {
  SPOTS_DATA.push({
    id: st.id,
    name: st.name,
    type: "semi-outdoor",
    typeName: "交通樞紐",
    lat: st.lat,
    lng: st.lng,
    isHidden: ["tra-nantou", "tra-alishan", "tra-yushan", "tra-hengchun"].includes(st.id),
    stationId: "tra",
    stationName: "台鐵",
    description: "台鐵都會區主要交通樞紐，通勤與觀光人潮眾多。",
    hourly: MOCK_TRA_HOURLY,
    monthly: st.temps.map((temp, index) => {
      const month = index + 1;
      const origMonthly = MOCK_TRA_MONTHLY.find(m => m.month === month);
      return {
        month: month,
        temp: temp,
        flow: origMonthly ? origMonthly.flow : 50000
      };
    }),
    simulate: (temp, weather) => {
      // 使用該站的真實日均人流作為基準
      let baseFlow = st.dailyFlow;
      
      // 氣溫效應：過熱或過冷略為降低出行意願
      if (temp > 30) baseFlow -= Math.round((temp - 30) * (baseFlow * 0.02));
      if (temp < 15) baseFlow -= Math.round((15 - temp) * (baseFlow * 0.02));
      
      // 天氣修正
      if (weather === "rainy") baseFlow = Math.round(baseFlow * 0.75);
      if (weather === "typhoon") baseFlow = Math.round(baseFlow * 0.15);
      
      return Math.max(0, baseFlow);
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
  if (n === 0 || n !== y.length) return { slope: 0, intercept: 0, r: 0, r2: 0 };
  
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
  
  if (absR >= 0.7) degree = "高度";
  else if (absR >= 0.4) degree = "中度";
  else if (absR >= 0.2) degree = "低度";
  else return `在 ${spotName}，氣溫與人流量之間**無顯著線性相關性**（$r$ = ${r.toFixed(2)}），顯示人流量波動主要受氣溫以外的因子（如通勤週期、例假日或特定事件）主導。`;
  
  let explanation = "";
  if (r > 0) {
    if (typeName === "室內商業區") {
      explanation = "此現象反映了室內空間之『天候適應效應』。在氣溫偏高時，民眾傾向選擇進入具備空調系統之室內環境，使得出站運量與氣溫表現出正向相關。";
    } else {
      explanation = "顯示氣溫上升與該地區人流量呈正向變動關係。";
    }
  } else {
    if (typeName.includes("戶外")) {
      explanation = "此現象反映了戶外區域之『氣候敏感性特徵』。當溫度過高時，人體舒適度下降會降低民眾前往露天景點的意願，導致運量與氣溫變化呈負向關聯。";
    } else {
      explanation = "顯示氣溫上升與該地區人流量呈負向變動關係。";
    }
  }
  
  return `在 ${spotName}，氣溫與人流量呈現 **${degree}${direction}**（相關係數 $r$ = **${r.toFixed(2)}**）。${explanation}`;
}

const EXTRA_STATIONS = [
  { id: "tra-ext-0900", name: "基隆", lat: 25.132, lng: 121.738, temps: [15.8, 16.8, 18.8, 21.9, 24.9, 27.9, 28.9, 28.9, 27.4, 24.9, 21.8, 17.8] },
  { id: "tra-ext-0910", name: "三坑", lat: 25.123, lng: 121.742, temps: [15.8, 16.8, 18.8, 21.9, 24.9, 27.9, 28.9, 28.9, 27.4, 24.9, 21.8, 17.8] },
  { id: "tra-ext-0920", name: "八堵", lat: 25.108, lng: 121.729, temps: [15.8, 16.8, 18.8, 21.9, 24.9, 27.9, 28.9, 28.9, 27.4, 24.9, 21.8, 17.8] },
  { id: "tra-ext-0930", name: "七堵", lat: 25.093, lng: 121.714, temps: [15.9, 16.9, 18.9, 21.9, 24.9, 28.0, 29.0, 29.0, 27.4, 24.9, 21.9, 17.9] },
  { id: "tra-ext-0940", name: "百福", lat: 25.078, lng: 121.694, temps: [15.9, 16.9, 18.9, 21.9, 24.9, 28.0, 29.0, 29.0, 27.4, 24.9, 21.9, 17.9] },
  { id: "tra-ext-0950", name: "五堵", lat: 25.078, lng: 121.668, temps: [15.9, 16.9, 18.9, 21.9, 24.9, 28.0, 29.0, 29.0, 27.4, 24.9, 21.9, 17.9] },
  { id: "tra-ext-0960", name: "汐止", lat: 25.068, lng: 121.661, temps: [15.9, 16.9, 18.9, 21.9, 24.9, 28.0, 29.0, 29.0, 27.4, 24.9, 21.9, 17.9] },
  { id: "tra-ext-0970", name: "汐科", lat: 25.064, lng: 121.652, temps: [15.9, 16.9, 18.9, 21.9, 24.9, 28.0, 29.0, 29.0, 27.4, 24.9, 21.9, 17.9] },
  { id: "tra-ext-0980", name: "南港", lat: 25.053, lng: 121.607, temps: [15.9, 16.9, 18.9, 21.9, 24.9, 28.0, 29.0, 29.0, 27.4, 24.9, 21.9, 17.9] },
  { id: "tra-ext-0990", name: "松山", lat: 25.049, lng: 121.578, temps: [15.9, 16.9, 18.9, 22.0, 25.0, 28.0, 29.0, 29.0, 27.5, 25.0, 21.9, 17.9] },
  { id: "tra-ext-1000", name: "臺北", lat: 25.048, lng: 121.518, temps: [15.9, 16.9, 18.9, 22.0, 25.0, 28.0, 29.0, 29.0, 27.5, 25.0, 21.9, 17.9] },
  { id: "tra-ext-1001", name: "臺北-環島", lat: 25.048, lng: 121.517, temps: [15.9, 16.9, 18.9, 22.0, 25.0, 28.0, 29.0, 29.0, 27.5, 25.0, 21.9, 17.9] },
  { id: "tra-ext-1010", name: "萬華", lat: 25.034, lng: 121.500, temps: [15.9, 16.9, 18.9, 22.0, 25.0, 28.0, 29.0, 29.0, 27.5, 25.0, 21.9, 17.9] },
  { id: "tra-ext-1020", name: "板橋", lat: 25.014, lng: 121.464, temps: [16.0, 17.0, 19.0, 22.0, 25.0, 28.0, 29.0, 29.0, 27.5, 25.0, 22.0, 18.0] },
  { id: "tra-ext-1030", name: "浮洲", lat: 25.004, lng: 121.445, temps: [16.0, 17.0, 19.0, 22.0, 25.0, 28.0, 29.0, 29.0, 27.5, 25.0, 22.0, 18.0] },
  { id: "tra-ext-1040", name: "樹林", lat: 24.991, lng: 121.425, temps: [16.0, 17.0, 19.0, 22.0, 25.0, 28.0, 29.0, 29.0, 27.5, 25.0, 22.0, 18.0] },
  { id: "tra-ext-1050", name: "南樹林", lat: 24.980, lng: 121.409, temps: [16.0, 17.0, 19.0, 22.0, 25.0, 28.0, 29.0, 29.0, 27.5, 25.0, 22.0, 18.0] },
  { id: "tra-ext-1060", name: "山佳", lat: 24.973, lng: 121.393, temps: [16.0, 17.0, 19.0, 22.0, 25.0, 28.0, 29.0, 29.0, 27.5, 25.0, 22.0, 18.0] },
  { id: "tra-ext-1070", name: "鶯歌", lat: 24.954, lng: 121.355, temps: [16.1, 17.1, 19.1, 22.0, 25.0, 28.0, 29.0, 29.0, 27.5, 25.0, 22.1, 18.1] },
  { id: "tra-ext-1075", name: "鳳鳴", lat: 24.973, lng: 121.337, temps: [16.0, 17.0, 19.0, 22.0, 25.0, 28.0, 29.0, 29.0, 27.5, 25.0, 22.0, 18.0] },
  { id: "tra-ext-1080", name: "桃園", lat: 24.989, lng: 121.314, temps: [16.0, 17.0, 19.0, 22.0, 25.0, 28.0, 29.0, 29.0, 27.5, 25.0, 22.0, 18.0] },
  { id: "tra-ext-1090", name: "內壢", lat: 24.973, lng: 121.258, temps: [16.0, 17.0, 19.0, 22.0, 25.0, 28.0, 29.0, 29.0, 27.5, 25.0, 22.0, 18.0] },
  { id: "tra-ext-1100", name: "中壢", lat: 24.954, lng: 121.226, temps: [16.1, 17.1, 19.1, 22.0, 25.0, 28.0, 29.0, 29.0, 27.5, 25.0, 22.1, 18.1] },
  { id: "tra-ext-1110", name: "埔心", lat: 24.919, lng: 121.184, temps: [16.1, 17.1, 19.1, 22.1, 25.1, 28.0, 29.0, 29.0, 27.6, 25.1, 22.1, 18.1] },
  { id: "tra-ext-1120", name: "楊梅", lat: 24.914, lng: 121.146, temps: [16.1, 17.1, 19.1, 22.1, 25.1, 28.0, 29.0, 29.0, 27.6, 25.1, 22.1, 18.1] },
  { id: "tra-ext-1130", name: "富岡", lat: 24.934, lng: 121.083, temps: [16.1, 17.1, 19.1, 22.1, 25.1, 28.0, 29.0, 29.0, 27.6, 25.1, 22.1, 18.1] },
  { id: "tra-ext-1140", name: "新富", lat: 24.931, lng: 121.068, temps: [16.1, 17.1, 19.1, 22.1, 25.1, 28.0, 29.0, 29.0, 27.6, 25.1, 22.1, 18.1] },
  { id: "tra-ext-1150", name: "北湖", lat: 24.922, lng: 121.056, temps: [16.1, 17.1, 19.1, 22.1, 25.1, 28.0, 29.0, 29.0, 27.6, 25.1, 22.1, 18.1] },
  { id: "tra-ext-1160", name: "湖口", lat: 24.903, lng: 121.044, temps: [16.1, 17.1, 19.1, 22.1, 25.1, 28.0, 29.0, 29.0, 27.6, 25.1, 22.1, 18.1] },
  { id: "tra-ext-1170", name: "新豐", lat: 24.869, lng: 120.996, temps: [16.2, 17.2, 19.2, 22.1, 25.1, 28.1, 29.1, 29.1, 27.6, 25.1, 22.2, 18.2] },
  { id: "tra-ext-1180", name: "竹北", lat: 24.839, lng: 121.009, temps: [16.2, 17.2, 19.2, 22.2, 25.2, 28.1, 29.1, 29.1, 27.7, 25.2, 22.2, 18.2] },
  { id: "tra-ext-1190", name: "北新竹", lat: 24.809, lng: 120.984, temps: [16.3, 17.3, 19.3, 22.2, 25.2, 28.1, 29.1, 29.1, 27.7, 25.2, 22.3, 18.3] },
  { id: "tra-ext-1191", name: "千甲", lat: 24.807, lng: 121.003, temps: [16.3, 17.3, 19.3, 22.2, 25.2, 28.1, 29.1, 29.1, 27.7, 25.2, 22.3, 18.3] },
  { id: "tra-ext-1192", name: "新莊", lat: 24.788, lng: 121.022, temps: [16.3, 17.3, 19.3, 22.2, 25.2, 28.1, 29.1, 29.1, 27.7, 25.2, 22.3, 18.3] },
  { id: "tra-ext-1193", name: "竹中", lat: 24.781, lng: 121.031, temps: [16.3, 17.3, 19.3, 22.2, 25.2, 28.1, 29.1, 29.1, 27.7, 25.2, 22.3, 18.3] },
  { id: "tra-ext-1194", name: "六家", lat: 24.808, lng: 121.039, temps: [16.3, 17.3, 19.3, 22.2, 25.2, 28.1, 29.1, 29.1, 27.7, 25.2, 22.3, 18.3] },
  { id: "tra-ext-1201", name: "上員", lat: 24.778, lng: 121.056, temps: [16.3, 17.3, 19.3, 22.2, 25.2, 28.1, 29.1, 29.1, 27.7, 25.2, 22.3, 18.3] },
  { id: "tra-ext-1202", name: "榮華", lat: 24.748, lng: 121.083, temps: [16.4, 17.4, 19.4, 22.3, 25.3, 28.1, 29.1, 29.1, 27.8, 25.3, 22.4, 18.4] },
  { id: "tra-ext-1203", name: "竹東", lat: 24.738, lng: 121.095, temps: [16.4, 17.4, 19.4, 22.3, 25.3, 28.1, 29.1, 29.1, 27.8, 25.3, 22.4, 18.4] },
  { id: "tra-ext-1204", name: "橫山", lat: 24.720, lng: 121.118, temps: [16.4, 17.4, 19.4, 22.3, 25.3, 28.1, 29.1, 29.1, 27.8, 25.3, 22.4, 18.4] },
  { id: "tra-ext-1205", name: "九讚頭", lat: 24.721, lng: 121.136, temps: [16.4, 17.4, 19.4, 22.3, 25.3, 28.1, 29.1, 29.1, 27.8, 25.3, 22.4, 18.4] },
  { id: "tra-ext-1206", name: "合興", lat: 24.717, lng: 121.154, temps: [16.4, 17.4, 19.4, 22.3, 25.3, 28.1, 29.1, 29.1, 27.8, 25.3, 22.4, 18.4] },
  { id: "tra-ext-1207", name: "富貴", lat: 24.716, lng: 121.167, temps: [16.4, 17.4, 19.4, 22.3, 25.3, 28.1, 29.1, 29.1, 27.8, 25.3, 22.4, 18.4] },
  { id: "tra-ext-1208", name: "內灣", lat: 24.705, lng: 121.183, temps: [16.4, 17.4, 19.4, 22.3, 25.3, 28.1, 29.1, 29.1, 27.8, 25.3, 22.4, 18.4] },
  { id: "tra-ext-1210", name: "新竹", lat: 24.802, lng: 120.972, temps: [16.3, 17.3, 19.3, 22.2, 25.2, 28.1, 29.1, 29.1, 27.7, 25.2, 22.3, 18.3] },
  { id: "tra-ext-1220", name: "三姓橋", lat: 24.787, lng: 120.928, temps: [16.3, 17.3, 19.3, 22.2, 25.2, 28.1, 29.1, 29.1, 27.7, 25.2, 22.3, 18.3] },
  { id: "tra-ext-1230", name: "香山", lat: 24.763, lng: 120.914, temps: [16.4, 17.4, 19.4, 22.2, 25.2, 28.1, 29.1, 29.1, 27.7, 25.2, 22.4, 18.4] },
  { id: "tra-ext-1240", name: "崎頂", lat: 24.723, lng: 120.872, temps: [16.4, 17.4, 19.4, 22.3, 25.3, 28.1, 29.1, 29.1, 27.8, 25.3, 22.4, 18.4] },
  { id: "tra-ext-1250", name: "竹南", lat: 24.687, lng: 120.881, temps: [16.5, 17.5, 19.5, 22.3, 25.3, 28.2, 29.2, 29.2, 27.8, 25.3, 22.5, 18.5] },
  { id: "tra-ext-2110", name: "談文", lat: 24.656, lng: 120.858, temps: [16.5, 17.5, 19.5, 22.3, 25.3, 28.2, 29.2, 29.2, 27.8, 25.3, 22.5, 18.5] },
  { id: "tra-ext-2120", name: "大山", lat: 24.646, lng: 120.804, temps: [16.5, 17.5, 19.5, 22.4, 25.4, 28.2, 29.2, 29.2, 27.9, 25.4, 22.5, 18.5] },
  { id: "tra-ext-2130", name: "後龍", lat: 24.616, lng: 120.787, temps: [16.6, 17.6, 19.6, 22.4, 25.4, 28.2, 29.2, 29.2, 27.9, 25.4, 22.6, 18.6] },
  { id: "tra-ext-2140", name: "龍港", lat: 24.612, lng: 120.758, temps: [16.6, 17.6, 19.6, 22.4, 25.4, 28.2, 29.2, 29.2, 27.9, 25.4, 22.6, 18.6] },
  { id: "tra-ext-2150", name: "白沙屯", lat: 24.565, lng: 120.708, temps: [16.7, 17.7, 19.7, 22.4, 25.4, 28.2, 29.2, 29.2, 27.9, 25.4, 22.7, 18.7] },
  { id: "tra-ext-2160", name: "新埔", lat: 24.540, lng: 120.695, temps: [16.7, 17.7, 19.7, 22.5, 25.5, 28.2, 29.2, 29.2, 28.0, 25.5, 22.7, 18.7] },
  { id: "tra-ext-2170", name: "通霄", lat: 24.491, lng: 120.678, temps: [16.8, 17.8, 19.8, 22.5, 25.5, 28.3, 29.3, 29.3, 28.0, 25.5, 22.8, 18.8] },
  { id: "tra-ext-2180", name: "苑裡", lat: 24.443, lng: 120.651, temps: [16.8, 17.8, 19.8, 22.6, 25.6, 28.3, 29.3, 29.3, 28.1, 25.6, 22.8, 18.8] },
  { id: "tra-ext-2190", name: "日南", lat: 24.378, lng: 120.654, temps: [16.9, 17.9, 19.9, 22.6, 25.6, 28.3, 29.3, 29.3, 28.1, 25.6, 22.9, 18.9] },
  { id: "tra-ext-2200", name: "大甲", lat: 24.344, lng: 120.627, temps: [17.0, 18.0, 20.0, 22.7, 25.7, 28.3, 29.3, 29.3, 28.2, 25.7, 23.0, 19.0] },
  { id: "tra-ext-2210", name: "臺中港", lat: 24.304, lng: 120.602, temps: [17.0, 18.0, 20.0, 22.7, 25.7, 28.3, 29.3, 29.3, 28.2, 25.7, 23.0, 19.0] },
  { id: "tra-ext-2220", name: "清水", lat: 24.264, lng: 120.569, temps: [17.1, 18.1, 20.1, 22.7, 25.7, 28.4, 29.4, 29.4, 28.2, 25.7, 23.1, 19.1] },
  { id: "tra-ext-2230", name: "沙鹿", lat: 24.237, lng: 120.558, temps: [17.1, 18.1, 20.1, 22.8, 25.8, 28.4, 29.4, 29.4, 28.3, 25.8, 23.1, 19.1] },
  { id: "tra-ext-2240", name: "龍井", lat: 24.197, lng: 120.543, temps: [17.2, 18.2, 20.2, 22.8, 25.8, 28.4, 29.4, 29.4, 28.3, 25.8, 23.2, 19.2] },
  { id: "tra-ext-2250", name: "大肚", lat: 24.154, lng: 120.542, temps: [17.3, 18.3, 20.3, 22.8, 25.8, 28.4, 29.4, 29.4, 28.3, 25.8, 23.3, 19.3] },
  { id: "tra-ext-2260", name: "追分", lat: 24.121, lng: 120.570, temps: [17.3, 18.3, 20.3, 22.9, 25.9, 28.4, 29.4, 29.4, 28.4, 25.9, 23.3, 19.3] },
  { id: "tra-ext-3140", name: "造橋", lat: 24.642, lng: 120.867, temps: [16.5, 17.5, 19.5, 22.4, 25.4, 28.2, 29.2, 29.2, 27.9, 25.4, 22.5, 18.5] },
  { id: "tra-ext-3150", name: "豐富", lat: 24.604, lng: 120.826, temps: [16.6, 17.6, 19.6, 22.4, 25.4, 28.2, 29.2, 29.2, 27.9, 25.4, 22.6, 18.6] },
  { id: "tra-ext-3160", name: "苗栗", lat: 24.570, lng: 120.822, temps: [16.6, 17.6, 19.6, 22.4, 25.4, 28.2, 29.2, 29.2, 27.9, 25.4, 22.6, 18.6] },
  { id: "tra-ext-3170", name: "南勢", lat: 24.522, lng: 120.792, temps: [16.7, 17.7, 19.7, 22.5, 25.5, 28.2, 29.2, 29.2, 28.0, 25.5, 22.7, 18.7] },
  { id: "tra-ext-3180", name: "銅鑼", lat: 24.487, lng: 120.786, temps: [16.8, 17.8, 19.8, 22.5, 25.5, 28.3, 29.3, 29.3, 28.0, 25.5, 22.8, 18.8] },
  { id: "tra-ext-3190", name: "三義", lat: 24.421, lng: 120.774, temps: [16.9, 17.9, 19.9, 22.6, 25.6, 28.3, 29.3, 29.3, 28.1, 25.6, 22.9, 18.9] },
  { id: "tra-ext-3210", name: "泰安", lat: 24.331, lng: 120.742, temps: [17.0, 18.0, 20.0, 22.7, 25.7, 28.3, 29.3, 29.3, 28.2, 25.7, 23.0, 19.0] },
  { id: "tra-ext-3220", name: "后里", lat: 24.309, lng: 120.733, temps: [17.0, 18.0, 20.0, 22.7, 25.7, 28.3, 29.3, 29.3, 28.2, 25.7, 23.0, 19.0] },
  { id: "tra-ext-3230", name: "豐原", lat: 24.254, lng: 120.724, temps: [17.1, 18.1, 20.1, 22.7, 25.7, 28.4, 29.4, 29.4, 28.2, 25.7, 23.1, 19.1] },
  { id: "tra-ext-3240", name: "栗林", lat: 24.235, lng: 120.711, temps: [17.1, 18.1, 20.1, 22.8, 25.8, 28.4, 29.4, 29.4, 28.3, 25.8, 23.1, 19.1] },
  { id: "tra-ext-3250", name: "潭子", lat: 24.212, lng: 120.706, temps: [17.2, 18.2, 20.2, 22.8, 25.8, 28.4, 29.4, 29.4, 28.3, 25.8, 23.2, 19.2] },
  { id: "tra-ext-3260", name: "頭家厝", lat: 24.196, lng: 120.704, temps: [17.2, 18.2, 20.2, 22.8, 25.8, 28.4, 29.4, 29.4, 28.3, 25.8, 23.2, 19.2] },
  { id: "tra-ext-3270", name: "松竹", lat: 24.180, lng: 120.702, temps: [17.2, 18.2, 20.2, 22.8, 25.8, 28.4, 29.4, 29.4, 28.3, 25.8, 23.2, 19.2] },
  { id: "tra-ext-3280", name: "太原", lat: 24.164, lng: 120.700, temps: [17.3, 18.3, 20.3, 22.8, 25.8, 28.4, 29.4, 29.4, 28.3, 25.8, 23.3, 19.3] },
  { id: "tra-ext-3290", name: "精武", lat: 24.149, lng: 120.698, temps: [17.3, 18.3, 20.3, 22.9, 25.9, 28.4, 29.4, 29.4, 28.4, 25.9, 23.3, 19.3] },
  { id: "tra-ext-3300", name: "臺中", lat: 24.137, lng: 120.687, temps: [17.3, 18.3, 20.3, 22.9, 25.9, 28.4, 29.4, 29.4, 28.4, 25.9, 23.3, 19.3] },
  { id: "tra-ext-3310", name: "五權", lat: 24.129, lng: 120.667, temps: [17.3, 18.3, 20.3, 22.9, 25.9, 28.4, 29.4, 29.4, 28.4, 25.9, 23.3, 19.3] },
  { id: "tra-ext-3320", name: "大慶", lat: 24.119, lng: 120.648, temps: [17.3, 18.3, 20.3, 22.9, 25.9, 28.4, 29.4, 29.4, 28.4, 25.9, 23.3, 19.3] },
  { id: "tra-ext-3330", name: "烏日", lat: 24.109, lng: 120.622, temps: [17.3, 18.3, 20.3, 22.9, 25.9, 28.4, 29.4, 29.4, 28.4, 25.9, 23.3, 19.3] },
  { id: "tra-ext-3340", name: "新烏日", lat: 24.109, lng: 120.614, temps: [17.3, 18.3, 20.3, 22.9, 25.9, 28.4, 29.4, 29.4, 28.4, 25.9, 23.3, 19.3] },
  { id: "tra-ext-3350", name: "成功", lat: 24.114, lng: 120.590, temps: [17.3, 18.3, 20.3, 22.9, 25.9, 28.4, 29.4, 29.4, 28.4, 25.9, 23.3, 19.3] },
  { id: "tra-ext-3360", name: "彰化", lat: 24.082, lng: 120.539, temps: [17.4, 18.4, 20.4, 22.9, 25.9, 28.5, 29.5, 29.5, 28.4, 25.9, 23.4, 19.4] },
  { id: "tra-ext-3370", name: "花壇", lat: 24.025, lng: 120.537, temps: [17.5, 18.5, 20.5, 23.0, 26.0, 28.5, 29.5, 29.5, 28.5, 26.0, 23.5, 19.5] },
  { id: "tra-ext-3380", name: "大村", lat: 23.990, lng: 120.561, temps: [17.5, 18.5, 20.5, 23.0, 26.0, 28.5, 29.5, 29.5, 28.5, 26.0, 23.5, 19.5] },
  { id: "tra-ext-3390", name: "員林", lat: 23.959, lng: 120.570, temps: [17.6, 18.6, 20.6, 23.0, 26.0, 28.5, 29.5, 29.5, 28.5, 26.0, 23.6, 19.6] },
  { id: "tra-ext-3400", name: "永靖", lat: 23.928, lng: 120.572, temps: [17.6, 18.6, 20.6, 23.1, 26.1, 28.5, 29.5, 29.5, 28.6, 26.1, 23.6, 19.6] },
  { id: "tra-ext-3410", name: "社頭", lat: 23.896, lng: 120.581, temps: [17.7, 18.7, 20.7, 23.1, 26.1, 28.6, 29.6, 29.6, 28.6, 26.1, 23.7, 19.7] },
  { id: "tra-ext-3420", name: "田中", lat: 23.858, lng: 120.591, temps: [17.7, 18.7, 20.7, 23.1, 26.1, 28.6, 29.6, 29.6, 28.6, 26.1, 23.7, 19.7] },
  { id: "tra-ext-3430", name: "二水", lat: 23.813, lng: 120.618, temps: [17.8, 18.8, 20.8, 23.2, 26.2, 28.6, 29.6, 29.6, 28.7, 26.2, 23.8, 19.8] },
  { id: "tra-ext-3431", name: "源泉", lat: 23.798, lng: 120.642, temps: [17.8, 18.8, 20.8, 23.2, 26.2, 28.6, 29.6, 29.6, 28.7, 26.2, 23.8, 19.8] },
  { id: "tra-ext-3432", name: "濁水", lat: 23.835, lng: 120.705, temps: [17.7, 18.7, 20.7, 23.2, 26.2, 28.6, 29.6, 29.6, 28.7, 26.2, 23.7, 19.7] },
  { id: "tra-ext-3433", name: "龍泉", lat: 23.835, lng: 120.750, temps: [17.7, 18.7, 20.7, 23.2, 26.2, 28.6, 29.6, 29.6, 28.7, 26.2, 23.7, 19.7] },
  { id: "tra-ext-3434", name: "集集", lat: 23.826, lng: 120.785, temps: [17.8, 18.8, 20.8, 23.2, 26.2, 28.6, 29.6, 29.6, 28.7, 26.2, 23.8, 19.8] },
  { id: "tra-ext-3435", name: "水里", lat: 23.818, lng: 120.853, temps: [17.8, 18.8, 20.8, 23.2, 26.2, 28.6, 29.6, 29.6, 28.7, 26.2, 23.8, 19.8] },
  { id: "tra-ext-3436", name: "車埕", lat: 23.833, lng: 120.866, temps: [17.8, 18.8, 20.8, 23.2, 26.2, 28.6, 29.6, 29.6, 28.7, 26.2, 23.8, 19.8] },
  { id: "tra-ext-3450", name: "林內", lat: 23.760, lng: 120.615, temps: [17.9, 18.9, 20.9, 23.2, 26.2, 28.6, 29.6, 29.6, 28.7, 26.2, 23.9, 19.9] },
  { id: "tra-ext-3460", name: "石榴", lat: 23.732, lng: 120.580, temps: [17.9, 18.9, 20.9, 23.3, 26.3, 28.6, 29.6, 29.6, 28.8, 26.3, 23.9, 19.9] },
  { id: "tra-ext-3470", name: "斗六", lat: 23.712, lng: 120.541, temps: [17.9, 18.9, 20.9, 23.3, 26.3, 28.6, 29.6, 29.6, 28.8, 26.3, 23.9, 19.9] },
  { id: "tra-ext-3480", name: "斗南", lat: 23.673, lng: 120.481, temps: [18.0, 19.0, 21.0, 23.3, 26.3, 28.7, 29.7, 29.7, 28.8, 26.3, 24.0, 20.0] },
  { id: "tra-ext-3490", name: "石龜", lat: 23.640, lng: 120.471, temps: [18.0, 19.0, 21.0, 23.4, 26.4, 28.7, 29.7, 29.7, 28.9, 26.4, 24.0, 20.0] },
  { id: "tra-ext-4050", name: "大林", lat: 23.601, lng: 120.456, temps: [18.1, 19.1, 21.1, 23.4, 26.4, 28.7, 29.7, 29.7, 28.9, 26.4, 24.1, 20.1] },
  { id: "tra-ext-4060", name: "民雄", lat: 23.555, lng: 120.431, temps: [18.2, 19.2, 21.2, 23.4, 26.4, 28.7, 29.7, 29.7, 28.9, 26.4, 24.2, 20.2] },
  { id: "tra-ext-4070", name: "嘉北", lat: 23.500, lng: 120.449, temps: [18.3, 19.3, 21.3, 23.5, 26.5, 28.8, 29.8, 29.8, 29.0, 26.5, 24.3, 20.3] },
  { id: "tra-ext-4080", name: "嘉義", lat: 23.479, lng: 120.441, temps: [18.3, 19.3, 21.3, 23.5, 26.5, 28.8, 29.8, 29.8, 29.0, 26.5, 24.3, 20.3] },
  { id: "tra-ext-4090", name: "水上", lat: 23.434, lng: 120.400, temps: [18.3, 19.3, 21.3, 23.6, 26.6, 28.8, 29.8, 29.8, 29.1, 26.6, 24.3, 20.3] },
  { id: "tra-ext-4100", name: "南靖", lat: 23.413, lng: 120.387, temps: [18.4, 19.4, 21.4, 23.6, 26.6, 28.8, 29.8, 29.8, 29.1, 26.6, 24.4, 20.4] },
  { id: "tra-ext-4110", name: "後壁", lat: 23.366, lng: 120.361, temps: [18.5, 19.5, 21.5, 23.6, 26.6, 28.8, 29.8, 29.8, 29.1, 26.6, 24.5, 20.5] },
  { id: "tra-ext-4120", name: "新營", lat: 23.307, lng: 120.323, temps: [18.5, 19.5, 21.5, 23.7, 26.7, 28.8, 29.8, 29.8, 29.2, 26.7, 24.5, 20.5] },
  { id: "tra-ext-4130", name: "柳營", lat: 23.278, lng: 120.323, temps: [18.6, 19.6, 21.6, 23.7, 26.7, 28.9, 29.9, 29.9, 29.2, 26.7, 24.6, 20.6] },
  { id: "tra-ext-4140", name: "林鳳營", lat: 23.243, lng: 120.321, temps: [18.6, 19.6, 21.6, 23.8, 26.8, 28.9, 29.9, 29.9, 29.3, 26.8, 24.6, 20.6] },
  { id: "tra-ext-4150", name: "隆田", lat: 23.193, lng: 120.319, temps: [18.7, 19.7, 21.7, 23.8, 26.8, 28.9, 29.9, 29.9, 29.3, 26.8, 24.7, 20.7] },
  { id: "tra-ext-4160", name: "拔林", lat: 23.173, lng: 120.321, temps: [18.7, 19.7, 21.7, 23.8, 26.8, 28.9, 29.9, 29.9, 29.3, 26.8, 24.7, 20.7] },
  { id: "tra-ext-4170", name: "善化", lat: 23.133, lng: 120.307, temps: [18.8, 19.8, 21.8, 23.9, 26.9, 28.9, 29.9, 29.9, 29.4, 26.9, 24.8, 20.8] },
  { id: "tra-ext-4180", name: "南科", lat: 23.107, lng: 120.302, temps: [18.8, 19.8, 21.8, 23.9, 26.9, 28.9, 29.9, 29.9, 29.4, 26.9, 24.8, 20.8] },
  { id: "tra-ext-4190", name: "新市", lat: 23.068, lng: 120.290, temps: [18.9, 19.9, 21.9, 23.9, 26.9, 29.0, 30.0, 30.0, 29.4, 26.9, 24.9, 20.9] },
  { id: "tra-ext-4200", name: "永康", lat: 23.038, lng: 120.253, temps: [18.9, 19.9, 21.9, 24.0, 27.0, 29.0, 30.0, 30.0, 29.5, 27.0, 24.9, 20.9] },
  { id: "tra-ext-4210", name: "大橋", lat: 23.019, lng: 120.224, temps: [19.0, 20.0, 22.0, 24.0, 27.0, 29.0, 30.0, 30.0, 29.5, 27.0, 25.0, 21.0] },
  { id: "tra-ext-4220", name: "臺南", lat: 22.997, lng: 120.212, temps: [19.0, 20.0, 22.0, 24.0, 27.0, 29.0, 30.0, 30.0, 29.5, 27.0, 25.0, 21.0] },
  { id: "tra-ext-4250", name: "保安", lat: 22.933, lng: 120.232, temps: [19.1, 20.1, 22.1, 24.1, 27.1, 29.0, 30.0, 30.0, 29.6, 27.1, 25.1, 21.1] },
  { id: "tra-ext-4260", name: "仁德", lat: 22.924, lng: 120.241, temps: [19.1, 20.1, 22.1, 24.1, 27.1, 29.0, 30.0, 30.0, 29.6, 27.1, 25.1, 21.1] },
  { id: "tra-ext-4270", name: "中洲", lat: 22.904, lng: 120.253, temps: [19.1, 20.1, 22.1, 24.1, 27.1, 29.0, 30.0, 30.0, 29.6, 27.1, 25.1, 21.1] },
  { id: "tra-ext-4271", name: "長榮大學", lat: 22.907, lng: 120.273, temps: [19.1, 20.1, 22.1, 24.1, 27.1, 29.0, 30.0, 30.0, 29.6, 27.1, 25.1, 21.1] },
  { id: "tra-ext-4272", name: "沙崙", lat: 22.924, lng: 120.286, temps: [19.1, 20.1, 22.1, 24.1, 27.1, 29.0, 30.0, 30.0, 29.6, 27.1, 25.1, 21.1] },
  { id: "tra-ext-4290", name: "大湖", lat: 22.878, lng: 120.254, temps: [19.2, 20.2, 22.2, 24.1, 27.1, 29.1, 30.1, 30.1, 29.6, 27.1, 25.2, 21.2] },
  { id: "tra-ext-4300", name: "路竹", lat: 22.854, lng: 120.266, temps: [19.2, 20.2, 22.2, 24.1, 27.1, 29.1, 30.1, 30.1, 29.6, 27.1, 25.2, 21.2] },
  { id: "tra-ext-4310", name: "岡山", lat: 22.792, lng: 120.300, temps: [19.3, 20.3, 22.3, 24.2, 27.2, 29.1, 30.1, 30.1, 29.7, 27.2, 25.3, 21.3] },
  { id: "tra-ext-4320", name: "橋頭", lat: 22.761, lng: 120.310, temps: [19.4, 20.4, 22.4, 24.2, 27.2, 29.1, 30.1, 30.1, 29.7, 27.2, 25.4, 21.4] },
  { id: "tra-ext-4330", name: "楠梓", lat: 22.727, lng: 120.324, temps: [19.4, 20.4, 22.4, 24.3, 27.3, 29.1, 30.1, 30.1, 29.8, 27.3, 25.4, 21.4] },
  { id: "tra-ext-4340", name: "新左營", lat: 22.688, lng: 120.307, temps: [19.5, 20.5, 22.5, 24.3, 27.3, 29.2, 30.2, 30.2, 29.8, 27.3, 25.5, 21.5] },
  { id: "tra-ext-4350", name: "左營", lat: 22.674, lng: 120.294, temps: [19.5, 20.5, 22.5, 24.3, 27.3, 29.2, 30.2, 30.2, 29.8, 27.3, 25.5, 21.5] },
  { id: "tra-ext-4360", name: "內惟", lat: 22.666, lng: 120.287, temps: [19.5, 20.5, 22.5, 24.3, 27.3, 29.2, 30.2, 30.2, 29.8, 27.3, 25.5, 21.5] },
  { id: "tra-ext-4370", name: "美術館", lat: 22.652, lng: 120.281, temps: [19.5, 20.5, 22.5, 24.3, 27.3, 29.2, 30.2, 30.2, 29.8, 27.3, 25.5, 21.5] },
  { id: "tra-ext-4380", name: "鼓山", lat: 22.642, lng: 120.281, temps: [19.5, 20.5, 22.5, 24.4, 27.4, 29.2, 30.2, 30.2, 29.9, 27.4, 25.5, 21.5] },
  { id: "tra-ext-4390", name: "三塊厝", lat: 22.639, lng: 120.294, temps: [19.5, 20.5, 22.5, 24.4, 27.4, 29.2, 30.2, 30.2, 29.9, 27.4, 25.5, 21.5] },
  { id: "tra-ext-4400", name: "高雄", lat: 22.639, lng: 120.303, temps: [19.5, 20.5, 22.5, 24.4, 27.4, 29.2, 30.2, 30.2, 29.9, 27.4, 25.5, 21.5] },
  { id: "tra-ext-4410", name: "民族", lat: 22.639, lng: 120.315, temps: [19.5, 20.5, 22.5, 24.4, 27.4, 29.2, 30.2, 30.2, 29.9, 27.4, 25.5, 21.5] },
  { id: "tra-ext-4420", name: "科工館", lat: 22.637, lng: 120.326, temps: [19.5, 20.5, 22.5, 24.4, 27.4, 29.2, 30.2, 30.2, 29.9, 27.4, 25.5, 21.5] },
  { id: "tra-ext-4430", name: "正義", lat: 22.634, lng: 120.342, temps: [19.5, 20.5, 22.5, 24.4, 27.4, 29.2, 30.2, 30.2, 29.9, 27.4, 25.5, 21.5] },
  { id: "tra-ext-4440", name: "鳳山", lat: 22.631, lng: 120.357, temps: [19.6, 20.6, 22.6, 24.4, 27.4, 29.2, 30.2, 30.2, 29.9, 27.4, 25.6, 21.6] },
  { id: "tra-ext-4450", name: "後庄", lat: 22.640, lng: 120.391, temps: [19.5, 20.5, 22.5, 24.4, 27.4, 29.2, 30.2, 30.2, 29.9, 27.4, 25.5, 21.5] },
  { id: "tra-ext-4460", name: "九曲堂", lat: 22.656, lng: 120.421, temps: [19.5, 20.5, 22.5, 24.3, 27.3, 29.2, 30.2, 30.2, 29.8, 27.3, 25.5, 21.5] },
  { id: "tra-ext-4470", name: "六塊厝", lat: 22.666, lng: 120.465, temps: [19.5, 20.5, 22.5, 24.3, 27.3, 29.2, 30.2, 30.2, 29.8, 27.3, 25.5, 21.5] },
  { id: "tra-ext-5000", name: "屏東", lat: 22.669, lng: 120.486, temps: [19.5, 20.5, 22.5, 24.3, 27.3, 29.2, 30.2, 30.2, 29.8, 27.3, 25.5, 21.5] },
  { id: "tra-ext-5010", name: "歸來", lat: 22.652, lng: 120.503, temps: [19.5, 20.5, 22.5, 24.3, 27.3, 29.2, 30.2, 30.2, 29.8, 27.3, 25.5, 21.5] },
  { id: "tra-ext-5020", name: "麟洛", lat: 22.635, lng: 120.514, temps: [19.5, 20.5, 22.5, 24.4, 27.4, 29.2, 30.2, 30.2, 29.9, 27.4, 25.5, 21.5] },
  { id: "tra-ext-5030", name: "西勢", lat: 22.616, lng: 120.527, temps: [19.6, 20.6, 22.6, 24.4, 27.4, 29.2, 30.2, 30.2, 29.9, 27.4, 25.6, 21.6] },
  { id: "tra-ext-5040", name: "竹田", lat: 22.587, lng: 120.540, temps: [19.6, 20.6, 22.6, 24.4, 27.4, 29.2, 30.2, 30.2, 29.9, 27.4, 25.6, 21.6] },
  { id: "tra-ext-5050", name: "潮州", lat: 22.550, lng: 120.536, temps: [19.7, 20.7, 22.7, 24.4, 27.4, 29.2, 30.2, 30.2, 29.9, 27.4, 25.7, 21.7] },
  { id: "tra-ext-5060", name: "崁頂", lat: 22.513, lng: 120.515, temps: [19.7, 20.7, 22.7, 24.5, 27.5, 29.2, 30.2, 30.2, 30.0, 27.5, 25.7, 21.7] },
  { id: "tra-ext-5070", name: "南州", lat: 22.492, lng: 120.512, temps: [19.8, 20.8, 22.8, 24.5, 27.5, 29.3, 30.3, 30.3, 30.0, 27.5, 25.8, 21.8] },
  { id: "tra-ext-5080", name: "鎮安", lat: 22.458, lng: 120.511, temps: [19.8, 20.8, 22.8, 24.5, 27.5, 29.3, 30.3, 30.3, 30.0, 27.5, 25.8, 21.8] },
  { id: "tra-ext-5090", name: "林邊", lat: 22.431, lng: 120.515, temps: [19.9, 20.9, 22.9, 24.6, 27.6, 29.3, 30.3, 30.3, 30.1, 27.6, 25.9, 21.9] },
  { id: "tra-ext-5100", name: "佳冬", lat: 22.414, lng: 120.548, temps: [19.9, 20.9, 22.9, 24.6, 27.6, 29.3, 30.3, 30.3, 30.1, 27.6, 25.9, 21.9] },
  { id: "tra-ext-5110", name: "東海", lat: 22.399, lng: 120.572, temps: [19.9, 20.9, 22.9, 24.6, 27.6, 29.3, 30.3, 30.3, 30.1, 27.6, 25.9, 21.9] },
  { id: "tra-ext-5120", name: "枋寮", lat: 22.368, lng: 120.595, temps: [19.9, 20.9, 22.9, 24.6, 27.6, 29.3, 30.3, 30.3, 30.1, 27.6, 25.9, 21.9] },
  { id: "tra-ext-5130", name: "加祿", lat: 22.331, lng: 120.624, temps: [20.0, 21.0, 23.0, 24.7, 27.7, 29.3, 30.3, 30.3, 30.2, 27.7, 26.0, 22.0] },
  { id: "tra-ext-5140", name: "內獅", lat: 22.306, lng: 120.643, temps: [20.0, 21.0, 23.0, 24.7, 27.7, 29.3, 30.3, 30.3, 30.2, 27.7, 26.0, 22.0] },
  { id: "tra-ext-5160", name: "枋山", lat: 22.267, lng: 120.659, temps: [20.1, 21.1, 23.1, 24.7, 27.7, 29.4, 30.4, 30.4, 30.2, 27.7, 26.1, 22.1] },
  { id: "tra-ext-5170", name: "枋野", lat: 22.281, lng: 120.717, temps: [20.1, 21.1, 23.1, 24.7, 27.7, 29.4, 30.4, 30.4, 30.2, 27.7, 26.1, 22.1] },
  { id: "tra-ext-5190", name: "大武", lat: 22.365, lng: 120.901, temps: [20.0, 21.0, 23.0, 24.6, 27.6, 29.3, 30.3, 30.3, 30.1, 27.6, 26.0, 22.0] },
  { id: "tra-ext-5200", name: "瀧溪", lat: 22.461, lng: 120.942, temps: [19.8, 20.8, 22.8, 24.5, 27.5, 29.3, 30.3, 30.3, 30.0, 27.5, 25.8, 21.8] },
  { id: "tra-ext-5210", name: "金崙", lat: 22.532, lng: 120.967, temps: [19.7, 20.7, 22.7, 24.5, 27.5, 29.2, 30.2, 30.2, 30.0, 27.5, 25.7, 21.7] },
  { id: "tra-ext-5220", name: "太麻里", lat: 22.619, lng: 121.005, temps: [19.6, 20.6, 22.6, 24.4, 27.4, 29.2, 30.2, 30.2, 29.9, 27.4, 25.6, 21.6] },
  { id: "tra-ext-5230", name: "知本", lat: 22.710, lng: 121.061, temps: [19.4, 20.4, 22.4, 24.3, 27.3, 29.1, 30.1, 30.1, 29.8, 27.3, 25.4, 21.4] },
  { id: "tra-ext-5240", name: "康樂", lat: 22.764, lng: 121.094, temps: [19.4, 20.4, 22.4, 24.2, 27.2, 29.1, 30.1, 30.1, 29.7, 27.2, 25.4, 21.4] },
  { id: "tra-ext-5998", name: "南方小站", lat: 22.528, lng: 120.537, temps: [19.7, 20.7, 22.7, 24.5, 27.5, 29.2, 30.2, 30.2, 30.0, 27.5, 25.7, 21.7] },
  { id: "tra-ext-5999", name: "潮州基地", lat: 22.522, lng: 120.526, temps: [19.7, 20.7, 22.7, 24.5, 27.5, 29.2, 30.2, 30.2, 30.0, 27.5, 25.7, 21.7] },
  { id: "tra-ext-6000", name: "臺東", lat: 22.794, lng: 121.123, temps: [19.3, 20.3, 22.3, 24.2, 27.2, 29.1, 30.1, 30.1, 29.7, 27.2, 25.3, 21.3] },
  { id: "tra-ext-6010", name: "山里", lat: 22.862, lng: 121.138, temps: [19.2, 20.2, 22.2, 24.1, 27.1, 29.1, 30.1, 30.1, 29.6, 27.1, 25.2, 21.2] },
  { id: "tra-ext-6020", name: "鹿野", lat: 22.912, lng: 121.137, temps: [19.1, 20.1, 22.1, 24.1, 27.1, 29.0, 30.0, 30.0, 29.6, 27.1, 25.1, 21.1] },
  { id: "tra-ext-6030", name: "瑞源", lat: 22.956, lng: 121.159, temps: [19.1, 20.1, 22.1, 24.0, 27.0, 29.0, 30.0, 30.0, 29.5, 27.0, 25.1, 21.1] },
  { id: "tra-ext-6040", name: "瑞和", lat: 22.980, lng: 121.156, temps: [19.0, 20.0, 22.0, 24.0, 27.0, 29.0, 30.0, 30.0, 29.5, 27.0, 25.0, 21.0] },
  { id: "tra-ext-6050", name: "關山", lat: 23.046, lng: 121.164, temps: [18.9, 19.9, 21.9, 24.0, 27.0, 29.0, 30.0, 30.0, 29.5, 27.0, 24.9, 20.9] },
  { id: "tra-ext-6060", name: "海端", lat: 23.103, lng: 121.177, temps: [18.8, 19.8, 21.8, 23.9, 26.9, 28.9, 29.9, 29.9, 29.4, 26.9, 24.8, 20.8] },
  { id: "tra-ext-6070", name: "池上", lat: 23.126, lng: 121.219, temps: [18.8, 19.8, 21.8, 23.9, 26.9, 28.9, 29.9, 29.9, 29.4, 26.9, 24.8, 20.8] },
  { id: "tra-ext-6080", name: "富里", lat: 23.179, lng: 121.249, temps: [18.7, 19.7, 21.7, 23.8, 26.8, 28.9, 29.9, 29.9, 29.3, 26.8, 24.7, 20.7] },
  { id: "tra-ext-6090", name: "東竹", lat: 23.226, lng: 121.278, temps: [18.7, 19.7, 21.7, 23.8, 26.8, 28.9, 29.9, 29.9, 29.3, 26.8, 24.7, 20.7] },
  { id: "tra-ext-6100", name: "東里", lat: 23.272, lng: 121.304, temps: [18.6, 19.6, 21.6, 23.7, 26.7, 28.9, 29.9, 29.9, 29.2, 26.7, 24.6, 20.6] },
  { id: "tra-ext-6110", name: "玉里", lat: 23.332, lng: 121.312, temps: [18.5, 19.5, 21.5, 23.7, 26.7, 28.8, 29.8, 29.8, 29.2, 26.7, 24.5, 20.5] },
  { id: "tra-ext-6120", name: "三民", lat: 23.425, lng: 121.345, temps: [18.4, 19.4, 21.4, 23.6, 26.6, 28.8, 29.8, 29.8, 29.1, 26.6, 24.4, 20.4] },
  { id: "tra-ext-6130", name: "瑞穗", lat: 23.497, lng: 121.377, temps: [18.3, 19.3, 21.3, 23.5, 26.5, 28.8, 29.8, 29.8, 29.0, 26.5, 24.3, 20.3] },
  { id: "tra-ext-6140", name: "富源", lat: 23.580, lng: 121.380, temps: [18.1, 19.1, 21.1, 23.4, 26.4, 28.7, 29.7, 29.7, 28.9, 26.4, 24.1, 20.1] },
  { id: "tra-ext-6150", name: "大富", lat: 23.606, lng: 121.390, temps: [18.1, 19.1, 21.1, 23.4, 26.4, 28.7, 29.7, 29.7, 28.9, 26.4, 24.1, 20.1] },
  { id: "tra-ext-6160", name: "光復", lat: 23.666, lng: 121.421, temps: [18.0, 19.0, 21.0, 23.3, 26.3, 28.7, 29.7, 29.7, 28.8, 26.3, 24.0, 20.0] },
  { id: "tra-ext-6170", name: "萬榮", lat: 23.712, lng: 121.419, temps: [17.9, 18.9, 20.9, 23.3, 26.3, 28.6, 29.6, 29.6, 28.8, 26.3, 23.9, 19.9] },
  { id: "tra-ext-6180", name: "鳳林", lat: 23.746, lng: 121.447, temps: [17.9, 18.9, 20.9, 23.3, 26.3, 28.6, 29.6, 29.6, 28.8, 26.3, 23.9, 19.9] },
  { id: "tra-ext-6190", name: "南平", lat: 23.782, lng: 121.458, temps: [17.8, 18.8, 20.8, 23.2, 26.2, 28.6, 29.6, 29.6, 28.7, 26.2, 23.8, 19.8] },
  { id: "tra-ext-6200", name: "林榮新光", lat: 23.802, lng: 121.462, temps: [17.8, 18.8, 20.8, 23.2, 26.2, 28.6, 29.6, 29.6, 28.7, 26.2, 23.8, 19.8] },
  { id: "tra-ext-6210", name: "豐田", lat: 23.848, lng: 121.496, temps: [17.7, 18.7, 20.7, 23.2, 26.2, 28.6, 29.6, 29.6, 28.7, 26.2, 23.7, 19.7] },
  { id: "tra-ext-6220", name: "壽豐", lat: 23.869, lng: 121.511, temps: [17.7, 18.7, 20.7, 23.1, 26.1, 28.6, 29.6, 29.6, 28.6, 26.1, 23.7, 19.7] },
  { id: "tra-ext-6230", name: "平和", lat: 23.883, lng: 121.520, temps: [17.7, 18.7, 20.7, 23.1, 26.1, 28.6, 29.6, 29.6, 28.6, 26.1, 23.7, 19.7] },
  { id: "tra-ext-6240", name: "志學", lat: 23.908, lng: 121.529, temps: [17.6, 18.6, 20.6, 23.1, 26.1, 28.5, 29.5, 29.5, 28.6, 26.1, 23.6, 19.6] },
  { id: "tra-ext-6250", name: "吉安", lat: 23.968, lng: 121.583, temps: [17.5, 18.5, 20.5, 23.0, 26.0, 28.5, 29.5, 29.5, 28.5, 26.0, 23.5, 19.5] },
  { id: "tra-ext-7000", name: "花蓮", lat: 23.993, lng: 121.602, temps: [17.5, 18.5, 20.5, 23.0, 26.0, 28.5, 29.5, 29.5, 28.5, 26.0, 23.5, 19.5] },
  { id: "tra-ext-7010", name: "北埔", lat: 24.033, lng: 121.602, temps: [17.5, 18.5, 20.5, 23.0, 26.0, 28.5, 29.5, 29.5, 28.5, 26.0, 23.5, 19.5] },
  { id: "tra-ext-7020", name: "景美", lat: 24.090, lng: 121.611, temps: [17.4, 18.4, 20.4, 22.9, 25.9, 28.5, 29.5, 29.5, 28.4, 25.9, 23.4, 19.4] },
  { id: "tra-ext-7030", name: "新城", lat: 24.128, lng: 121.641, temps: [17.3, 18.3, 20.3, 22.9, 25.9, 28.4, 29.4, 29.4, 28.4, 25.9, 23.3, 19.3] },
  { id: "tra-ext-7040", name: "崇德", lat: 24.172, lng: 121.655, temps: [17.2, 18.2, 20.2, 22.8, 25.8, 28.4, 29.4, 29.4, 28.3, 25.8, 23.2, 19.2] },
  { id: "tra-ext-7050", name: "和仁", lat: 24.242, lng: 121.712, temps: [17.1, 18.1, 20.1, 22.8, 25.8, 28.4, 29.4, 29.4, 28.3, 25.8, 23.1, 19.1] },
  { id: "tra-ext-7060", name: "和平", lat: 24.298, lng: 121.753, temps: [17.1, 18.1, 20.1, 22.7, 25.7, 28.4, 29.4, 29.4, 28.2, 25.7, 23.1, 19.1] },
  { id: "tra-ext-7070", name: "漢本", lat: 24.335, lng: 121.768, temps: [17.0, 18.0, 20.0, 22.7, 25.7, 28.3, 29.3, 29.3, 28.2, 25.7, 23.0, 19.0] },
  { id: "tra-ext-7080", name: "武塔", lat: 24.449, lng: 121.776, temps: [16.8, 17.8, 19.8, 22.6, 25.6, 28.3, 29.3, 29.3, 28.1, 25.6, 22.8, 18.8] },
  { id: "tra-ext-7090", name: "南澳", lat: 24.463, lng: 121.801, temps: [16.8, 17.8, 19.8, 22.5, 25.5, 28.3, 29.3, 29.3, 28.0, 25.5, 22.8, 18.8] },
  { id: "tra-ext-7100", name: "東澳", lat: 24.518, lng: 121.831, temps: [16.7, 17.7, 19.7, 22.5, 25.5, 28.2, 29.2, 29.2, 28.0, 25.5, 22.7, 18.7] },
  { id: "tra-ext-7110", name: "永樂", lat: 24.568, lng: 121.845, temps: [16.6, 17.6, 19.6, 22.4, 25.4, 28.2, 29.2, 29.2, 27.9, 25.4, 22.6, 18.6] },
  { id: "tra-ext-7120", name: "蘇澳", lat: 24.595, lng: 121.851, temps: [16.6, 17.6, 19.6, 22.4, 25.4, 28.2, 29.2, 29.2, 27.9, 25.4, 22.6, 18.6] },
  { id: "tra-ext-7130", name: "蘇澳新", lat: 24.609, lng: 121.827, temps: [16.6, 17.6, 19.6, 22.4, 25.4, 28.2, 29.2, 29.2, 27.9, 25.4, 22.6, 18.6] },
  { id: "tra-ext-7140", name: "新馬", lat: 24.615, lng: 121.823, temps: [16.6, 17.6, 19.6, 22.4, 25.4, 28.2, 29.2, 29.2, 27.9, 25.4, 22.6, 18.6] },
  { id: "tra-ext-7150", name: "冬山", lat: 24.636, lng: 121.792, temps: [16.5, 17.5, 19.5, 22.4, 25.4, 28.2, 29.2, 29.2, 27.9, 25.4, 22.5, 18.5] },
  { id: "tra-ext-7160", name: "羅東", lat: 24.678, lng: 121.774, temps: [16.5, 17.5, 19.5, 22.3, 25.3, 28.2, 29.2, 29.2, 27.8, 25.3, 22.5, 18.5] },
  { id: "tra-ext-7170", name: "中里", lat: 24.694, lng: 121.775, temps: [16.5, 17.5, 19.5, 22.3, 25.3, 28.2, 29.2, 29.2, 27.8, 25.3, 22.5, 18.5] },
  { id: "tra-ext-7180", name: "二結", lat: 24.705, lng: 121.774, temps: [16.4, 17.4, 19.4, 22.3, 25.3, 28.1, 29.1, 29.1, 27.8, 25.3, 22.4, 18.4] },
  { id: "tra-ext-7190", name: "宜蘭", lat: 24.755, lng: 121.758, temps: [16.4, 17.4, 19.4, 22.2, 25.2, 28.1, 29.1, 29.1, 27.7, 25.2, 22.4, 18.4] },
  { id: "tra-ext-7200", name: "四城", lat: 24.787, lng: 121.763, temps: [16.3, 17.3, 19.3, 22.2, 25.2, 28.1, 29.1, 29.1, 27.7, 25.2, 22.3, 18.3] },
  { id: "tra-ext-7210", name: "礁溪", lat: 24.827, lng: 121.775, temps: [16.3, 17.3, 19.3, 22.2, 25.2, 28.1, 29.1, 29.1, 27.7, 25.2, 22.3, 18.3] },
  { id: "tra-ext-7220", name: "頂埔", lat: 24.844, lng: 121.809, temps: [16.2, 17.2, 19.2, 22.2, 25.2, 28.1, 29.1, 29.1, 27.7, 25.2, 22.2, 18.2] },
  { id: "tra-ext-7230", name: "頭城", lat: 24.859, lng: 121.823, temps: [16.2, 17.2, 19.2, 22.1, 25.1, 28.1, 29.1, 29.1, 27.6, 25.1, 22.2, 18.2] },
  { id: "tra-ext-7240", name: "外澳", lat: 24.884, lng: 121.846, temps: [16.2, 17.2, 19.2, 22.1, 25.1, 28.1, 29.1, 29.1, 27.6, 25.1, 22.2, 18.2] },
  { id: "tra-ext-7250", name: "龜山", lat: 24.905, lng: 121.869, temps: [16.1, 17.1, 19.1, 22.1, 25.1, 28.0, 29.0, 29.0, 27.6, 25.1, 22.1, 18.1] },
  { id: "tra-ext-7260", name: "大溪", lat: 24.938, lng: 121.890, temps: [16.1, 17.1, 19.1, 22.1, 25.1, 28.0, 29.0, 29.0, 27.6, 25.1, 22.1, 18.1] },
  { id: "tra-ext-7270", name: "大里", lat: 24.967, lng: 121.923, temps: [16.0, 17.0, 19.0, 22.0, 25.0, 28.0, 29.0, 29.0, 27.5, 25.0, 22.0, 18.0] },
  { id: "tra-ext-7280", name: "石城", lat: 24.978, lng: 121.945, temps: [16.0, 17.0, 19.0, 22.0, 25.0, 28.0, 29.0, 29.0, 27.5, 25.0, 22.0, 18.0] },
  { id: "tra-ext-7290", name: "福隆", lat: 25.016, lng: 121.945, temps: [16.0, 17.0, 19.0, 22.0, 25.0, 28.0, 29.0, 29.0, 27.5, 25.0, 22.0, 18.0] },
  { id: "tra-ext-7300", name: "貢寮", lat: 25.022, lng: 121.909, temps: [16.0, 17.0, 19.0, 22.0, 25.0, 28.0, 29.0, 29.0, 27.5, 25.0, 22.0, 18.0] },
  { id: "tra-ext-7310", name: "雙溪", lat: 25.039, lng: 121.867, temps: [15.9, 16.9, 18.9, 22.0, 25.0, 28.0, 29.0, 29.0, 27.5, 25.0, 21.9, 17.9] },
  { id: "tra-ext-7320", name: "牡丹", lat: 25.059, lng: 121.852, temps: [15.9, 16.9, 18.9, 21.9, 24.9, 28.0, 29.0, 29.0, 27.4, 24.9, 21.9, 17.9] },
  { id: "tra-ext-7330", name: "三貂嶺", lat: 25.066, lng: 121.823, temps: [15.9, 16.9, 18.9, 21.9, 24.9, 28.0, 29.0, 29.0, 27.4, 24.9, 21.9, 17.9] },
  { id: "tra-ext-7331", name: "大華", lat: 25.050, lng: 121.797, temps: [15.9, 16.9, 18.9, 22.0, 25.0, 28.0, 29.0, 29.0, 27.5, 25.0, 21.9, 17.9] },
  { id: "tra-ext-7332", name: "十分", lat: 25.041, lng: 121.775, temps: [15.9, 16.9, 18.9, 22.0, 25.0, 28.0, 29.0, 29.0, 27.5, 25.0, 21.9, 17.9] },
  { id: "tra-ext-7333", name: "望古", lat: 25.034, lng: 121.763, temps: [15.9, 16.9, 18.9, 22.0, 25.0, 28.0, 29.0, 29.0, 27.5, 25.0, 21.9, 17.9] },
  { id: "tra-ext-7334", name: "嶺腳", lat: 25.030, lng: 121.748, temps: [16.0, 17.0, 19.0, 22.0, 25.0, 28.0, 29.0, 29.0, 27.5, 25.0, 22.0, 18.0] },
  { id: "tra-ext-7335", name: "平溪", lat: 25.026, lng: 121.740, temps: [16.0, 17.0, 19.0, 22.0, 25.0, 28.0, 29.0, 29.0, 27.5, 25.0, 22.0, 18.0] },
  { id: "tra-ext-7336", name: "菁桐", lat: 25.024, lng: 121.724, temps: [16.0, 17.0, 19.0, 22.0, 25.0, 28.0, 29.0, 29.0, 27.5, 25.0, 22.0, 18.0] },
  { id: "tra-ext-7350", name: "猴硐", lat: 25.087, lng: 121.827, temps: [15.9, 16.9, 18.9, 21.9, 24.9, 28.0, 29.0, 29.0, 27.4, 24.9, 21.9, 17.9] },
  { id: "tra-ext-7360", name: "瑞芳", lat: 25.109, lng: 121.806, temps: [15.8, 16.8, 18.8, 21.9, 24.9, 27.9, 28.9, 28.9, 27.4, 24.9, 21.8, 17.8] },
  { id: "tra-ext-7361", name: "海科館", lat: 25.138, lng: 121.800, temps: [15.8, 16.8, 18.8, 21.9, 24.9, 27.9, 28.9, 28.9, 27.4, 24.9, 21.8, 17.8] },
  { id: "tra-ext-7362", name: "八斗子", lat: 25.135, lng: 121.803, temps: [15.8, 16.8, 18.8, 21.9, 24.9, 27.9, 28.9, 28.9, 27.4, 24.9, 21.8, 17.8] },
  { id: "tra-ext-7380", name: "四腳亭", lat: 25.103, lng: 121.762, temps: [15.8, 16.8, 18.8, 21.9, 24.9, 27.9, 28.9, 28.9, 27.4, 24.9, 21.8, 17.8] },
  { id: "tra-ext-7390", name: "暖暖", lat: 25.102, lng: 121.740, temps: [15.8, 16.8, 18.8, 21.9, 24.9, 27.9, 28.9, 28.9, 27.4, 24.9, 21.8, 17.8] },
  { id: "mt-ext-000", name: "太平山", lat: 24.490, lng: 121.530, temps: [8.5, 9.5, 11.5, 14.0, 16.0, 17.5, 18.0, 17.8, 16.5, 14.0, 11.5, 9.5] },
  { id: "mt-ext-001", name: "梨山", lat: 24.250, lng: 121.250, temps: [10.5, 11.5, 13.5, 16.0, 18.0, 19.5, 20.0, 19.8, 18.5, 16.0, 13.5, 11.5] },
  { id: "mt-ext-002", name: "合歡山", lat: 24.140, lng: 121.270, temps: [0.5, 1.5, 3.5, 6.0, 8.0, 9.5, 10.0, 9.8, 8.5, 6.0, 3.5, 1.5] },
  { id: "mt-ext-003", name: "奇萊山", lat: 24.110, lng: 121.320, temps: [-0.5, 0.5, 2.5, 5.0, 7.0, 8.5, 9.0, 8.8, 7.5, 5.0, 2.5, 0.5] },
  { id: "mt-ext-004", name: "雪山", lat: 24.380, lng: 121.230, temps: [-1.5, -0.5, 1.5, 4.0, 6.0, 7.5, 8.0, 7.8, 6.5, 4.0, 1.5, -0.5] },
  { id: "mt-ext-005", name: "大霸尖山", lat: 24.460, lng: 121.260, temps: [-0.5, 0.5, 2.5, 5.0, 7.0, 8.5, 9.0, 8.8, 7.5, 5.0, 2.5, 0.5] },
  { id: "mt-ext-006", name: "南湖大山", lat: 24.360, lng: 121.440, temps: [-0.5, 0.5, 2.5, 5.0, 7.0, 8.5, 9.0, 8.8, 7.5, 5.0, 2.5, 0.5] },
  { id: "mt-ext-007", name: "清境", lat: 24.050, lng: 121.160, temps: [11.5, 12.5, 14.5, 17.0, 19.0, 20.5, 21.0, 20.8, 19.5, 17.0, 14.5, 12.5] },
  { id: "mt-ext-008", name: "杉林溪", lat: 23.630, lng: 120.790, temps: [10.5, 11.5, 13.5, 16.0, 18.0, 19.5, 20.0, 19.8, 18.5, 16.0, 13.5, 11.5] },
  { id: "mt-ext-009", name: "溪頭", lat: 23.670, lng: 120.790, temps: [11.5, 12.5, 14.5, 17.0, 19.0, 20.5, 21.0, 20.8, 19.5, 17.0, 14.5, 12.5] },
  { id: "mt-ext-010", name: "秀姑巒山", lat: 23.500, lng: 121.060, temps: [-0.5, 0.5, 2.5, 5.0, 7.0, 8.5, 9.0, 8.8, 7.5, 5.0, 2.5, 0.5] },
  { id: "mt-ext-011", name: "向陽山", lat: 23.290, lng: 121.030, temps: [0.5, 1.5, 3.5, 6.0, 8.0, 9.5, 10.0, 9.8, 8.5, 6.0, 3.5, 1.5] },
  { id: "mt-ext-012", name: "關山", lat: 23.250, lng: 120.870, temps: [0.5, 1.5, 3.5, 6.0, 8.0, 9.5, 10.0, 9.8, 8.5, 6.0, 3.5, 1.5] },
  { id: "mt-ext-013", name: "北大武山", lat: 22.620, lng: 120.750, temps: [3.5, 4.5, 6.5, 9.0, 11.0, 12.5, 13.0, 12.8, 11.5, 9.0, 6.5, 4.5] },
  { id: "mt-ext-014", name: "霧台", lat: 22.740, lng: 120.730, temps: [15.5, 16.5, 18.5, 21.0, 23.0, 24.5, 25.0, 24.8, 23.5, 21.0, 18.5, 16.5] },
  { id: "mt-ext-015", name: "茂林", lat: 22.880, lng: 120.660, temps: [17.5, 18.5, 20.5, 23.0, 25.0, 26.5, 27.0, 26.8, 25.5, 23.0, 20.5, 18.5] },
  { id: "mt-ext-016", name: "拉拉山", lat: 24.710, lng: 121.430, temps: [9.5, 10.5, 12.5, 15.0, 17.0, 18.5, 19.0, 18.8, 17.5, 15.0, 12.5, 10.5] },
  { id: "mt-ext-017", name: "司馬庫斯", lat: 24.580, lng: 121.330, temps: [10.5, 11.5, 13.5, 16.0, 18.0, 19.5, 20.0, 19.8, 18.5, 16.0, 13.5, 11.5] },
  { id: "mt-ext-018", name: "觀霧", lat: 24.500, lng: 121.110, temps: [9.5, 10.5, 12.5, 15.0, 17.0, 18.5, 19.0, 18.8, 17.5, 15.0, 12.5, 10.5] },
  { id: "mt-ext-019", name: "七星山", lat: 25.170, lng: 121.550, temps: [11.5, 12.5, 14.5, 17.0, 19.0, 20.5, 21.0, 20.8, 19.5, 17.0, 14.5, 12.5] },
  { id: "mt-ext-020", name: "大雪山", lat: 24.280, lng: 120.930, temps: [5.5, 6.5, 8.5, 11.0, 13.0, 14.5, 15.0, 14.8, 13.5, 11.0, 8.5, 6.5] },
  { id: "mt-ext-021", name: "八仙山", lat: 24.230, lng: 121.000, temps: [7.5, 8.5, 10.5, 13.0, 15.0, 16.5, 17.0, 16.8, 15.5, 13.0, 10.5, 8.5] },
  { id: "mt-ext-022", name: "藤枝", lat: 22.720, lng: 120.700, temps: [15.5, 16.5, 18.5, 21.0, 23.0, 24.5, 25.0, 24.8, 23.5, 21.0, 18.5, 16.5] },
  { id: "mt-ext-023", name: "南橫", lat: 23.270, lng: 120.940, temps: [7.5, 8.5, 10.5, 13.0, 15.0, 16.5, 17.0, 16.8, 15.5, 13.0, 10.5, 8.5] },
  { id: "mt-ext-024", name: "玉里山", lat: 23.350, lng: 121.250, temps: [13.5, 14.5, 16.5, 19.0, 21.0, 22.5, 23.0, 22.8, 21.5, 19.0, 16.5, 14.5] },
  { id: "mt-ext-025", name: "太魯閣大山", lat: 24.120, lng: 121.470, temps: [3.5, 4.5, 6.5, 9.0, 11.0, 12.5, 13.0, 12.8, 11.5, 9.0, 6.5, 4.5] },
  { id: "mt-ext-026", name: "能高山", lat: 23.980, lng: 121.260, temps: [1.5, 2.5, 4.5, 7.0, 9.0, 10.5, 11.0, 10.8, 9.5, 7.0, 4.5, 2.5] },
  { id: "mt-ext-027", name: "丹大山", lat: 23.850, lng: 121.230, temps: [2.5, 3.5, 5.5, 8.0, 10.0, 11.5, 12.0, 11.8, 10.5, 8.0, 5.5, 3.5] },
  { id: "mt-ext-028", name: "馬博拉斯山", lat: 23.530, lng: 121.030, temps: [-0.5, 0.5, 2.5, 5.0, 7.0, 8.5, 9.0, 8.8, 7.5, 5.0, 2.5, 0.5] },
  { id: "mt-ext-029", name: "大水窟山", lat: 23.480, lng: 121.050, temps: [0.5, 1.5, 3.5, 6.0, 8.0, 9.5, 10.0, 9.8, 8.5, 6.0, 3.5, 1.5] },
  { id: "mt-ext-030", name: "新康山", lat: 23.280, lng: 121.030, temps: [1.5, 2.5, 4.5, 7.0, 9.0, 10.5, 11.0, 10.8, 9.5, 7.0, 4.5, 2.5] },
  { id: "mt-ext-031", name: "卑南主山", lat: 22.950, lng: 120.870, temps: [2.5, 3.5, 5.5, 8.0, 10.0, 11.5, 12.0, 11.8, 10.5, 8.0, 5.5, 3.5] },
  { id: "mt-ext-032", name: "知本主山", lat: 22.750, lng: 120.870, temps: [5.5, 6.5, 8.5, 11.0, 13.0, 14.5, 15.0, 14.8, 13.5, 11.0, 8.5, 6.5] },
  { id: "mt-ext-033", name: "大武山", lat: 22.580, lng: 120.760, temps: [4.5, 5.5, 7.5, 10.0, 12.0, 13.5, 14.0, 13.8, 12.5, 10.0, 7.5, 5.5] }
];

EXTRA_STATIONS.forEach(st => {
  SPOTS_DATA.push({
    id: st.id,
    name: st.name,
    type: "semi-outdoor",
    typeName: "觀測節點",
    lat: st.lat,
    lng: st.lng,
    isHidden: true,
    monthly: st.temps.map((t, index) => ({
      month: index + 1,
      temp: t,
      flow: 100
    })),
    simulate: () => 100
  });
});


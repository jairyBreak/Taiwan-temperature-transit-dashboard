import fs from 'fs';
import { SPOTS_DATA } from './data.js';

const daysInMonth = [31, 28, 31, 30];

for (let m = 1; m <= 4; m++) {
  const records = [];
  const days = daysInMonth[m - 1];
  
  SPOTS_DATA.forEach(spot => {
    const monthData = spot.monthly ? spot.monthly.find(mm => mm.month === m) : null;
    const baseTemp = monthData ? monthData.temp : 20;
    
    for (let d = 1; d <= days; d++) {
      // Simulate daily variation
      const noise = (Math.random() - 0.5) * 4; // +/- 2 degrees
      const temp = Math.round((baseTemp + noise) * 10) / 10;
      const flow = Math.round(spot.simulate(temp, "sunny") * (0.8 + Math.random() * 0.4));
      
      records.push({
        spot_name: spot.name,
        latitude: spot.lat,
        longitude: spot.lng,
        temperature: temp,
        pedestrian_flow: flow,
        time: `${m.toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}`
      });
    }
  });
  
  fs.writeFileSync(`./data/mrt_2026_${m.toString().padStart(2, '0')}.json`, JSON.stringify(records, null, 2));
  console.log(`Generated month ${m} with ${records.length} records`);
}

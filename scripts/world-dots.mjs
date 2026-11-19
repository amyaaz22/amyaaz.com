import fs from 'fs';
import { feature } from 'topojson-client';
import { geoContains } from 'd3-geo';
const topo = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-110m.json'));
const fc = feature(topo, topo.objects.countries).features;
// ISO numeric ids: Africa + Middle East
const MEA = new Set([12,24,204,72,854,108,132,120,140,148,174,178,180,262,818,226,232,231,266,270,288,324,624,404,426,430,434,450,454,466,478,480,504,508,516,562,566,646,678,686,690,694,706,710,728,729,748,834,768,788,800,894,716,732,
 /* Middle East */ 784,682,512,634,414,48,368,760,400,422,275,376,792,364,887,792]);
const step = 1.7, out = [];
for (let lat = 78; lat >= -57; lat -= step) {
  for (let lon = -170; lon <= 180; lon += step) {
    const p = [lon + (Math.round((78 - lat) / step) % 2) * step / 2, lat];
    for (const f of fc) { if (f.id === '010') continue; if (geoContains(f, p)) { out.push([+p[0].toFixed(1), +p[1].toFixed(1), MEA.has(+f.id) ? 1 : 0]); break; } }
  }
}
fs.mkdirSync('public/assets/data', { recursive: true });
fs.writeFileSync('public/assets/data/world-dots.json', JSON.stringify(out));
console.log(out.length, out.filter(d => d[2]).length);

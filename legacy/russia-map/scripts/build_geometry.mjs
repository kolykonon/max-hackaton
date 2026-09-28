import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import mapshaper from 'mapshaper';
import {normalize,bounds} from '../core.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');process.chdir(root);
const read=p=>JSON.parse(fs.readFileSync(p));const write=(p,x)=>fs.writeFileSync(p,JSON.stringify(x));
const catalog=read('data/catalog.json');const source=read('data/raw/russia.geojson');
const extra=fs.existsSync('data/raw/supplement.geojson')?read('data/raw/supplement.geojson').features:[];
const aliases={'Бурятия':'Республика Бурятия','Тыва':'Республика Тыва','Адыгея':'Республика Адыгея','Татарстан':'Республика Татарстан','Марий Эл':'Республика Марий Эл','Чувашия':'Чувашская Республика','Северная Осетия - Алания':'Республика Северная Осетия — Алания','Алтай':'Республика Алтай','Дагестан':'Республика Дагестан','Ингушетия':'Республика Ингушетия','Башкортостан':'Республика Башкортостан','Москва':'г. Москва','Кемеровская область':'Кемеровская область — Кузбасс'};
const names=[...new Set(catalog.map(c=>c.sourceRegion))];
const features=[...source.features,...extra].map((f,i)=>{
 const sourceName=f.properties.name;const n=aliases[sourceName]??sourceName;const name=names.find(v=>normalize(v)===normalize(n))??n;
 return {type:'Feature',properties:{id:`r${i+1}`,name,sourceName,disputed:!!f.properties.disputed},geometry:f.geometry};
});
const regionIndex=features.map(f=>({...f.properties,bounds:bounds(f),detail:`data/regions/${f.properties.id}.geojson`,catalogRegions:names.filter(n=>n===f.properties.name)}));
write('data/regions-index.json',regionIndex);
features.forEach(f=>write(`data/regions/${f.properties.id}.geojson`,f));
write('data/raw/normalized.geojson',{type:'FeatureCollection',features});
// Build topology once across neighbors. Explode preserves every disconnected polygon during simplification.
await mapshaper.runCommands('-i data/raw/normalized.geojson -explode -simplify weighted 20% keep-shapes -o data/raw/parts.geojson format=geojson');
const parts=read('data/raw/parts.geojson');const grouped=features.map(f=>({...f,geometry:{type:'MultiPolygon',coordinates:parts.features.filter(p=>p.properties.id===f.properties.id).flatMap(p=>p.geometry.type==='Polygon'?[p.geometry.coordinates]:p.geometry.coordinates)}}));
for(let i=0;i<features.length;i++){
 const original=features[i].geometry.type==='Polygon'?1:features[i].geometry.coordinates.length;
 if(grouped[i].geometry.coordinates.length!==original)throw Error('Lost islands: '+features[i].properties.name);
}
write('data/raw/overview.geojson',{type:'FeatureCollection',features:grouped});
await mapshaper.runCommands('-i data/raw/overview.geojson -o data/overview.topo.json format=topojson quantization=1000000');
fs.copyFileSync('../../data/moscow-districts.geojson','data/moscow-districts.geojson');
fs.copyFileSync('node_modules/d3/dist/d3.min.js','vendor/d3.min.js');
fs.copyFileSync('node_modules/topojson-client/dist/topojson-client.min.js','vendor/topojson-client.min.js');
fs.copyFileSync('node_modules/d3/LICENSE','vendor/d3-LICENSE');
fs.copyFileSync('node_modules/topojson-client/LICENSE','vendor/topojson-LICENSE');
console.log('Built',features.length,'regions; unmapped:',names.filter(n=>!regionIndex.some(r=>r.name===n)));

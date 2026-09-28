import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {contains,inBounds} from '../core.js';
process.chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'));
const read=p=>JSON.parse(fs.readFileSync(p));const index=read('data/regions-index.json'),catalog=read('data/catalog.json');
const coords=fs.existsSync('data/coordinates.json')?read('data/coordinates.json'):{};
const features=new Map(index.map(r=>[r.id,read(r.detail)]));const districts=read('data/moscow-districts.geojson');
const centers=catalog.map(c=>{
 const region=index.find(r=>r.name===c.sourceRegion);const location=coords[c.id]??{coordinates:null,quality:'unresolved',reason:'Геокодирование ещё не завершено'};
 const geographic=location.coordinates?index.filter(r=>inBounds(location.coordinates,r.bounds)&&contains(features.get(r.id),location.coordinates)):[];
 const district=location.coordinates?districts.features.find(f=>contains(f,location.coordinates)):null;
 return {...c,regionId:region?.id??null,geographicRegionIds:geographic.map(r=>r.id),geographicRegionNames:geographic.map(r=>r.name),districtId:district?.properties.id??null,location,regionMismatch:!!(geographic.length&&region&&!geographic.some(r=>r.id===region.id))};
});
fs.writeFileSync('data/centers.json',JSON.stringify(centers));
const report={imported:catalog.length,uniqueIds:new Set(catalog.map(c=>c.id)).size,sourceRegions:new Set(catalog.map(c=>c.sourceRegion)).size,boundaryRegions:index.length,exact:centers.filter(c=>c.location.quality==='exact').length,approximate:centers.filter(c=>c.location.quality==='approximate').length,unresolved:centers.filter(c=>!c.location.coordinates).length,unmappedRegions:[...new Set(centers.filter(c=>!c.regionId).map(c=>c.sourceRegion))],regionsWithoutCenters:index.filter(r=>!centers.some(c=>c.regionId===r.id)).map(r=>r.name),crossRegion:centers.filter(c=>c.regionMismatch).map(c=>({id:c.id,name:c.name,sourceRegion:c.sourceRegion,geographicRegions:c.geographicRegionNames,quality:c.location.quality})),outsideGeometry:centers.filter(c=>c.location.coordinates&&!c.geographicRegionIds.length).map(c=>c.id)};
fs.writeFileSync('reports/data-report.json',JSON.stringify(report,null,2));
const escape=x=>'"'+String(x??'').replaceAll('"','""')+'"';
const csv=(file,items)=>fs.writeFileSync(file,'\uFEFF'+[['ID','Название','Регион справочника','Город','Адрес','Качество координат','Причина'],...items.map(c=>[c.id,c.name,c.sourceRegion,c.city,c.address,c.location.quality,c.location.reason])].map(r=>r.map(escape).join(';')).join('\n'));
csv('reports/unresolved.csv',centers.filter(c=>!c.location.coordinates));csv('reports/approximate.csv',centers.filter(c=>c.location.quality==='approximate'));
console.log(JSON.stringify(report,null,2));

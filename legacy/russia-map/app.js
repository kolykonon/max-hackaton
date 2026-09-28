import {GROUPS,STATUS,COLORS,normalize,aggregate,summary,contains,inBounds,nearest,clusterPoints,geoError} from './core.js';
import {loadStatuses} from './status-provider.js';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=(url,label)=>{try{const u=new URL(url);return ['http:','https:'].includes(u.protocol)?`<a href="${esc(u.href)}" target="_blank" rel="noreferrer">${esc(label)}</a>`:''}catch{return ''}};
const state={group:GROUPS[0],regionId:null,districtId:null,centerId:null,query:'',filter:'all',nearby:false,position:null};
let centers=[],regions=[],features=[],statuses={},districts=null,projection,path,zoom,svg,width,height,transform=d3.zoomIdentity,detailToken=0;
const detailCache=new Map();
const allInRegion=id=>centers.filter(c=>c.regionId===id);
const status=c=>statuses[c.id]?.[state.group]??'unknown';
const stats=id=>aggregate(allInRegion(id),statuses,state.group);
const currentRegion=()=>regions.find(r=>r.id===state.regionId);
const demandMatch=c=>state.filter==='all'||(state.filter==='demand'?['urgent','needed'].includes(status(c)):status(c)===state.filter);
async function json(url){const r=await fetch(url);if(!r.ok)throw Error(`Не удалось загрузить ${url}`);return r.json()}
async function detail(id){if(!detailCache.has(id))detailCache.set(id,json(regions.find(r=>r.id===id).detail).catch(e=>{detailCache.delete(id);throw e}));return detailCache.get(id)}
function showMessage(text){$('map-message').textContent=text;$('map-message').hidden=!text;}
function groupButtons(){
 $('blood-groups').innerHTML=GROUPS.map(g=>`<button class="blood-button" aria-pressed="${state.group===g}" data-group="${esc(g)}" aria-label="${esc(g)}">${esc(g.split(' ')[0])}<span>${esc(g.split(' ')[1])}</span></button>`).join('');
 $('blood-groups').querySelectorAll('button').forEach(b=>b.onclick=()=>{state.group=b.dataset.group;groupButtons();$('blood-groups').querySelector('[aria-pressed="true"]').focus();render();if(state.centerId)renderCard(centers.find(c=>c.id===state.centerId));if($('cluster-dialog').open)renderCluster();});
}
function setupMap(){
 svg=d3.select('#map');zoom=d3.zoom().scaleExtent([1,6000]).on('zoom',event=>{transform=event.transform;d3.select('#viewport').attr('transform',transform);$('tooltip').hidden=true;paintMarkers();paintUser();paintLabels();});
 svg.call(zoom).on('dblclick.zoom',null);resizeMap();
 let previousWidth=0;new ResizeObserver(entries=>{const w=entries[0].contentRect.width;if(Math.abs(w-previousWidth)>2){previousWidth=w;resizeMap();}}).observe($('canvas'));
 $('zoom-in').onclick=()=>svg.call(zoom.scaleBy,1.8);$('zoom-out').onclick=()=>svg.call(zoom.scaleBy,1/1.8);$('reset').onclick=reset;
 $('map').addEventListener('keydown',e=>{
  if(e.target!==$('map'))return;
  const offsets={ArrowLeft:[70,0],ArrowRight:[-70,0],ArrowUp:[0,70],ArrowDown:[0,-70]};
  if(offsets[e.key]){e.preventDefault();svg.call(zoom.translateBy,offsets[e.key][0]/transform.k,offsets[e.key][1]/transform.k);}
  if(['+','=','-'].includes(e.key)){e.preventDefault();svg.call(zoom.scaleBy,e.key==='-'?1/1.6:1.6)}
 });
}
function resizeMap(){
 width=$('canvas').clientWidth;height=$('canvas').clientHeight;svg.attr('viewBox',`0 0 ${width} ${height}`);zoom.extent([[0,0],[width,height]]);
 projection=d3.geoConicEqualArea().parallels([50,70]).rotate([-100,0]).center([0,60]).scale(1).translate([0,0]);
 const raw=features.flatMap(f=>(f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates).flat(2)).map(p=>projection(p));
 const x=d3.extent(raw,p=>p[0]),y=d3.extent(raw,p=>p[1]);const scale=Math.min((width-45)/(x[1]-x[0]),(height-120)/(y[1]-y[0]));
 projection.scale(scale).translate([width/2-scale*(x[0]+x[1])/2,(height+20)/2-scale*(y[0]+y[1])/2]);
 // Pointwise projected path avoids GeoJSON winding ambiguity and a cut at the 180th meridian.
 const planar=d3.geoTransform({point(lon,lat){const [x,y]=projection([lon,lat]);this.stream.point(x,y)}});path=d3.geoPath(planar);
 drawRegions();drawDetail();drawDistricts();
 if(state.regionId){const id=state.regionId;detail(id).then(f=>{if(state.regionId===id)fit(f)}).catch(e=>showMessage(e.message));}else svg.call(zoom.transform,d3.zoomIdentity);
}
function featureEvents(sel,click){
 sel.on('click',(e,f)=>{e.stopPropagation();click(f)}).on('keydown',(e,f)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();click(f)}}).on('mousemove',(e,f)=>{
  const isDistrict=sel.attr('class')?.includes('district');
  const a=isDistrict?aggregate(centers.filter(c=>c.districtId===f.properties.id),statuses,state.group):stats(f.properties.id);
  const tooltip=$('tooltip');tooltip.textContent=`${f.properties.name} · ${state.group}. ${summary(a)}`;tooltip.hidden=false;
  const box=$('canvas').getBoundingClientRect();tooltip.style.left=Math.max(8,Math.min(e.clientX-box.left+12,width-270))+'px';tooltip.style.top=Math.max(8,Math.min(e.clientY-box.top+14,height-100))+'px';
 }).on('mouseleave',()=>{$('tooltip').hidden=true});
}
function drawRegions(){
 const sel=d3.select('#regions').selectAll('path').data(features,f=>f.properties.id).join('path').attr('d',path).attr('class',f=>`region${state.regionId&&state.regionId!==f.properties.id?' dimmed':''}${state.regionId===f.properties.id?' selected':''}${f.properties.disputed?' disputed':''}`).attr('fill',f=>COLORS[stats(f.properties.id).color]).attr('tabindex',state.regionId?-1:0).attr('role','button').attr('aria-label',f=>`${f.properties.name}. ${state.group}. ${summary(stats(f.properties.id))}`);
 featureEvents(sel,f=>selectRegion(f.properties.id));
}
let activeDetail=null;
function drawDetail(){const sel=d3.select('#details').selectAll('path').data(activeDetail?[activeDetail]:[]).join('path').attr('d',path).attr('class',f=>`detail${f.properties.disputed?' disputed':''}`).attr('fill',f=>COLORS[stats(f.properties.id).color]);featureEvents(sel,()=>{state.districtId=null;renderList()});}
function drawDistricts(){
 const show=currentRegion()?.name==='г. Москва'&&districts;
 const sel=d3.select('#districts').selectAll('path').data(show?districts.features:[],f=>f.properties.id).join('path').attr('d',path).attr('class','district').attr('fill',f=>COLORS[aggregate(centers.filter(c=>c.districtId===f.properties.id),statuses,state.group).color]).attr('tabindex',0).attr('role','button').attr('aria-label',f=>`Район ${f.properties.name}. ${summary(aggregate(centers.filter(c=>c.districtId===f.properties.id),statuses,state.group))}`);
 featureEvents(sel,f=>{state.districtId=f.properties.id;state.query='';$('search').value='';renderList();fit(f)});
}
function fit(feature){
 const [[x0,y0],[x1,y1]]=path.bounds(feature);const k=Math.max(1,Math.min(6000,.78/Math.max((x1-x0)/width,(y1-y0)/height)));
 svg.call(zoom.transform,d3.zoomIdentity.translate(width/2-k*(x0+x1)/2,height/2-k*(y0+y1)/2).scale(k));
}
async function selectRegion(id,{focusList=false}={}){
 const token=++detailToken;state.regionId=id;state.districtId=null;state.nearby=false;state.query='';$('search').value='';activeDetail=null;drawDetail();render();showMessage('');
 try{const f=await detail(id);if(token!==detailToken)return;activeDetail=f;drawDetail();fit(f);
  if(currentRegion()?.name==='г. Москва'&&!districts){districts=await json('data/moscow-districts.geojson');if(token!==detailToken)return;}drawDistricts();
 }catch(e){if(token===detailToken){showMessage(e.message+' Список учреждений доступен.');const f=features.find(f=>f.properties.id===id);if(f)fit(f)}}
 if(focusList)$('list').focus();
}
function reset(){++detailToken;state.regionId=null;state.districtId=null;state.query='';state.nearby=false;state.filter='all';$('search').value='';$('need-filter').value='all';activeDetail=null;showMessage('');render();svg.call(zoom.transform,d3.zoomIdentity);}
function visibleCenters(){
 let pool=state.nearby&&state.position?nearest(centers,state.position.coordinates,centers.length):state.query?centers:state.regionId?centers.filter(c=>c.regionId===state.regionId||c.geographicRegionIds.includes(state.regionId)):centers;
 if(state.districtId)pool=pool.filter(c=>c.districtId===state.districtId);
 const q=normalize(state.query);return pool.filter(c=>demandMatch(c)&&(!q||normalize([c.name,c.city,c.sourceRegion,c.address,c.id].join(' ')).includes(q)));
}
function paintMarkers(){
 if(!projection)return;
 const show=state.regionId||state.query||state.nearby||state.filter!=='all'||transform.k>3;
 const points=show?visibleCenters().filter(c=>c.location.coordinates).map(c=>{const [x,y]=transform.apply(projection(c.location.coordinates));return {x,y,center:c}}).filter(p=>p.x>=-30&&p.x<=width+30&&p.y>=-30&&p.y<=height+30):[];
 const clusters=clusterPoints(points,30);
 const sel=d3.select('#markers').selectAll('g').data(clusters,c=>c.items.map(p=>p.center.id).sort().join(',')).join(enter=>{const g=enter.append('g');g.append('circle');g.append('text');return g;}).attr('class',c=>`marker${c.items.length===1&&c.items[0].center.location.quality==='approximate'?' approximate':''}`).attr('transform',c=>`translate(${c.x},${c.y})`).attr('tabindex',0).attr('role','button').attr('aria-label',c=>c.items.length>1?`${c.items.length} учреждений. Раскрыть кластер`:`${c.items[0].center.name}. ${state.group}: ${STATUS[status(c.items[0].center)]}`);
 sel.select('circle').attr('r',c=>c.items.length>1?17:8).attr('fill',c=>c.items.length>1?'#fafff4':COLORS[status(c.items[0].center)]);
 sel.select('text').attr('text-anchor','middle').attr('dy','.35em').text(c=>c.items.length>1?c.items.length:'');
 const activate=c=>{if(c.items.length===1)openCenter(c.items[0].center);else{
  const unique=new Set(c.items.map(p=>p.center.location.coordinates.join(',')));
  if(unique.size===1||transform.k>1500){openCluster(c.items.map(p=>p.center));return;}
  const geo={type:'MultiPoint',coordinates:c.items.map(p=>p.center.location.coordinates)};const old=transform.k;fit(geo);if(transform.k<old*1.3)openCluster(c.items.map(p=>p.center));
 }};
 sel.on('click',(e,c)=>{e.stopPropagation();activate(c)}).on('keydown',(e,c)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate(c)}});
}
function paintLabels(){
 const labels=[['Москва',[37.61,55.75]],['Санкт-Петербург',[30.31,59.94]],['Екатеринбург',[60.6,56.84]],['Новосибирск',[82.92,55.03]],['Якутск',[129.73,62.03]],['Владивосток',[131.88,43.12]]];
 d3.select('#city-labels').selectAll('text').data(transform.k<1.4&&width>550?labels:[]).join('text').attr('class','city-label').attr('x',d=>projection(d[1])[0]+5).attr('y',d=>projection(d[1])[1]-5).text(d=>d[0]);
}
function paintUser(){
 const group=d3.select('#user-marker');group.selectAll('*').remove();if(!state.position)return;
 const p=state.position.coordinates;const [x,y]=transform.apply(projection(p));
 const offset=[p[0]+state.position.accuracy/(111320*Math.max(.01,Math.cos(p[1]*Math.PI/180))),p[1]];const q=transform.apply(projection(offset));const r=Math.hypot(q[0]-x,q[1]-y);
 group.append('circle').attr('cx',x).attr('cy',y).attr('r',r).attr('fill','#3686af18').attr('stroke','#3686af80');
 group.append('circle').attr('cx',x).attr('cy',y).attr('r',7).attr('fill','#3686af').attr('stroke','white').attr('stroke-width',3);group.append('title').text(`Ваше местоположение, точность ±${Math.round(state.position.accuracy)} м`);
}
function regionItem(r){const a=stats(r.id);return `<button class="list-item" data-region="${r.id}"><i class="dot ${a.color}"></i><span class="list-item-body"><span class="list-item-title">${esc(r.name)}${r.disputed?' *':''}</span><small>${a.known?`${a.need} из ${a.known} с потребностью · ${a.unknown} без данных`:'Нет данных'}${r.disputed?' · спорная территория':''}</small></span><span class="count">${a.total} ↗</span></button>`;}
function centerItem(c){return `<button class="list-item" data-center="${c.id}"><i class="dot ${status(c)}"></i><span class="list-item-body"><span class="list-item-title">${esc(c.name)}</span><small>${esc(c.city??'Город не указан')}${c.distance!==undefined?` · ${c.distance.toFixed(1)} км по прямой`:''}</small><small class="${status(c)==='urgent'?'urgency-label':''}">${esc(state.group)} · ${STATUS[status(c)]} · демо</small>${!c.location.coordinates?'<small>⌖ Расположение требует уточнения</small>':c.location.quality==='approximate'?'<small>⌖ Приблизительная точка улицы</small>':''}${c.regionMismatch?`<small>По справочнику: ${esc(c.sourceRegion)}; на карте: ${esc(c.geographicRegionNames.join(', '))}</small>`:''}</span><span class="count">↗</span></button>`;}
function bindItems(el){el.querySelectorAll('[data-region]').forEach(b=>b.onclick=()=>selectRegion(b.dataset.region));el.querySelectorAll('[data-center]').forEach(b=>b.onclick=()=>openCenter(centers.find(c=>c.id===b.dataset.center)));}
function renderList(){
 const r=currentRegion();const a=state.districtId?aggregate(centers.filter(c=>c.districtId===state.districtId),statuses,state.group):r?stats(r.id):aggregate(centers,statuses,state.group);
 const district=state.districtId?districts?.features.find(f=>f.properties.id===state.districtId):null;
 const title=state.nearby?'Рядом с вами':district?`Район ${district.properties.name}`:r?r.name:'Найдите своё место\nдля доброго дела';
 $('selection-summary').innerHTML=`<span class="summary-eyebrow">${state.nearby?'РАССТОЯНИЯ ПО ПРЯМОЙ':r?'ВЫБРАННЫЙ РЕГИОН':'ОТ РЕГИОНА К ЦЕНТРУ'}</span><h2 class="summary-heading">${esc(title)}</h2><p class="summary-text">${state.nearby?'Ближайшие центры по обе стороны границ регионов. Уточняйте адрес и условия приёма.':summary(a)}</p>${!state.nearby?`<div class="summary-bar" aria-hidden="true"><span class="urgent" style="width:${a.total?100*a.need/a.total:0}%"></span><span class="enough" style="width:${a.total?100*(a.known-a.need)/a.total:0}%"></span><span class="unknown" style="width:${a.total?100*a.unknown/a.total:100}%"></span></div><p class="summary-hint">${esc(state.group)} · демонстрационная потребность${r?`<br>${allInRegion(r.id).filter(c=>!c.location.coordinates).length} учреждений без точки на карте`:''}</p>`:''}${district?'<button class="inline-button" id="clear-district">Все учреждения региона</button>':''}${state.position&&!state.nearby?'<button class="inline-button" id="show-nearby">Ближайшие ко мне</button>':''}`;
 if($('clear-district'))$('clear-district').onclick=()=>{state.districtId=null;render();};if($('show-nearby'))$('show-nearby').onclick=()=>{state.nearby=true;state.districtId=null;state.query='';$('search').value='';render()};
 const isCenters=state.regionId||state.query||state.nearby||state.filter!=='all';
 if(!isCenters){const sorted=[...regions].sort((a,b)=>a.name.localeCompare(b.name,'ru'));$('list').innerHTML=sorted.map(regionItem).join('');$('list-title').textContent='Регионы на карте';$('list-count').textContent=regions.length;}
 else{
  const pool=visibleCenters();if(!state.nearby)pool.sort((a,b)=>({urgent:0,needed:1,enough:2,unknown:3}[status(a)]-({urgent:0,needed:1,enough:2,unknown:3}[status(b)]))||a.name.localeCompare(b.name,'ru'));
  const matches=state.query?regions.filter(r=>normalize(r.name).includes(normalize(state.query))):[];
  $('list-title').textContent=state.query?'Результаты по всей стране':state.nearby?'Ближайшие учреждения':'Учреждения';$('list-count').textContent=pool.length+(matches.length?` + ${matches.length} рег.`:'');
  $('list').innerHTML=matches.map(regionItem).join('')+pool.map(centerItem).join('')||'<p class="empty">Ничего не найдено. Измените запрос или фильтр потребности.</p>';
 }
 bindItems($('list'));
}
function render(){
 const r=currentRegion();$('crumb').textContent=r?' / '+r.name:'';
 $('map-subtitle').textContent=r?`${allInRegion(r.id).length} учреждений в справочнике · ${state.group} · демо`:`${regions.length} территорий на карте · ${centers.length} учреждений · ${state.group}`;
 $('map-level').textContent=state.regionId?'02 / ЦЕНТРЫ РЕГИОНА':'01 / ВСЯ РОССИЯ';$('map-instruction').textContent=state.regionId?'Нажмите на точку или кластер учреждений':'Выберите регион на карте или в списке';
 drawRegions();drawDetail();drawDistricts();renderList();paintMarkers();paintLabels();
}
async function openCenter(c){
 if(!c)return;state.centerId=c.id;$('cluster-dialog').close();renderCard(c);if(!$('center-dialog').open)$('center-dialog').showModal();
 if(c.regionId&&state.regionId!==c.regionId)await selectRegion(c.regionId);
 if(state.centerId!==c.id)return;
 if(c.location.coordinates){const p=projection(c.location.coordinates);const k=Math.max(transform.k,120);svg.call(zoom.transform,d3.zoomIdentity.translate(width/2-p[0]*k,height/2-p[1]*k).scale(k));}
 $('map-level').textContent='03 / ВЫБРАННЫЙ ЦЕНТР';
}
function renderCard(c){
 const s=status(c);const locationText=c.location.coordinates?c.location.quality==='exact'?'Совпали город, улица и дом (автоматическая проверка OSM).':'Приблизительно: точка улицы, дом не подтверждён.':'Расположение требует уточнения. Точка на карте не показана.';
 const fields=[['Адрес',[c.city,c.address].filter(Boolean).join(', ')||'Не указан'],['Телефон',c.phone??'Не указан'],['Часы приёма доноров',c.hours??'Не указаны'],['Способ записи',c.booking??'В справочнике не указан'],['Виды донаций',c.donationTypes??'Не указаны'],['Требования к донору',c.requirements??'Не указаны'],['Качество исходного справочника',c.verification??'Статус проверки не указан'],['Дата проверки справочника (не потребности)',c.sourceCheckedAt??'Не указана'],['Примечания исходного справочника',c.notes??'Отсутствуют'],['Координаты',locationText],['Регион в справочнике',c.sourceRegion],['Регион по геометрии',c.geographicRegionNames.length?c.geographicRegionNames.join(', '):'Не определён']];
 $('center-content').innerHTML=`<p class="center-type">${esc(c.id)} · ${esc(c.type)}</p><h2 id="center-name">${esc(c.name)}</h2><p class="center-address">${esc([c.city,c.address].filter(Boolean).join(', ')||'Адрес не указан')}</p><div class="status-banner ${s}"><i class="dot ${s}"></i><strong>${esc(state.group)} · ${STATUS[s]}</strong></div><p class="demo-caption">Потребность сгенерирована для демонстрации. Не является медицинскими сведениями.</p><div class="blood-grid" aria-label="Все восемь демостатусов">${GROUPS.map(g=>`<div class="blood-cell${g===state.group?' active':''}"><i class="dot ${statuses[c.id][g]}"></i>${esc(g)}<small>${STATUS[statuses[c.id][g]]}</small></div>`).join('')}</div><dl>${fields.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}<dt>Источники справочника</dt><dd class="source-links">${c.sources.length?c.sources.map((s,i)=>link(s,`Источник ${i+1} ↗`)).join(''):'Не указаны'}</dd>${c.location.sourceUrl?`<dt>Источник координат</dt><dd>${link(c.location.sourceUrl,'Объект OpenStreetMap ↗')}</dd>`:''}</dl>${c.regionMismatch?'<p class="card-note">Регион организации и физическое расположение различаются. Принадлежность в справочнике сохранена, географический регион определён по координатам. Различие может отражать расположение областного учреждения в соседнем городе или неточность исходных границ.</p>':''}<p class="card-note">Перед посещением проверьте адрес, часы, условия приёма и актуальную потребность по источникам учреждения. Карта не оформляет запись.</p>`;
}
let clusterCenters=[];function renderCluster(){$('cluster-list').innerHTML=clusterCenters.map(centerItem).join('');bindItems($('cluster-list'))}function openCluster(items){clusterCenters=items;renderCluster();$('cluster-dialog').showModal()}
async function locateSuccess(position){
 const coordinates=[position.coords.longitude,position.coords.latitude];state.position={coordinates,accuracy:position.coords.accuracy};
 const candidates=regions.filter(r=>inBounds(coordinates,r.bounds));let found=[];
 try{const loaded=await Promise.all(candidates.map(r=>detail(r.id)));found=candidates.filter((r,i)=>contains(loaded[i],coordinates));
  if(found.length)await selectRegion(found[0].id);
  state.nearby=true;state.districtId=null;state.query='';$('search').value='';
  $('location-message').textContent=`${found.length?`Ваш регион по контурам: ${found.map(r=>r.name).join(', ')}.`:'Местоположение вне покрытия контуров карты.'} Точность браузера ±${Math.round(position.coords.accuracy)} м. Расстояния — по прямой; приблизительные точки могут искажать расстояние.`;
  const nearby=nearest(centers,coordinates,5);if(found.length&&nearby.length)fit({type:'MultiPoint',coordinates:[coordinates,...nearby.map(c=>c.location.coordinates)]});render();paintUser();
 }catch(e){$('location-message').textContent='Не удалось загрузить границы для определения региона. '+e.message;paintUser();}
 $('locate').disabled=false;
}
function locateFailure(error){$('location-message').hidden=false;$('location-message').textContent=geoError(error);$('locate').disabled=false;}
function initEvents(){
 $('home').onclick=reset;$('search').oninput=e=>{state.query=e.target.value;state.nearby=false;state.districtId=null;renderList();paintMarkers();};$('need-filter').onchange=e=>{state.filter=e.target.value;renderList();paintMarkers()};
 $('locate').onclick=()=>{$('location-message').hidden=false;if(!navigator.geolocation){locateFailure({code:2});return;}$('location-message').textContent='Определяем местоположение…';$('locate').disabled=true;navigator.geolocation.getCurrentPosition(locateSuccess,locateFailure,{timeout:12000,maximumAge:0,enableHighAccuracy:false});};
 for(const kind of ['center','cluster','about']){$(`${kind}-close`).onclick=()=>$(`${kind}-dialog`).close();$(`${kind}-dialog`).addEventListener('click',e=>{if(e.target===$(`${kind}-dialog`)){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});}
 $('center-dialog').addEventListener('close',()=>{state.centerId=null;$('map-level').textContent=state.regionId?'02 / ЦЕНТРЫ РЕГИОНА':'01 / ВСЯ РОССИЯ'});
 $('about-open').onclick=$('boundaries-open').onclick=()=>$('about-dialog').showModal();
 document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!document.querySelector('dialog[open]')){e.preventDefault();$('search').focus();}if(e.key==='Escape'&&!document.querySelector('dialog[open]')){state.query='';$('search').value='';renderList();paintMarkers();}});
}
async function start(){
 try{const [c,r,t,demo]=await Promise.all([json('data/centers.json'),json('data/regions-index.json'),json('data/overview.topo.json'),loadStatuses()]);
 centers=c;regions=r;statuses=demo.statuses;features=topojson.feature(t,Object.values(t.objects)[0]).features;
 $('total-centers').textContent=centers.length;$('total-regions').textContent=new Set(centers.map(c=>c.sourceRegion)).size;
 groupButtons();setupMap();initEvents();render();
 }catch(e){$('fatal').hidden=false;$('fatal').textContent=e.message+'. Запустите карту через локальный HTTP-сервер (см. README).';console.error(e)}
}
start();

export const GROUPS=['O(I) Rh+','O(I) Rh−','A(II) Rh+','A(II) Rh−','B(III) Rh+','B(III) Rh−','AB(IV) Rh+','AB(IV) Rh−'];
export const STATUS={enough:'Достаточно',needed:'Нужны доноры',urgent:'Высокая потребность',unknown:'Нет данных'};
export const COLORS={enough:'#a5cbb4',needed:'#e8cf98',urgent:'#de8276',unknown:'#dce2d8'};
export const normalize=s=>String(s??'').toLowerCase().replaceAll('ё','е').replace(/[^\p{L}\p{N}]/gu,'');
export function aggregate(centers,statuses,group){
 let known=0,need=0,unknown=0,urgent=0;
 for(const c of centers){const s=statuses[c.id]?.[group]??'unknown';if(s==='unknown'){unknown++;continue;}known++;if(s==='needed'||s==='urgent')need++;if(s==='urgent')urgent++;}
 const ratio=known?need/known:null;
 return {total:centers.length,known,need,unknown,urgent,ratio,color:ratio===null?'unknown':ratio<.25?'enough':ratio<.6?'needed':'urgent'};
}
export const summary=a=>a.known?`Доноры нужны в ${a.need} из ${a.known} центров с данными. Ещё по ${a.unknown} центрам данных нет.`:a.total?`По всем ${a.total} центрам нет демоданных.`:'Нет данных: в справочнике нет учреждений.';
export function inRing(point,ring){
 const lng=x=>x<0?x+360:x;const x=lng(point[0]),y=point[1];let inside=false;
 for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const a=ring[i],b=ring[j],ax=lng(a[0]),bx=lng(b[0]);
  if((a[1]>y)!==(b[1]>y)&&x<(bx-ax)*(y-a[1])/(b[1]-a[1])+ax)inside=!inside;
 }return inside;
}
export function contains(feature,point){const g=feature.geometry??feature;const polys=g.type==='Polygon'?[g.coordinates]:g.coordinates;return polys.some(p=>inRing(point,p[0])&&!p.slice(1).some(r=>inRing(point,r)));}
export function bounds(feature){const g=feature.geometry??feature,coords=g.type==='Polygon'?g.coordinates.flat():g.coordinates.flat(2);return coords.reduce((b,[x,y])=>{x=x<0?x+360:x;return [Math.min(b[0],x),Math.min(b[1],y),Math.max(b[2],x),Math.max(b[3],y)]},[Infinity,Infinity,-Infinity,-Infinity]);}
export function inBounds([x,y],b){x=x<0?x+360:x;return x>=b[0]&&x<=b[2]&&y>=b[1]&&y<=b[3];}
export function distance(a,b){const rad=Math.PI/180;const q=Math.sin((b[1]-a[1])*rad/2)**2+Math.cos(a[1]*rad)*Math.cos(b[1]*rad)*Math.sin((b[0]-a[0])*rad/2)**2;return 6371*2*Math.atan2(Math.sqrt(q),Math.sqrt(Math.max(0,1-q)));}
export function nearest(centers,point,count=5){return centers.filter(c=>c.location?.coordinates).map(c=>({...c,distance:distance(point,c.location.coordinates)})).sort((a,b)=>a.distance-b.distance).slice(0,count);}
// Connected components in screen space; identical coordinates always remain accessible in one cluster.
export function clusterPoints(points,radius=28){
 const parents=points.map((_,i)=>i);const root=i=>parents[i]===i?i:(parents[i]=root(parents[i]));
 for(let i=0;i<points.length;i++)for(let j=0;j<i;j++)if(Math.hypot(points[i].x-points[j].x,points[i].y-points[j].y)<radius)parents[root(i)]=root(j);
 const groups=new Map();points.forEach((p,i)=>{const r=root(i);if(!groups.has(r))groups.set(r,[]);groups.get(r).push(p)});
 return [...groups.values()].map(items=>({items,x:items.reduce((s,p)=>s+p.x,0)/items.length,y:items.reduce((s,p)=>s+p.y,0)/items.length}));
}
export function geoError(error){return ({1:'Доступ к геолокации запрещён. Разрешите его в браузере или выберите регион вручную.',2:'Местоположение недоступно. Выберите регион вручную.',3:'Время ожидания геолокации истекло. Попробуйте ещё раз.'})[error.code]??'Не удалось определить местоположение.';}

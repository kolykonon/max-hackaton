"""Pinned, cached OSM-derived overview + two individual OSM relations.
Never enumerate administrative children via the main API.
"""
import sys,json,urllib.request,hashlib
from pathlib import Path
from datetime import datetime,timezone
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT.parents[1]/'scripts'))
from fetch_boundaries import stitch,inside
RAW=ROOT/'data/raw'
def get(url,name):
    p=RAW/name
    if not p.exists():
        with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'KaplyaDonorMap/1.0 boundary preparation'}),timeout=90) as r: p.write_bytes(r.read())
    return json.loads(p.read_text())
def main():
    manifest=[]
    url='https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/russia.geojson'
    base=get(url,'russia.geojson')
    manifest.append({'url':url,'file':'russia.geojson','sourceDate':'2013-12-04 (feature metadata)','sha256':hashlib.sha256((RAW/'russia.geojson').read_bytes()).hexdigest()})
    extra=[]
    for rid,name in [(72639,'Республика Крым'),(1574364,'г. Севастополь')]:
        u=f'https://www.openstreetmap.org/api/0.6/relation/{rid}/full.json'
        data=get(u,f'osm-{rid}.json'); el=data['elements']; rel=next(e for e in el if e['type']=='relation' and e['id']==rid)
        print('OSM boundary',rid,rel['tags'].get('name'),rel['tags'].get('admin_level'),flush=True)
        nodes={e['id']:[e['lon'],e['lat']] for e in el if e['type']=='node'}; ways={e['id']:e['nodes'] for e in el if e['type']=='way'}
        rings={role:[[nodes[n] for n in ring] for ring in stitch([ways[m['ref']] for m in rel['members'] if m['type']=='way' and m['role']==role])] for role in ['outer','inner']}
        polygons=[[r] for r in rings['outer']]
        for hole in rings['inner']:
            matches=[p for p in polygons if inside(hole[0],p[0])]; assert len(matches)==1; matches[0].append(hole)
        extra.append({'type':'Feature','properties':{'name':name,'disputed':True,'osmId':rid,'osmName':rel['tags'].get('name'),'osmTimestamp':rel['timestamp']},'geometry':{'type':'MultiPolygon','coordinates':polygons}})
        manifest.append({'url':u,'file':f'osm-{rid}.json','sourceDate':rel['timestamp'],'sha256':hashlib.sha256((RAW/f'osm-{rid}.json').read_bytes()).hexdigest()})
    (RAW/'supplement.geojson').write_text(json.dumps({'type':'FeatureCollection','features':extra},ensure_ascii=False))
    (RAW/'manifest.json').write_text(json.dumps({'retrievedAt':datetime.now(timezone.utc).isoformat(),'sources':manifest},ensure_ascii=False,indent=2))
if __name__=='__main__': main()

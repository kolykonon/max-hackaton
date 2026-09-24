"""Refresh Moscow's OSM district boundaries; Python standard library only.
Downloads 12 administrative parents and their 132 subareas via OSM API.
Caches raw responses outside the project; derived data licensed ODbL 1.0.
"""
import concurrent.futures
import json
from pathlib import Path
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
CACHE = Path('/tmp/kaplya-osm-cache')
CACHE.mkdir(exist_ok=True)

def fetch(endpoint):
    path = CACHE / (endpoint.replace('/', '_').replace('?', '_') + '.json')
    if not path.exists():
        for attempt in range(3):
            try:
                req = urllib.request.Request('https://www.openstreetmap.org/api/0.6/' + endpoint, headers={'User-Agent': 'KaplyaMoscowPrototype/1.0'})
                with urllib.request.urlopen(req, timeout=45) as response:
                    path.write_bytes(response.read())
                break
            except Exception:
                if attempt == 2:
                    raise
                time.sleep(2)
    return json.loads(path.read_text())['elements']

def stitch(segments):
    segments = [s[:] for s in segments]
    rings = []
    while segments:
        ring = segments.pop()
        while ring[-1] != ring[0]:
            for i, segment in enumerate(segments):
                if segment[0] == ring[-1]:
                    ring.extend(segment[1:]); segments.pop(i); break
                if segment[-1] == ring[-1]:
                    ring.extend(segment[-2::-1]); segments.pop(i); break
            else:
                raise ValueError('Unclosed boundary')
        rings.append(ring)
    return rings

def inside(point, ring):
    x,y = point; result = False
    for a,b in zip(ring, ring[1:]):
        if (a[1]>y) != (b[1]>y) and x < (b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:
            result = not result
    return result

def district(item):
    rid, parent = item
    elements = fetch(f'relation/{rid}/full.json')
    relation = next(e for e in elements if e['type']=='relation' and e['id']==rid)
    assert relation['tags']['admin_level']=='8', relation['tags']
    nodes = {e['id']: [e['lon'],e['lat']] for e in elements if e['type']=='node'}
    ways = {e['id']: e['nodes'] for e in elements if e['type']=='way'}
    parts = {}
    for role in ('outer','inner'):
        parts[role] = [[nodes[n] for n in ring] for ring in stitch([ways[m['ref']] for m in relation['members'] if m['type']=='way' and m['role']==role])]
    assert parts['outer'], rid
    polygons = [[ring] for ring in parts['outer']]
    for hole in parts['inner']:
        matches = [p for p in polygons if inside(hole[0],p[0])]
        assert len(matches)==1, (rid,'unassigned inner ring')
        matches[0].append(hole)
    name = relation['tags']['name'].removeprefix('район ').removesuffix(' район')
    short = parent['tags'].get('short_name')
    if not short:
        short = ''.join(w[0] for w in parent['tags']['name'].replace('-',' ').split()).upper()
    if parent['id']==1320358: short='ЗелАО'
    if parent['id']==2263058: short='НАО'
    if parent['id']==2263059: short='ТАО'
    return {'type':'Feature','properties':{'id':str(rid),'name':name,'okrug':short,'okrugName':parent['tags']['name'],'zone':'green' if short=='ЗелАО' else 'new' if short in ('НАО','ТАО') else 'city','osmVersion':relation['version'],'osmTimestamp':relation['timestamp']},'geometry':{'type':'MultiPolygon','coordinates':polygons}}

def main():
    root = fetch('relation/102269.json')[0]
    parents = [fetch(f"relation/{m['ref']}.json")[0] for m in root['members'] if m['type']=='relation' and m['role']=='subarea']
    work = [(m['ref'],p) for p in parents for m in p['members'] if m['type']=='relation' and m['role']=='subarea']
    assert len(work)==132, len(work)
    features=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        for f in executor.map(district,work):
            features.append(f)
            print(f"{len(features)}/132 {f['properties']['name']}",flush=True)
    data={'type':'FeatureCollection','license':'ODbL-1.0','attribution':'© OpenStreetMap contributors','source':'https://www.openstreetmap.org/relation/102269','retrieved':time.strftime('%Y-%m-%d'),'features':features}
    (ROOT/'data/moscow-districts.geojson').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')

if __name__=='__main__': main()

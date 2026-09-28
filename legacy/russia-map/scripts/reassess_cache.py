"""Revalidate coordinates using cached provider results only, no network requests."""
import json
from geocode import ROOT,CACHE,assess,input_signature
catalog=json.loads((ROOT/'data/catalog.json').read_text()); data=json.loads((ROOT/'data/coordinates.json').read_text())
cache={v['url']:v for p in CACHE.glob('*.json') for v in [json.loads(p.read_text())]}
for c in catalog:
    old=data.get(c['id']); queries=old.get('queries',[]) if old else []
    if not queries: continue
    results=[]
    for q in queries:
        for r in cache.get(q,{}).get('results',[]):
            if not any(v.get('osm_id')==r.get('osm_id') and v.get('osm_type')==r.get('osm_type') for v in results):results.append(r)
    data[c['id']]={**assess(c,results),'queries':queries,'geocodedAt':old.get('geocodedAt'),'providerError':old.get('providerError'),'inputSignature':input_signature(c)}
(ROOT/'data/coordinates.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
print({q:sum(r['quality']==q for r in data.values()) for q in ['exact','approximate','unresolved']})

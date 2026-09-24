"""Build a self-contained HTML and standalone SVG from local OSM GeoJSON.
Run: python3 scripts/build.py (no third-party dependencies).
"""
from pathlib import Path
import html
import json
import math

ROOT = Path(__file__).resolve().parents[1]
COLORS = {'urgent':'#de8276','needed':'#e8cf98','enough':'#a5cbb4','unknown':'#dce2d8'}

def project(lon, lat):
    # Local equirectangular projection: preserve angles near Moscow at 55.7 N.
    return ((lon-36.5)*math.cos(math.radians(55.7))*1500, (56.1-lat)*1500)

def build():
    geo = json.loads((ROOT/'data/moscow-districts.geojson').read_text())
    assert len(geo['features']) == 132
    paths=[]; districts=[]
    for feature in geo['features']:
        properties = feature['properties']
        rings = [ring for polygon in feature['geometry']['coordinates'] for ring in polygon]
        coords = [[project(*point) for point in ring] for ring in rings]
        points = [point for ring in coords for point in ring]
        path = ''.join('M'+'L'.join(f'{x:.2f},{y:.2f}' for x,y in ring)+'Z' for ring in coords)
        # Explicitly artificial, repeatable demonstration data. Never medical data.
        code = int(properties['id']) % 13
        status = 'urgent' if code < 3 else 'needed' if code < 5 else 'unknown' if code == 12 else 'enough'
        bounds = [min(p[0] for p in points), min(p[1] for p in points), max(p[0] for p in points), max(p[1] for p in points)]
        d = {**properties, 'bounds':[round(v,2) for v in bounds], 'status':status,
             'polygons':feature['geometry']['coordinates']}
        districts.append(d)
        paths.append(f'<path id="region-{d["id"]}" data-id="{d["id"]}" data-name="{html.escape(d["name"],quote=True)}" data-okrug="{d["okrug"]}" class="region" role="button" tabindex="0" aria-label="{html.escape(d["name"],quote=True)}" aria-pressed="false" fill="{COLORS[status]}" fill-rule="evenodd" d="{path}"><title>{html.escape(d["name"])}</title></path>')
    payload=json.dumps({'districts':districts},ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
    template=(ROOT/'src/index.template.html').read_text()
    content=template.replace('/* STYLES */',(ROOT/'src/styles.css').read_text()).replace('<!-- PATHS -->','\n'.join(paths)).replace('/* DATA */',payload).replace('/* SCRIPT */',(ROOT/'src/app.js').read_text())
    (ROOT/'index.html').write_text(content)
    left=min(d['bounds'][0] for d in districts)-25
    top=min(d['bounds'][1] for d in districts)-25
    width=max(d['bounds'][2] for d in districts)-left+25
    height=max(d['bounds'][3] for d in districts)-top+25
    standalone=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{left} {top} {width} {height}" width="1100" height="1300"><title>132 района Москвы — демонстрационная карта донорства</title><desc>© OpenStreetMap contributors, ODbL 1.0. Выгрузка {geo["retrieved"]}. Цвета не являются медицинскими данными.</desc><style>.region{{stroke:#f8faf4;stroke-width:1;stroke-linejoin:round;vector-effect:non-scaling-stroke}}.region:hover{{stroke:#244b38;stroke-width:2}}</style>'+''.join(paths)+'</svg>'
    (ROOT/'moscow-districts.svg').write_text(standalone)
    print(f'Built index.html ({len(content.encode()):,} bytes), moscow-districts.svg. 132 districts, 12 okrugs.')

if __name__=='__main__': build()

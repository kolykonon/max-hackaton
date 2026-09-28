"""One-time Nominatim import: one process/thread, >=1.15s between calls, persistent cache.
No client-side API. Run only for this finite catalog, not as a scheduled job.
Policy: https://operations.osmfoundation.org/policies/nominatim/
"""
import json, re, time, hashlib, os, urllib.request, urllib.parse, urllib.error, argparse, fcntl
from pathlib import Path
from datetime import datetime, timezone
ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'data/geocoding-cache'; CACHE.mkdir(exist_ok=True)
ENDPOINT=os.environ.get('GEOCODER_URL','https://nominatim.openstreetmap.org/search')
UA='KaplyaDonorMap/1.0 (one-time 405 public blood-center addresses; local prototype)'
last=0
def input_signature(c):
    return hashlib.sha256(json.dumps([c.get(k) for k in ['sourceRegion','city','address']],ensure_ascii=False).encode()).hexdigest()

def norm(s):
    return re.sub(r'[^а-яa-z0-9]','',str(s or '').lower().replace('ё','е'))
def streetnorm(s):
    s=str(s or '').lower().replace('ё','е')
    s=re.sub(r'\b(улица|ул|проспект|просп|пр|переулок|пер|шоссе|ш|бульвар|б|набережная|наб|площадь|пл|имени|им)\b\.?','',s)
    return norm(s)
def citynorm(s):
    return norm(re.sub(r'^(городской округ|город|г\.|пгт|рп|п\.|пос[её]лок|с\.|село)\s*','',str(s or ''),flags=re.I))
def housenorm(s):
    s=str(s or '').lower()
    s=re.sub(r'корпус|корп\.?','к',s)
    s=re.sub(r'строение|стр\.?','с',s)
    return norm(s)
def regionnorm(s):
    s=str(s or '').lower().replace('ё','е')
    aliases={'удмуртская республика':'удмуртия','чувашская республика':'чувашия','кабардино-балкарская республика':'кабардино-балкария','карачаево-черкесская республика':'карачаево-черкесия','кемеровская область — кузбасс':'кемеровская область','автономная республика крым':'республика крым'}
    s=aliases.get(s,s)
    return norm(re.sub(r'республика|^г\.\s*','',s))
def parse_address(s):
    s=re.sub(r'^\d{6}[, ]*','',s or '')
    # Postal city prefixes occur before the actual street; take the last street-like part.
    parts=[v.strip() for v in s.split(',') if v.strip()]
    street=next((v for v in parts if re.search(r'ул\.|улица|просп|переул|пер\.|шоссе|бульвар|наб\.|площад',v,re.I)),parts[0] if parts else '')
    rest=s[s.find(street)+len(street):]
    house=re.search(r'(?:д(?:ом)?\.?\s*)?(\d+[а-яa-z]?(?:[/\-]\d+[а-яa-z]?)?(?:\s*(?:к(?:орп(?:ус)?)?\.?|стр(?:оение)?\.?)\s*\d+[а-яa-z]?)?)',rest,re.I)
    if not house:
        m=re.search(r'\s+(\d+[а-яa-z]?(?:/\d+)?)$',street,re.I)
        if m: house=m; street=street[:m.start()]
    number=house.group(1) if house else None
    if number:
        suffix=re.search(r'(?:,\s*|\s+)((?:корп(?:ус)?\.?|к\.?|стр(?:оение)?\.?|с\.)\s*\d+[а-яa-z]?)',rest,re.I)
        if suffix and housenorm(suffix.group(1)) not in housenorm(number): number+=' '+suffix.group(1)
    return street,number

def request(params):
    global last
    params={**params,'format':'jsonv2','addressdetails':1,'limit':5,'accept-language':'ru'}
    url=ENDPOINT+'?'+urllib.parse.urlencode(params)
    p=CACHE/(hashlib.sha256(url.encode()).hexdigest()+'.json')
    if p.exists(): return json.loads(p.read_text())
    for attempt in range(3):
        time.sleep(max(0,1.15-(time.monotonic()-last))); last=time.monotonic()
        try:
            with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':UA}),timeout=25) as resp:
                result={'url':url,'fetchedAt':datetime.now(timezone.utc).isoformat(),'results':json.load(resp)}
            p.write_text(json.dumps(result,ensure_ascii=False)); return result
        except urllib.error.HTTPError as e:
            if e.code in (403,429):
                raise RuntimeError(f'Provider requested stop: HTTP {e.code}. Cache preserved; do not bypass rate limit.')
            if attempt==2: return {'url':url,'error':str(e),'results':[]}
            time.sleep(2**(attempt+2))
        except (OSError,ValueError) as e:
            if attempt==2: return {'url':url,'error':str(e),'results':[]}
            time.sleep(2**(attempt+2))

def assess(c,results):
    street,house=parse_address(c['address']); city=citynorm(c['city'])
    city_aliases={city}
    if c['city']=='Москва (Зеленоград)': city_aliases={'зеленоград'}
    accepted=[]
    for r in results:
        a=r.get('address',{}); cities=[citynorm(a.get(k)) for k in ['city','town','village','municipality','hamlet']]
        city_ok=bool(city and city_aliases.intersection(cities))
        region_ok=regionnorm(c['sourceRegion'])==regionnorm(a.get('state'))
        # Explicit city names in the catalog can establish physical location across these borders.
        cross_city=(c['sourceRegion'],c['city'],a.get('state')) in {('Московская область','Москва','Москва'),('Ленинградская область','Санкт-Петербург','Санкт-Петербург')}
        if not region_ok and not cross_city: continue
        road=a.get('road') or a.get('pedestrian') or a.get('square')
        road_ok=bool(streetnorm(street) and streetnorm(street)==streetnorm(road))
        hn=a.get('house_number'); house_ok=bool(house and hn and housenorm(house)==housenorm(hn))
        if city_ok and road_ok and house_ok:
            accepted.append((r,'exact','Совпали населённый пункт, улица и номер дома; автоматическая проверка OSM'))
        elif city_ok and road_ok and not hn and r.get('addresstype') in ['road','pedestrian','square']:
            accepted.append((r,'approximate','Совпали населённый пункт и улица; точка улицы, дом не подтверждён'))
    exact=[v for v in accepted if v[1]=='exact']; candidates=exact or accepted
    # A POI inside a uniquely matched address building is not a second address.
    buildings=[v for v in exact if v[0].get('addresstype')=='building']
    if len(buildings)==1:
        b=buildings[0][0]; box=b.get('boundingbox')
        if box and all(float(box[0])<=float(v[0]['lat'])<=float(box[1]) and float(box[2])<=float(v[0]['lon'])<=float(box[3]) for v in exact): candidates=buildings
    unique={ (round(float(r['lon']),4),round(float(r['lat']),4)): (r,q,n) for r,q,n in candidates }
    if len(unique)!=1:
        return {'coordinates':None,'quality':'unresolved','reason':'Несколько подходящих объектов' if unique else 'Не подтверждено совпадение населённого пункта, улицы и дома'}
    r,q,n=next(iter(unique.values()))
    return {'coordinates':[float(r['lon']),float(r['lat'])],'quality':q,'reason':n,'matchedAddress':r.get('display_name'),'matchedFields':r.get('address'),'osmType':r.get('osm_type'),'osmId':r.get('osm_id'),'source':'OpenStreetMap / Nominatim','sourceUrl':f'https://www.openstreetmap.org/{r.get("osm_type")}/{r.get("osm_id")}'}

def main():
    lock=(CACHE/'.lock').open('w'); fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
    ap=argparse.ArgumentParser(); ap.add_argument('--limit',type=int); args=ap.parse_args()
    centers=json.loads((ROOT/'data/catalog.json').read_text()); out=ROOT/'data/coordinates.json'
    data=json.loads(out.read_text()) if out.exists() else {}
    for i,c in enumerate(centers[:args.limit]):
        if c['id'] in data and data[c['id']].get('inputSignature')==input_signature(c) and not data[c['id']].get('providerError'): continue
        street,house=parse_address(c['address'])
        if not street:
            data[c['id']]={'coordinates':None,'quality':'unresolved','reason':'Адрес отсутствует'}
        else:
            params={'q':', '.join(filter(None,[c['sourceRegion'],c['city'],street,house]))}
            res=request(params); result=assess(c,res['results']); queries=[res['url']]
            # City + street fallback handles an institution of one region located in another.
            if result['quality']=='unresolved' and not res.get('error'):
                res=request({'city':c['city'],'street':f'{house or ""} {street}'.strip()}); queries.append(res['url']); result=assess(c,res['results'])
            result['queries']=queries; result['geocodedAt']=res.get('fetchedAt'); result['providerError']=res.get('error')
            data[c['id']]=result
        data[c['id']]['inputSignature']=input_signature(c)
        temporary=out.with_suffix('.tmp')
        temporary.write_text(json.dumps(data,ensure_ascii=False,indent=2)); temporary.replace(out)
        if (i+1)%20==0: print(i+1,'/',len(centers),{q:sum(r['quality']==q for r in data.values()) for q in ['exact','approximate','unresolved']},flush=True)
    print('Geocoding complete',len(data),flush=True)
if __name__=='__main__': main()

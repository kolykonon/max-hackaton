"""Import all CSV/XLSX fields verbatim; blank cells become null. Never execute cells."""
import csv, json, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
p=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'data/raw/blood_stations_russia.csv'
if p.suffix.lower()=='.xlsx':
    from openpyxl import load_workbook
    values=iter(load_workbook(p,read_only=True,data_only=True).active.values)
    headers=next(values); rows=[dict(zip(headers,v)) for v in values if any(v)]
else:
    rows=list(csv.DictReader(p.open(encoding='utf-8-sig',newline=''),delimiter=';'))
fields={'ID':'id','Название':'name','Тип учреждения':'type','Субъект РФ':'sourceRegion','Населённый пункт':'city','Адрес':'address','Телефон':'phone','Часы приёма доноров':'hours','Запись':'booking','Статус данных':'verification','Примечания / проверить':'notes','Дата проверки':'sourceCheckedAt','Виды донаций (подтверждено)':'donationTypes','Требования к донору':'requirements'}
centers=[]
for row in rows:
    raw={k:(str(v).strip() if v is not None and str(v).strip() else None) for k,v in row.items()}
    c={v:raw.get(k) for k,v in fields.items()}
    c['sources']=[raw[k] for k in ['Источник 1','Источник 2 (часы, запись)'] if raw.get(k)]
    c['raw']=raw; centers.append(c)
assert len({c['id'] for c in centers})==len(centers) and all(c['id'] for c in centers),'Duplicate / missing IDs'
(ROOT/'data/catalog.json').write_text(json.dumps(centers,ensure_ascii=False,indent=2))
print(f'Imported {len(centers)} centers, {len(set(c["sourceRegion"] for c in centers))} regions, all IDs unique')

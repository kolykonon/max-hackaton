"""Stable independent demo API payload; no medical dates or fabricated stock volumes."""
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
GROUPS=['O(I) Rh+','O(I) Rh−','A(II) Rh+','A(II) Rh−','B(III) Rh+','B(III) Rh−','AB(IV) Rh+','AB(IV) Rh−']
SEED='kaplya-russia-demo-v1'
def statuses(id):
    def status(group):
        v=int.from_bytes(hashlib.sha256(f'{SEED}:{id}:{group}'.encode()).digest()[:4],'big')%100
        return 'unknown' if v<15 else 'enough' if v<53 else 'needed' if v<82 else 'urgent'
    return {g:status(g) for g in GROUPS}
def main():
    catalog=json.loads((ROOT/'data/catalog.json').read_text())
    (ROOT/'data/demo-statuses.json').write_text(json.dumps({'kind':'demo','seed':SEED,'algorithm':'SHA-256(seed:id:group), first uint32 big endian modulo 100','groups':GROUPS,'statuses':{c['id']:statuses(c['id']) for c in catalog}},ensure_ascii=False,indent=2))
    print('Generated eight deterministic demo statuses for',len(catalog),'centers')
if __name__=='__main__':main()

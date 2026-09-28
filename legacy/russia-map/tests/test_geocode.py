import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from geocode import parse_address,assess
class AddressTests(unittest.TestCase):
 def test_corpus_and_structure(self):
  self.assertEqual(parse_address('ул. Поликарпова, д. 14, корп. 2'),('ул. Поликарпова','14 корп. 2'))
  self.assertEqual(parse_address('Каштановая аллея, д. 2, стр. 1'),('Каштановая аллея','2 стр. 1'))
 def test_no_false_city_center_or_wrong_homonym(self):
  c={'city':'Павловск','sourceRegion':'Воронежская область','address':'ул. Ленина, д. 1'}
  r={'lat':'50','lon':'40','addresstype':'building','address':{'city':'Павловск','state':'Алтайский край','road':'улица Ленина','house_number':'1'}}
  self.assertIsNone(assess(c,[r])['coordinates'])
  r['address']['state']='Воронежская область';r['addresstype']='city';r['address'].pop('house_number');r['address'].pop('road')
  self.assertIsNone(assess(c,[r])['coordinates'])
 def test_wrong_corpus_not_exact(self):
  c={'city':'Москва','sourceRegion':'г. Москва','address':'ул. Поликарпова, д. 14, корп. 2'}
  r={'lat':'55','lon':'37','addresstype':'building','address':{'city':'Москва','state':'Москва','road':'улица Поликарпова','house_number':'14'}}
  self.assertIsNone(assess(c,[r])['coordinates'])
  r['address']['house_number']='14 к2';self.assertEqual(assess(c,[r])['quality'],'exact')
if __name__=='__main__':unittest.main()

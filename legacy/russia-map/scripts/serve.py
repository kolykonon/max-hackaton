"""Serve only this prototype, the Moscow prototype and shared public geometry; never .env."""
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit,unquote
import argparse
ROOT=Path(__file__).resolve().parents[3]
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs): super().__init__(*args,directory=str(ROOT),**kwargs)
    def do_GET(self):
        p=unquote(urlsplit(self.path).path)
        target=(ROOT/p.lstrip('/')).resolve()
        if p=='/':
            self.send_response(302);self.send_header('Location','/legacy/russia-map/');self.end_headers();return
        allowed=any(target.is_relative_to(ROOT/'legacy'/folder) for folder in ['russia-map','moscow-map'])
        if not allowed or any(part.startswith('.') or part=='node_modules' for part in target.relative_to(ROOT).parts):
            self.send_error(404);return
        super().do_GET()
    def do_HEAD(self): self.do_GET()
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--port',type=int,default=4174);args=p.parse_args()
    print(f'Капля: http://127.0.0.1:{args.port}/legacy/russia-map/',flush=True)
    ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()

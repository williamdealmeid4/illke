"""Refresh classic regional assets and source coordinates at the pinned revision."""
import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'apps/web'
manifest = json.loads((ROOT/'static/maps/sources.json').read_text())
base = manifest['repository'].replace('https://github.com/', 'https://raw.githubusercontent.com/')+'/'+manifest['revision']+'/'
for name in manifest['files']:
    (ROOT/'static/maps'/name).write_bytes(urllib.request.urlopen(base+'public/maps/'+name, timeout=30).read())
points = {}
for edition, filename in [('rby','gen1-map-landmarks.ts'), ('gsc','gen2-map-landmarks.ts'), ('emerald','gen3-map-landmarks.ts'), ('frlg','gen3-frlg-map-landmarks.ts')]:
    text = urllib.request.urlopen(base+'lib/pokemon/data/'+filename, timeout=30).read().decode()
    extracted = []
    for obj in re.findall(r'\{[^{}]*\}', text):
        name = re.search(r'name:\s*"([^"]+)"', obj)
        x = re.search(r'\bx:\s*(\d+)', obj)
        y = re.search(r'\by:\s*(\d+)', obj)
        if not (name and x and y):
            continue
        px, py = int(x[1]), int(y[1])
        width = re.search(r'width:\s*(\d+)', obj)
        height = re.search(r'height:\s*(\d+)', obj)
        view = re.search(r'(?:region|mapView):\s*"([^"]+)"', obj)
        if edition == 'rby':
            px, py = px*8+20, py*8+13
        elif edition in ['emerald', 'frlg']:
            # Regional centroid; offsets match the source's visible map canvas.
            dx, dy = (8,16) if edition == 'emerald' else (32,32)
            px = (px+int(width[1])/2)*8+dx
            py = (py+int(height[1])/2)*8+dy
        point = {'name':name[1], 'x':px, 'y':py, 'view':view[1] if view else edition}
        if point not in extracted:
            extracted.append(point)
    if not extracted:
        raise ValueError('No coordinates extracted: '+edition)
    points[edition] = extracted
(ROOT/'src/lib/map-points.json').write_text(json.dumps(points, ensure_ascii=False, separators=(',', ':'))+'\n')
print('Mapas e coordenadas atualizados na revisão', manifest['revision'])

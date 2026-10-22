"""Import only explicit item balls and hidden items; do not infer NPC gifts or shops."""
import io
import json
import re
import tarfile
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    'firered': ('pret/pokefirered', 'master'),
    'emerald': ('pret/pokeemerald', 'master'),
}
result = {'sources': {}, 'items': {}}
for game, (repo, branch) in SOURCES.items():
    revision = json.load(urllib.request.urlopen(f'https://api.github.com/repos/{repo}/commits/{branch}', timeout=30))['sha']
    result['sources'][game] = {'repository': f'https://github.com/{repo}', 'revision': revision}
    archive = urllib.request.urlopen(f'https://codeload.github.com/{repo}/tar.gz/{revision}', timeout=90).read()
    with tarfile.open(fileobj=io.BytesIO(archive), mode='r:gz') as tar:
        files = {}
        for member in tar.getmembers():
            name = member.name.split('/', 1)[-1]
            if member.isfile() and (name.startswith('data/maps/') or name == 'data/scripts/item_ball_scripts.inc') and name.endswith(('.json', '.inc')):
                files[name] = tar.extractfile(member).read().decode()
    scripts = {}
    for text in files.values():
        for label, item in re.findall(r'([A-Za-z0-9_]+)::?\s*\n\s*finditem\s+ITEM_([A-Z0-9_]+)', text):
            scripts[label] = item
    count = 0
    for path, text in files.items():
        if not path.endswith('/map.json'):
            continue
        data = json.loads(text)
        for event in data.get('object_events', []) + data.get('bg_events', []):
            item = scripts.get(event.get('script')) if event.get('graphics_id', '').endswith('ITEM_BALL') else None
            hidden = event.get('type') == 'hidden_item'
            if hidden:
                item = event.get('item', '').removeprefix('ITEM_')
            if not item or item == 'NONE':
                continue
            slug = item.lower().replace('_', '-')
            area = data['region_map_section'].removeprefix('MAPSEC_').lower().replace('_', '-')
            area = re.sub(r'route-(\d+)', r'route-\1', area)
            label = re.sub(r'(?<=[a-z])(?=[A-Z])|_', ' ', data['name'])
            hint = {'id': game+'-'+data['name']+'-'+str(event['x'])+'-'+str(event['y']), 'area': area, 'title': label,
                    'method': 'Procurar um item oculto; use o Itemfinder' if hidden else 'Recolher a Poké Ball de item no cenário',
                    'conditions': [], 'tile': {'x': event['x'], 'y': event['y']},
                    'source': f'https://github.com/{repo}/blob/{revision}/{path}'}
            result['items'].setdefault(game, {}).setdefault(slug, []).append(hint)
            count += 1
    print(game, count, 'pistas extraídas de eventos explícitos', revision[:12])
path = ROOT/'apps/web/src/lib/server/item-locations.json'
path.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':'))+'\n')

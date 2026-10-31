# /// script
# requires-python = ">=3.11"
# dependencies = ["Pillow>=11"]
# ///
"""Download sourced game art locally: uv run scripts/sync-game-covers.py.

Researched overrides take precedence over exact title matching. Validate every
image with Pillow and SHA-256. Exit unsuccessfully if any title remains missing.
"""
import concurrent.futures
import hashlib
import io
import json
from pathlib import Path
import re
import subprocess
import ssl
import time
import unicodedata
import urllib.parse
import urllib.request
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'apps/web/src/lib/game-covers.json'
OUT = ROOT / 'apps/web/static/covers'
PLATFORMS = {'gb':'Nintendo_-_Game_Boy','gbc':'Nintendo_-_Game_Boy_Color','gba':'Nintendo_-_Game_Boy_Advance','ds':'Nintendo_-_Nintendo_DS','3ds':'Nintendo_-_Nintendo_3DS','n64':'Nintendo_-_Nintendo_64','gc':'Nintendo_-_GameCube','wii':'Nintendo_-_Wii','wiiu':'Nintendo_-_Wii_U','mini':'Nintendo_-_Pokemon_Mini'}

def request(url):
    for attempt in range(3):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent':'illke-asset-sync/2.0'}), timeout=30).read()
        except urllib.error.URLError as error:
            # Windows curl uses the OS certificate store; uv's Python bundles a
            # different CA set. Keep certificate verification enabled in both.
            if isinstance(error.reason, ssl.SSLCertVerificationError):
                return subprocess.check_output(['curl.exe', '--fail', '--silent', '--show-error', '--location', '--max-time', '30', url])
            if attempt == 2:
                raise
            time.sleep(attempt + 1)
        except Exception:
            if attempt == 2:
                raise
            time.sleep(attempt + 1)

def raster(data):
    with Image.open(io.BytesIO(data)) as im:
        ext = {'PNG':'png', 'JPEG':'jpg', 'WEBP':'webp'}[im.format]
        width, height = im.size
        im.verify()
    if min(width, height) < 32:
        raise ValueError('image is too small')
    return ext, width, height

def norm(value):
    value = unicodedata.normalize('NFKD', value).encode('ascii','ignore').decode().lower()
    value = re.sub(r'\([^)]*\)|\bversion\b', '', value)
    return re.sub('[^a-z0-9]', '', value)

def listing(pair):
    platform, repo = pair
    try:
        rows = json.loads(request(f'https://api.github.com/repos/libretro-thumbnails/{repo}/git/trees/master?recursive=1'))['tree']
        return platform, [row['path'] for row in rows if row['path'].startswith('Named_Boxarts/')]
    except Exception as error:
        print(f'Listing unavailable: {repo}: {error}')
        return platform, []

def main():
    games = json.loads(subprocess.check_output(['node','--input-type=module','-e',"import{games}from'./apps/web/src/lib/games.js';process.stdout.write(JSON.stringify(games))"], cwd=ROOT))
    records = json.loads(MANIFEST.read_text(encoding='utf-8'))
    overrides = json.loads((ROOT/'scripts/game-cover-overrides.json').read_text(encoding='utf-8'))
    OUT.mkdir(exist_ok=True)
    needs_matching = [g for g in games if g['id'] not in records and g['id'] not in overrides]
    platforms = {p for g in needs_matching for p in g['consoles'] if p in PLATFORMS}
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        lists = dict(pool.map(listing, [(p, PLATFORMS[p]) for p in platforms]))

    def cover(game):
        identifier = game['id']
        existing = records.get(identifier)
        override = overrides.get(identifier)
        try:
            if existing and (not override or override[0] == existing['source']):
                try:
                    data = (ROOT/'apps/web/static'/existing['image'].lstrip('/')).read_bytes()
                    ext, width, height = raster(data)
                    if hashlib.sha256(data).hexdigest() == existing['sha256']:
                        return identifier, {**existing, 'width':width, 'height':height}, None
                except (OSError, ValueError, SyntaxError):
                    pass  # Missing or damaged cache: fetch the attributed source.
            if override:
                source, origin, kind = override
            elif existing:
                source, origin, kind = (existing[k] for k in ['source','origin','kind'])
            else:
                matches = [(p, path) for p in game['consoles'] for path in lists.get(p, []) if norm(path.split('/')[-1].removesuffix('.png')) == norm(game['name'])]
                if not matches:
                    raise ValueError('no researched source or exact box-art match')
                platform, path = sorted(matches, key=lambda pair: ('Preview' in pair[1], 'Demo' in pair[1], 'USA' not in pair[1], 'Europe' not in pair[1], pair[1]))[0]
                origin = 'https://github.com/libretro-thumbnails/' + PLATFORMS[platform]
                source = 'https://raw.githubusercontent.com/libretro-thumbnails/' + PLATFORMS[platform] + '/master/' + urllib.parse.quote(path)
                kind = 'box'
            data = request(source)
            ext, width, height = raster(data)
            filename = identifier + '.' + ext
            print('Downloaded:', identifier)
            return identifier, {'image':'/covers/'+filename,'source':source,'origin':origin,'kind':kind,'sha256':hashlib.sha256(data).hexdigest(),'width':width,'height':height}, data
        except Exception as error:
            print(f'MISSING {identifier}: {error}')
            return identifier, None, None

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(cover, games))
    records = {key: row for key, row, data in results if row}
    print(f'{len(records)}/{len(games)} verified images; {len(games)-len(records)} missing')
    if len(records) != len(games):
        raise SystemExit(1)  # Preserve the last complete files and manifests.
    for key, row, data in results:
        if data is not None:
            target = OUT / Path(row['image']).name
            pending = target.with_suffix(target.suffix + '.pending')
            pending.write_bytes(data)
            pending.replace(target)
    content = json.dumps(records, ensure_ascii=False, indent=2) + '\n'
    for target in [MANIFEST, OUT/'sources.json']:
        pending = target.with_suffix('.json.pending')
        pending.write_text(content, encoding='utf-8')
        pending.replace(target)

if __name__ == '__main__':
    main()

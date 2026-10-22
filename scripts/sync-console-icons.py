"""Download existing console artwork unchanged; retain upstream attribution and hashes."""
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.parse import quote
import hashlib, json
ROOT = Path(__file__).resolve().parents[1] / 'apps/web/static/consoles'
REV = 'd9f969054dc7fbb6fa89519036d2b971e0855b51'
NAMES = {'gb':'Game Boy','gbc':'Game Boy Color','gba':'Game Boy Advance','ds':'Nintendo DS','3ds':'Nintendo 3DS','switch':'Switch','switch2':'Switch 2','n64':'Nintendo 64','gc':'GameCube','wii':'Wii','wiiu':'Wii U','mini':'Pokemon Mini'}
ROOT.mkdir(parents=True,exist_ok=True)
files=[]
for key,name in {**NAMES,'pico':'PICO','arcade':'Arcade Games'}.items():
    prefix = 'Sega' if key=='pico' else 'FBNeo' if key=='arcade' else 'Nintendo'
    url=f'https://raw.githubusercontent.com/libretro/retroarch-assets/{REV}/'+quote(f'xmb/flatux/png/{prefix} - {name}.png')
    data=urlopen(Request(url,headers={'User-Agent':'illke-assets/1.0'}),timeout=30).read()
    (ROOT/f'{key}.png').write_bytes(data)
    files.append({'platform':key,'file':f'{key}.png','source':url,'sha256':hashlib.sha256(data).hexdigest()})
for key,code in [('mobile','1f4f1'),('pc','1f5a5')]:
    url=f'https://raw.githubusercontent.com/jdecked/twemoji/v16.0.1/assets/svg/{code}.svg'
    data=urlopen(url,timeout=30).read()
    (ROOT/f'{key}.svg').write_bytes(data)
    files.append({'platform':key,'file':f'{key}.svg','source':url,'sha256':hashlib.sha256(data).hexdigest()})
manifest={'sources':[{'name':'RetroArch assets / FlatUX','url':'https://github.com/libretro/retroarch-assets','revision':REV,'license':'CC BY 4.0','license_url':f'https://github.com/libretro/retroarch-assets/blob/{REV}/COPYING','attribution':'baxysquare and RetroArch assets contributors (FlatUX)'},{'name':'Twemoji','url':'https://github.com/jdecked/twemoji','license':'CC BY 4.0','attribution':'Twitter, Inc. and other contributors'}],'files':files}
(ROOT/'sources.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f'{len(files)} existing platform images downloaded.')

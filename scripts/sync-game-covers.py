"""Fetch existing box scans and official publisher artwork; keep sources explicit."""
import concurrent.futures, hashlib, json, re, unicodedata, urllib.parse, urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
import subprocess
GAMES=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import{games}from'./apps/web/src/lib/games.js';process.stdout.write(JSON.stringify(games))"],cwd=ROOT))
PLATFORMS={'gb':'Nintendo_-_Game_Boy','gbc':'Nintendo_-_Game_Boy_Color','gba':'Nintendo_-_Game_Boy_Advance','ds':'Nintendo_-_Nintendo_DS','3ds':'Nintendo_-_Nintendo_3DS','n64':'Nintendo_-_Nintendo_64','gc':'Nintendo_-_GameCube','wii':'Nintendo_-_Wii','wiiu':'Nintendo_-_Wii_U','mini':'Nintendo_-_Pokemon_Mini'}
def request(url):return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'illke-asset-sync'}),timeout=12).read()
def norm(s):
 s=unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()
 s=re.sub(r'\([^)]*\)|\bversion\b','',s)
 return re.sub('[^a-z0-9]','',s)
def listing(pair):
 key,repo=pair
 try:
  rows=json.loads(request(f'https://api.github.com/repos/libretro-thumbnails/{repo}/git/trees/master?recursive=1'))['tree']
  return key,[r['path'] for r in rows if r['path'].startswith('Named_Boxarts/') and 'pokemon' in r['path'].lower()]
 except:return key,[]
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:lists=dict(pool.map(listing,PLATFORMS.items()))
# Official publisher archive artwork is used where a physical box scan is unavailable.
OFFICIAL={
 'legends-za':'legends_z-a','legends-arceus':'pokemonlegendsarceus','scarlet':'sv','violet':'sv','sword':'sword_shield','shield':'sword_shield','brilliant-diamond':'bdsp','shining-pearl':'bdsp','lets-go-pikachu':'pika_vee','lets-go-eevee':'pika_vee','pokemon-new-pokemon-snap':'pokemonsnap','pokemon-new-snap':'pokemonsnap','new-pokemon-snap':'pokemonsnap','pokemon-home':'pokemonhome','pokemon-quest':'pokemonquest','pokemon-unite':'pokemonunite','pokemon-cafe-remix':'maze','pokemon-champions':'pokemonchampions','pokemon-pokopia':'pocoapokemon','pokemon-detective-pikachu-returns':'detective_pikachu','pokemon-mystery-dungeon-rescue-team-dx':'dungeonDX','pokemon-pokken-tournament-dx':'pokkenDX',
}
OFFICIAL.update({'yellow':'other_gb-pikachu','crystal':'other_gbc-crystal','omega-ruby':'ds_oras','alpha-sapphire':'ds_oras','extra-hey-you-pikachu':'other_64-genki','extra-xd-gale-of-darkness':'other_xd','extra-box-ruby-sapphire':'other_pbrs','extra-pokepark-wii-pikachu-s-adventure':'wii_pokepark','extra-pokepark-2-wonders-beyond':'wii_pokepark2','extra-rumble-u':'ds_scrambleU','extra-pokken-tournament':'pokken_wiiU','extra-trading-card-game-2':'other_gbc-gr','extra-battle-trozei':'ds_battletrozei','extra-detective-pikachu':'meitantei_pikachu','extra-bank':'ds_pokemonbank','extra-pokedex-3d-pro':'ds_zenkokuzukan_pro','mega-dimension':'legends_z-a_m','extra-pokken-tournament-arcade':'pokken'})
for g in GAMES:
 if g['id'].startswith(('the-isle-of-armor','the-crown-tundra')):OFFICIAL[g['id']]='sword_shield_expansion'
 if g['id'].startswith(('the-teal-mask','the-indigo-disk')):OFFICIAL[g['id']]='sv_dlc'
APP={'extra-go':'pokemongo','extra-sleep':'sleep','extra-masters-ex':'masters','extra-trading-card-game-pocket':'tcgp','extra-magikarp-jump':'koiking','extra-smile':'smile','extra-rumble-rush':'pokemon-scramblesp','extra-duel':'pokemon-comaster','extra-pokedex-for-ios':'pokedex'}
# Match actual generated catalog identifiers by title when they carry a prefix.
for game in GAMES:
 for title,key in [('New Pokémon Snap','pokemonsnap'),('Pokémon HOME','pokemonhome'),('Pokémon Quest','pokemonquest'),('Pokémon UNITE','pokemonunite'),('Pokémon Café ReMix','maze'),('Pokémon Champions','pokemonchampions'),('Pokémon Pokopia','pocoapokemon'),('Pokémon Detective Pikachu Returns','detective_pikachu'),('Pokémon Mystery Dungeon: Rescue Team DX','dungeonDX'),('Pokkén Tournament DX','pokkenDX')]:
  if game['name']==title:OFFICIAL[game['id']]=key
out=ROOT/'apps/web/static/covers';out.mkdir(exist_ok=True)
records=json.loads((ROOT/'apps/web/src/lib/game-covers.json').read_text()) if (ROOT/'apps/web/src/lib/game-covers.json').exists() else {}
def cover(game):
 if game["id"] in records:return game["id"],records[game["id"]]
 candidates=[]
 for platform in game['consoles']:
  for path in lists.get(platform,[]):
   filename=path.split('/')[-1].removesuffix('.png')
   if norm(filename)==norm(game['name']):candidates.append((platform,path))
 try:
  if candidates:
   platform,path=sorted(candidates,key=lambda p:('USA' not in p[1],'Europe' not in p[1],p[1]))[0]
   source='https://raw.githubusercontent.com/libretro-thumbnails/'+PLATFORMS[platform]+'/master/'+urllib.parse.quote(path)
   data=request(source);ext='png';kind='box';origin='https://github.com/libretro-thumbnails/'+PLATFORMS[platform]
  elif game['id'] in APP:
   ext='png';source='https://www.pokemon.co.jp/img/app/icon-app-'+APP[game['id']]+'.png';data=request(source);kind='official-art';origin='https://www.pokemon.co.jp/app/'
  elif game['id'] in OFFICIAL:
   key=OFFICIAL[game['id']];ext='jpg' if key not in ['sv_dlc'] else 'png'
   source='https://www.pokemon.co.jp/img/game/archive/thumb_'+key+'.'+ext
   
   try:data=request(source)
   except:ext='png';source=source.removesuffix('.jpg')+'.png';data=request(source)
   kind='official-art';origin='https://www.pokemon.co.jp/game/'
  else:return
  if not(data.startswith(b'\x89PNG') or data.startswith(b'\xff\xd8')):return
  file=game['id']+'.'+ext;(out/file).write_bytes(data)
  return game['id'],{'image':'/covers/'+file,'source':source,'origin':origin,'kind':kind,'sha256':hashlib.sha256(data).hexdigest()}
 except:return
with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
 for row in pool.map(cover,GAMES):
  if row:records[row[0]]=row[1]
(ROOT/'apps/web/src/lib/game-covers.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
(out/'sources.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
print(len(records),'verified images;',len(GAMES)-len(records),'titles without a verified image')

"""Render source game metatiles and export physical map connections for guide hints.
No ROM, generated artwork, or guessed regional coordinates are used.
Requires Pillow. Sources are pinned to the item snapshot revisions.
"""
import argparse, hashlib, io, json, re, struct, tarfile, urllib.request
from pathlib import Path
from PIL import Image
from functools import lru_cache

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--cache',default='/tmp/illke-guide-sources')
args=parser.parse_args()
SOURCES=json.loads((ROOT/'apps/web/src/lib/server/item-locations.json').read_text())['sources']
output={'sources':SOURCES,'games':{}}
manifest={'sources':SOURCES,'files':[]}
public=ROOT/'apps/web/static/maps/local'
public.mkdir(parents=True,exist_ok=True)
def normalize(text):return re.sub('[^a-z0-9]','',text.lower())
def label(text):return re.sub(r'(?<=[a-z])(?=[A-Z])|(?<=[A-Za-z])(?=\d)|_',' ',text)
for game,source in SOURCES.items():
    base=Path(args.cache)/game
    revision=source['revision'];repo=source['repository'].removeprefix('https://github.com/')
    raw=f'https://raw.githubusercontent.com/{repo}/{revision}/'
    if not base.exists():
        data=urllib.request.urlopen(f'https://codeload.github.com/{repo}/tar.gz/{revision}',timeout=90).read()
        base.mkdir(parents=True)
        with tarfile.open(fileobj=io.BytesIO(data)) as tar:
            for member in tar.getmembers():
                name=member.name.split('/',1)[-1]
                if member.isfile() and name.startswith(('data/maps/','data/layouts/','data/tilesets/')):
                    target=base/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(tar.extractfile(member).read())
    wildfile=base/'wild_encounters.json'
    if not wildfile.exists():wildfile.write_bytes(urllib.request.urlopen(raw+'src/data/wild_encounters.json',timeout=30).read())
    wild=json.loads(wildfile.read_text())
    wild_rows=[row for group in wild['wild_encounter_groups'] if group.get('for_maps') for row in group['encounters']]
    wildmaps={row['map'] for group in wild['wild_encounter_groups'] if group.get('for_maps') for row in group['encounters']}
    maps={}
    for file in sorted((base/'data/maps').glob('*/map.json')):
        data=json.loads(file.read_text());maps[data['id']]=data
    layouts={row['id']:row for row in json.loads((base/'data/layouts/layouts.json').read_text())['layouts'] if 'id' in row}
    itemmaps={h['source'].split('/maps/')[1].split('/')[0] for hints in json.loads((ROOT/'apps/web/src/lib/server/item-locations.json').read_text())['items'][game].values() for h in hints}
    tilesets={normalize(p.name):p for p in (base/'data/tilesets').glob('*/*') if p.is_dir()}
    headers_file=base/'tileset-headers.h'
    if not headers_file.exists():headers_file.write_bytes(urllib.request.urlopen(raw+'src/data/tilesets/headers.h',timeout=30).read())
    tile_alias={};palette_alias={}
    for symbol,body in re.findall(r'const struct Tileset (gTileset_\w+)\s*=\s*\{(.*?)\};',headers_file.read_text(),re.S):
        owner=tilesets.get(normalize(symbol.removeprefix('gTileset_')))
        if not owner:continue
        for field,prefix,aliases in [('tiles','gTilesetTiles_',tile_alias),('palettes','gTilesetPalettes_',palette_alias)]:
            found=re.search(r'\.'+field+r'\s*=\s*('+prefix+r'\w+)',body)
            if found:
                target=tilesets.get(normalize(found[1].removeprefix(prefix)))
                if target:aliases[owner]=target
    primary_count,primary_palettes=(640,7) if game=='firered' else (512,6)
    @lru_cache(maxsize=None)
    def sheet(path):
        image=Image.open(tile_alias.get(path,path)/'tiles.png');image.load()
        return image
    @lru_cache(maxsize=None)
    def palette(path,index):
        return [tuple(map(int,line.split())) for line in (palette_alias.get(path,path)/f'palettes/{index:02d}.pal').read_text().splitlines()[3:19]]
    @lru_cache(maxsize=None)
    def attributes_for(path):return (path/'metatile_attributes.bin').read_bytes()
    @lru_cache(maxsize=None)
    def metatile(primary,secondary,number):
        owner=primary if number<primary_count else secondary
        index=number if number<primary_count else number-primary_count
        data=(owner/'metatiles.bin').read_bytes()[index*16:index*16+16]
        if len(data)!=16:raise ValueError('Metatile outside source tileset')
        image=Image.new('RGBA',(16,16))
        for layer in range(2):
            for quadrant in range(4):
                value=struct.unpack_from('<H',data,(layer*4+quadrant)*2)[0]
                tileid=value&1023;palid=value>>12
                tile_owner=primary if tileid<primary_count else secondary
                tilenum=tileid if tileid<primary_count else tileid-primary_count
                source_sheet=sheet(tile_owner);columns=source_sheet.width//8
                colors=palette(primary if palid<primary_palettes else secondary,palid)
                tile=source_sheet.crop(((tilenum%columns)*8,(tilenum//columns)*8,(tilenum%columns)*8+8,(tilenum//columns)*8+8))
                rendered=Image.new('RGBA',(8,8))
                rendered.putdata([(*colors[pixel%16],0 if layer and pixel%16==0 else 255) for pixel in tile.getdata()])
                if value&1024:rendered=rendered.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
                if value&2048:rendered=rendered.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
                image.alpha_composite(rendered,((quadrant%2)*8,(quadrant//2)*8))
        return image
    nodes={};rendered_count=0
    for key,data in maps.items():
        layout=layouts.get(data.get('layout'))
        if not layout:continue
        node={'name':data['name'],'label':label(data['name']),'area':data.get('region_map_section','').removeprefix('MAPSEC_').lower().replace('_','-'),'type':data.get('map_type'),'width':layout['width'],'height':layout['height'],'source':source['repository']+'/blob/'+revision+'/data/maps/'+data['name']+'/map.json','exits':[]}
        for con in data.get('connections') or []:
            if con['map'] in maps:node['exits'].append({'to':con['map'],'direction':con['direction']})
        for warp in data.get('warp_events') or []:
            if warp['dest_map'] in maps and warp['dest_map']!=key:node['exits'].append({'to':warp['dest_map'],'tile':{'x':warp['x'],'y':warp['y']},'warp':True})
        node['exits']=list({json.dumps(e,sort_keys=True):e for e in node['exits']}.values())
        if data['name'] in itemmaps or key in wildmaps:
            primary=tilesets.get(normalize(layout['primary_tileset'].removeprefix('gTileset_')))
            secondary=tilesets.get(normalize(layout['secondary_tileset'].removeprefix('gTileset_')))
            if primary and secondary:
                blocks=(base/layout['blockdata_filepath']).read_bytes()
                image=Image.new('RGBA',(layout['width']*16,layout['height']*16))
                for i,(block,) in enumerate(struct.iter_unpack('<H',blocks)):
                    image.paste(metatile(primary,secondary,block&1023),((i%layout['width'])*16,(i//layout['width'])*16))
                target=public/game/(data['name']+'.webp');target.parent.mkdir(parents=True,exist_ok=True)
                image.convert('RGB').save(target,'WEBP',lossless=True,method=6)
                node['image']='/maps/local/'+game+'/'+target.name
                grass=[];water=[]
                for y in range(layout['height']):
                    for kind,allowed,result_runs in [('grass',{2,3,9},grass),('water',{16,17,18,20,21},water)]:
                        start=None
                        for x in range(layout['width']+1):
                            good=False
                            if x<layout['width']:
                                block=struct.unpack_from('<H',blocks,(y*layout['width']+x)*2)[0]&1023
                                owner=primary if block<primary_count else secondary
                                n=block if block<primary_count else block-primary_count
                                attributes=attributes_for(owner)
                                size=4 if game=='firered' else 2
                                behavior=int.from_bytes(attributes[n*size:n*size+size],'little')&(511 if game=='firered' else 255)
                                good=behavior in allowed
                            if good and start is None:start=x
                            if not good and start is not None:
                                result_runs.append([start,y,x-start]);start=None
                node['zones']={'grass':grass,'water':water}
                node['wild']={}
                for row in wild_rows:
                    if row['map']!=key:continue
                    version=('leafgreen' if 'LeafGreen' in row.get('base_label','') else 'firered') if game=='firered' else 'emerald'
                    node['wild'][version]={field:sorted({mon['species'].removeprefix('SPECIES_').lower().replace('_','-') for mon in value.get('mons',[])}) for field,value in row.items() if field.endswith('_mons')}
                manifest['files'].append({'file':game+'/'+target.name,'source':node['source'],'layout':layout['blockdata_filepath'],'primary':str(primary.relative_to(base)),'secondary':str(secondary.relative_to(base)),'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
                rendered_count+=1
        nodes[key]=node
    output['games'][game]=nodes
    print(game,len(nodes),'connected maps;',rendered_count,'local maps rendered')
    metatile.cache_clear();sheet.cache_clear();palette.cache_clear();attributes_for.cache_clear()
(ROOT/'apps/web/src/lib/server/world-navigation.json').write_text(json.dumps(output,ensure_ascii=False,separators=(',',':'))+'\n')
(public/'sources.json').write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+'\n')

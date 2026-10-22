import points from './map-points.json' with { type: 'json' };
import artwork from './regional-artwork.json' with { type: 'json' };
const normalize = s => s.toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').replace(/^(kanto|johto|hoenn)-/,'');
export function mapFor(game, area='') {
 const set=game.map;
 if (!set) {
  const key=({Kanto:'kanto',Johto:'johto',Hoenn:'hoenn',Sinnoh:'sinnoh',Unova:'unova',Kalos:'kalos',Alola:'alola',Galar:'galar',Hisui:'hisui',Paldea:'paldea'}[game.region] || '')+'-artwork';
  return artwork[key] ? {...artwork[key],point:null,illustration:true} : null;
 }
 const target=normalize(area);
 const point=(points[set] || []).filter(p=>{const name=normalize(p.name);return target===name||target.startsWith(name+'-');}).sort((a,b)=>normalize(b.name).length-normalize(a.name).length)[0];
 const view=point?.view;
 let image=set==='rby'?'kanto-town-map-rby.png':set==='gsc'?(view==='kanto'?'kanto-town-map-gsc.png':'johto-town-map-gsc.png'):set==='emerald'?'hoenn-map-emerald.svg':({'sevii123':'frlg-islands-1-3-map.svg','sevii45':'frlg-islands-4-5-map.svg','sevii67':'frlg-islands-6-7-map.svg'}[view]||'kanto-map-frlg.svg');
 return {image:'/maps/'+image,width:['rby','gsc'].includes(set)?160:240,height:['rby','gsc'].includes(set)?144:160,point:point || null};
}

export function landmarksFor(game) { return [...new Map((points[game.map] || []).map(p=>[p.name,p])).values()]; }

import { error } from '@sveltejs/kit';
import { getGame } from '$lib/games.js';
import { readApi } from '$lib/api.js';
import { loadGuide } from '$lib/server/guides.js';
export async function load({params,url,fetch}) {
 const game=getGame(params.id);
 if(!game)error(404,'Jogo não encontrado.');
 const kind=url.searchParams.get('kind')==='item'?'item':'pokemon';
 const query=(url.searchParams.get('q') || '').slice(0,100);
 const target=(url.searchParams.get('target') || '').slice(0,100);
 let matches=[],entry=null,guide=null,message='';
 try {
  if(target){entry=await readApi(fetch,'/catalog/'+kind+'/'+encodeURIComponent(target));guide=await loadGuide(entry,game.id);}
  else if(query.trim()){const catalog=await readApi(fetch,'/catalog/'+kind+'?'+new URLSearchParams({q:query,per_page:'12'}));matches=catalog.data || [];}
 }catch(cause){message=cause.status===404?'Este alvo não foi encontrado no catálogo. Faça uma nova busca.':cause.message;}
 return {game,kind,query,matches,entry,guide,message};
}

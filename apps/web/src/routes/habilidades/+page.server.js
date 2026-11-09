import { readApi } from "$lib/api.js";
import {classifyAbility} from '$lib/ability-categories.js';
export async function load({ fetch, url }) {
  try {
    const params=new URLSearchParams(url.searchParams); params.delete('page'); params.delete('category');
    const first=await readApi(fetch,'/catalog/ability?'+params);
    const rest=await Promise.all(Array.from({length:first.last_page-1},(_,i)=>readApi(fetch,'/catalog/ability?'+params+'&page='+(i+2))));
    const entries=[...first.data,...rest.flatMap(p=>p.data)];
    const category=url.searchParams.get('category');
    const filtered=entries.filter(e=>!category||classifyAbility(e.attributes.effect).id===category);
    const current=Math.max(1,Number(url.searchParams.get('page'))||1);
    const total=filtered.length;
    const pageUrl=n=>{const p=new URLSearchParams(url.searchParams);p.set('page',n);return url.origin+url.pathname+'?'+p;};
    return {
      catalog: {...first,data:filtered.slice((current-1)*36,current*36), total,current_page:current,last_page:Math.ceil(total/36),from:total?(current-1)*36+1:0,to:Math.min(current*36,total),prev_page_url:current>1?pageUrl(current-1):null,next_page_url:current*36<total?pageUrl(current+1):null},
      kind: "ability",
      title: "Habilidades",
      query: Object.fromEntries(url.searchParams),
      error: null,
    };
  } catch (e) {
    return {
      catalog: null,
      kind: "ability",
      title: "Habilidades",
      query: Object.fromEntries(url.searchParams),
      error: e.message,
    };
  }
}

/** API PHP é a autoridade de dados e regras. */
export async function readApi(fetch,path,cookie=''){
 const base=typeof process!=='undefined'?(process.env.API_INTERNAL_URL||'http://127.0.0.1:8000'):'';
 const res=await fetch(base+'/api/v1'+path,{headers:{Accept:'application/json',...(cookie?{cookie}:{})}});
 if(!res.ok)throw new Error('Consulta indisponível ('+res.status+').');
 return res.json();
}
export async function mutate(path,body,method='POST'){
 const csrf=document.cookie.split('; ').find(x=>x.startsWith('XSRF-TOKEN='))?.split('=').slice(1).join('=');
 const res=await fetch('/api/v1'+path,{method,headers:{'Content-Type':'application/json',Accept:'application/json',...(csrf?{'X-XSRF-TOKEN':decodeURIComponent(csrf)}:{})},body:body===undefined?undefined:JSON.stringify(body)});
 const result=await res.json();if(!res.ok)throw new Error(result.error?.message||result.message||'Não foi possível concluir a ação.');return result;
}

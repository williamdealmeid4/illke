
// Only catalog-owned URLs are fetched; visitor input never becomes an upstream URL.
export async function GET({params, url, fetch}) {
  const name=params.name;
  const response=await fetch((process.env.API_INTERNAL_URL || 'http://127.0.0.1:8000')+'/api/v1/sprite/'+encodeURIComponent(name)+(url.searchParams.get('style')==='artwork'?'?style=artwork':''), {redirect:'manual'});
  if(response.status!==302) return response;
  const target=new URL(response.headers.get('location'));
  if(target.origin!=='https://raw.githubusercontent.com' || !target.pathname.startsWith('/PokeAPI/sprites/')) return new Response('Imagem indisponível',{status:404});
  try {
    const upstream=await fetch(target,{signal:AbortSignal.timeout(15000)});
    if(!upstream.ok) return new Response('Imagem indisponível',{status:404});
    return new Response(await upstream.arrayBuffer(),{headers:{'Content-Type':upstream.headers.get('content-type')||'image/png','Cache-Control':'public, max-age=86400'}});
  } catch {return new Response('Imagem indisponível',{status:503});}
}

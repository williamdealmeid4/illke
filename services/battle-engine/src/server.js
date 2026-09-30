import http from 'node:http';
import {context,versions,options,evaluate,damage,legal,stats,importTeam,exportTeam,validateTeam,speciesData} from './domain.js';
const port=Number(process.env.ENGINE_PORT||8081);
const token=process.env.ENGINE_TOKEN;
if(!token){console.error('ENGINE_TOKEN ausente. Configure o segredo interno.');process.exit(1);}
const send=(res,status,data)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/health')return send(res,200,{status:'ok',versions});
  if(req.headers.authorization!=='Bearer '+token)return send(res,401,{error:{code:'UNAUTHENTICATED'}});
  if(req.method==='GET'&&url.pathname==='/context')return send(res,200,context);
  if(req.method==='GET'&&url.pathname==='/species')return send(res,200,speciesData());
  if(req.method==='GET'&&url.pathname==='/options')return send(res,200,options(url.searchParams.get('pokemon')||''));
  let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>100000){send(res,413,{error:{code:'PAYLOAD_TOO_LARGE'}});req.destroy();return;}}
  const body=JSON.parse(raw||'{}');
  const actions={'/evaluate':evaluate,'/validate':legal,'/stats':stats,'/damage':damage,'/import':x=>importTeam(x.text),'/export':exportTeam,'/team/validate':x=>validateTeam(x.builds)};
  if(req.method!=='POST'||!actions[url.pathname])return send(res,404,{error:{code:'NOT_FOUND'}});
  send(res,200,actions[url.pathname](body));
 }catch(error){send(res,422,{error:{code:'ENGINE_INPUT_INVALID',message:error.message}});}
}).listen(port,'127.0.0.1',()=>console.log('illke battle engine http://127.0.0.1:'+port));

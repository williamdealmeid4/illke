import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { apiRequest } from '../apps/web/src/lib/server/transport.js';

test('PHP transport consumes error bodies and preserves separate session cookies',async()=>{
  const server=http.createServer((req,res)=>{res.writeHead(404,{'Content-Type':'application/json','Set-Cookie':['one=1; Path=/','two=2; Path=/']});res.end(JSON.stringify({message:'not found',padding:'x'.repeat(8192)}));});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{const base=`http://127.0.0.1:${server.address().port}/missing`;for(let i=0;i<30;i++){const response=await apiRequest(base);assert.equal(response.status,404);assert.equal((await response.json()).message,'not found');assert.equal(response.headers.getSetCookie().length,2);}}
  finally{await new Promise(resolve=>server.close(resolve));}
});

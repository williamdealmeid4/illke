const checks=[['Frontend','http://127.0.0.1:5186/'],['API JSON','http://127.0.0.1:8000/up'],['API HTML','http://127.0.0.1:8000/up'],['Motor','http://127.0.0.1:8081/health'],['Catálogo','http://127.0.0.1:5186/api/v1/summary']];
let failed=false;
for(const [name,url] of checks){try{const response=await fetch(url,{headers:{Accept:name==='API HTML'?'text/html':'application/json'},signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error('HTTP '+response.status);if(name==='Catálogo'){const data=await response.json();if(!data.counts?.pokemon||!data.builds)throw Error('Catálogo vazio');}else await response.arrayBuffer();console.log('OK '+name);}catch(error){failed=true;console.error('FALHA '+name+': '+error.message);}}
process.exitCode=failed?1:0;

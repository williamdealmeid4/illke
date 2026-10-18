import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync, readlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
const root = resolve(import.meta.dirname, "..");
mkdirSync(resolve(root,'.runtime'),{recursive:true});
if(process.argv.includes('--stop')) {
  if(process.platform==='win32') {
    const result=spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',resolve(root,'scripts/stop-dev.ps1')],{stdio:'inherit',windowsHide:true});
    process.exit(result.status || 0);
  }
  const path=resolve(root,'.runtime/dev-processes.json');
  if(existsSync(path)) {
    const state=JSON.parse(readFileSync(path,'utf8'));
    if(state.root!==root) throw Error('Registro de processos não pertence a este projeto.');
    for(const pid of [...state.children,state.parent]) {try{if(readlinkSync(`/proc/${pid}/cwd`).startsWith(root))process.kill(pid,'SIGTERM');}catch{}}
  }
  process.exit(0);
}
const portable=resolve(root,process.platform==='win32'?'.runtime/php85/php.exe':'.runtime/php');
const php=existsSync(portable)?portable:'php';
if(spawnSync(php,['-v'],{stdio:'ignore'}).status!==0)throw Error('PHP indisponível. Execute npm run setup.');
const require=createRequire(resolve(root,'apps/web/package.json'));
const vite=resolve(dirname(require.resolve('vite/package.json')),'bin/vite.js');
const artisan=resolve(root,'apps/api/artisan');
const commands=[
  ['api',php,[artisan,'serve','--host=127.0.0.1','--port=8000'],'apps/api'],
  ['evaluations',php,[artisan,'queue:work','--queue=evaluations','--timeout=600','--tries=120'],'apps/api'],
  ['discord-worker',php,[artisan,'queue:work','--queue=discord,default','--timeout=60','--tries=1'],'apps/api'],
  ['engine',process.execPath,['--watch','--env-file-if-exists=.env',resolve(root,'services/battle-engine/src/server.js')],'services/battle-engine'],
  ['web',process.execPath,[vite,'--host','127.0.0.1'],'apps/web'],
];
const children=new Map();let stopping=false;
function record(){writeFileSync(resolve(root,'.runtime/dev-processes.json'),JSON.stringify({root,parent:process.pid,children:[...children.values()].map(c=>c.pid).filter(Boolean)}));}
function start(spec,attempt=0){
  const [name,command,args,cwd]=spec;
  const child=spawn(command,args,{cwd:resolve(root,cwd),stdio:'inherit',windowsHide:true});children.set(name,child);record();
  child.on('error',error=>{console.error(name+': '+error.message);stop();process.exitCode=1;});
  child.on('exit',code=>{if(stopping)return;if(attempt<3){console.error(name+' encerrou; reiniciando ('+(attempt+1)+'/3).');setTimeout(()=>{if(!stopping)start(spec,attempt+1);},1000*(attempt+1));}else{console.error(name+' não estabilizou. Consulte os logs.');stop();process.exitCode=code||1;}});
}
function stop(){if(stopping)return;stopping=true;for(const child of children.values()){if(child.exitCode!==null)continue;if(process.platform==='win32')spawnSync('taskkill',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore',windowsHide:true});else child.kill('SIGTERM');}}
commands.forEach(spec=>start(spec));
process.on('SIGINT',stop);process.on('SIGTERM',stop);process.on('SIGBREAK',stop);

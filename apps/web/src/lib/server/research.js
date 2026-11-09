import research from './research-index.json' with {type:'json'};
import machines from './machine-index.json' with {type:'json'};
import machineGuides from './machine-guides.json' with {type:'json'};
export function researchedGuide(entry,game){
 if(game.status==='announced')return null;
 const record=research[entry.kind]?.[entry.slug]||(entry.kind==='item'?machineGuides[entry.slug]:null);const facts=record?.games?.[game.id];
 const debut=entry.kind==='pokemon'?entry.generation:record?.introduced;
 if(facts?.status==='absent'||(game.category==='Série principal'&&game.generation&&debut>game.generation))return {status:'absent',hints:[],source:record?.source||'https://github.com/PokeAPI/pokeapi',message:entry.kind==='pokemon'?'Este Pokémon não existe nesse jogo.':'Este item não existe nesse jogo.'};
 if(!facts||facts.status==='unknown')return null;
 if(facts.status==='transfer')return {status:'transfer',hints:[],source:record.source,message:'Disponível por troca ou transferência de outro jogo; não há local de captura direta nesta edição na fonte consultada.'};
 const hints=[];
 for(const location of facts.locations||[])hints.push({title:location.name,area:location.slug,method:'Local de obtenção registrado; consulte a fonte para requisitos de presente, inicial ou captura.',source:record.source});
 for(const method of facts.methods||[])hints.push({title:method.type==='finite'?'Locais e recompensas limitados':'Métodos repetíveis',area:'',method:method.places.map(p=>p.name).join(' · '),source:record.source});
 if(facts.method)hints.push({title:'Método de obtenção',area:'',method:facts.method,source:record.source});
 return {status:'ready',hints:hints.map((h,i)=>({...h,id:'research-'+i,researched:true,conditions:[]})),source:record.source,message:'Informações de obtenção pesquisadas para esta edição. Confira na fonte as condições e restrições de versão.',checked:record.checked};
}
export function findMachines(query,game){
 const q=query.toLowerCase().trim().replace(/^tm\s*(?=[a-z])/,'').replace(/[^a-z0-9]/g,'');
 return machines.machines.filter(m=>m.group===game.group&&(m.move?.replaceAll('-','').includes(q)||m.item?.replaceAll('-','')===q||String(m.number)===q||'tm'+String(m.number).padStart(2,'0')===q));
}
export function researchCoverage(game){return {pokemon:Object.values(research.pokemon).filter(r=>r.games?.[game.id]).length,items:Object.values(research.item).filter(r=>r.games?.[game.id]).length,machines:machines.machines.filter(m=>m.group===game.group).length};}

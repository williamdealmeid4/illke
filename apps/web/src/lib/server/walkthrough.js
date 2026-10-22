import world from './world-navigation.json' with {type:'json'};
const normalize=s=>(s||'').toLowerCase().replace(/[éê]/g,'e').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').replace(/^(kanto|hoenn)-/,'');
const directions={up:'norte',down:'sul',left:'oeste',right:'leste',dive:'mergulhando com Dive',emerge:'voltando à superfície'};
const fieldFor=method=>method==='walk'?'land_mons':method==='surf'?'water_mons':method?.includes('rod')?'fishing_mons':method==='rock-smash'?'rock_smash_mons':null;
const knownRoutes={
  MAP_VIRIDIAN_FOREST:['MAP_VIRIDIAN_CITY','MAP_ROUTE2','MAP_ROUTE2_VIRIDIAN_FOREST_SOUTH_ENTRANCE','MAP_VIRIDIAN_FOREST'],
  MAP_ROUTE12:['MAP_LAVENDER_TOWN','MAP_ROUTE12'],
  MAP_ROUTE16:['MAP_CELADON_CITY','MAP_ROUTE16'],
};
function routeTo(nodes,destination,edition){
  const known=edition==='firered'&&knownRoutes[destination];
  if(known&&known.every(id=>nodes[id]))return {ids:known,reviewed:true};
  // Physical connections only. Do not infer adjacency from dots on a regional map.
  const incoming=new Map();
  for(const [id,node] of Object.entries(nodes))for(const exit of node.exits){
    if(!nodes[exit.to] || exit.to===id)continue;
    if(!incoming.has(exit.to))incoming.set(exit.to,[]);
    incoming.get(exit.to).push(id);
  }
  const queue=[[destination]],seen=new Set([destination]);
  while(queue.length){
    const path=queue.shift(),id=path[0],node=nodes[id];
    if(['MAP_TYPE_CITY','MAP_TYPE_TOWN'].includes(node.type))return {ids:path,reviewed:false};
    if(path.length>=14)continue;
    for(const prev of incoming.get(id)||[])if(!seen.has(prev)){seen.add(prev);queue.push([prev,...path]);}
  }
  return {ids:[destination],reviewed:false};
}
export function instructionsFor(hint,entry,game){
  const method=hint.methodId;
  const goal=entry.kind==='item'?(hint.carrier?`${hint.carrier} com ${entry.name || entry.slug}`:entry.name || entry.slug):entry.name || entry.slug;
  const steps=[];const requirements=[];
  if(hint.tile){
    const hidden=hint.method.includes('oculto');
    steps.push({title:'Procure no mapa local',text:`No local ${hint.title}, procure a marca “Alvo”. Ela aponta o quadrado do item; confira o andar antes de procurar.`});
    steps.push({title:hidden?'Revele o item oculto':'Recolha o item',text:hidden?'Use o Itemfinder para procurar o item oculto indicado. Em geral, fique ao lado do ponto e interaja olhando para ele.':'Aproxime-se da Poké Ball indicada no cenário e interaja para recolher o item.'});
  }else if(method==='walk')steps.push({title:`Procure ${goal}`,text:'Caminhe pela grama alta desta área. Em cavernas, ande no piso com encontros. Evite Repel se o nível do seu primeiro Pokémon impedir estes encontros.'});
  else if(method==='surf'){requirements.push('Um Pokémon com Surf e a liberação para usá-lo fora de batalha neste jogo.');steps.push({title:'Entre na água',text:`Use Surf na água desta área e movimente-se até encontrar ${goal}. Pescar da margem usa outra tabela de encontros.`});}
  else if(method?.includes('rod')){requirements.push(hint.method);steps.push({title:'Pesque com a vara correta',text:`Fique voltado para a água desta área e use ${hint.method.replace(/^Pescar com /,'')}. Confirme a fisgada quando o jogo pedir; outra vara pode encontrar espécies diferentes.`});}
  else if(method==='rock-smash'){requirements.push('Rock Smash e a liberação para usá-lo nesta versão.');steps.push({title:'Investigue as pedras quebráveis',text:`Use Rock Smash nas pedras quebráveis de ${hint.title}. Repita nas pedras que reaparecerem; o encontro não é garantido a cada tentativa.`});}
  else if(method?.startsWith('headbutt')){requirements.push('Headbutt.');steps.push({title:'Balance as árvores',text:`Use Headbutt nas árvores desta área. Respeite a categoria de árvore indicada na pista: ${hint.method}.`});}
  else steps.push({title:'Ação no destino',text:`Em ${hint.title}: ${hint.method}. Este método tem condições próprias; não depende apenas de caminhar na grama.`});
  if(hint.conditions?.length)requirements.push(...hint.conditions);
  if(hint.min!==undefined)steps.push({title:'Confira o encontro',text:`O registro selecionado indica nível ${hint.min}${hint.max!==hint.min?' a '+hint.max:''}${hint.chance!==null?' e '+hint.chance+'% na tabela deste encontro':''}. A taxa não é a chance de captura nem garante um encontro imediato.`});
  if(hint.carrier)steps.push({title:'Confira o item carregado',text:`Capture ${hint.carrier} e confira seu item equipado. Nesta versão, ${hint.itemChance}% dos encontros registrados com esse Pokémon podem carregar ${entry.name || entry.slug}; encontrar o Pokémon e ele carregar o item são chances separadas.`});
  if(['firered','leafgreen'].includes(game.id)&&entry.slug==='leftovers'&&hint.tile){
    requirements.push('Poké Flute obtida com Mr. Fuji após a história da Pokémon Tower.','Itemfinder obtido com o assistente de Oak no portão da Route 11 após registrar 30 espécies capturadas.');
    steps.splice(0,steps.length,
      {title:'Libere o Snorlax',text:'Vá até o Snorlax que bloqueia esta rota. Use a Poké Flute e termine o encontro, capturando-o ou derrotando-o. O item fica no lugar em que ele dormia.'},
      {title:'Fique em cima da marca',text:'Depois que o Snorlax sair, pise exatamente no quadrado marcado como “Alvo” no mapa local. Ficar ao lado e apertar o botão de interação não basta para este item.'},
      {title:'Use o Itemfinder',text:'Abra a bolsa e use o Itemfinder enquanto está em cima desse quadrado para receber Leftovers.'});
  }
  return {requirements:[...new Set(requirements)],steps};
}
export function addWalkthrough(guide,entry){
  if(!guide)return guide;
  const edition=['firered','leafgreen'].includes(guide.game.id)?'firered':guide.game.id==='emerald'?'emerald':null;
  const nodes=world.games[edition] || {},localMaps={};
  const hints=guide.hints.map(hint=>{
    const action=instructionsFor(hint,entry,guide.game);
    let matches=[];
    if(hint.tile&&hint.source){const name=hint.source.split('/maps/')[1]?.split('/')[0];matches=Object.entries(nodes).filter(([,n])=>n.name===name&&n.image);}
    else {
      const area=normalize(hint.area),field=fieldFor(hint.methodId),species=hint.carrier || entry.slug;
      matches=Object.entries(nodes).filter(([,n])=>n.image&&(area===n.area||area.startsWith(n.area+'-'))&&field&&n.wild?.[guide.game.id]?.[field]?.includes(species));
      const floor=area.match(/(?:^|-)(b\d+f|\d+f)(?:-|$)/)?.[1];
      if(floor)matches=matches.filter(([,n])=>normalize(n.name).split('-').includes(floor)||normalize(n.name).endsWith(floor));
    }
    const paths=matches.map(([id,node])=>{
      const route=routeTo(nodes,id,edition);
      const routeSteps=route.ids.map((key,index)=>{
        const current=nodes[key],previous=nodes[route.ids[index-1]];
        const exit=previous?.exits.find(e=>e.to===key);
        return {title:current.label,area:current.area,source:current.source,text:!previous?`Comece em ${current.label}.`:exit?.direction?`Saia de ${previous.label} para ${directions[exit.direction] || exit.direction} e siga para ${current.label}.`:`Em ${previous.label}, use a passagem para ${current.label}. Confira a entrada ou escada indicada no mapa do jogo.`};
      });
      localMaps[id]={id,label:node.label,image:node.image,width:node.width,height:node.height,source:node.source,zones:node.zones};
      const previous=route.ids.at(-2);
      const entries=node.exits.filter(e=>e.to===previous&&e.tile).map(e=>e.tile);
      return {mapId:id,steps:routeSteps,entries,reviewed:route.reviewed};
    });
    return {...hint,walkthrough:{...action,paths,coverage:paths.length?'local':'area',note:paths.length?'As etapas ligam áreas e passagens reais. Não calculam passos dentro de cada sala; barreiras e acesso podem depender do progresso da campanha.':'O método está registrado, mas o caminho detalhado e o mapa local desta edição ainda não foram verificados.'}};
  });
  return {...guide,target:{name:entry.name || entry.slug,slug:entry.slug,kind:entry.kind},hints,localMaps};
}

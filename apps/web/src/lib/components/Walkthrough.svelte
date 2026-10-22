<script>
 import {onMount} from 'svelte';
 import {mapFor} from '$lib/maps.js';
 import {MapPin, Map as MapIcon, ZoomIn} from '@lucide/svelte';
 let {guide,hint,hints=[],onSelect=()=>{}}=$props();
 let mounted=$state(false),mapId=$state(''),mode=$state('local'),stepIndex=$state(0),zoom=$state(false);
 onMount(()=>mounted=true);
 $effect(()=>{const id=hint?.id;mapId='';mode='local';stepIndex=0;zoom=false;});
 let path=$derived(hint?.walkthrough?.paths.find(p=>p.mapId===mapId) || hint?.walkthrough?.paths[0]);
 let local=$derived(path?guide.localMaps[path.mapId]:null);
 $effect(()=>{stepIndex=path?.steps.length || 0;});
 let regional=$derived(mapFor(guide.game,hint?.area));
 let localView=$derived(mode==='local'&&local);
 let steps=$derived([...(path?.steps || []),...(hint?.walkthrough?.steps || [])]);
 let current=$derived(steps[stepIndex] || steps[0]);
 let waypoints=$derived((path?.steps || []).map((step,index)=>({step,index,map:mapFor(guide.game,step.area)})).filter((p,index,all)=>p.map?.point&&p.map.image===regional?.image&&all.findIndex(q=>q.map?.point?.x===p.map.point.x&&q.map?.point?.y===p.map.point.y)===index));
 let markers=$derived([...new Map(hints.map(h=>[h.area,{hint:hint?.area===h.area?hint:h,map:mapFor(guide.game,h.area)}])).values()].filter(p=>p.map?.point&&p.map.image===regional?.image));
 let zone=$derived(hint?.methodId==='surf'||hint?.methodId?.includes('rod')?'water':hint?.methodId==='walk'?'grass':null);
 function chooseStep(index){stepIndex=index;mode=index>=(path?.steps.length || 0)?'local':'regional';}
</script>
<div class="walkthrough-panel">
 {#if hint}
  <div class="walkthrough-title"><MapPin size={21}/><div><h3>{guide.target?.name || 'Alvo'} em {hint.title}</h3><p>{hint.tile?'O marcador aponta o quadrado do item.':'Siga o acesso indicado e procure pelo método desta pista.'}</p></div></div>
  {#if hint.walkthrough?.requirements.length}<div class="guide-requirements"><strong>Antes de ir</strong><ul>{#each hint.walkthrough.requirements as requirement}<li>{requirement}</li>{/each}</ul></div>{/if}
  {#if (hint.walkthrough?.paths.length || 0)>1}<label class="local-map-picker">Mapa local<select disabled={!mounted} bind:value={mapId}><option value="">Escolher área / andar</option>{#each hint.walkthrough.paths as option}<option value={option.mapId}>{guide.localMaps[option.mapId].label}</option>{/each}</select><small>Há mais de um mapa com registros nesta área. Confira o andar da pista.</small></label>{/if}
  <div class="walkthrough-body">
   <div class="map-panel guide-map">
    <div class="map-toolbar"><div class="map-view-buttons" role="group" aria-label="Visualização do caminho"><button disabled={!mounted||!local} class:chosen={!!localView} onclick={()=>mode='local'}>Mapa local</button><button disabled={!mounted||!regional} class:chosen={!localView} onclick={()=>mode='regional'}>Mapa regional</button></div><button disabled={!mounted} class="icon-button" aria-label={zoom?'Reduzir mapa':'Ampliar mapa'} onclick={()=>zoom=!zoom}><ZoomIn size={17}/></button></div>
    {#if localView}
     <div class="map-scroll local-map-scroll"><div class="local-scene" class:zoom style={`aspect-ratio:${local.width}/${local.height}`}>
      <img src={local.image} alt={'Mapa local de '+local.label+' com a pista de '+guide.target.name} width={local.width*16} height={local.height*16}/>
      {#if zone&&local.zones?.[zone]?.length}<svg class="encounter-zones" viewBox={`0 0 ${local.width} ${local.height}`} aria-label={zone==='grass'?'Grama para procurar encontros':'Água para procurar encontros'}>{#each local.zones[zone] as [x,y,width]}<rect {x} {y} {width} height="1"/>{/each}</svg>{/if}
      {#each path.entries as entry,i}<span class="local-entry" style={`left:${(entry.x+.5)/local.width*100}%;top:${(entry.y+.5)/local.height*100}%`} title="Passagem de entrada"><span>{i===0?'Entrada':'Entrada alternativa'}</span></span>{/each}
      {#if hint.tile}<span class="local-target" style={`left:${(hint.tile.x+.5)/local.width*100}%;top:${(hint.tile.y+.5)/local.height*100}%`}><MapPin size={25} fill="currentColor"/><span>Alvo</span></span>{/if}
     </div></div>
     <p class="map-legend">{#if hint.tile}<span class="legend-target"></span>Quadrado do item{:else if zone&&local.zones?.[zone]?.length}<span class="legend-zone"></span>{zone==='grass'?'Grama da área. O encontro ocorre ao caminhar.':'Água da área. Use o método indicado.'}{:else}O encontro está registrado neste mapa; não há um quadrado fixo de aparição.{/if}</p>
     <p class="help">Cenário reconstruído com os tiles do jogo. Personagens e objetos móveis não são exibidos. <a href={local.source} class="text-link">Fonte do mapa local</a></p>
    {:else if regional}
     <div class="map-scroll"><div class="region-map" class:zoom style={`aspect-ratio:${regional.width}/${regional.height}`}>
      <img src={regional.image} alt={'Caminho regional para '+hint.title} width={regional.width} height={regional.height}/>
      {#if waypoints.length>1}<svg class="regional-route" viewBox={`0 0 ${regional.width} ${regional.height}`} aria-label="Sequência de áreas do caminho"><polyline points={waypoints.map(p=>p.map.point.x+','+p.map.point.y).join(' ')}/></svg>{/if}
      {#each waypoints as waypoint}<button disabled={!mounted} class="route-waypoint" class:chosen={stepIndex===waypoint.index} style={`left:${waypoint.map.point.x/regional.width*100}%;top:${waypoint.map.point.y/regional.height*100}%`} aria-label={'Etapa '+(waypoint.index+1)+': '+waypoint.step.title} onclick={()=>chooseStep(waypoint.index)}>{waypoint.index+1}</button>{/each}
      {#each markers as marker}<button disabled={!mounted} class="map-pin" class:selected={hint.id===marker.hint.id} style={`left:${marker.map.point.x/regional.width*100}%;top:${marker.map.point.y/regional.height*100}%`} title={marker.hint.title+' — '+marker.hint.method} aria-label={'Mostrar pista: '+marker.hint.title+' — '+marker.hint.method} onclick={()=>onSelect(marker.hint.id)}><MapPin size={21} fill="currentColor"/></button>{/each}
     </div></div>
     <p class="help">{#if regional.illustration}{regional.label}. Não há coordenadas verificadas para marcar este destino. <a class="text-link" href={regional.source}>Fonte</a>.{:else}A linha liga as áreas do roteiro; não representa o caminho dentro de cada rota.{/if}</p>
    {:else}<div class="map-missing"><MapIcon size={36}/><h3>Mapa local ainda sem cobertura</h3><p>Use as instruções ao lado. Ainda não há coordenadas verificadas para desenhar o caminho nesta versão.</p></div>{/if}
    <div class="active-hint" aria-live="polite"><strong>{hint.title} · {current?.title || hint.method}</strong><p>{current?.text || hint.method}</p>{#if hint.tile}<p class="help">Referência do alvo em {hint.title}: coluna {hint.tile.x}, linha {hint.tile.y}. <a href={hint.source} class="text-link">Conferir evento</a>.</p>{/if}</div>
   </div>
   <div class="walkthrough-instructions"><h4>Como chegar e o que fazer</h4><ol>{#each steps as step,i}<li><button disabled={!mounted} class:current={stepIndex===i} aria-current={stepIndex===i?'step':undefined} onclick={()=>chooseStep(i)}><span>{i+1}</span><div><strong>{step.title}</strong><p>{step.text}</p></div></button></li>{/each}</ol><p class="help">{hint.walkthrough?.note}</p></div>
  </div>
 {:else}<div class="map-missing"><MapIcon size={36}/><h3>Nenhum destino confirmado</h3><p>Selecione outra pista ou outro jogo. Um mapa sem local confirmado não indica onde encontrar este alvo.</p></div>{/if}
</div>

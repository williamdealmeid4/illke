<script>
  import { onMount } from 'svelte';
  import { library, createTeam, saveTeam, removeTeam, exportBackup, importBackup, downloadJson } from '$lib/team-store.js';
  let teams = $state([]), message = $state(''), archived = $state(false), busy = $state(false);
  async function refresh() { try { teams = (await library()).teams; } catch(e) { message = e.message; } }
  onMount(() => { refresh(); });
  async function action(fn) { busy=true; message=''; try { await fn(); await refresh(); } catch(e) { message=e.message; } finally { busy=false; } }
  async function readBackup(event) {
    const file=event.currentTarget.files[0]; if(!file) return;
    await action(async()=>{ if(file.size>10*1024*1024) throw Error('Backup limitado a 10 MB.'); const count=await importBackup(JSON.parse(await file.text())); message=count+' equipes importadas como cópias.'; });
    event.target.value='';
  }
</script>
<svelte:head><title>Minhas equipes — illke</title></svelte:head>
<div class="page-header split"><div><h1>Minhas equipes</h1><p>Suas equipes neste navegador. Exporte um backup para guardar em outro lugar.</p></div><a class="button" href="/builder?new=1">Criar equipe</a></div>
<div class="actions"><button class="button secondary" onclick={()=>action(async()=>downloadJson(await exportBackup(),'illke-backup.json'))} disabled={busy}>Exportar backup</button><label class="button secondary">Importar backup<input class="sr-only" type="file" accept="application/json,.json" onchange={readBackup} disabled={busy}/></label><button class="text-link" onclick={()=>archived=!archived}>{archived?'Ver ativas':'Ver arquivadas'}</button></div>
{#if message}<p class="notice" role="status">{message}</p>{/if}
{#each teams.filter(t=>t.archived===archived) as team (team.id)}
  <article class="content-panel"><div class="split"><h2><a href={'/builder?team='+team.id}>{team.name}</a></h2><span class="help">{team.context_id} · {team.members.length} integrantes</span></div>
  <p>{team.members.map(m=>m.pokemon).join(' · ')}</p>
  <label>Nome da equipe<input value={team.name} maxlength="100" onchange={e=>action(()=>saveTeam(team.id,{name:e.currentTarget.value},'Renomear equipe'))}/></label>
  <label>Anotações da equipe<textarea value={team.notes} maxlength="20000" onchange={e=>action(()=>saveTeam(team.id,{notes:e.currentTarget.value}))}></textarea></label>
  <div class="actions"><a class="button" href={'/builder?team='+team.id}>Editar equipe</a><button class="button secondary" disabled={busy} onclick={()=>action(()=>createTeam({...team,name:(team.name+' — cópia').slice(0,100),history:[],evaluations:[]}))}>Duplicar</button><button class="button secondary" disabled={busy} onclick={()=>action(()=>saveTeam(team.id,{archived:!team.archived}))}>{team.archived?'Restaurar':'Arquivar'}</button><button class="danger-link" disabled={busy} onclick={()=>{if(confirm('Excluir esta equipe? Exporte um backup para preservá-la.')) action(()=>removeTeam(team.id));}}>Excluir</button></div>
  <p class="help">Atualizada em {new Date(team.updated_at).toLocaleString('pt-BR')}</p></article>
{:else}<div class="empty-panel"><h2>{archived?'Nenhuma equipe arquivada':'Sua biblioteca está pronta para começar'}</h2><p>Monte uma equipe no editor ou importe um backup.</p><a class="button" href="/builder?new=1">Abrir editor</a></div>{/each}

<script>
  import { onMount } from 'svelte';
  import { sprite, roles } from '$lib/api.js';
  import { library, createTeam, saveTeam, removeTeam, exportBackup, importBackup, downloadJson } from '$lib/team-store.js';
  import { Plus, Copy, Archive, Trash2, Download, Upload, Swords } from '@lucide/svelte';
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
<div class="page-header split">
  <div>
    <div class="breadcrumbs"><a href="/">illke</a><span>/</span>Minhas equipes</div>
    <h1>Minhas equipes</h1>
    <p>Suas equipes salvas neste navegador. Exporte um backup para guardar em outro dispositivo.</p>
  </div>
  <a class="button" href="/builder?new=1"><Plus size={16}/> Criar equipe</a>
</div>
<div class="toolbar team-library-toolbar">
  <div class="actions" style="margin:0">
    <button class="button secondary small" onclick={()=>action(async()=>downloadJson(await exportBackup(),'illke-backup.json'))} disabled={busy}>Exportar backup</button>
    <label class="button secondary small">Importar backup<input class="sr-only" type="file" accept="application/json,.json" onchange={readBackup} disabled={busy}/></label>
  </div>
  <button class="text-link" onclick={()=>archived=!archived}>{archived?'Ver ativas':'Ver arquivadas'}</button>
</div>
{#if message}<p class="notice" role="status">{message}</p>{/if}
<div class="team-library-list">
{#each teams.filter(t=>t.archived===archived) as team (team.id)}
  <article class="content-panel team-card">
    <div class="team-card-header">
      <div>
        <div class="team-card-badges">
          <span class="chip">{team.context_id.toUpperCase()}</span>
          <span class="help">{team.members.length} / 6 integrantes</span>
          <span class="help">· Atualizada em {new Date(team.updated_at).toLocaleString('pt-BR')}</span>
        </div>
        <h2><a href={'/builder?team='+team.id}>{team.name}</a></h2>
      </div>
      <a class="button small" href={'/builder?team='+team.id}>Editar equipe</a>
    </div>

    <div class="team-roster-grid" aria-label="Integrantes da equipe">
      {#each Array.from({ length: 6 }, (_, i) => team.members[i]) as member, slot}
        {#if member}
          <a class="team-roster-slot filled" href={'/builder?team='+team.id}>
            <span class="slot-index">0{slot + 1}</span>
            <img src={sprite(member.pokemon)} alt="" width="64" height="64" loading="lazy"/>
            <strong>{member.pokemon}</strong>
            <small>{member.item || roles[member.role] || 'Sem item'}</small>
          </a>
        {:else}
          <a class="team-roster-slot empty" href={'/builder?team='+team.id}>
            <span class="slot-index">0{slot + 1}</span>
            <Plus size={18}/>
            <small>Vaga livre</small>
          </a>
        {/if}
      {/each}
    </div>
    <p class="sr-only">{team.members.map(m=>m.pokemon).join(' · ')}</p>

    <div class="team-edit-grid">
      <label class="stacked-field">
        <span>Nome da equipe</span>
        <input value={team.name} maxlength="100" onchange={e=>action(()=>saveTeam(team.id,{name:e.currentTarget.value},'Renomear equipe'))}/>
      </label>
      <label class="stacked-field">
        <span>Anotações da equipe</span>
        <textarea rows="2" placeholder="Estratégia geral, leads, wincons ou observações de torneio…" value={team.notes} maxlength="20000" onchange={e=>action(()=>saveTeam(team.id,{notes:e.currentTarget.value}))}></textarea>
      </label>
    </div>

    <div class="team-card-actions">
      <div class="actions" style="margin:0">
        <button class="button secondary small" disabled={busy} onclick={()=>action(()=>createTeam({...team,name:(team.name+' — cópia').slice(0,100),history:[],evaluations:[]}))}>Duplicar</button>
        <button class="button secondary small" disabled={busy} onclick={()=>action(()=>saveTeam(team.id,{archived:!team.archived}))}>{team.archived?'Restaurar':'Arquivar'}</button>
      </div>
      <button class="danger-link" disabled={busy} onclick={()=>{if(confirm('Excluir esta equipe? Exporte um backup para preservá-la.')) action(()=>removeTeam(team.id));}}>Excluir</button>
    </div>
  </article>
{:else}
  <div class="empty-panel">
    <h2>{archived?'Nenhuma equipe arquivada':'Sua biblioteca está pronta para começar'}</h2>
    <p>Monte uma equipe no editor ou importe um backup.</p>
    <a class="button" href="/builder?new=1">Abrir editor</a>
  </div>
{/each}
</div>

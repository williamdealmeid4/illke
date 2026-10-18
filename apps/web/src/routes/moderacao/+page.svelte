<script>
  import { onMount } from 'svelte';
  import { mutate } from '$lib/api.js';
  let authorized=$state(false), token=$state(''), reports=$state(null), message=$state(''), busy=$state(false), page=$state(1);
  async function load() { const response=await fetch('/api/v1/moderation/reports?page='+page); if(!response.ok){authorized=false;throw Error('Sua sessão de moderação expirou.');} reports=await response.json(); }
  onMount(()=>{fetch('/api/v1/moderation/session').then(r=>r.json()).then(async s=>{authorized=s.authorized;if(authorized)await load();}).catch(e=>message=e.message);});
  async function action(fn){busy=true;message='';try{await fn();}catch(e){message=e.message;}finally{busy=false;token='';}}
  async function login(){await action(async()=>{await mutate('/moderation/session',{token});authorized=true;await load();});}
  async function resolveReport(id,type){await action(async()=>{const result=await mutate('/moderation/reports/'+id,{action:type},'PATCH');message=result.message;await load();});}
</script>
<svelte:head><title>Moderação — illke</title></svelte:head>
<div class="page-header"><h1>Moderação</h1><p>Atendimento de denúncias. As ações administrativas ficam registradas.</p></div>
{#if message}<p class="notice" role="status">{message}</p>{/if}
{#if !authorized}<form class="content-panel" onsubmit={e=>{e.preventDefault();login();}}><h2>Acesso administrativo</h2><p>A sessão expira em 30 minutos.</p><label>Credencial de moderação<input type="password" bind:value={token} autocomplete="current-password" required maxlength="500"/></label><div class="actions"><button class="button" disabled={busy}>Entrar na moderação</button></div></form>
{:else}<button class="button secondary" onclick={()=>action(async()=>{await mutate('/moderation/session',undefined,'DELETE');authorized=false;})}>Encerrar sessão</button>
{#each reports?.data || [] as report}<article class="content-panel"><h2>{report.topic_title}</h2><p>{report.reason}</p><p class="help">{new Date(report.created_at).toLocaleString('pt-BR')} · {report.hidden?'Oculto':report.locked?'Fechado':'Aberto'}</p><div class="actions">{#if !report.hidden}<a class="button secondary" href={'/comunidade/'+report.topic_id}>Ver discussão e respostas</a>{/if}<button class="button secondary" disabled={busy} onclick={()=>resolveReport(report.id,'resolve')}>Resolver sem alteração</button><button class="button secondary" disabled={busy} onclick={()=>resolveReport(report.id,'lock')}>Fechar tópico e resolver</button><button class="danger-link" disabled={busy} onclick={()=>resolveReport(report.id,'hide')}>Ocultar tópico e resolver</button></div></article>{:else}<div class="empty-panel"><h2>Nenhuma denúncia pendente</h2></div>{/each}
<div class="actions"><button class="button secondary" disabled={page<=1||busy} onclick={()=>{page--;action(load);}}>Anterior</button><span>Página {page}</span><button class="button secondary" disabled={!reports?.next_page_url||busy} onclick={()=>{page++;action(load);}}>Próxima</button></div>{/if}

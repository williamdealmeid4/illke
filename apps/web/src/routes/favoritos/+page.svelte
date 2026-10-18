<script>
  import { onMount } from 'svelte';
  import { library, toggleFavorite } from '$lib/team-store.js';
  import BuildList from '$lib/components/BuildList.svelte';
  let ids=$state([]), builds=$state([]), message=$state(''), offset=$state(0), loading=$state(true);
  async function load() {
    loading=true;
    try { ids=(await library()).favorites; if(!ids.length){builds=[];return;} const query=new URLSearchParams(); ids.slice(offset,offset+100).forEach(id=>query.append('ids[]',id)); const response=await fetch('/api/v1/builds?'+query); if(!response.ok) throw Error('Não foi possível consultar os favoritos.'); builds=(await response.json()).data; }
    catch(e){message=e.message;}finally{loading=false;}
  }
  onMount(()=>{load();});
  async function remove(id){try{await toggleFavorite(id);await load();}catch(e){message=e.message;}}
</script>
<svelte:head><title>Favoritos — illke</title></svelte:head>
<div class="page-header"><h1>Favoritos</h1><p>Referências guardadas neste navegador. Seus favoritos também entram no backup da biblioteca.</p></div>
{#if message}<p class="notice" role="status">{message}</p>{/if}
{#if loading}<p role="status">Carregando favoritos…</p>{:else if !ids.length}<div class="empty-panel"><h2>Nenhuma build favoritada</h2><p>Abra uma referência e escolha Favoritar.</p><a class="button" href="/builds">Explorar builds</a></div>{:else}
{#each builds as build}<div class="content-panel"><BuildList builds={[build]}/><button class="danger-link" onclick={()=>remove(build.public_id)}>Remover favorito de {build.pokemon}</button></div>{/each}
{#if builds.length<ids.slice(offset,offset+100).length}<p class="notice">Algumas referências não estão mais disponíveis. O backup preserva seus identificadores.</p>{/if}
<div class="actions"><button class="button secondary" disabled={offset===0} onclick={()=>{offset-=100;load();}}>Anterior</button><span>{offset+1}–{Math.min(offset+100,ids.length)} de {ids.length}</span><button class="button secondary" disabled={offset+100>=ids.length} onclick={()=>{offset+=100;load();}}>Próxima</button></div>{/if}

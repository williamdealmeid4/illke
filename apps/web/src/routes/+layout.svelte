<script>
  import "../app.css";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { Menu, X, Sun, Moon, Plus, Gamepad2, Users, Heart, Calculator, Package, Swords, Sparkles, Home, Library } from "@lucide/svelte";
  import { onMount } from "svelte";
  import { games, consoles } from "$lib/games.js";
  import Opening from "$lib/components/Opening.svelte";
  import ConsoleIcon from "$lib/components/ConsoleIcon.svelte";
  import PokedexIcon from "$lib/components/PokedexIcon.svelte";
  let { children, data } = $props();
  let mounted = $state(false);
  let open = $state(false);
  let light = $state(false);
  onMount(() => {
    mounted = true;
    try { light = localStorage.getItem("illke-theme") === "light"; } catch {}
  });
  function theme() {
    light = !light;
    try { localStorage.setItem("illke-theme", light ? "light" : "dark"); } catch {}
  }
  function changeGame(event) {
    open = false;
    const target = new URL(page.url);
    const id = event.currentTarget.value;
    target.searchParams.set('game', id);
    target.searchParams.delete('page');
    if (target.pathname.startsWith('/jogos/')) target.pathname='/jogos/'+id;
    goto(target.pathname+target.search+target.hash, {invalidateAll:true});
  }
  const nav = [
    ["/jogos", "Jogos e mapas", Gamepad2],
    ["/pokedex", "Pokédex", PokedexIcon],
    ["/builds", "Builds", Swords],
    ['/equipes', 'Minhas equipes', Users],
    ["/itens", "Itens", Package],
    ["/golpes", "Golpes", Swords],
    ["/habilidades", "Habilidades", Sparkles],
    ["/comunidade", "Comunidade", Users],
  ];
</script>

<svelte:window onkeydown={event=>{if(event.key==='Escape') open=false;}}/>
{#if data.showIntro}<Opening/>{/if}
<div class="app" class:light>
  <a href="#content" class="skip-link">Ir para o conteúdo</a>
  <header class="workspace-topbar">
    <a class="brand" href="/" aria-label="illke início"><span class="brand-mark"><span></span></span>illke</a>
    <span class="current-location">{nav.find(([href])=>page.url.pathname.startsWith(href))?.[1] || 'Início'}</span>
    <div class="header-actions"><button class="icon-button theme-button" disabled={!mounted} onclick={theme} aria-label={light ? "Ativar tema escuro" : "Ativar tema claro"}>{#if light}<Moon size={18}/>{:else}<Sun size={18}/>{/if}</button><a class="button small" href="/builder"><Plus size={16}/> Criar equipe</a><button class="icon-button menu-toggle" disabled={!mounted} onclick={()=>open=!open} aria-controls="workspace-sidebar" aria-expanded={open} aria-label={open ? "Fechar menu" : "Abrir menu"}>{#if open}<X size={20}/>{:else}<Menu size={20}/>{/if}</button></div>
  </header>
  {#if open}<button class="workspace-backdrop" aria-label="Fechar navegação" onclick={()=>open=false}></button>{/if}
  <aside id="workspace-sidebar" class="workspace-sidebar" class:expanded={open}>
    <nav aria-label="Principal"><a href="/" class:active={page.url.pathname==='/'} onclick={()=>open=false}><Home size={18}/>Início</a>{#each nav as [href,label,Icon]}<a {href} class:active={page.url.pathname.startsWith(href)} aria-current={page.url.pathname.startsWith(href)?'page':undefined} onclick={()=>open=false}><Icon size={18}/>{label}</a>{/each}</nav>
    <form action={page.url.pathname} class="sidebar-game" onsubmit={event=>{event.preventDefault();open=false;}}>
      <div class="sidebar-game-title"><ConsoleIcon platform={data.selectedGame?.consoles[0] || 'gbc'} size={40}/><label for="current-game">Jogo selecionado</label></div>
      <select disabled={!mounted} id="current-game" name="game" value={data.selectedGame?.id || ''} onchange={changeGame}><option value="" disabled>Selecionar jogo</option>{#each games as game}<option value={game.id}>{game.name} — {game.consoles.map(c=>consoles[c]).join(' / ')}</option>{/each}</select>
      {#if data.selectedGame}<a href={'/jogos/'+data.selectedGame.id+'?game='+data.selectedGame.id}>Mapa e locais de encontro</a>{/if}
    </form>
    <nav aria-label="Ferramentas"><a href="/favoritos" onclick={()=>open=false}><Heart size={18}/>Favoritos</a><a href="/calculos" onclick={()=>open=false}><Calculator size={18}/>Calculadora de dano</a><a href="/wiki" onclick={()=>open=false}><Library size={18}/>Guias</a></nav>
    <a class="sidebar-discord" href={data.discordInviteUrl || '/discord'}>Bot do Discord</a>
  </aside>
  <main id="content" class="workspace-content">{@render children()}</main>
  <footer>
    <a class="brand" href="/">illke</a>
    <nav aria-label="Rodapé">
      <a href="/cobertura">Cobertura</a><a href="/favoritos">Favoritos</a><a href="/calculos">Calculadora</a><a href="/moderacao">Moderação</a><a href="/fontes">Fontes e créditos</a
      ><a href="/wiki">Guias</a>
    </nav>
    <small
      >Projeto independente de fãs. Pokémon pertence aos respectivos titulares.</small
    >
  </footer>
</div>

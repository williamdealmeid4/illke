<script>
  import "../app.css";
  import { page } from "$app/state";
  import {
    Search,
    Menu,
    X,
    ChevronRight,
    Swords,
    Users,
    BookOpen,
    Layers,
    Sun,
    Moon,
    Plus,
    ChevronDown,
  } from "@lucide/svelte";
  import { onMount } from "svelte";
  let { children, data } = $props();
  let open = $state(false);
  let light = $state(false);
  onMount(() => {
    light = localStorage.getItem("illke-theme") === "light";
  });
  function theme() {
    light = !light;
    localStorage.setItem("illke-theme", light ? "light" : "dark");
  }
  const nav = [
    ["/pokedex", "Pokédex"],
    ["/builds", "Builds"],
    ["/itens", "Itens"],
    ["/golpes", "Golpes"],
    ["/comunidade", "Comunidade"],
  ];
</script>

<div class="app" class:light>
  <a href="#content" class="skip-link">Ir para o conteúdo</a>
  <header class="header">
    <a class="brand" href="/" aria-label="illke início"
      ><span class="brand-mark"><span></span></span>illke</a
    >
    <nav aria-label="Principal">
      {#each nav as [href, label]}<a
          {href}
          class:active={page.url.pathname.startsWith(href)}>{label}</a
        >{/each}
    </nav>
    <div class="header-actions">
      <a
        class="discord-link"
        href={data.discordInviteUrl || "/discord"}
        rel="noreferrer">Bot do Discord</a
      ><button
        class="icon-button theme-button"
        onclick={theme}
        aria-label={light ? "Ativar tema escuro" : "Ativar tema claro"}
        >{#if light}<Moon size={17} />{:else}<Sun size={17} />{/if}</button
      ><a class="button small" href="/builder"
        ><Plus size={16} /> Criar equipe</a
      ><button
        class="icon-button mobile-only"
        onclick={() => (open = !open)}
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        >{#if open}<X size={20} />{:else}<Menu size={20} />{/if}</button
      >
    </div>
  </header>
  {#if open}<nav class="mobile-nav" aria-label="Menu móvel">
      {#each nav as [href, label]}<a {href} onclick={() => (open = false)}
          >{label}</a
        >{/each}
    </nav>{/if}
  <main id="content">{@render children()}</main>
  <footer>
    <a class="brand" href="/">illke</a>
    <nav aria-label="Rodapé">
      <a href="/cobertura">Cobertura</a><a href="/fontes">Fontes e créditos</a
      ><a href="/wiki">Guias</a>
    </nav>
    <small
      >Projeto independente de fãs. Pokémon pertence aos respectivos titulares.</small
    >
  </footer>
</div>

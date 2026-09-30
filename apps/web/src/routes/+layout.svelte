<script>
 import '../app.css';
 import { page } from '$app/state';
 import { Search, Menu, ArrowUpRight, Sun, Moon, X, BookOpen, Layers, Wrench, Users } from '@lucide/svelte';
 let open=$state(false);let light=$state(false);
 const nav=[['/pokedex','Pokédex'],['/itens','Itens'],['/builds','Builds'],['/wiki','Wiki'],['/comunidade','Comunidade']];
 let { children }=$props();
</script>
<div class:light class="app">
 <header class="header"><a class="brand" href="/" aria-label="illke — início">illke<span class="brand-dot"></span></a>
  <nav aria-label="Principal">{#each nav as [href,label]}<a {href} class:active={page.url.pathname.startsWith(href)}>{label}</a>{/each}</nav>
  <div class="header-actions"><a href="/builder" class="button small">Criar build <ArrowUpRight size={15}/></a><button class="icon-button" onclick={()=>light=!light} aria-label={light?'Ativar tema escuro':'Ativar tema claro'}>{#if light}<Moon size={18}/>{:else}<Sun size={18}/>{/if}</button><button class="icon-button mobile-only" onclick={()=>open=!open} aria-label="Abrir navegação">{#if open}<X size={20}/>{:else}<Menu size={20}/>{/if}</button></div>
 </header>
 {#if open}<nav class="mobile-nav" aria-label="Navegação móvel">{#each nav as [href,label]}<a {href} onclick={()=>open=false}>{label}</a>{/each}<a href="/conta">Minha conta</a></nav>{/if}
 <main>{@render children()}</main>
 <footer><a class="brand" href="/">illke<span class="brand-dot"></span></a><p>Catálogo, estratégia e comunidade Pokémon.</p><div><a href="/cobertura">Cobertura dos dados</a><a href="/fontes">Fontes e créditos</a><a href="/conta">Minha conta</a></div><small>Projeto independente. Pokémon pertence aos respectivos titulares.</small></footer>
</div>

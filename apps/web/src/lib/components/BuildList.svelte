<script>
  import MoveChip from "./MoveChip.svelte";
  import EntityIcon from "./EntityIcon.svelte";
  import { sprite, roles } from "$lib/api.js";
  let { builds = [] } = $props();
</script>

{#if !builds.length}<div class="empty-panel">
    <h3>Nenhuma build neste recorte</h3>
    <p>
      Tente outro Pokémon ou formato. Você também pode criar sua própria build.
    </p>
    <a class="text-link" href="/builder">Abrir builder</a>
  </div>{:else}<div class="build-list">
    {#each builds as build}<article class="build-row">
        <img
          src={sprite(build.pokemon)}
          alt={build.pokemon}
          width="80"
          height="80"
          loading="lazy"
        />
        <div>
          <h3>
            <a href={"/builds/" + build.public_id}
              >{build.pokemon} <span class="muted">/ {build.name}</span></a
            >
          </h3>
          <p>
            {roles[build.configuration.role] || build.configuration.role} · {#if build.configuration.item}<EntityIcon
                kind="item"
                name={build.configuration.item}
                size={24}
              />{/if}{build.configuration.item || "Sem item"} · {build
              .configuration.nature}
          </p>
          <div>
            {#each build.configuration.moves as move}<MoveChip
                name={move}
              />{/each}
          </div>
          <span class="help"
            >{build.source_name || build.author_name || "Comunidade"} · {build.context_id}
            · {build.legality === "legal"
              ? "Conjunto legal no simulador"
              : "Requer revisão"}{#if build.votes}
              · {build.votes} votos{/if}</span
          >
        </div>
        <a class="button secondary small" href={"/builds/" + build.public_id}
          >Ver build</a
        >
      </article>{/each}
  </div>{/if}

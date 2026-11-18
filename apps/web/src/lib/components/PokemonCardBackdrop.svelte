<script>
  import TypeIcon from './TypeIcon.svelte';
  let { types = ['normal'] } = $props();
  let list = $derived(types?.length ? types.slice(0, 2) : ['normal']);
</script>

<div class="pokemon-card-backdrop" aria-hidden="true">
  {#each list as type}
    <span class="pokemon-card-element" data-type={String(type).toLowerCase()}>
      <TypeIcon {type} size={112} />
    </span>
  {/each}
</div>

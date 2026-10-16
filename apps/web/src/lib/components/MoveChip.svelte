<script>
  import TypeIcon from "./TypeIcon.svelte";
  import { moveIconData } from "$lib/icons.js";
  let { name } = $props();
  let data = $derived(moveIconData(name));
</script>

<span class="chip move-chip"
  >{#if data}<TypeIcon type={data.type} size={14} />{/if}{name}</span
>

<script>
  import TypeIcon from "./TypeIcon.svelte";
  import { moveIconData } from "$lib/icons.js";
  let { name } = $props();
  let data = $derived(moveIconData(name));
</script>

<a class="chip move-chip" href={'/golpe/'+name.toLowerCase().replaceAll(' ','-')}
  >{#if data}<TypeIcon type={data.type} size={14} />{/if}{name}</a
>

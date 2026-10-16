<script>
  import { uiIcons } from "$lib/icons.js";
  let { type, size = 18 } = $props();
  let source = $derived(uiIcons.types[String(type || "").toLowerCase()]);
</script>

{#if source}<img
    class="type-icon"
    style={"width:" + size + "px;height:" + size + "px"}
    src={source}
    alt=""
    width={size}
    height={size}
    loading="lazy"
    aria-hidden="true"
  />{/if}

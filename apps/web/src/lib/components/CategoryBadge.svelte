<script>
  import { uiIcons, categoryLabels } from "$lib/icons.js";
  let { category } = $props();
  let key = $derived(String(category || "").toLowerCase());
</script>

<span class="category-badge" title="Categoria do golpe"
  >{#if uiIcons.categories[key]}<img
      class="category-icon"
      src={uiIcons.categories[key]}
      alt=""
      width="32"
      height="14"
      loading="lazy"
    />{/if}<span>{categoryLabels[key] || category}</span></span
>

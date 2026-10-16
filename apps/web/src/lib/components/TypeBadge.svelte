<script>
  import TypeIcon from "./TypeIcon.svelte";
  let { type } = $props();
</script>

<span class="type" data-type={String(type || "").toLowerCase()}
  ><TypeIcon {type} size={14} />{type}</span
>

<script>
  import { Box, CircleHelp, Swords } from "@lucide/svelte";
  import AbilitySymbol from "./AbilitySymbol.svelte";
  import { itemIconIndex, uiIcons } from "$lib/icons.js";
  import TypeIcon from "./TypeIcon.svelte";
  let {
    entry = null,
    kind = entry?.kind,
    name = entry?.name || "",
    size = 40,
    decorative = true,
  } = $props();
  let source = $derived(
    entry?.image?.url ||
      (kind === "pokemon" ? entry?.attributes?.sprites?.artwork?.url : null),
  );
  let failed = $state(false);
  let itemIndex = $derived(
    kind === "item" ? itemIconIndex(name) || itemIconIndex(entry?.slug) : null,
  );
  let Fallback = $derived(
    { item: Box, move: Swords }[kind] || CircleHelp,
  );
  let hasMoveType = $derived(
    kind === "move" && uiIcons.types[entry?.attributes?.type],
  );
  let tooltip = $derived(
    source && !failed
      ? name
      : itemIndex
        ? name + " · sprite Showdown"
        : hasMoveType
          ? "Tipo do golpe: " + entry.attributes.type
          : kind === "ability"
            ? "Habilidade · ícone de interface"
            : "Sem sprite disponível · ícone de interface",
  );
  $effect(() => {
    source;
    failed = false;
  });
</script>

<span
  class="entity-icon"
  class:semantic={!source && !itemIndex && !hasMoveType}
  style={"--entity-size:" + size + "px"}
  title={tooltip}
  role={decorative ? undefined : "img"}
  aria-label={decorative ? undefined : tooltip}
  aria-hidden={decorative ? "true" : undefined}
>
  {#if source && !failed}<img
      class="entity-image"
      src={source}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onerror={() => (failed = true)}
    />
  {:else if itemIndex}<span
      class="item-sheet-icon"
      style={"background-image:url(" +
        uiIcons.item_sheet +
        ");background-position:-" +
        (itemIndex % 16) * 24 +
        "px -" +
        Math.floor(itemIndex / 16) * 24 +
        "px;"}
    ></span>
  {:else if hasMoveType}<TypeIcon
      type={entry.attributes.type}
      size={Math.min(size, 32)}
    />
  {:else if kind === "ability"}<AbilitySymbol entry={entry || { name }} size={Math.min(size - 8, 28)} />
  {:else}<Fallback size={Math.min(size - 8, 24)} strokeWidth={1.5} />{/if}
</span>

<script>
  import { Box, Sparkles, CircleHelp, Swords } from "@lucide/svelte";
  import { itemIconIndex, uiIcons } from "$lib/icons.js";
  import TypeIcon from "./TypeIcon.svelte";
  import AbilityIcon from './AbilityIcon.svelte';
  let {
    entry = null,
    kind = entry?.kind,
    name = entry?.name || "",
    size = 40,
    decorative = true,
    variant = 'sprite',
  } = $props();
  let source = $derived(
    (kind === 'pokemon' ? '/media/pokemon/'+encodeURIComponent(entry?.name || name)+(variant==='artwork'?'?style=artwork':'') : null) || entry?.image?.url ||
      (kind === "pokemon" ? entry?.attributes?.sprites?.artwork?.url : null),
  );
  let failed = $state(false);
  let normalized = $state('');
  async function normalize(event) {
    const image=event.currentTarget;
    if(kind!=='pokemon' || image.src.startsWith('data:')) return;
    try {
      const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
      const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
      let left=canvas.width,top=canvas.height,right=0,bottom=0;
      for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(pixels[(y*canvas.width+x)*4+3]>16){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
      if(right<=left||bottom<=top)return;
      const cropped=document.createElement('canvas');cropped.width=right-left+1;cropped.height=bottom-top+1;
      cropped.getContext('2d').drawImage(canvas,left,top,cropped.width,cropped.height,0,0,cropped.width,cropped.height);
      normalized=cropped.toDataURL();
    } catch { /* Display the original when pixel access is unavailable. */ }
  }
  let itemIndex = $derived(
    kind === "item" ? itemIconIndex(name) || itemIconIndex(entry?.slug) : null,
  );
  let Fallback = $derived(
    { ability: Sparkles, item: Box, move: Swords }[kind] || CircleHelp,
  );
  let hasMoveType = $derived(
    kind === "move" && uiIcons.types[entry?.attributes?.type],
  );
  let tooltip = $derived(
    source && !failed
      ? (kind === 'pokemon' && !entry?.image && !entry?.attributes?.sprites?.artwork ? name+' · imagem de referência da espécie' : name)
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
    normalized = '';
  });
</script>

<span
  class="entity-icon"
  class:pixel-sprite={kind === 'pokemon' && variant === 'sprite'}
  class:semantic={!source && !itemIndex && !hasMoveType}
  style={"--entity-size:" + size + "px"}
  title={tooltip}
  role={decorative ? undefined : "img"}
  aria-label={decorative ? undefined : tooltip}
  aria-hidden={decorative ? "true" : undefined}
>
  {#if source && !failed}<img
      class="entity-image"
      src={normalized || source}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onerror={() => (failed = true)}
      onload={normalize}
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
  {:else if kind === 'ability'}<AbilityIcon effect={entry?.attributes?.effect || ''} size={Math.min(size-8,28)}/>
  {:else}<Fallback size={Math.min(size - 8, 24)} strokeWidth={1.5} />{/if}
</span>

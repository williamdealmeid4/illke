<script>
  import { Sparkles } from "@lucide/svelte";

  let { suggestion = null, href = "", onSelect = null } = $props();
</script>

{#if suggestion}
  <div class="did-you-mean" role="status" aria-live="polite">
    <Sparkles size={15} aria-hidden="true" />
    <span>
      Você quis dizer
      {#if onSelect}
        <button
          type="button"
          class="did-you-mean-link"
          onclick={() => onSelect(suggestion)}
        >{suggestion}</button>?
      {:else}
        <a class="did-you-mean-link" {href}>{suggestion}</a>?
      {/if}
    </span>
  </div>
{/if}

<style>
  .did-you-mean {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 10px 0 14px;
    padding: 9px 14px;
    border-radius: 10px;
    border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--border));
    background: color-mix(in srgb, var(--accent) 8%, var(--surface));
    color: var(--text);
    font-size: 13px;
  }
  .did-you-mean :global(svg) {
    color: var(--accent);
    flex-shrink: 0;
  }
  .did-you-mean-link {
    background: none;
    border: none;
    padding: 0;
    margin: 0 2px;
    font: inherit;
    font-weight: 700;
    font-style: italic;
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .did-you-mean-link:hover {
    opacity: 0.85;
  }
</style>

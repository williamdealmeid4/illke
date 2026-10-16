<script>
  let { pagination } = $props();
</script>

{#if pagination && pagination.last_page > 1}<nav
    class="pagination"
    aria-label="Paginação"
  >
    <span>{pagination.from}–{pagination.to} de {pagination.total}</span>
    <div class="actions" style="margin:0">
      {#if pagination.prev_page_url}<a
          href={new URL(pagination.prev_page_url).search}>Anterior</a
        >{/if}{#if pagination.next_page_url}<a
          href={new URL(pagination.next_page_url).search}>Próxima</a
        >{/if}
    </div>
  </nav>{/if}

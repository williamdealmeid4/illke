<script>
  let { size = 18, strokeWidth = 1.75 } = $props();
</script>

<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="pokedex-icon">
  <path d="M5 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
  <circle cx="7" cy="7" r="1.5" />
  <path d="M11 6h1m3 0h1M3 11h7l2-2h7M7 15h8v3H7zM21 8v9" />
</svg>

<script>
  import { consoles } from '$lib/games.js';
  let { platform = 'gb', size = 30 } = $props();
</script>
<img class="console-icon" src={'/consoles/'+platform+(['mobile','pc'].includes(platform)?'.svg':'.png')} alt={consoles[platform] || platform} width={size} height={size} loading="lazy"/>
<style>.console-icon{object-fit:contain;flex-shrink:0;vertical-align:middle;}</style>

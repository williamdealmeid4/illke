<script>
  import {CloudSun, HeartPulse, Shield, Gauge, Eye, Swords, Sparkles, CircleHelp} from '@lucide/svelte';
  import {classifyAbility} from '$lib/ability-categories.js';
  let {effect='', size=24}=$props();
  const icons={CloudSun, HeartPulse, Shield, Gauge, Eye, Swords, Sparkles, CircleHelp};
  let category=$derived(classifyAbility(effect));
  let Icon=$derived(icons[category.icon]);
</script>
<span class="ability-category-icon" title={category.label}><Icon {size}/></span>

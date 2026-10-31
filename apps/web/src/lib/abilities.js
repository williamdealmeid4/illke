// Editorial navigation groups describe the principal effect, not an official battle type.
export const abilityCategories = [
  { id: 'all', name: 'Todas', icon: 'LayoutGrid', description: 'Explore o catálogo completo.' },
  { id: 'offense', name: 'Ataque e dano', icon: 'Swords', description: 'Potência, golpes e acertos críticos.' },
  { id: 'defense', name: 'Defesa e proteção', icon: 'Shield', description: 'Resistências, imunidades e redução de dano.' },
  { id: 'weather', name: 'Clima e terreno', icon: 'CloudSun', description: 'Chuva, sol, tempestades e campos de batalha.' },
  { id: 'status', name: 'Status e controle', icon: 'Orbit', description: 'Condições, atributos e controle do adversário.' },
  { id: 'recovery', name: 'Cura e suporte', icon: 'HeartPulse', description: 'Recuperação, aliados e efeitos de equipe.' },
  { id: 'speed', name: 'Velocidade e movimento', icon: 'Wind', description: 'Agilidade, prioridade e troca de Pokémon.' },
  { id: 'special', name: 'Formas e utilidade', icon: 'Shapes', description: 'Transformações, itens e mecânicas especiais.' },
];

// Icons are assigned by the ability's actual theme. Several abilities can share a
// symbol (e.g. fire), while their navigation group reflects their different roles.
const groups = [
  ['weather', 'CloudRain', 'drizzle primordial-sea'],
  ['weather', 'Sun', 'drought desolate-land orichalcum-pulse mega-sol'],
  ['weather', 'CloudSun', 'cloud-nine air-lock forecast delta-stream teraform-zero'],
  ['weather', 'Waves', 'sand-stream sand-spit sand-force sand-veil sandpit'],
  ['weather', 'Snowflake', 'snow-warning snow-cloak ice-body frostbite'],
  ['weather', 'Zap', 'electric-surge hadron-engine'],
  ['weather', 'Leaf', 'grassy-surge seed-sower grass-pelt'],
  ['weather', 'Orbit', 'psychic-surge misty-surge'],
  ['weather', 'Sun', 'solar-power protosynthesis flower-gift'],
  ['speed', 'Sun', 'chlorophyll'],
  ['speed', 'Waves', 'swift-swim wave-rider aqua-boost'],
  ['speed', 'Wind', 'speed-boost quick-feet unburden gale-wings sand-rush slush-rush surge-surfer quick-draw wind-rider sprint run-up skater high-rise climber shadow-dash nomad vanguard'],
  ['speed', 'LogOut', 'run-away wimp-out emergency-exit'],
  ['speed', 'Timer', 'stall slow-start truant mycelium-might'],
  ['speed', 'HeartPulse', 'triage'],
  ['offense', 'Flame', 'blaze flare-boost turboblaze fire-mane flame-boost spicy-spray hot-blooded'],
  ['offense', 'Droplets', 'torrent water-bubble'],
  ['offense', 'Leaf', 'overgrow'],
  ['offense', 'Bug', 'swarm'],
  ['offense', 'Swords', 'huge-power pure-power hustle guts rivalry sheer-force reckless scrappy defeatist moxie justified defiant competitive tough-claws gorilla-tactics supreme-overlord intrepid-sword sword-of-ruin chilling-neigh grim-neigh pride hero conqueror melee power-spot steely-spirit steelworker transistor dragons-maw beast-boost neuroforce analytic stakeout supreme-overlord'],
  ['offense', 'HandFist', 'iron-fist unseen-fist'],
  ['offense', 'Crosshair', 'sniper super-luck merciless no-guard victory-star'],
  ['offense', 'Scissors', 'hyper-cutter sharpness piercing-drill'],
  ['offense', 'CircleDot', 'mega-launcher skill-link parental-bond'],
  ['offense', 'AudioLines', 'punk-rock'],
  ['offense', 'Gem', 'rocky-payload'],
  ['offense', 'CircleDashed', 'mold-breaker infiltrator long-reach propeller-tail stalwart'],
  ['offense', 'HeartCrack', 'aftermath innards-out explode'],
  ['offense', 'Moon', 'dark-aura fairy-aura aura-break'],
  ['offense', 'ScanEye', 'tinted-lens minds-eye compound-eyes'],
  ['offense', 'Smile', 'strong-jaw'],
  ['defense', 'Shield', 'battle-armor shell-armor sturdy wonder-guard magic-guard friend-guard bulletproof dauntless-shield shadow-shield prism-armor aura-guard bodyguard last-bastion shield decoy'],
  ['defense', 'ShieldCheck', 'immunity leaf-guard aroma-veil flower-veil sweet-veil pastel-veil purifying-salt good-as-gold full-metal-body clear-body white-smoke mirror-armor keen-eye big-pecks inner-focus oblivious own-tempo unaware guard-dog armor-tail queenly-majesty dazzling shield-dust'],
  ['defense', 'Feather', 'levitate eelevate'],
  ['defense', 'Mountain', 'solid-rock filter mountaineer'],
  ['defense', 'Layers', 'thick-fat fur-coat fluffy multiscale ice-scales grass-cloak overcoat wonder-skin'],
  ['defense', 'Flame', 'flash-fire heatproof well-baked-body thermal-exchange water-veil magma-armor warm-blanket'],
  ['defense', 'Droplet', 'damp dry-skin water-absorb storm-drain sponge'],
  ['defense', 'Zap', 'volt-absorb lightning-rod motor-drive'],
  ['defense', 'Leaf', 'sap-sipper herbivore'],
  ['defense', 'Mountain', 'earth-eater'],
  ['defense', 'EarOff', 'soundproof'],
  ['defense', 'Anchor', 'suction-cups sticky-hold'],
  ['defense', 'ShieldPlus', 'stamina water-compaction marvel-scale tenacity parry instinct dodge'],
  ['defense', 'Gem', 'rock-head'],
  ['status', 'Zap', 'static electromorphosis wind-power quark-drive teravolt'],
  ['status', 'Flame', 'flame-body steam-engine anger-point berserk anger-shell'],
  ['status', 'Eye', 'intimidate frighten pressure unnerve anticipation forewarn perception'],
  ['status', 'Skull', 'poison-point poison-touch toxic-chain toxic-debris poison-puppeteer corrosion stench disgust'],
  ['status', 'Sprout', 'effect-spore supersweet-syrup lingering-aroma'],
  ['status', 'Moon', 'bad-dreams lullaby deep-sleep comatose'],
  ['status', 'Link', 'shadow-tag arena-trap magnet-pull shackle'],
  ['status', 'Waves', 'rough-skin iron-barbs jagged-edge gooey tangling-hair cotton-down'],
  ['status', 'Shuffle', 'synchronize contrary simple moody opportunist costar download tangled-feet rattled steadfast limber'],
  ['status', 'Ban', 'cursed-body mummy neutralizing-gas perish-body wandering-spirit interference daze calming'],
  ['status', 'Orbit', 'vessel-of-ruin tablets-of-ruin beads-of-ruin'],
  ['status', 'Laugh', 'cute-charm serene-grace prankster'],
  ['status', 'Swords', 'toxic-boost weak-armor'],
  ['recovery', 'HeartPulse', 'natural-cure healer regenerator hydration rain-dish poison-heal hospitality medic life-force nurse power-nap'],
  ['recovery', 'Apple', 'cheek-pouch gluttony cud-chew ripen harvest gulp lunchbox hunger-switch'],
  ['recovery', 'Sunrise', 'early-bird insomnia vital-spirit'],
  ['recovery', 'Users', 'plus minus battery symbiosis telepathy commander share mood-maker confidence'],
  ['special', 'Fingerprint', 'color-change protean libero multitype rks-system mimicry adaptability normalize dragonize refrigerate pixilate aerilate galvanize liquid-voice'],
  ['special', 'Shapes', 'stance-change zen-mode shields-down schooling disguise battle-bond power-construct ice-face zero-to-hero embody-aspect tera-shift tera-shell as-one-glastrier as-one-spectrier gulp-missile'],
  ['special', 'Copy', 'trace imposter receiver power-of-alchemy dancer'],
  ['special', 'VenetianMask', 'illusion stealth'],
  ['special', 'Package', 'pickup pickpocket magician frisk honey-gather ball-fetch bonanza fortune'],
  ['special', 'Weight', 'heavy-metal light-metal'],
  ['special', 'Lightbulb', 'illuminate'],
  ['special', 'Wand', 'technician omnipotent celebrate'],
  ['special', 'RefreshCw', 'shed-skin magic-bounce screen-cleaner curious-medicine'],
  ['special', 'Droplets', 'liquid-ooze'],
  ['special', 'Heart', 'soul-heart spirit'],
  ['special', 'CircleOff', 'klutz black-hole'],
  ['special', 'ListOrdered', 'sequence thrust'],
];

const metadata = new Map();
for (const [category, icon, slugs] of groups) {
  for (const slug of slugs.split(' ')) metadata.set(slug, { category, icon });
}
export function abilityMeta(entry) {
  const slug = typeof entry === 'string' ? entry : entry?.slug || entry?.name?.toLowerCase().replaceAll(' ', '-');
  return metadata.get(slug) || { category: 'special', icon: 'Puzzle' };
}

export function filterAbilities(entries, query = {}) {
  const needle = (query.q || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return entries.filter((entry) => {
    const name = `${entry.name} ${entry.slug}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return (!needle || name.includes(needle)) &&
      (!query.generation || String(entry.generation) === String(query.generation)) &&
      (!query.category || query.category === 'all' || abilityMeta(entry).category === query.category);
  }).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export function paginateAbilities(entries, url, perPage = 24) {
  const last_page = Math.max(1, Math.ceil(entries.length / perPage));
  const requested = Number(url.searchParams.get('page'));
  const current_page = Math.min(last_page, Math.max(1, Number.isFinite(requested) ? Math.floor(requested) : 1));
  const start = (current_page - 1) * perPage;
  const link = (page) => { const target = new URL(url); target.searchParams.set('page', String(page)); return target.href; };
  return { data: entries.slice(start, start + perPage), total: entries.length, current_page, last_page,
    from: entries.length ? start + 1 : 0, to: Math.min(start + perPage, entries.length),
    prev_page_url: current_page > 1 ? link(current_page - 1) : null,
    next_page_url: current_page < last_page ? link(current_page + 1) : null };
}

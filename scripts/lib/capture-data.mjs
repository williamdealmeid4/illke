const index = rows => new Map(rows.map(row => [row.id, row]));
const names = (rows, key, field) => new Map(rows.filter(row => row.local_language_id === '9').map(row => [row[key], row[field]]));
const title = value => value.replaceAll('-', ' ').replace(/\b\w/g, letter => letter.toUpperCase());

export function buildCaptureData(tables, revision) {
  const versions = index(tables.versions), groups = index(tables.version_groups);
  const versionNames = names(tables.version_names, 'version_id', 'name');
  const areas = index(tables.location_areas), locations = index(tables.locations);
  const areaNames = names(tables.location_area_prose, 'location_area_id', 'name');
  const locationNames = names(tables.location_names, 'location_id', 'name');
  const methods = index(tables.encounter_methods), slots = index(tables.encounter_slots);
  const methodNames = names(tables.encounter_method_prose, 'encounter_method_id', 'name');
  const conditionNames = names(tables.encounter_condition_value_prose, 'encounter_condition_value_id', 'name');
  const conditionIds = new Map();
  for (const row of tables.encounter_condition_value_map) {
    if (!conditionIds.has(row.encounter_id)) conditionIds.set(row.encounter_id, []);
    conditionIds.get(row.encounter_id).push(row.encounter_condition_value_id);
  }
  const species = index(tables.pokemon_species), types = index(tables.types), pokemon = {};
  for (const row of tables.pokemon) {
    const detail = species.get(row.species_id);
    if (!detail) continue;
    const form = tables.pokemon_forms.find(form => form.pokemon_id === row.id);
    const formGeneration = Number(groups.get(form?.introduced_in_version_group_id)?.generation_id || detail.generation_id);
    pokemon[row.id] = { id: Number(row.id), species_id: Number(row.species_id), name: row.identifier,
      generation: Math.max(Number(detail.generation_id), formGeneration),
      capture_rate: Number(detail.capture_rate), types: [], past_types: [], encounters: [] };
  }
  for (const row of tables.pokemon_types) if (pokemon[row.pokemon_id]) pokemon[row.pokemon_id].types.push(types.get(row.type_id)?.identifier);
  const historical = new Map();
  for (const row of tables.pokemon_types_past) {
    const key = row.pokemon_id+':'+row.generation_id;
    if (!historical.has(key)) historical.set(key, {pokemon_id: row.pokemon_id, generation: Number(row.generation_id), types: []});
    historical.get(key).types.push(types.get(row.type_id)?.identifier);
  }
  for (const row of historical.values()) if (pokemon[row.pokemon_id]) pokemon[row.pokemon_id].past_types.push({through_generation:row.generation, types:row.types});
  const grouped = new Map();
  for (const row of tables.encounters) {
    const target = pokemon[row.pokemon_id], slot = slots.get(row.encounter_slot_id), version = versions.get(row.version_id);
    if (!target || !slot || !version) continue;
    const area = areas.get(row.location_area_id), location = locations.get(area?.location_id), method = methods.get(slot.encounter_method_id);
    const conditions = [...(conditionIds.get(row.id) || [])].sort((a,b)=>Number(a)-Number(b));
    const key = [row.pokemon_id, row.version_id, row.location_area_id, slot.encounter_method_id, ...conditions].join(':');
    if (!grouped.has(key)) grouped.set(key, {
      pokemon_id: row.pokemon_id, game: version.identifier,
      location: locationNames.get(location?.id) || title(location?.identifier || 'Área sem nome'),
      area: areaNames.get(area?.id) || title(area?.identifier || 'Área sem nome'),
      area_id: Number(row.location_area_id), area_slug: area?.identifier || '', method: method?.identifier || 'unknown',
      method_label: methodNames.get(slot.encounter_method_id) || title(method?.identifier || 'Desconhecido'),
      conditions: conditions.map(id => conditionNames.get(id) || 'Condição #'+id),
      min_level: Number(row.min_level), max_level: Number(row.max_level), slots: new Map(),
    });
    const encounter = grouped.get(key);
    encounter.min_level = Math.min(encounter.min_level, Number(row.min_level));
    encounter.max_level = Math.max(encounter.max_level, Number(row.max_level));
    encounter.slots.set(row.encounter_slot_id, Number(slot.rarity));
  }
  for (const {pokemon_id, slots: rarity, ...encounter} of grouped.values()) {
    const rate = [...rarity.values()].reduce((total,value)=>total+value,0);
    pokemon[pokemon_id].encounters.push({...encounter, encounter_rate:rate>0&&rate<=100?rate:null});
  }
  const counts = {};
  for (const entry of Object.values(pokemon)) for (const encounter of entry.encounters) counts[encounter.game] = (counts[encounter.game] || 0)+1;
  return {schema_version:1, revision, source:'https://github.com/PokeAPI/pokeapi/tree/'+revision+'/data/v2/csv',
    generated_at:new Date().toISOString(), games:tables.versions.map(version=>({
      id:version.identifier, label:versionNames.get(version.id)||title(version.identifier),
      generation:Number(groups.get(version.version_group_id)?.generation_id), records:counts[version.identifier]||0,
    })), pokemon};
}

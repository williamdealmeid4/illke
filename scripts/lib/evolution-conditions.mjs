export function evolutionConditions(row, lookup = {}) {
  const conditions = [];
  if(row.minimum_level) conditions.push('Nível '+row.minimum_level);
  if(row.evolution_trigger_id==='2') conditions.push('Troca');
  if(row.trigger_item_id) conditions.push('Usar '+(lookup.items?.get(row.trigger_item_id)?.identifier || 'item específico'));
  if(row.held_item_id) conditions.push('Segurando '+(lookup.items?.get(row.held_item_id)?.identifier || 'item específico'));
  if(row.minimum_happiness) conditions.push('Amizade mínima: '+row.minimum_happiness);
  if(row.minimum_beauty) conditions.push('Beleza mínima: '+row.minimum_beauty);
  if(row.minimum_affection) conditions.push('Afeição mínima: '+row.minimum_affection);
  if(row.time_of_day) conditions.push({day:'Durante o dia',night:'Durante a noite',dusk:'Ao entardecer'}[row.time_of_day] || 'Horário específico');
  if(row.gender_id) conditions.push({'1':'Fêmea','2':'Macho','3':'Sem gênero'}[row.gender_id] || 'Gênero específico');
  if(row.known_move_id) conditions.push('Conhecer '+(lookup.moves?.get(row.known_move_id)?.identifier || 'golpe específico'));
  if(row.known_move_type_id) conditions.push('Conhecer golpe do tipo '+(lookup.types?.get(row.known_move_type_id)?.identifier || 'exigido pela versão'));
  if(row.used_move_id) conditions.push('Usar '+(lookup.moves?.get(row.used_move_id)?.identifier || 'golpe específico'));
  if(row.location_id) conditions.push('Local específico do jogo');
  if(row.needs_overworld_rain==='1') conditions.push('Chuva no mapa');
  if(row.turn_upside_down==='1') conditions.push('Inverter o aparelho');
  if(row.needs_multiplayer==='1') conditions.push('Multijogador');
  if(row.minimum_steps) conditions.push(row.minimum_steps+' passos');
  if(row.minimum_move_count) conditions.push(row.minimum_move_count+' usos de golpe exigido');
  if(row.minimum_damage_taken) conditions.push('Receber '+row.minimum_damage_taken+' de dano');
  if(row.party_species_id || row.party_type_id) conditions.push('Companheiro específico na equipe');
  if(row.relative_physical_stats) conditions.push('Relação específica entre Ataque e Defesa');
  if(row.condition_expression || row.required_pokemon_form_id || row.near_special_rock==='1' || row.region_id || row.nature_bitmask || row.percentage_chance) conditions.push('Condição adicional específica da versão; consulte a fonte do jogo');
  return conditions.length ? conditions.join(' · ') : 'Condição específica da versão ainda não detalhada';
}

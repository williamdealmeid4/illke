const DATABASE = 'illke-library';
const KEY = 'library';
const stats = ['hp','atk','def','spa','spd','spe'];
let database;
let favoriteMigration;
const copy = value => structuredClone(value);
const blank = () => ({ schema_version: 2, active_id: null, legacy_migrated: false, teams: [], favorites: [] });

export function cleanMember(member) {
  if (!member || typeof member.pokemon !== 'string' || member.pokemon.length > 80 || !/^gen[1-9]ou$/.test(member.context_id || '')) throw Error('Integrante ou formato inválido no backup.');
  if (!Array.isArray(member.moves) || member.moves.length > 4 || member.moves.some(m => m != null && (typeof m !== 'string' || m.length > 80))) throw Error('Golpes inválidos no backup.');
  const result = {};
  for (const key of ['name','nickname','pokemon','context_id','nature','ability','item','tera_type','role','strategy','level']) result[key] = member[key] ?? (key === 'level' ? 100 : '');
  for (const key of ['name','nickname','nature','ability','item','tera_type','role','strategy']) {
    if (typeof result[key] !== 'string' || result[key].length > (key === 'strategy' ? 20000 : 100)) throw Error('Texto inválido no backup.');
  }
  if (result.level !== null && (!Number.isFinite(result.level) || result.level < 1 || result.level > 100)) throw Error('Nível inválido no backup.');
  result.moves = member.moves.map(m => m || '');
  for (const [key, max] of [['evs',252],['ivs',31]]) {
    result[key] = Object.fromEntries(stats.map(s => {
      const value = member[key]?.[s] ?? (key === 'ivs' ? 31 : 0);
      if (!Number.isInteger(Number(value)) || value < 0 || value > max) throw Error('Treinamento inválido no backup.');
      return [s, Number(value)];
    }));
  }
  result.visibility = 'private';
  return result;
}

export function cleanTeam(team, freshId = false) {
  if (!team || !Array.isArray(team.members) || team.members.length > 6) throw Error('Uma equipe deve ter de zero a seis integrantes.');
  if (typeof team.name !== 'string' || !team.name.trim() || team.name.length > 100) throw Error('Nome de equipe inválido.');
  const members = team.members.map(cleanMember);
  const context = team.context_id || members[0]?.context_id || 'gen9ou';
  if (!/^gen[1-9]ou$/.test(context)) throw Error('Formato de equipe inválido.');
  if (members.some(m => m.context_id !== context)) throw Error('Todos os integrantes devem usar o mesmo formato.');
  return { id: freshId || !team.id ? crypto.randomUUID() : team.id, name: team.name,
    context_id: context, members, notes: String(team.notes || '').slice(0,20000),
    updated_at: new Date().toISOString(), archived: !!team.archived,
    revision: Number(team.revision || 0), evaluations: Array.isArray(team.evaluations) ? team.evaluations.filter(e => typeof e.id === 'string').slice(-20) : [],
    history: Array.isArray(team.history) ? team.history.slice(-20) : [] };
}

export function parseBackup(value) {
  if (value?.app !== 'illke' || value.schema_version !== 2 || !Array.isArray(value.teams) || value.teams.length > 500) throw Error('Este não é um backup illke compatível (versão 2).');
  return { teams: value.teams.map(t => ({ ...cleanTeam(t, true), history: [], evaluations: [] })),
    favorites: Array.isArray(value.favorites) ? value.favorites.filter(id => typeof id === 'string' && /^[a-f0-9-]{36}$/i.test(id)).slice(0,5000) : [] };
}

function connect() {
  if (!database) database = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('state');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { database = null; reject(Error('Não foi possível abrir sua biblioteca. Exporte um backup antes de limpar dados do navegador.')); };
  });
  return database;
}

async function transaction(change) {
  const db = await connect();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('state', change ? 'readwrite' : 'readonly');
    const store = tx.objectStore('state');
    const request = store.get(KEY);
    let result;
    request.onsuccess = () => {
      try {
        const library = request.result || blank();
        result = change ? change(library) : library;
        if (change) store.put(library, KEY);
      } catch (error) { reject(error); tx.abort(); }
    };
    tx.oncomplete = () => { if (change) window.dispatchEvent(new Event('illke-library')); resolve(copy(result)); };
    tx.onerror = () => reject(Error('Não foi possível salvar. Seu armazenamento pode estar cheio ou bloqueado.'));
    tx.onabort = () => reject(Error('A biblioteca não foi alterada. Tente novamente.'));
  });
}

async function migrateLegacyFavorites() {
  if (!favoriteMigration) favoriteMigration=(async()=>{
    const state=await transaction();
    if(state.legacy_favorites_migrated)return;
    try{
      const ids=[],signal=AbortSignal.timeout(3000);
      for(let page=1;page<=50;page++){
        const response=await fetch('/api/v1/builds?favorites=1&page='+page,{signal});
        if(!response.ok)return;
        const data=await response.json();ids.push(...data.data.map(build=>build.public_id));
        if(!data.next_page_url)break;
      }
      await transaction(value=>{value.favorites=[...new Set([...value.favorites,...ids])];value.legacy_favorites_migrated=true;return value;});
    }catch{}
  })();
  await favoriteMigration;
}

export async function library() {
  const data = await transaction();
  if (data.teams.length || data.legacy_migrated) {await migrateLegacyFavorites();return transaction();}
  let legacy;
  try { legacy = JSON.parse(localStorage.getItem('illke-team-v1') || 'null'); } catch {}
  if (legacy?.members?.length) {
    // Keep the legacy key intact until the new library has been read successfully.
    try {
      const team = cleanTeam({ ...legacy, name: legacy.name || 'Minha equipe' });
      await transaction(state => { if (!state.legacy_migrated && !state.teams.length) { state.teams.push(team); state.active_id = team.id; } state.legacy_migrated=true; return state; });
    } catch (error) { throw Error('Seu rascunho antigo foi preservado, mas não pôde ser migrado: ' + error.message); }
  }
  else await transaction(state => {state.legacy_migrated=true;return state;});
  await migrateLegacyFavorites();
  return transaction();
}

export const getTeam = async id => (await library()).teams.find(t => t.id === id);
export async function createTeam(input) {
  const team = cleanTeam(input, true);
  await transaction(state => { if (state.teams.length >= 500) throw Error('Limite de 500 equipes. Exporte um backup para organizar sua biblioteca.'); state.teams.push(team); state.active_id = team.id; return team; });
  return team;
}
export async function saveTeam(id, patch, checkpoint = '') {
  return transaction(state => {
    const index = state.teams.findIndex(t => t.id === id);
    if (index < 0) throw Error('Equipe não encontrada.');
    const before = state.teams[index];
    const history = checkpoint ? [...before.history, { at: new Date().toISOString(), reason: checkpoint, name: before.name, context_id: before.context_id, members: copy(before.members), notes: before.notes }].slice(-20) : before.history;
    const team = cleanTeam({ ...before, ...patch, history, revision: before.revision + 1 });
    state.teams[index] = team;
    state.active_id = id;
    return team;
  });
}
export const removeTeam = id => transaction(state => { state.teams = state.teams.filter(t => t.id !== id); if (state.active_id === id) state.active_id = null; return state; });
export const toggleFavorite = id => transaction(state => { state.favorites = state.favorites.includes(id) ? state.favorites.filter(x => x !== id) : [...state.favorites, id]; return state.favorites; });
export const importBackup = value => {
  const parsed = parseBackup(value);
  return transaction(state => { if (state.teams.length + parsed.teams.length > 500) throw Error('O backup excede o limite da biblioteca.'); state.teams.push(...parsed.teams); state.favorites = [...new Set([...state.favorites,...parsed.favorites])]; return parsed.teams.length; });
};
export async function exportBackup() {
  const state = await library();
  return { app: 'illke', schema_version: 2, exported_at: new Date().toISOString(), teams: state.teams.map(t => ({ ...cleanTeam(t), history: [], evaluations: [] })), favorites: state.favorites };
}
export function downloadJson(value, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value,null,2)], {type:'application/json'}));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

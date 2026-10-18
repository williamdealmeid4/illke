import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { getContext } from "./contexts.js";
import { hash, toSet, validateTeam, versions } from "./domain.js";
const require = createRequire(import.meta.url);
const { Battle, Dex, TeamValidator } = require("pokemon-showdown");
export const policy = "heuristic-singles-v1";
export const benchmarkVersion = "reference-sets-v2-balanced";
export function interval(wins, total) {
  if (!total) return null;
  const z = 1.959963984540054,
    p = wins / total,
    d = 1 + (z * z) / total,
    c = (p + (z * z) / (2 * total)) / d,
    h =
      (z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total))) /
      d;
  return [
    wins === 0 ? 0 : Math.max(0, c - h),
    wins === total ? 1 : Math.min(1, c + h),
  ];
}
function choice(battle, side) {
  const request = side.activeRequest;
  if (!request || request.wait) return null;
  if (request.teamPreview)
    return "team " + side.pokemon.map((_, i) => i + 1).join("");
  if (request.forceSwitch) {
    const slot = side.pokemon.findIndex((p) => !p.fainted && !p.isActive);
    return slot >= 0 ? "switch " + (slot + 1) : "pass";
  }
  const active = side.active[0],
    foe = side.foe.active[0];
  if (!active || !request.active) return "default";
  const moves = request.active[0].moves
    .map((m, i) => ({ m, i, move: battle.dex.moves.get(m.id) }))
    .filter((x) => !x.m.disabled && x.m.pp !== 0);
  if (!moves.length) return "default";
  const score = ({ move }) => {
    if (move.category === "Status") {
      if (move.heal) return active.hp < active.maxhp * 0.55 ? 95 : 0;
      if (move.status) return foe?.status ? 0 : 28;
      if (move.boosts)
        return Object.values(active.boosts).some((x) => x >= 2) ? 1 : 22;
      if (move.sideCondition) return 10;
      return 2;
    }
    const effectiveness = foe
      ? battle.dex.getEffectiveness(move.type, foe.types)
      : 0;
    const immune = foe && !battle.dex.getImmunity(move.type, foe.types);
    const attack =
      active.storedStats[move.category === "Physical" ? "atk" : "spa"] || 100;
    const defense =
      foe?.storedStats[move.category === "Physical" ? "def" : "spd"] || 100;
    return immune
      ? 0
      : (move.basePower || 50) *
          (active.types.includes(move.type) ? 1.5 : 1) *
          2 ** effectiveness *
          (attack / defense) *
          (move.accuracy === true ? 1 : move.accuracy / 100);
  };
  moves.sort((a, b) => score(b) - score(a) || a.i - b.i);
  return "move " + (moves[0].i + 1);
}
export function runBattle(team, opponent, format, seed, maxTurns = 150, reverse = false) {
  const battle = new Battle({
    formatid: format,
    seed,
    send: () => {},
    p1: { name: reverse ? 'Reference' : 'Candidate', team: (reverse ? opponent : team).map(toSet) },
    p2: { name: reverse ? 'Candidate' : 'Reference', team: (reverse ? team : opponent).map(toSet) },
  });
  try {
    let actions = 0;
    while (
      !battle.ended &&
      battle.turn <= maxTurns &&
      actions++ < maxTurns * 5
    ) {
      for (const side of battle.sides) {
        if (side.isChoiceDone()) continue;
        const action = choice(battle, side);
        if (action && !battle.choose(side.id, action)) {
          battle.choose(side.id, "default");
        }
      }
      if (
        battle.sides.every((s) => !s.activeRequest || s.activeRequest.wait) &&
        !battle.ended
      )
        break;
    }
    return battle.ended
      ? battle.winner === "Candidate"
        ? "win"
        : battle.winner === "Reference"
          ? "loss"
          : "draw"
      : "draw";
  } finally {
    battle.destroy();
  }
}
export function makeBenchmark(builds, contextId) {
  const candidates = builds.filter(
    (b) => b.context_id === contextId && b.legality === "legal",
  );
  const validator = new TeamValidator(getContext(contextId).format);
  const teams = [];
  for (let t = 0; t < 10; t++) {
    const members = [];
    for (let n = 0; n < candidates.length && members.length < 6; n++) {
      const b = candidates[(n + t * 31) % candidates.length];
      if (
        members.some(
          (m) =>
            Dex.species.get(m.pokemon).baseSpecies ===
            Dex.species.get(b.pokemon).baseSpecies,
        )
      )
        continue;
      if (!(validator.validateTeam([...members, b].map(toSet)) || []).length)
        members.push(b);
    }
    if (members.length === 6) teams.push(members);
  }
  if (!teams.length)
    throw Error("Não há equipes de referência suficientes para este contexto.");
  return teams;
}
export function measure(members, referenceTeams, contextId, samples = 1000) {
  const context = getContext(contextId);
  let wins = 0,
    losses = 0,
    draws = 0;
  const outcomes = [], matchups = referenceTeams.map((team,index)=>({index,pokemon:team.map(b=>b.pokemon),wins:0,losses:0,draws:0,samples:0}));
  for (let i = 0; i < samples; i++) {
    const result = runBattle(
      members,
      referenceTeams[Math.floor(i / 2) % referenceTeams.length],
      context.format,
      [12, 34, Math.floor(i / 65536), i % 65536],
      150, i % 2 === 1,
    );
    if (result === "win") wins++;
    else if (result === "loss") losses++;
    else draws++;
    outcomes.push(result === 'win' ? 1 : 0);
    const matchup = matchups[Math.floor(i / 2) % referenceTeams.length];
    matchup.samples++; matchup[result === 'win' ? 'wins' : result === 'loss' ? 'losses' : 'draws']++;
  }
  return {
    wins,
    outcomes, matchups,
    losses,
    draws,
    samples,
    win_rate: wins / samples,
    interval_95: interval(wins, samples),
    draw_policy: "Empates e limites de turnos não contam como vitória.",
  };
}
export function pairedComparison(baseline, candidate) {
  if (baseline.length !== candidate.length || !baseline.length) throw Error('Amostras pareadas incompatíveis.');
  const differences = baseline.map((value,index)=>candidate[index]-value);
  const n=differences.length, mean=differences.reduce((a,b)=>a+b,0)/n;
  const better=differences.filter(x=>x>0).length,worse=differences.filter(x=>x<0).length,discordant=better+worse;
  let logTerm=-discordant*Math.LN2,logTail=logTerm;
  for(let k=1;k<=Math.min(better,worse);k++){logTerm+=Math.log(discordant-k+1)-Math.log(k);const maximum=Math.max(logTail,logTerm);logTail=maximum+Math.log(Math.exp(logTail-maximum)+Math.exp(logTerm-maximum));}
  const bounds=count=>{const z=2.241402728,p=count/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return [count===0?0:Math.max(0,c-h),count===n?1:Math.min(1,c+h)];};
  const positive=bounds(better),negative=bounds(worse);
  return {difference:mean,interval_95:[Math.max(-1,positive[0]-negative[1]),Math.min(1,positive[1]-negative[0])],p_value:discordant?Math.min(1,2*Math.exp(logTail)):1,samples:n,discordant,method:'mcnemar-exact-wilson-bonferroni-v1'};
}

export function finishEvaluation(result) {
  const ordered=[...(result.comparisons || [])].sort((a,b)=>a.paired.p_value-b.paired.p_value);
  let previous=0;
  for(let index=0;index<ordered.length;index++) {
    const comparison=ordered[index];
    comparison.paired.adjusted_p=Math.min(1,Math.max(previous,comparison.paired.p_value*(ordered.length-index)));
    previous=comparison.paired.adjusted_p;
  }
  result.recommendations=ordered.filter(c=>c.paired.adjusted_p<=0.05 && c.paired.difference>0).map(c=>({...c,reason:'Melhora nas mesmas sementes e adversários, com comparação pareada e correção de Holm para as alternativas testadas.'}));
  result.search_summary={candidates:result.candidates.length,tested:result.comparisons.length,method:'mcnemar-exact-holm-v1'};
  result.complete=true;
  return result;
}

export async function simulate(input) {
  const validation = validateTeam(input.members);
  if (validation.issues.length) throw Error(validation.issues.join(" "));
  if (input.members.length !== 6)
    throw Error("A avaliação de equipe exige seis Pokémon.");
  const contextId = validation.context.id;
  const catalog = JSON.parse(
    await readFile(
      new URL(input.snapshot_id && /^[a-f0-9]{64}$/.test(input.snapshot_id) ? `../../../.data/snapshots/${input.snapshot_id}.json` : '../../../.data/catalog.json', import.meta.url),
      "utf8",
    ),
  );
  const teams = makeBenchmark(catalog.builds, contextId);
  const slot = input.recommendation_slot ?? 0;
  if (!Number.isInteger(slot) || slot < 0 || slot > 5) throw Error('Slot inválido.');
  if (input.unit === 'candidate') {
    const result = input.baseline;
    const build = result.candidates[input.candidate_index];
    if (!build) throw Error('Alternativa não encontrada.');
    const members=structuredClone(input.members); members[slot]=build;
    const comparison=measure(members,teams,contextId);
    const paired=pairedComparison(result.outcomes,comparison.outcomes);
    delete comparison.outcomes;
    return {slot,build,comparison,paired};
  }
  const benchmark = {
    id: benchmarkVersion,
    context_id: contextId,
    hash: hash(teams),
    source_revision: catalog.revision,
    sets_hash: hash(catalog.builds.filter((b) => b.context_id === contextId)),
    teams: teams.map((t) =>
      t.map((b) => ({
        pokemon: b.pokemon,
        name: b.name,
        source_url: b.source_url,
      })),
    ),
    policy,
    max_turns: 150,
    sides: 'alternating',
    seed_scheme: '[12,34,floor(index/65536),index%65536]',
    type: "synthetic-reference-teams",
    description:
      "Equipes sintéticas legais montadas de sets de referência; não representam a distribuição de jogadores.",
  };
  const result = {
    ...measure(input.members, teams, contextId),
    snapshot_id: catalog.snapshot_id,
    benchmark,
    versions,
    context: validation.context,
    input_hash: hash({ members: input.members, benchmark, versions }),
    limitations: [
      "Estimativa exclusiva deste benchmark e desta política automatizada.",
      "Não representa taxa de vitória em partidas humanas.",
      "A política não modela adequadamente todas as estratégias de suporte nem usa transformações opcionais.",
    ],
    recommendations: [],
    comparisons: [],
    complete: false,
  };
  const current = input.members[slot];
  const identity = b => hash({...toSet(b),name:''});
  const seen=new Set([identity(current)]);
  const alternatives = catalog.builds
    .filter(
      (b) =>
        b.context_id === contextId &&
        b.legality === "legal" &&
        Dex.toID(b.pokemon) === Dex.toID(current.pokemon),
    )
    .filter(b=>{const key=identity(b);if(seen.has(key))return false;seen.add(key);return true;})
    .filter(b=>{const team=structuredClone(input.members);team[slot]=b;return !validateTeam(team).issues.length;})
    .sort((a,b)=>identity(a).localeCompare(identity(b)));
  result.candidates = alternatives;
  if(input.unit === 'baseline') return result;
  for (const build of alternatives) {
    const members = structuredClone(input.members);
    members[slot] = build;
    if (validateTeam(members).issues.length) continue;
    const comparison = measure(members, teams, contextId);
    const paired=pairedComparison(result.outcomes,comparison.outcomes);
    delete comparison.outcomes;
    result.comparisons.push({slot,build,comparison,paired});
  }
  return finishEvaluation(result);
}

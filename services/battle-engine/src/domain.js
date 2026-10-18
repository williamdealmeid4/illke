import crypto from "node:crypto";
import { createRequire } from "node:module";
import { z } from "zod";
import { getContext, contexts } from "./contexts.js";
export { contexts };
const require = createRequire(import.meta.url);
const { Dex, TeamValidator, Teams } = require("pokemon-showdown");
const calc = require("@smogon/calc");
const psVersion = require("pokemon-showdown/package.json").version;
const calcVersion = require("@smogon/calc/package.json").version;
export const versions = {
  engine: "2.0.0",
  showdown: psVersion,
  calculator: calcVersion,
  evaluator: "2.0.0",
};
export const context = getContext("gen9ou");
const statNames = ["hp", "atk", "def", "spa", "spd", "spe"];
const statMap = (max) =>
  z.object(
    Object.fromEntries(
      statNames.map((s) => [s, z.number().int().min(0).max(max)]),
    ),
  );
export const buildSchema = z.object({
  name: z.string().trim().min(1).max(100),
  nickname: z.string().trim().max(18).default(''),
  context_id: z
    .string()
    .refine(
      (x) => contexts.some((c) => c.id === x) || x === "sv-ou-r1",
      "Contexto não suportado",
    ),
  pokemon: z.string().min(1).max(80),
  level: z.number().int().min(1).max(100),
  nature: z.string().min(1).max(30),
  ability: z.string().max(80),
  item: z.string().max(80),
  moves: z
    .array(z.string().min(1).max(80))
    .min(1, "Escolha ao menos um golpe.")
    .max(4),
  evs: statMap(252),
  ivs: statMap(31),
  tera_type: z.string().max(30),
  role: z.enum([
    'unclassified',
    "physical-attacker",
    "special-attacker",
    "setup",
    "wall",
    "support",
    "control",
  ]),
  strategy: z.string().max(20000).default(""),
  visibility: z.enum(["private", "unlisted", "public"]).default("private"),
});
const globalDex = Dex;
const id = (s) => Dex.toID(s);
const optionRestrictions = new Map();
export function toSet(b) {
  return {
    name: b.nickname || '',
    species: b.pokemon,
    level: b.level,
    nature: b.nature,
    ability: b.ability,
    item: b.item,
    moves: b.moves,
    evs: b.evs,
    ivs: b.ivs,
    teraType: b.tera_type || undefined,
  };
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, canonical(value[k])]),
    );
  return value;
}
export function hash(value) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(canonical(value)))
    .digest("hex");
}
export function options(name, contextId = "gen9ou") {
  const context = getContext(contextId);
  const Dex = globalDex.forFormat(context.format);
  const species = Dex.species.get(name);
  if (!species.exists || species.gen > context.generation)
    return {
      supported: false,
      reason: "Espécie ou forma indisponível nesta geração.",
      context,
      abilities: [],
      moves: [],
      items: [],
      natures: [],
      types: [],
    };
  const learnset = Object.assign(
    {},
    ...Dex.species.getFullLearnset(species.id).map((x) => x.learnset),
  );
  const moves = Object.keys(learnset)
    .map((x) => Dex.moves.get(x))
    .filter((x) => x.exists && x.gen <= context.generation)
    .map((x) => ({
      id: x.id,
      name: x.name,
      type: x.type,
      category: x.category,
      power: x.basePower,
      accuracy: x.accuracy,
    }));
  const key = context.id + ':' + species.id;
  if (!optionRestrictions.has(key)) {
    const validator = new TeamValidator(context.format);
    optionRestrictions.set(key, Object.fromEntries(moves.map(move => [move.name, validator.validateSet({species:species.name,name:'',ability:context.capabilities.ability?species.abilities['0']:'',nature:'Serious',moves:[move.name],evs:{hp:4}}, {}) || []])));
  }
  return {
    supported: true,
    pokemon: species.name,
    form: species.forme || "Base",
    pokemon_types: species.types,
    move_restrictions: optionRestrictions.get(key),
    stats: species.baseStats,
    abilities: context.capabilities.ability
      ? [...new Set(Object.values(species.abilities))]
      : [],
    ability_descriptions: Object.fromEntries(Object.values(species.abilities).map(name=>[name,Dex.abilities.get(name).desc || ''])),
    moves,
    natures: Dex.natures
      .all()
      .map((x) => ({ name: x.name, plus: x.plus, minus: x.minus })),
    items: Dex.items
      .all()
      .filter(
        (x) => x.exists && x.gen <= context.generation && !x.isNonstandard,
      )
      .map((x) => ({ id: x.id, name: x.name, description: x.desc || x.shortDesc || '' })),
    tera_types: Dex.types.all().filter(x => x.exists).map(x => x.name),
    types: Dex.types
      .all()
      .filter((x) => x.exists)
      .map((x) => x.name),
    context,
  };
}
export function legal(build) {
  const parsed = buildSchema.safeParse(build);
  if (!parsed.success)
    return {
      status: "invalid",
      issues: parsed.error.issues.map((x) => ({
        code: "SCHEMA_INVALID",
        path: x.path.join("."),
        message: x.message,
      })),
    };
  const b = parsed.data,
    issues = [];
  const context = getContext(b.context_id);
  const Dex = globalDex.forFormat(context.format);
  if (
    Object.values(b.evs).reduce((a, n) => a + n, 0) >
    context.capabilities.ev_total
  )
    issues.push({
      code: "EV_TOTAL_MAX",
      path: "evs",
      message: "O total de EVs excede o limite deste contexto.",
    });
  if (new Set(b.moves.map(id)).size !== b.moves.length)
    issues.push({
      code: "DUPLICATE_MOVE",
      path: "moves",
      message: "Golpes repetidos não são permitidos.",
    });
  if (!Dex.species.get(b.pokemon).exists)
    return {
      status: "unsupported",
      issues: [
        {
          code: "UNKNOWN_FORM",
          path: "pokemon",
          message: "Forma ausente no snapshot de cálculo.",
        },
      ],
    };
  const set = toSet(b);
  const validator = new TeamValidator(context.format);
  const problems = validator.validateSet(structuredClone(set), {}) || [];
  issues.push(
    ...problems.map((message) => ({
      code: "SHOWDOWN_SET_INVALID",
      path: "set",
      message,
    })),
  );
  return {
    status: issues.length ? "illegal" : "legal",
    scope: context.scope,
    issues,
  };
}
const calculationSchema=buildSchema.pick({context_id:true,pokemon:true,level:true,nature:true,ability:true,item:true,evs:true,ivs:true,tera_type:true}).extend({
  boosts:z.object(Object.fromEntries(statNames.map(name=>[name,z.number().int().min(-6).max(6).optional()]))).optional(),
  current_hp:z.number().int().min(1).optional(),
});
function calculationBuild(input) {
  const parsed=calculationSchema.safeParse(input);
  if(!parsed.success)throw Error(parsed.error.issues.map(issue=>issue.path.join('.')+': '+issue.message).join(' '));
  const build=parsed.data;
  if(Object.values(build.evs).reduce((sum,value)=>sum+value,0)>getContext(build.context_id).capabilities.ev_total)throw Error('evs: o total de treinamento excede o limite do formato.');
  return build;
}
export function stats(input) {
  const build=calculationBuild(input);
  const gen = calc.Generations.get(getContext(build.context_id).generation);
  const p = new calc.Pokemon(gen, build.pokemon, {
    level: build.level,
    nature: build.nature,
    ability: build.ability,
    item: build.item || undefined,
    evs: build.evs,
    ivs: build.ivs,
  });
  return p.stats;
}
export function damage(input) {
  input={...input,attacker:calculationBuild(input.attacker),defender:calculationBuild(input.defender)};
  const gen = calc.Generations.get(
    getContext(input.attacker.context_id).generation,
  );
  if (input.attacker.context_id !== input.defender.context_id)
    throw Error("Os contextos devem ser iguais.");
  const make = (b) =>
    new calc.Pokemon(gen, b.pokemon, {
      level: b.level,
      nature: b.nature,
      ability: b.ability,
      item: b.item || undefined,
      evs: b.evs,
      ivs: b.ivs,
      teraType: b.tera_type || undefined,
      boosts: b.boosts || {},
      curHP: b.current_hp,
    });
  const result = calc.calculate(
    gen,
    make(input.attacker),
    make(input.defender),
    new calc.Move(gen, input.move, { isCrit: input.critical === true }),
    new calc.Field({
      gameType: input.game_type || "Singles",
      weather: input.weather || undefined,
      terrain: input.terrain || undefined,
      attackerSide: input.attacker_side || {},
      defenderSide: input.defender_side || {},
    }),
  );
  const range = result.range();
  return {
    range,
    description: range[1] === 0 ? `${input.move} não causa dano direto em ${input.defender.pokemon} nas condições informadas.` : result.desc(),
    rolls: result.damage,
    versions,
  };
}
export function evaluate(build) {
  const legality = legal(build);
  const context = getContext(build.context_id);
  const Dex = globalDex.forFormat(context.format);
  const result = {
    legality,
    context,
    versions,
    input_hash: hash({ build, versions, context }),
    score: null,
    confidence: "partial",
    evidence: [],
    limitations: [
      "Não estima chance de vitória.",
      "Sem benchmark editorial aprovado, adequação ao metagame e sinergia não recebem pontuação.",
      "Validação individual não valida cláusulas de equipe nem comprova origem de um exemplar no cartucho.",
    ],
  };
  if (legality.status !== "legal") return result;
  result.stats = stats(build);
  const species = Dex.species.get(build.pokemon),
    nature = Dex.natures.get(build.nature),
    moveData = build.moves.map((x) => Dex.moves.get(x));
  const physical = moveData.filter((m) => m.category === "Physical"),
    special = moveData.filter((m) => m.category === "Special");
  if (build.role === "physical-attacker" && nature.minus === "atk")
    result.evidence.push({
      code: "NATURE_REDUCES_ROLE_STAT",
      severity: "warning",
      message: "A nature reduz Attack, atributo principal da função física.",
      observed: nature.name,
    });
  if (build.role === "special-attacker" && nature.minus === "spa")
    result.evidence.push({
      code: "NATURE_REDUCES_ROLE_STAT",
      severity: "warning",
      message:
        "A nature reduz Special Attack, atributo principal da função especial.",
      observed: nature.name,
    });
  if (build.role === "physical-attacker" && !physical.length)
    result.evidence.push({
      code: "NO_PHYSICAL_ACTION",
      severity: "warning",
      message: "Nenhum golpe físico foi selecionado para a função declarada.",
    });
  if (build.role === "special-attacker" && !special.length)
    result.evidence.push({
      code: "NO_SPECIAL_ACTION",
      severity: "warning",
      message: "Nenhum golpe especial foi selecionado para a função declarada.",
    });
  const unused =
    context.capabilities.ev_total -
    Object.values(build.evs).reduce((a, n) => a + n, 0);
  if (unused > 6)
    result.evidence.push({
      code: "TRAINING_UNUSED",
      severity: "info",
      message: unused + " EVs ainda podem ser distribuídos.",
      observed: unused,
    });
  if (
    id(build.item).startsWith("choice") &&
    moveData.some((m) => m.category === "Status")
  )
    result.evidence.push({
      code: "CHOICE_STATUS_TRADEOFF",
      severity: "info",
      message:
        "O item Choice trava a seleção de golpe; confira a intenção dos golpes de status.",
    });
  result.evidence.push({
    code: "STAT_CALCULATION",
    severity: "info",
    message: "Atributos calculados para nível, nature, EVs e IVs informados.",
    observed: result.stats,
  });
  result.components = {
    coherence: {
      status: "observed",
      warnings: result.evidence.filter((x) => x.severity === "warning").length,
    },
    efficiency: { status: "requires_benchmarks" },
    context_fit: { status: "requires_benchmarks" },
    synergy: { status: "requires_team" },
    popularity: { status: "no_data" },
  };
  return result;
}
export function importTeam(text) {
  if (typeof text !== "string" || text.length > 20000)
    throw Error("Importação limitada a 20.000 caracteres.");
  return Teams.import(text) || [];
}
export function exportTeam(build) {
  return Teams.export([toSet(build)]);
}
export function validateTeam(builds) {
  if (!Array.isArray(builds) || !builds.length || builds.length > 6)
    throw Error("Selecione de 1 a 6 Pokémon.");
  const issues = [];
  if (builds.some((b) => b.context_id !== builds[0].context_id))
    issues.push("A equipe deve usar o mesmo formato e geração.");
  for (const [i, build] of builds.entries()) {
    const result = legal(build);
    issues.push(
      ...result.issues.map(
        (issue) =>
          `Integrante ${i + 1} (${build.pokemon || "sem Pokémon"}): ${issue.message}`,
      ),
    );
  }
  const context =
    contexts.some((c) => c.id === builds[0].context_id) ||
    builds[0].context_id === "sv-ou-r1"
      ? getContext(builds[0].context_id)
      : undefined;
  if (!issues.length && context) {
    issues.push(
      ...(new TeamValidator(context.format).validateTeam(
        builds.map((b) => structuredClone(toSet(b))),
      ) || []),
    );
  }
  return { issues, versions, context };
}
export function speciesData() {
  return Dex.species
    .all()
    .filter((s) => s.exists)
    .map((s) => ({
      id: s.id,
      name: s.name,
      num: s.num,
      forme: s.forme,
      baseSpecies: s.baseSpecies,
      types: s.types,
      stats: s.baseStats,
      abilities: s.abilities,
      gen: s.gen,
      nonstandard: s.isNonstandard || null,
    }));
}

import test from "node:test";
import assert from "node:assert/strict";
import {
  legal,
  evaluate,
  validateTeam,
  options,
  stats,
  hash,
} from "../services/battle-engine/src/domain.js";
import { measure, interval } from "../services/battle-engine/src/simulation.js";
const statMap = (v) =>
  Object.fromEntries(
    ["hp", "atk", "def", "spa", "spd", "spe"].map((s) => [s, v]),
  );
const build = {
  name: "Physical attacker",
  context_id: "gen9ou",
  pokemon: "Garchomp",
  level: 100,
  nature: "Jolly",
  ability: "Rough Skin",
  item: "Leftovers",
  moves: ["Earthquake", "Dragon Claw", "Swords Dance", "Stealth Rock"],
  evs: { hp: 0, atk: 252, def: 0, spa: 0, spd: 4, spe: 252 },
  ivs: statMap(31),
  tera_type: "Ground",
  role: "physical-attacker",
  strategy: "",
  visibility: "private",
};
test("legal set uses the selected generation and rejects future species", () => {
  assert.equal(legal(build).status, "legal");
  assert.equal(legal({ ...build, context_id: "gen1ou" }).status, "illegal");
});
test("EV total and duplicate moves are independently reported", () => {
  const result = legal({
    ...build,
    evs: statMap(252),
    moves: ["Earthquake", "Earthquake"],
  });
  assert.ok(result.issues.some((x) => x.code === "EV_TOTAL_MAX"));
  assert.ok(result.issues.some((x) => x.code === "DUPLICATE_MOVE"));
});
test("schema rejects malformed training rather than computing invented results", () => {
  assert.equal(legal({ ...build, ivs: statMap(32) }).status, "invalid");
});
test("older formats exclude future moves from candidates", () => {
  assert.ok(
    !options("Blastoise", "gen1ou").moves.some((m) => m.name === "Shell Smash"),
  );
  assert.ok(
    options("Blastoise", "gen9ou").moves.some((m) => m.name === "Shell Smash"),
  );
});
test("team validation catches species clause and mixed contexts", () => {
  assert.ok(validateTeam([build, build]).issues.length);
  assert.throws(() =>
    validateTeam([build, { ...build, context_id: "gen8ou" }]),
  );
});
test("stats and evidence reflect level, training, and role", () => {
  assert.equal(stats(build).atk, 359);
  const result = evaluate({ ...build, nature: "Modest" });
  assert.ok(result.evidence.some((x) => x.code === "NATURE_REDUCES_ROLE_STAT"));
  assert.equal(result.score, null);
});
test("hash ignores property order and includes changed inputs", () => {
  assert.equal(hash({ a: 1, b: 2 }), hash({ b: 2, a: 1 }));
  assert.notEqual(hash({ a: 1 }), hash({ a: 2 }));
});
test("confidence bounds distinguish an empty sample and a perfect finite sample", () => {
  assert.equal(interval(0, 0), null);
  const perfect = interval(10, 10);
  assert.ok(perfect[0] < 1 && perfect[0] > 0.7);
  assert.equal(perfect[1], 1);
});
test("seeded battles reproduce their results and account for every outcome", () => {
  const a = measure(
    [build],
    [[{ ...build, pokemon: "Garchomp" }]],
    "gen9ou",
    5,
  );
  const b = measure(
    [build],
    [[{ ...build, pokemon: "Garchomp" }]],
    "gen9ou",
    5,
  );
  assert.deepEqual(a, b);
  assert.equal(a.wins + a.losses + a.draws, 5);
});

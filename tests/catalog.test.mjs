import test from "node:test";
import assert from "node:assert/strict";
import { catalogGeneration } from "../scripts/lib/catalog-generation.mjs";
test("generation filters distinguish a species from its later forms", () => {
  assert.equal(catalogGeneration(1, 1, true, [9]), 1);
  assert.equal(catalogGeneration(1, 6, false, [6]), 6);
  assert.equal(catalogGeneration(1, 8, false, [8]), 8);
  assert.equal(catalogGeneration(1, undefined, false, [9]), 9);
  assert.equal(catalogGeneration(3, undefined, false, []), 3);
});

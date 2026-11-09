import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyAbility} from '../apps/web/src/lib/ability-categories.js';
test('ability navigation uses the primary effect and avoids incidental words',()=>{
 assert.equal(classifyAbility('On switch-in, this Pokemon summons Rain Dance.').id,'field');
 assert.equal(classifyAbility('This Pokemon is immune to Ground-type attacks. Gravity removes immunity.').id,'defense');
 assert.equal(classifyAbility("This Pokemon’s moves have their secondary effect chance doubled. This stacks with Rainbow.").id,'utility');
 assert.equal(classifyAbility('').id,'unknown');
 assert.equal(classifyAbility('This Pokemon restores HP.').id,'healing');
});

// CI21 C9 port of engine test/scripts/sunscar-matriarch.test.ts (engine blob edd0df93): every case, assertion and
// budget unchanged; engine and SDK imports are public exports. Scenario creation moves
// to beforeAll (as engine's far-reach-roc did), so each 2 s body times gameplay only.
import { builtFolder } from '@wildshard/engine/test/builtFolder';
import { beforeAll, expect, test } from 'vitest';
import { scenario, type DiskScriptScenario } from '@wildshard/dev/test/scriptScenario';

let directory: string;
// Disk admission and independent host allocation are fixture preparation, as in
// far-reach-roc: on a hosted runner they alone spent the 2 s body (CI 44011533102).
// The unchanged two-second bodies measure every gameplay/save/restore step.
let prepared: readonly [DiskScriptScenario, DiskScriptScenario, DiskScriptScenario] | undefined;
beforeAll(async () => {
  directory = builtFolder('sunscar-dunes');
  const create = () => scenario('sunscar-dunes', 'sunscar.matriarch.decision', { productDirectory: directory, seed: 6511,
    actors: [{ id: 'matriarch', at: [-14, 18, -150] }], players: [{ id: 101, at: [-14, 0, -130] }],
  });
  prepared = [await create(), await create(), await create()];
}, 120_000);
test('the published Matriarch guest flies, grounds and restores without replaying effects', async () => {
  if (prepared === undefined) throw new Error('Missing admitted Matriarch fixtures');
  const [boss, resumed] = prepared; boss.send('start');
  expect(boss.commands(),JSON.stringify(boss.trace().slice(-3))).toEqual([['move', 'matriarch', 'orbit'], ['timer', 'beat', 3]]);
  boss.advance(3); expect(boss.commands(), JSON.stringify({state:boss.state(),trace:boss.trace().slice(-12),metrics:boss.host.metrics()})).toContainEqual(['move', 'matriarch', 'dive', 101]);
  boss.send('strike.done', 'matriarch', 'maw', true);
  expect(boss.commands(),JSON.stringify(boss.trace().slice(-3))).toEqual([['timer', 'beat', 0], ['move', 'matriarch', 'climb']]);
  boss.send('move.done', 'matriarch', 'climb', true);
  expect(boss.commands(),JSON.stringify(boss.trace().slice(-3))).toEqual([['move', 'matriarch', 'orbit'], ['timer', 'beat', 5]]);
  boss.send('threshold', 'matriarch', 1); expect(boss.commands(),JSON.stringify(boss.trace().slice(-3))).toEqual([['move', 'matriarch', 'stormOrbit']]);
  boss.send('threshold', 'matriarch', 2);
  expect(boss.commands(),JSON.stringify(boss.trace().slice(-3))).toEqual([['stop', 'matriarch'], ['timer', 'beat', 0], ['move', 'matriarch', 'lie']]);
  boss.send('move.done', 'matriarch', 'lie', true); expect(boss.commands(),JSON.stringify(boss.trace().slice(-3))).toEqual([['move', 'matriarch', 'stalk', 101]]);
  boss.send('move.done', 'matriarch', 'stalk', true); expect(boss.commands(),JSON.stringify(boss.trace().slice(-3))).toEqual([['strike', 'matriarch', 'tail', 101]]);
  const saved = boss.save(); resumed.restore(structuredClone(saved));
  expect(resumed.host.metrics()[0]?.calls).toBe(0);
  for (const owner of [boss, resumed]) owner.send('strike.done', 'matriarch', 'tail', false);
  expect(resumed.commands()).toEqual(boss.commands()); expect(resumed.save()).toEqual(boss.save());
  resumed.send('death', 'matriarch'); expect(resumed.state()).toEqual({ step: 25 });
  expect(resumed.commands()).toEqual([['stop', 'matriarch'], ['timer', 'beat', 0]]);
  resumed.advance(8); expect(resumed.commands()).toEqual([]);
  resumed.send('stop'); expect(resumed.state()).toEqual({ step: 0 });
  expect(boss.maxFuel()).toBeLessThan(400_000);
  expect(boss.host.metrics()[0]).toMatchObject({ refusals: 0, disabled: false });
}, 2_000);
test('a retried fight in the storm starts circling at its kept phase', async () => {
  // A retry restores the guest's start state while the encounter keeps its phase: the phase arrives as a threshold
  // before the fight restarts, and the restarted fight must fly (it hung on its last idle steering and left the map).
  if (prepared === undefined) throw new Error('Missing admitted Matriarch fixtures');
  const boss = prepared[2];
  boss.send('threshold', 'matriarch', 1); expect(boss.commands()).toEqual([]); expect(boss.state()).toEqual({ step: 10 });
  boss.send('start');
  expect(boss.commands(), JSON.stringify(boss.trace().slice(-3))).toEqual([['move', 'matriarch', 'stormOrbit'], ['timer', 'beat', 3]]);
  boss.advance(3); expect(boss.commands()).toContainEqual(['move', 'matriarch', 'stormDive', 101]);
}, 2_000);

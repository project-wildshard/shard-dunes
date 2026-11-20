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
let prepared: readonly [DiskScriptScenario, DiskScriptScenario, DiskScriptScenario, DiskScriptScenario, DiskScriptScenario] | undefined;
beforeAll(async () => {
  directory = builtFolder('sunscar-dunes');
  const create = (y = 18, hpShare = 1) => scenario('sunscar-dunes', 'sunscar.matriarch.decision', { productDirectory: directory, seed: 6511,
    actors: [{ id: 'matriarch', at: [-14, y, -150], hpShare }], players: [{ id: 101, at: [-14, 0, -130] }],
  });
  // ONE-FORMAT OF19c1: aloft at full health (twice), aloft at the storm's 0.66, and on the basin floor (her declared spawn
  // stands there when her fight begins or a retry brings her back) at full and at the grounded 0.33
  prepared = [await create(), await create(), await create(18, 0.66), await create(-40, 1), await create(-40, 0.33)];
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
// ONE-FORMAT OF19c1: her decision is her declared encounter's, which stops and restarts it at every phase change and
// retry; a start reads her phase off her health and, standing on the basin floor, rises first.
test('a restarted fight reads its phase off her health, and rises from the basin floor', async () => {
  if (prepared === undefined) throw new Error('Missing admitted Matriarch fixtures');
  const [, , storm, floor, grounded] = prepared;
  storm.send('start');
  expect(storm.commands(), JSON.stringify(storm.trace().slice(-3))).toEqual([['move', 'matriarch', 'stormOrbit'], ['timer', 'beat', 3]]);
  storm.advance(3); expect(storm.commands()).toContainEqual(['move', 'matriarch', 'stormDive', 101]);
  floor.send('start'); expect(floor.commands(), JSON.stringify(floor.trace().slice(-3))).toEqual([['move', 'matriarch', 'rise']]);
  floor.send('move.done', 'matriarch', 'rise', true);
  expect(floor.commands(), JSON.stringify(floor.trace().slice(-3))).toEqual([['move', 'matriarch', 'orbit'], ['timer', 'beat', 3]]);
  grounded.send('start'); expect(grounded.commands(), JSON.stringify(grounded.trace().slice(-3))).toEqual([['move', 'matriarch', 'stalk', 101]]);
}, 2_000);

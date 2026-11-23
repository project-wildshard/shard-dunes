// ONE-FORMAT OF19b: the dune's creatures are declared rows the engine runs beside the runtime plan's keeper (OF19b0). The
// built product stands every home as a declared spawn, the keeper only the Matriarch; the first ray is held until the
// scout; a skitterer killed comes back after its respawn row's seconds (spawn, kill, refill), and the cell saves and
// restores them.
// oxlint-disable-next-line import/no-nodejs-modules -- The proof reads the admitted product and native physics.
import { readFileSync } from 'node:fs';
import { builtFolder } from '@wildshard/sdk/internal/engine/test/builtFolder';
import { expect, test } from 'vitest';
import { Vector3 } from 'three';
import { nativeRapierFile } from './fixtures/native-rapier-file';
import { loadHeadlessFolder } from '@wildshard/sdk/headless/host/headlessFolder';
import { outputDescriptor } from '@wildshard/sdk/headless/game/shardfile/outputDescriptor';
import { loadRapier } from '@wildshard/sdk/headless/physics/rapier';
import { createSimHost } from '@wildshard/sdk/internal/engine/sim';
import { snapshotSimHost } from '@wildshard/sdk/headless/sim/snapshot';
import { restoreSimHost } from '@wildshard/sdk/internal/engine/sim/restore';
import { prepareRuntimeWorld } from '@wildshard/sdk/internal/engine/game/plugin/simulation';
import { parseNativeRuntimePlan } from '@wildshard/format/nativeRuntimePlan';
import { leadPlayer } from '@wildshard/sdk/internal/engine/sim/leadPlayer';

const HOMES = 13, SKITTERER = 'sunscar.home:1', RAY = 'sunscar.home:0', RESPAWN_TICKS = 50 * 60;

test('every home is a declared spawn: held ray, pack and striders stand, a skitterer refills, the cell resumes', async () => {
  const directory = builtFolder('sunscar-dunes'), product = await loadHeadlessFolder(directory), descriptor = outputDescriptor(product.shardfile);
  if (descriptor === undefined) throw new Error('Missing admitted product');
  const shard = product.shardfile, plan = parseNativeRuntimePlan(product.section('sim/runtime-plan'));
  expect(shard.creatures.spawns.map(row => row.id)).toEqual([...Array.from({ length: HOMES }, (_, index) => `sunscar.home:${String(index)}`), 'sunscar.matriarch']);
  expect(plan.recipe.population.rows.homes).toEqual([]);
  expect(product.has('actors/species-programs')).toBe(false); // OF19d: the page draws its declared looks' rigs
  const assets = new Map(descriptor.index.files.map(file => [file.commons === true ? `commons:${file.hash}` : file.hash,
    Uint8Array.from(readFileSync(`${directory}/${file.path}`))]));
  const rapier = await loadRapier(Uint8Array.from(readFileSync(nativeRapierFile)));
  const world = await prepareRuntimeWorld(shard, assets, plan.baked, plan.recipe, descriptor.sections), host = createSimHost(world.level, { ...world.ports, rapier });
  world.install(host, { restoring: false, emit: () => undefined }).keeper.settle();
  for (const row of shard.creatures.spawns.filter(row => row.id !== 'sunscar.matriarch')) expect(host.entities.get(row.id)?.alive, row.id).toBe(true);
  // OF19c1: the keeper keeps nothing; the Matriarch is a declared spawned boss, out of the world until her fight begins
  expect(plan.recipe.population.rows.boss).toBeUndefined();
  expect(host.entities.get('sunscar.matriarch')?.alive).toBe(false);
  expect(host.entities.get('sunscar.matriarch')?.position.y).toBeLessThan(-1000);
  const ray = host.entities.get(RAY), skitterer = host.entities.get(SKITTERER);
  if (ray === undefined || skitterer === undefined) throw new Error('Missing declared bodies');
  host.step();
  expect(ray.mem['held']).toBe(1);
  host.flags.set('sunscar.scout'); host.step();
  expect(ray.mem['held']).toBe(0);
  const lead = leadPlayer(host);
  host.combat.hit({ source: lead.health, sourceTags: ['actor.player', 'dmg.melee'], target: skitterer.combatActor(), amount: 1000,
    point: skitterer.position.clone(), dir: new Vector3(0, 0, 1) });
  expect(skitterer.alive).toBe(false);
  for (let i = 0; i < RESPAWN_TICKS - 120; i++) host.step();
  expect(skitterer.alive).toBe(false);
  for (let i = 0; i < 240; i++) host.step();
  expect(skitterer.alive).toBe(true);
  const saved = snapshotSimHost(host);
  const resumed = restoreSimHost(world.level, { ...world.ports, rapier }, saved, fresh => {
    world.install(fresh, { restoring: true, emit: () => undefined, snapshot: saved }).keeper.settle();
  });
  try {
    for (let i = 0; i < 60; i++) { host.step(); resumed.step(); }
    for (const row of shard.creatures.spawns) expect(resumed.entities.get(row.id)?.position.toArray(), row.id).toEqual(host.entities.get(row.id)?.position.toArray());
  } finally { resumed.dispose(); host.dispose(); }
}, 60_000);

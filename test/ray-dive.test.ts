// ONE-FORMAT OF19d: the Dune Ray is a declared spawn on the declared host, and it still hunts: once the scout lets it go,
// a player standing still under its circle is noticed, dived at (the body drops from its glide to the chest) and struck by
// its swoop. The staging walk checks the same on the live server; this pins it on the built product.
// oxlint-disable-next-line import/no-nodejs-modules -- The proof reads the admitted product and native physics.
import { readFileSync } from 'node:fs';
import { builtFolder } from '@wildshard/sdk/internal/engine/test/builtFolder';
import { expect, test } from 'vitest';
import { nativeRapierFile } from './fixtures/native-rapier-file';
import { loadHeadlessFolder } from '@wildshard/sdk/headless/host/headlessFolder';
import { outputDescriptor } from '@wildshard/sdk/headless/game/shardfile/outputDescriptor';
import { loadRapier } from '@wildshard/sdk/headless/physics/rapier';
import { createSimHost } from '@wildshard/sdk/internal/engine/sim';
import { prepareRuntimeWorld } from '@wildshard/sdk/internal/engine/game/plugin/simulation';
import { parseNativeRuntimePlan } from '@wildshard/format/nativeRuntimePlan';
import { leadPlayer } from '@wildshard/sdk/internal/engine/sim/leadPlayer';
import { signalHeightAt } from '../src/generators/landscape';

const RAY_HOME = 'sunscar.home:0', TICKS = 50 * 40, CHEST = 3;

test('a freed Dune Ray dives at a player standing under its circle and its swoop lands', async () => {
  const directory = builtFolder('sunscar-dunes'), product = await loadHeadlessFolder(directory), descriptor = outputDescriptor(product.shardfile);
  if (descriptor === undefined) throw new Error('Missing admitted product');
  const plan = parseNativeRuntimePlan(product.section('sim/runtime-plan'));
  const assets = new Map(descriptor.index.files.map(file => [file.commons === true ? `commons:${file.hash}` : file.hash,
    Uint8Array.from(readFileSync(`${directory}/${file.path}`))]));
  const rapier = await loadRapier(Uint8Array.from(readFileSync(nativeRapierFile)));
  const world = await prepareRuntimeWorld(product.shardfile, assets, plan.baked, plan.recipe, descriptor.sections), host = createSimHost(world.level, { ...world.ports, rapier });
  try {
    world.install(host, { restoring: false, emit: () => undefined });
    const ray = host.entities.get(RAY_HOME); if (ray === undefined) throw new Error('Missing the first ray');
    host.flags.set('sunscar.scout'); host.step();
    const player = leadPlayer(host);
    // On the sand under the ray (the shard's own ground height); the player's own motor settles the feet.
    const x = ray.position.x + 3, z = ray.position.z + 3;
    player.position.set(x, signalHeightAt()(x, z) + 0.2, z);
    let swoops = 0, lowest = Infinity, highest = -Infinity;
    host.events.on('damage.dealt', event => { if (event.req.target === player.health) swoops++; }, host.scope);
    for (let i = 0; i < TICKS && swoops === 0; i++) {
      host.step();
      const above = ray.position.y - player.position.y;
      lowest = Math.min(lowest, above); highest = Math.max(highest, above);
    }
    expect(highest, 'glides above the player first').toBeGreaterThan(CHEST * 2);
    expect(lowest, 'dives to the chest').toBeLessThan(CHEST);
    expect(swoops, 'its swoop lands').toBeGreaterThan(0);
  } finally { host.dispose(); }
}, 60_000);

// J186 Ring 2, CI only, never a hook. The whole Signal quest on the built
// product: Sefa, logbook, well, three waymarks, the tower fire and the
// Matriarch, driven only by the inputs the page sends (walking, [E]
// prompts, whip cracks, attacks). No flag, pose or quest state is written;
// the fight reads where the Matriarch is to aim, as a player's eyes do.
import '@wildshard/engine/scripts/sim-node-loader.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { test } from 'node:test';

const { loadHeadlessProduct } = await import('@wildshard/engine/host/headlessProduct');
const { createTrustedHeadlessResident } = await import('@wildshard/engine/host/headlessRuntime');
const { runTrustedHeadlessTape } = await import('@wildshard/engine/host/headlessTape');
const { outputDescriptor, serverReadsFile } = await import('@wildshard/engine/game/shardfile/outputDescriptor');
const { loadRapier } = await import('@wildshard/engine/physics/rapier');
const engineRequire = createRequire(import.meta.resolve('@wildshard/engine/package.json'));

// The [E] prompts and world cracks the page sends (SIGNAL_ACT in signalInteractions.ts).
const ACT = { talk: 0, logbook: 1, well: 2, pour: 3, fire: 6, crank: 100, light: 101 };
const MATRIARCH = 'sunscar.matriarch';
const press = (id, value, settle = 0) => [{ id, ticks: 1, commands: [{ kind: 'script', actorId: 'sunscar.interact', value }] },
  ...(settle > 0 ? [{ id: `${id}-settle`, ticks: settle, commands: [] }] : [])];
const walk = (id, points, ticks = 6000) => ({ id, ticks, commands: [], route: points.map(([x, z]) => ({ x, z })) });
// Up the tower's south stair to the deck beside the signal brazier, and back down.
const UP_STAIR = [[10.5, -56], [8.75, -58.5], [8.75, -73.4], [8.2, -74.7]], DOWN_STAIR = [[8.2, -74.7], [8.75, -73.4], [8.75, -58.5], [12, -60]];

const SEGMENTS = [
  ...press('distant-logbook', ACT.logbook),
  walk('walk-to-sefa', [[0, 70], [6, 73]], 1200),
  ...press('talk-to-sefa', ACT.talk),
  walk('walk-to-caravan', [[6, 73], [-36, 52], [-70, 32], [-76.6, 32.4]], 3600),
  ...press('read-logbook', ACT.logbook),
  walk('walk-to-well', [[-76.6, 32.4], [-70, 32], [-36, 52], [0, 66], [44, 40], [78, -2], [81.5, -5]]),
  ...press('oil-before-crank', ACT.well),
  ...press('heavy-crack-crank', ACT.crank, 90),
  ...press('take-oil', ACT.well),
  walk('walk-to-east-waymark', [[81, -5.3], [78, -2], [66, -22], [58, -31], [58, -32.2]]),
  ...press('light-east-unoiled', ACT.light, 60),
  ...press('pour-east', ACT.pour),
  ...press('light-east', ACT.light, 60),
  walk('walk-to-west-waymark', [[58, -32.2], [58, -31], [30, -14], [4, -4], [-20, -12], [-41, -21], [-42.5, -21.5]]),
  ...press('pour-west', ACT.pour + 1),
  ...press('light-west', ACT.light + 1, 60),
  walk('climb-tower-early', [[-42.5, -21.5], [-41, -21], [-14, -20], [5, -30], ...UP_STAIR]),
  ...press('fire-before-north', ACT.fire, 10),
  walk('walk-to-north-waymark', [...DOWN_STAIR, [14, -70], [24, -88], [32, -99], [35, -100.3]]),
  ...press('pour-north', ACT.pour + 2),
  ...press('light-north', ACT.light + 2, 60),
  walk('climb-tower', [[35, -100.3], [32, -99], [24, -88], [14, -70], [12, -60], ...UP_STAIR]),
  ...press('light-signal-fire', ACT.fire, 30),
  walk('walk-to-basin', [...DOWN_STAIR, [14, -70], [24, -88], [14, -90], [6, -84], [-6, -100], [-14, -140]], 8000),
];
// What each input earns (flags present, flags still absent, the quest's current step after it).
const EXPECT = {
  'distant-logbook': { absent: ['sunscar.logbook'], step: 'scout' },
  'talk-to-sefa': { flags: ['sunscar.scout'], step: 'logbook' },
  'read-logbook': { flags: ['sunscar.logbook'], step: 'oil' },
  'oil-before-crank': { absent: ['sunscar.oil'], step: 'oil' },
  'take-oil': { flags: ['sunscar.oil'], step: 'waymarks' },
  'light-east-unoiled-settle': { absent: ['sunscar.brazier.0'] },
  'light-east-settle': { flags: ['sunscar.brazier.0'], step: 'waymarks' },
  'light-west-settle': { flags: ['sunscar.brazier.1'], step: 'waymarks' },
  'fire-before-north-settle': { absent: ['sunscar.lit'] },
  'light-north-settle': { flags: ['sunscar.brazier.2'], step: 'fire' },
  'light-signal-fire': { flags: ['sunscar.lit'], step: 'matriarch' },
  'walk-to-basin': { absent: ['sunscar.matriarch.down', 'sunscar.complete'], step: 'matriarch' },
};
const FIGHT_TICKS = 9000;

test('sunscar-dunes: the full Signal journey on real inputs', { timeout: 9_500 }, async () => {
  const started = performance.now(), directory = resolve('out/sunscar-dunes'), product = await loadHeadlessProduct(directory), shard = product.shardfile;
  const descriptor = outputDescriptor(shard); assert.ok(descriptor, 'The built shard must pass admission');
  const assets = new Map(descriptor.index.files.filter(file => serverReadsFile(file, shard.terrain?.collider) && (file.name === undefined || file.kind === 'wasm' || file.kind === 'tile'))
    .map(file => [file.commons === true ? `commons:${file.hash}` : file.hash, readFileSync(join(directory, file.path))]));
  const rapier = await loadRapier(readFileSync(engineRequire.resolve('@dimforge/rapier3d-simd/rapier_wasm3d_bg.wasm')));
  const resident = await createTrustedHeadlessResident({ shard, assets, product, rapier }), { host } = resident;
  try {
    const report = runTrustedHeadlessTape(host, input => { resident.step(input); }, () => resident.effects, { version: 1, observe: [], segments: SEGMENTS });
    for (const [id, fact] of Object.entries(EXPECT)) {
      const at = report.observations.find(row => row.id === id); assert.ok(at, `Missing observation ${id}`);
      for (const flag of fact.flags ?? []) assert.ok(at.flags.includes(flag), `${id} must earn ${flag}`);
      for (const flag of fact.absent ?? []) assert.ok(!at.flags.includes(flag), `${id} must not earn ${flag}`);
      if (fact.step !== undefined) assert.equal(at.quests.find(row => row.id === 'sunscar.signal')?.currentId, fact.step, `${id} leaves the quest on ${fact.step}`);
    }
    // The fire summoned the Matriarch: face her, close to whip reach, crack at her until she falls.
    const player = [...host.players.values()][0]; assert.ok(player);
    let won = -1;
    for (let tick = 0; tick < FIGHT_TICKS && won < 0; tick++) {
      const boss = host.entities.get(MATRIARCH), command = { kind: 'player', moveX: 0, moveZ: 0, yaw: player.yaw ?? 0 };
      if (boss !== undefined) {
        const dx = boss.position.x - player.position.x, dz = boss.position.z - player.position.z, distance = Math.hypot(dx, dz);
        command.yaw = Math.atan2(-dx, -dz); command.attack = { targetId: MATRIARCH };
        if (distance > 5) { command.moveX = dx / distance; command.moveZ = dz / distance; }
      }
      resident.step([command]);
      if ([...host.flags.all].includes('sunscar.matriarch.down')) won = tick;
    }
    const flags = [...host.flags.all];
    assert.ok(won >= 0, `The Matriarch must fall within ${FIGHT_TICKS} ticks`);
    for (const flag of ['sunscar.matriarch.down', 'sunscar.matriarch.defeated', 'sunscar.matriarch.paid', 'sunscar.complete']) assert.ok(flags.includes(flag), `Victory must earn ${flag}`);
    const quest = host.quests.find(row => row.def.id === 'sunscar.signal'); assert.ok(quest?.isComplete, 'The Signal quest must be complete');
    console.log(`signal-journey ${JSON.stringify({ questTicks: report.ticks, fightTicks: won + 1, elapsedMs: Math.round(performance.now() - started) })}`);
  } finally { resident.dispose(); }
});

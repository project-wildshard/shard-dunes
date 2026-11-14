// The Signal quest's page inputs, shared by the CI-only journeys (J186 Ring 2,
// never a hook): signal-journey.test.mjs plays it, durable-ledger.test.mjs
// plays it, saves, restores and plays on. Only what the page sends: walking,
// [E] prompts, whip cracks and attacks; nothing here writes world state.
import '@wildshard/engine/scripts/sim-node-loader.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

const { loadHeadlessProduct } = await import('@wildshard/engine/host/headlessProduct');
const { outputDescriptor, serverReadsFile } = await import('@wildshard/engine/game/shardfile/outputDescriptor');
const { loadRapier } = await import('@wildshard/engine/physics/rapier');
const engineRequire = createRequire(import.meta.resolve('@wildshard/engine/package.json'));

// The [E] prompts and world cracks the page sends (SIGNAL_ACT in signalInteractions.ts).
export const ACT = { talk: 0, logbook: 1, well: 2, pour: 3, fire: 6, crank: 100, light: 101 };
export const MATRIARCH = 'sunscar.matriarch';
export const press = (id, value, settle = 0) => [{ id, ticks: 1, commands: [{ kind: 'script', actorId: 'sunscar.interact', value }] },
  ...(settle > 0 ? [{ id: `${id}-settle`, ticks: settle, commands: [] }] : [])];
export const walk = (id, points, ticks = 6000) => ({ id, ticks, commands: [], route: points.map(([x, z]) => ({ x, z })) });
// Up the tower's south stair to the deck beside the signal brazier, and back down.
export const UP_STAIR = [[10.5, -56], [8.75, -58.5], [8.75, -73.4], [8.2, -74.7]], DOWN_STAIR = [[8.2, -74.7], [8.75, -73.4], [8.75, -58.5], [12, -60]];
// From the tower's foot round to the Matriarch's basin, the way the fire sends you.
export const TOWER_TO_BASIN = [[14, -70], [24, -88], [14, -90], [6, -84], [-6, -100], [-14, -140]];

export const SEGMENTS = [
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
  // The fire summons the Matriarch; a room (HS1's world) holds every player in her arena still through her intro.
  ...press('light-signal-fire', ACT.fire, 300),
  walk('walk-to-basin', [...DOWN_STAIR, ...TOWER_TO_BASIN], 8000),
];
// What each input earns (flags present, flags still absent, the quest's current step after it).
export const EXPECT = {
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
export const FIGHT_TICKS = 9000;

/** The built output's admitted server files and the native physics, as the headless worker reads them. */
export async function loadSignalOutput() {
  const directory = resolve('out/sunscar-dunes'), product = await loadHeadlessProduct(directory), shard = product.shardfile;
  const descriptor = outputDescriptor(shard); assert.ok(descriptor, 'The built shard must pass admission');
  const assets = new Map(descriptor.index.files.filter(file => serverReadsFile(file, shard.terrain?.collider) && (file.name === undefined || file.kind === 'wasm' || file.kind === 'tile'))
    .map(file => [file.commons === true ? `commons:${file.hash}` : file.hash, readFileSync(join(directory, file.path))]));
  const rapier = await loadRapier(readFileSync(engineRequire.resolve('@dimforge/rapier3d-simd/rapier_wasm3d_bg.wasm')));
  return { shard, assets, product, rapier };
}

/** Face the Matriarch, close to whip reach and attack her until she falls: the tick she fell on, or -1.
 *  Reads where she stands only to aim, as a player's eyes do. `each` sees every tick's effects. */
export function fightMatriarch(resident, each = () => {}) {
  const { host } = resident, player = [...host.players.values()][0]; assert.ok(player);
  for (let tick = 0; tick < FIGHT_TICKS; tick++) {
    const boss = host.entities.get(MATRIARCH), command = { kind: 'player', moveX: 0, moveZ: 0, yaw: player.yaw ?? 0 };
    if (boss !== undefined) {
      const dx = boss.position.x - player.position.x, dz = boss.position.z - player.position.z, distance = Math.hypot(dx, dz);
      command.yaw = Math.atan2(-dx, -dz); command.attack = { targetId: MATRIARCH };
      if (distance > 5) { command.moveX = dx / distance; command.moveZ = dz / distance; }
    }
    resident.step([command]); each(resident.effects);
    if ([...host.flags.all].includes('sunscar.matriarch.down')) return tick;
  }
  return -1;
}

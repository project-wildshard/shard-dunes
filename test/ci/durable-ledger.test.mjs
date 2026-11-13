// J186 SH-dunes-4, CI only, never a hook. The Signal quest's Ledger is
// durable on the built product. Played on page inputs only (signal-route.mjs),
// the quest and the Matriarch each file their Ledger fact once, exactly the
// built product's Ledger rules (rows/ledger.ts), and pay their purse once.
// The world is then saved with the worker's own commit encoding and restored
// from that wire alone into a fresh residency: same tick, regional
// continuation, flags and complete quest. Playing on by the same real inputs
// files nothing again: striking the fallen Matriarch's body, climbing back
// to the brazier and lighting the signal fire from the very deck it was first
// lit from, and walking back down to her basin.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ACT, DOWN_STAIR, MATRIARCH, SEGMENTS, TOWER_TO_BASIN, UP_STAIR, fightMatriarch, loadSignalProduct, press, walk } from './signal-route.mjs';

const { openWorld } = await import('@wildshard/engine/host/openWorld');
const { runTrustedHeadlessTape } = await import('@wildshard/engine/host/headlessTape');
const { regionalContinuation, serializeSimSnapshot, snapshotSimHostBytes } = await import('@wildshard/engine/sim/snapshot');

const LEDGER = new Set(['fact', 'coins']);
const ledger = effects => effects.filter(row => LEDGER.has(row.kind));
const flags = host => [...host.flags.all].sort();
const signal = host => host.quests.find(row => row.def.id === 'sunscar.signal');
const tape = (resident, segments) => runTrustedHeadlessTape(resident.host, input => { resident.step(input); }, () => resident.effects, { version: 1, observe: [], segments }).observations;
const PLAY_ON = [
  walk('back-to-tower', [...[...TOWER_TO_BASIN].reverse(), [12, -60], ...UP_STAIR], 8000),
  ...press('relight-signal-fire', ACT.fire, 300),
  walk('back-to-basin', [...DOWN_STAIR, ...TOWER_TO_BASIN], 8000),
];

test('sunscar-dunes: the Signal Ledger files once and stays filed across a durable restore', { timeout: 9_500 }, async () => {
  const started = performance.now(), input = await loadSignalProduct();
  let resident = (await openWorld(input, { room: true })).resident;
  try {
    const journey = tape(resident, SEGMENTS), earned = journey.flatMap(row => row.effects);
    const won = fightMatriarch(resident, effects => { earned.push(...effects); });
    assert.ok(won >= 0, 'The Matriarch must fall');
    for (let tick = 0; tick < 60; tick++) { resident.step([]); earned.push(...resident.effects); }
    assert.deepEqual(ledger(earned), [
      { kind: 'fact', name: 'sunscar.signal', actorId: 'sunscar.signal' }, { kind: 'coins', amount: 5, actorId: 'actor.player' },
      // A room (HS1's world) pays a kill's purse to the player who earned it, not to the body (J105).
      { kind: 'fact', name: 'sunscar.matriarch', actorId: 'sunscar.matriarch' }, { kind: 'coins', amount: 20, actorId: 'actor.player' },
    ], 'The quest and the Matriarch each file one Ledger fact and pay one purse');
    // Every rule in the built product's Ledger is earned by play, and nothing it has no rule for is filed.
    assert.deepEqual(earned.filter(row => row.kind === 'fact').map(row => row.name).sort(), input.shard.ledger.map(rule => rule.fact).sort(), 'The filed facts are exactly the product Ledger');
    const firstFire = journey.find(row => row.id === 'light-signal-fire'); assert.ok(firstFire);

    // The durable save: the worker's commit encoding, restored from the wire alone into a fresh residency.
    const { host } = resident, tick = host.state.tick, regional = regionalContinuation(host), saved = flags(host);
    const wire = serializeSimSnapshot(snapshotSimHostBytes(host));
    resident.dispose(); resident = undefined; resident = (await openWorld(input, { room: true, snapshot: wire })).resident;
    const restored = resident.host;
    assert.notEqual(restored, host);
    assert.equal(restored.state.tick, tick, 'The restored world keeps its tick');
    assert.equal(regionalContinuation(restored), regional, 'The restored world keeps its regional continuation');
    assert.deepEqual(flags(restored), saved, 'The restored world keeps every flag');
    for (const flag of ['sunscar.complete', 'sunscar.matriarch.defeated', 'sunscar.matriarch.paid']) assert.ok(saved.includes(flag), `The save holds ${flag}`);
    assert.ok(signal(restored)?.isComplete, 'The restored Signal quest stays complete');

    const fallen = restored.entities.get(MATRIARCH); assert.ok(fallen);
    assert.ok(fallen.hp === 0 && fallen.alive === false, `The Matriarch is restored fallen (hp ${fallen.hp}, alive ${fallen.alive})`);

    // Play on: stand over the fallen Matriarch striking her, then relight the fire from the deck and walk back down.
    // Only quest-step flags make the quest re-check, so its completion is read again at the end, not inferred from silence.
    const after = [];
    let inReach = 0;
    for (let tick = 0; tick < 90; tick++) {
      const player = [...restored.players.values()][0]; assert.ok(player);
      const dx = fallen.position.x - player.position.x, dz = fallen.position.z - player.position.z, distance = Math.hypot(dx, dz);
      if (distance <= 6) inReach++;
      resident.step([{ kind: 'player', moveX: distance > 5 ? dx / distance : 0, moveZ: distance > 5 ? dz / distance : 0, yaw: Math.atan2(-dx, -dz), attack: { targetId: MATRIARCH } }]);
      after.push(...resident.effects);
    }
    assert.ok(inReach > 60, `The player stands in whip reach of her body (${inReach} of 90 ticks)`);
    assert.ok(!restored.flags.has('dead:actor.player'), 'The player is alive while striking her');
    const playOn = tape(resident, PLAY_ON); after.push(...playOn.flatMap(row => row.effects));
    const relight = playOn.find(row => row.id === 'relight-signal-fire'); assert.ok(relight);
    assert.ok(Math.hypot(relight.position[0] - firstFire.position[0], relight.position[1] - firstFire.position[1], relight.position[2] - firstFire.position[2]) < 1,
      `The fire is relit from the deck it was first lit from: ${relight.position} vs ${firstFire.position}`);
    assert.deepEqual(ledger(after), [], 'Nothing files or pays again after the restore');
    assert.ok(signal(restored)?.isComplete, 'The Signal quest stays complete');
    assert.ok(fallen.hp === 0 && fallen.alive === false && restored.entities.get(MATRIARCH) === fallen, 'The Matriarch stays fallen');
    console.log(`durable-ledger ${JSON.stringify({ tick, fightTicks: won + 1, wireChars: wire.length, playOnTicks: restored.state.tick - tick, elapsedMs: Math.round(performance.now() - started) })}`);
  } finally { resident?.dispose(); }
});

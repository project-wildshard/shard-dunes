// J186 Ring 2, CI only, never a hook. The whole Signal quest on the built
// product: Sefa, logbook, well, three waymarks, the tower fire and the
// Matriarch, driven only by the inputs the page sends (walking, [E]
// prompts, whip cracks, attacks). No flag, pose or quest state is written;
// the fight reads where the Matriarch is to aim, as a player's eyes do.
// The route itself lives in signal-route.mjs.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { EXPECT, FIGHT_TICKS, SEGMENTS, fightMatriarch, loadSignalProduct } from './signal-route.mjs';

const { createTrustedHeadlessResident } = await import('@wildshard/engine/host/headlessRuntime');
const { runTrustedHeadlessTape } = await import('@wildshard/engine/host/headlessTape');

test('sunscar-dunes: the full Signal journey on real inputs', { timeout: 9_500 }, async () => {
  const started = performance.now();
  const resident = await createTrustedHeadlessResident(await loadSignalProduct()), { host } = resident;
  try {
    const report = runTrustedHeadlessTape(host, input => { resident.step(input); }, () => resident.effects, { version: 1, observe: [], segments: SEGMENTS });
    for (const [id, fact] of Object.entries(EXPECT)) {
      const at = report.observations.find(row => row.id === id); assert.ok(at, `Missing observation ${id}`);
      for (const flag of fact.flags ?? []) assert.ok(at.flags.includes(flag), `${id} must earn ${flag}`);
      for (const flag of fact.absent ?? []) assert.ok(!at.flags.includes(flag), `${id} must not earn ${flag}`);
      if (fact.step !== undefined) assert.equal(at.quests.find(row => row.id === 'sunscar.signal')?.currentId, fact.step, `${id} leaves the quest on ${fact.step}`);
    }
    // The fire summoned the Matriarch: face her, close to whip reach, crack at her until she falls.
    const won = fightMatriarch(resident);
    const flags = [...host.flags.all];
    assert.ok(won >= 0, `The Matriarch must fall within ${FIGHT_TICKS} ticks`);
    for (const flag of ['sunscar.matriarch.down', 'sunscar.matriarch.defeated', 'sunscar.matriarch.paid', 'sunscar.complete']) assert.ok(flags.includes(flag), `Victory must earn ${flag}`);
    const quest = host.quests.find(row => row.def.id === 'sunscar.signal'); assert.ok(quest?.isComplete, 'The Signal quest must be complete');
    console.log(`signal-journey ${JSON.stringify({ questTicks: report.ticks, fightTicks: won + 1, elapsedMs: Math.round(performance.now() - started) })}`);
  } finally { resident.dispose(); }
});

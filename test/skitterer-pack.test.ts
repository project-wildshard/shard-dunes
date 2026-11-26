// CI21 C9 port of engine test/scripts/skitterer-pack.test.ts (engine blob 2eee9aa0): every case, assertion and
// budget unchanged; engine and SDK imports are public exports;
// physics bytes come from the installed engine's rapier package (identical bytes).
// oxlint-disable-next-line import/no-nodejs-modules -- The scenario reads the admitted product and native physics.
import { readFileSync } from 'node:fs';
import { builtFolder } from '@wildshard/sdk/internal/engine/test/builtFolder';
import { beforeAll, expect, test, vi } from 'vitest';
import { nativeRapierFile } from './fixtures/native-rapier-file';
import { loadHeadlessFolder } from '@wildshard/sdk/headless/host/headlessFolder';
import { actorDecisionRows, parseDecisionScripts } from '@wildshard/format/decisionScripts';
import { parseActorMoves } from '@wildshard/format/actorMoves';
import { parseWorldTargets } from '@wildshard/format/worldTargets';
import { readCreatureStrikes } from '@wildshard/format/creatures';
import { decisionStrikeRows } from '@wildshard/sdk/projectDecisions';
import { buildDecisionRegistries, decisionBindingMap, DECISION_PLAYER_HANDLE } from '@wildshard/format/decisionBindings';
import { DecisionHost, type DecisionScript, type DecisionTrace } from '@wildshard/sdk/internal/engine/script/decision';
import { DecisionModule } from '@wildshard/sdk/internal/engine/script/decisionModule';
import { ScenarioWorld, scenario } from '@wildshard/dev/test/scriptScenario';
import { SCRIPT_V1_READS, SCRIPT_V1_LISTS, type ScriptV1ReadName, type ScriptV1ListName } from '@wildshard/format/scriptAbiV1';
import { outputDescriptor } from '@wildshard/sdk/headless/game/shardfile/outputDescriptor';
import { loadRapier } from '@wildshard/sdk/headless/physics/rapier';
import { createSimHost } from '@wildshard/sdk/internal/engine/sim';
import { snapshotSimHost } from '@wildshard/sdk/headless/sim/snapshot';
import { restoreSimHost } from '@wildshard/sdk/internal/engine/sim/restore';
import { prepareRuntimeWorld } from '@wildshard/sdk/internal/engine/game/plugin/simulation';
import { nativeRuntimeActorIds, parseNativeRuntimePlan } from '@wildshard/format/nativeRuntimePlan';
import { leadPlayer } from '@wildshard/sdk/internal/engine/sim/leadPlayer';

let directory: string;
beforeAll(() => { directory = builtFolder('sunscar-dunes'); });

async function pack(seed = 6511) {
  const product = await loadHeadlessFolder(directory), source = product.shardfile, descriptor = outputDescriptor(source);
  if (descriptor === undefined) throw new Error('Missing admitted product');
  const { sections } = descriptor;
  const rows = parseDecisionScripts(sections.get('sim/scripts'));
  const row = rows.find(candidate => 'spawnGroup' in candidate.binding);
  if (row === undefined) throw new Error('Missing pack row');
  const registries = buildDecisionRegistries(source, parseActorMoves(sections.get('actors/moves')), parseWorldTargets(sections.get('world/targets')),
    decisionStrikeRows(source, readCreatureStrikes(sections.get('actors/strikes'))), rows, source.runtime === null ? nativeRuntimeActorIds(sections.get('sim/runtime-plan')) : []);
  const scripts: DecisionScript[] = [];
  for (const member of actorDecisionRows(row)) scripts.push({ ...member, ids: decisionBindingMap(member, registries).ids,
    state: member.state.map(slot => { if (slot.scope !== 'actor') throw new Error('Pack slots must be actor-scoped'); return { ...slot, scope: slot.scope }; }),
    reads: member.reads.filter((name): name is ScriptV1ReadName => Object.hasOwn(SCRIPT_V1_READS, name)),
    lists: member.reads.filter((name): name is ScriptV1ListName => Object.hasOwn(SCRIPT_V1_LISTS, name)),
  });
  const bindings = scripts.map((script, index) => {
    const self = Object.values(script.ids.actors ?? {})[0]; if (self === undefined) throw new Error('Missing pack actor');
    return { id: index + 1, self, script: script.id, actors: [self], instance: 0 };
  });
  const world = new ScenarioWorld({ actors: bindings.map((binding, index) => ({ id: binding.self, at: [index === 0 ? 5 : 100, 0, 0], fields: { 4: 1 } })),
    players: [{ id: DECISION_PLAYER_HANDLE, at: [0, 0, 0] }] });
  const trace: DecisionTrace[] = [], file = descriptor.index.files.find(candidate => candidate.path === row.module);
  if (file?.name === undefined) throw new Error('Missing module');
  const host = new DecisionHost({ scripts, bindings, modules: new Map([[row.module, await product.file(file.name)]]), world, seed: [seed, 0],
    trace: entry => { trace.push(structuredClone(entry)); } });
  let tick = 0;
  return { host, world, trace, scripts, bindings, step: (count: number) => { for (let i = 0; i < count; i++) host.step(++tick); } };
}

test('one pack row surfaces, ring-runs, retreats and burrows with independent seeded actor state', async () => {
  const a = await pack(), b = await pack(), first = a.bindings[0], script = a.scripts[0];
  if (first === undefined || script === undefined) throw new Error('Missing first member');
  for (const p of [a, b]) { for (const binding of p.bindings) p.host.enqueue(binding.id, [1, 0, 0, 0, 0, 0]); p.step(7); }
  expect(a.host.snapshot()).toEqual(b.host.snapshot()); expect(a.bindings).toHaveLength(10);
  const disk = await scenario('sunscar-dunes', 'sunscar.skitterer.decision', { productDirectory: directory, seed: 6511,
    actors: a.world.snapshot().actors ?? [], players: a.world.snapshot().players ?? [] });
  disk.send('start');
  expect(disk.host.snapshot().bindings.map(binding => binding.slots)).toEqual(a.host.snapshot().bindings.map(binding => binding.slots));
  expect(a.host.state(1)['step']).toBe(1); expect(a.host.state(2)['step']).toBe(0);
  expect(new Set(a.bindings.map(binding => a.host.state(binding.id)['ring'])).size).toBeGreaterThan(1);
  const move = script.ids.moves ?? {}, surface = move['surface']; if (surface === undefined) throw new Error('Missing surface');
  a.host.enqueue(1, [10, first.self, surface, 1, 0, 0]); a.step(6);
  expect(a.host.state(1)['step']).toBe(2);
  expect(a.trace.some(entry => entry.kind === 'call' && entry.commands.some(command => command[0] === 1 && command[2] === move[`ring${a.host.state(1)['ring']}`]))).toBe(true);
  a.world.setActor({ id: first.self, at: [5, 0, 0], fields: { 4: 0 }, moving: false }); a.step(6);
  expect(a.world.snapshot().actors?.find(actor => actor.id === first.self)?.moving).toBe(true);
  a.world.setActor({ id: first.self, at: [0.5, 0, 0], fields: { 4: 0 } }); a.step(6);
  expect(a.host.state(1)['step']).toBe(4);
  a.world.setActor({ id: first.self, at: [0.5, 0, 0], fields: { 4: 0 }, strikeState: 3 }); a.step(6);
  expect(a.host.state(1)['step']).toBe(3);
  a.world.setActor({ id: first.self, at: [100, 0, 0], fields: { 4: 0 }, strikeState: 0 }); a.step(312);
  expect(a.host.state(1)['step']).toBe(0); expect(a.host.state(2)['step']).toBe(0);
  expect(a.trace.some(entry => entry.kind === 'call' && entry.commands.some(command => command[0] === 1 && command[2] === move['burrow']))).toBe(true);
  const saved = a.host.snapshot(), fresh = await pack(), invoke = vi.spyOn(DecisionModule.prototype, 'invoke');
  try { fresh.world.restore(a.world.snapshot()); fresh.host.restore(saved); expect(invoke).not.toHaveBeenCalled(); } finally { invoke.mockRestore(); }
  for (let tick = saved.tick + 1; tick <= saved.tick + 120; tick++) { a.host.step(tick); fresh.host.step(tick); }
  expect(fresh.host.snapshot()).toEqual(a.host.snapshot());
  expect(a.host.metrics().every(metric => metric.refusals === 0 && metric.maxFuel < 400_000)).toBe(true);
}, 5_000);

test('native pack uses one module, real contacts and an exact fresh-host continuation', async () => {
  const product = await loadHeadlessFolder(directory), descriptor = outputDescriptor(product.shardfile);
  if (descriptor === undefined) throw new Error('Missing product');
  const plan = parseNativeRuntimePlan(product.section('sim/runtime-plan'));
  const assets = new Map(descriptor.index.files.map(file => [file.commons === true ? `commons:${file.hash}` : file.hash,
    Uint8Array.from(readFileSync(`${directory}/${file.path}`))]));
  const rapier = await loadRapier(Uint8Array.from(readFileSync(nativeRapierFile)));
  const world = await prepareRuntimeWorld(product.shardfile, assets, plan.baked, plan.recipe, descriptor.sections), host = createSimHost(world.level, { ...world.ports, rapier });
  let resumed: ReturnType<typeof restoreSimHost> | undefined;
  // ONE-FORMAT OF19b: the pack members are declared spawns; the declared host's `ShardDecisions` runs their one module
  // (it starts at install), not the keeper's borrowed authority, so the keeper-only restart and `mem` checks went
  const calls = vi.spyOn(DecisionModule.prototype, 'invoke');
  try {
    world.install(host, { restoring: false, emit: () => undefined });
    const actor = host.entities.get('sunscar.home:1'); if (actor === undefined) throw new Error('Missing pack member');
    leadPlayer(host).position.copy(actor.position); leadPlayer(host).position.z += 1;
    let hits = 0; host.events.on('damage.dealt', event => { if (event.req.target === leadPlayer(host).health) hits++; }, host.scope);
    for (let i = 0; i < 240; i++) host.step();
    // OF19c1: the Matriarch's decision row is the declared host's too (her encounter's), so two modules start
    expect(calls.mock.calls.filter(call => call[0] === 'ws_init')).toHaveLength(2);
    expect(calls.mock.calls.filter(call => call[0] === 'ws_handle').length).toBeLessThanOrEqual(400);
    calls.mockClear();
    expect(hits).toBeGreaterThan(0);
    const saved = snapshotSimHost(host);
    resumed = restoreSimHost(world.level, { ...world.ports, rapier }, saved, fresh => {
      world.install(fresh, { restoring: true, emit: () => undefined, snapshot: saved });
    });
    expect(calls.mock.calls.filter(call => call[0] === 'ws_handle')).toHaveLength(0);
    // OF19c1: the Matriarch's decision row is the declared host's too (her encounter's), so two modules start
    expect(calls.mock.calls.filter(call => call[0] === 'ws_init')).toHaveLength(2);
    for (let i = 0; i < 120; i++) { host.step(); resumed.step(); }
    expect(snapshotSimHost(resumed)).toEqual(snapshotSimHost(host));
  } finally { calls.mockRestore(); resumed?.dispose(); host.dispose(); }
}, 30_000);

// CI21 C9: the ordinary-runtime path of engine test/fixtures/headless/productSession.ts
// (engine blob 5292da61), which the Signal original replayed through: a worker made by
// HeadlessSimulation.create with advisory timing and the product's headless sections,
// and no product folder. Engine 0.1.32's exported productSession also passes the built
// folder, so its worker runs the room's world (openWorldAdapter), while the Signal
// runner records on the bare createNativeHeadlessResident. The two worlds part two
// ticks after sunscar.lit (tick 9280: the room's Matriarch fight). That is not replay
// drift: a room-world recorder replays through the exported productSession exactly,
// but on the room world the unchanged SignalTape wins without the storm-phase death
// the original case requires. So the original bare/bare pair stays (mini-replay).
// oxlint-disable-next-line import/no-unassigned-import -- The sim's Math goes in before any module body runs.
import '@wildshard/engine/core/portableMathFirst';
// oxlint-disable-next-line import/no-nodejs-modules -- Read the admitted product's own files.
import {readFileSync} from 'node:fs';
import {HeadlessSimulation} from '@wildshard/engine/host/headless';
import {loadHeadlessFolder} from '@wildshard/engine/host/headlessFolder';
import {folderHeadlessSections} from '@wildshard/engine/host/headlessSections';
import {outputDescriptor} from '@wildshard/engine/game/shardfile/outputDescriptor';
import {builtFolder} from '@wildshard/engine/test/builtFolder';

type ProductSimulation=Pick<HeadlessSimulation,'verbTape'|'verbTapePart'|'streamVerbTape'|'journey'|'walkLeg'|'step'|'dispose'|'quarantined'|'checkpoint'>;

/** The same checked product and ordinary native runtime as the original Signal journey. */
export async function openProductSession(slug:string,snapshot?:string):Promise<{sim:ProductSimulation;product:Awaited<ReturnType<typeof loadHeadlessFolder>>}> {
  const directory=builtFolder(slug),product=await loadHeadlessFolder(directory),descriptor=outputDescriptor(product.shardfile);
  if(descriptor===undefined)throw new Error('Missing admitted headless inventory');
  const assets=new Map(descriptor.index.files.map(file=>[file.commons===true?`commons:${file.hash}`:file.hash,Uint8Array.from(readFileSync(`${directory}/${file.path}`))]));
  const sim=await HeadlessSimulation.create(product.shardfile,assets,snapshot,{deadline:'advisory',sections:folderHeadlessSections(product)});
  return {sim,product};
}

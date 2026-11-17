// CI21 C9: the ordinary-runtime path of engine test/fixtures/headless/productSession.ts
// (engine blob 5292da61), which the Signal original replayed through: a worker made by
// HeadlessSimulation.create with advisory timing and the product's headless sections,
// and no product folder. Engine 0.1.32's exported productSession also passes the built
// folder, so its worker runs the server-class native plan, and on the Signal tower
// descent (tick ~9300) that replay leaves the trusted resident's path. The original
// harness is kept here; that difference is reported, not papered over.
// oxlint-disable-next-line import/no-unassigned-import -- The sim's Math goes in before any module body runs.
import '@wildshard/engine/core/portableMathFirst';
// oxlint-disable-next-line import/no-nodejs-modules -- Read the admitted product's own files.
import {readFileSync} from 'node:fs';
import {HeadlessSimulation} from '@wildshard/engine/host/headless';
import {loadHeadlessProduct} from '@wildshard/engine/host/headlessProduct';
import {productHeadlessSections} from '@wildshard/engine/host/headlessSections';
import {outputDescriptor} from '@wildshard/engine/game/shardfile/outputDescriptor';
import {builtProduct} from '@wildshard/engine/test/builtProduct';

type ProductSimulation=Pick<HeadlessSimulation,'verbTape'|'verbTapePart'|'streamVerbTape'|'journey'|'walkLeg'|'step'|'dispose'|'quarantined'|'checkpoint'>;

/** The same checked product and ordinary native runtime as the original Signal journey. */
export async function openProductSession(slug:string,snapshot?:string):Promise<{sim:ProductSimulation;product:Awaited<ReturnType<typeof loadHeadlessProduct>>}> {
  const directory=builtProduct(slug),product=await loadHeadlessProduct(directory),descriptor=outputDescriptor(product.shardfile);
  if(descriptor===undefined)throw new Error('Missing admitted headless inventory');
  const assets=new Map(descriptor.index.files.map(file=>[file.commons===true?`commons:${file.hash}`:file.hash,Uint8Array.from(readFileSync(`${directory}/${file.path}`))]));
  const sim=await HeadlessSimulation.create(product.shardfile,assets,snapshot,{deadline:'advisory',sections:productHeadlessSections(product)});
  return {sim,product};
}

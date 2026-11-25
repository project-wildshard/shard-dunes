import type { ProjectGenerationContext } from '@wildshard/sdk/projectGeneration';
import { nameBlob, type NamedBlob } from '@wildshard/sdk/blobs';
import { signalWorldMetadata, type SignalWorldMetadata } from './worldMetadata';
import { bakeSignalWorldSources } from './worldSources';

const input = 'assets/models/dry-well.glb';
const pieces = ['rocks', 'dressing', 'tower', 'caravan', 'well', 'braziers', 'lash'];
const names = pieces.flatMap(piece => [`${piece}.glb`, `${piece}.json`]);

/** Cache the original world bake from its explicit model input, never from a generated piece or metadata file. */
export async function signalWorldFiles(ctx: Pick<ProjectGenerationContext, 'cached'>): Promise<ReadonlyMap<string, Uint8Array>> {
  const files = await ctx.cached({ id: 'world-geometry', native: true, inputs: [input] }, async inputs => {
    const well = inputs.get(input);
    if (inputs.size !== 1 || well === undefined) throw new Error('Missing original well model');
    return (await bakeSignalWorldSources(well)).files;
  });
  if (files.size !== names.length || names.some(name => (files.get(name)?.byteLength ?? 0) === 0)) {
    throw new Error('World geometry cache inventory differs');
  }
  return files;
}

/** The world program's data: all original world bytes and their validated metadata. */
export interface SignalWorldData {
  readonly world: SignalWorldMetadata; readonly blobs: readonly NamedBlob[];
  readonly files: { readonly urls: Readonly<Record<string, string>> };
}
/** Admit the seven world GLBs (QA 11-24 row 50, J510: no plait texture companion; the held whip is code geometry). */
export async function signalWorld(ctx: Pick<ProjectGenerationContext, 'cached' | 'asset'>): Promise<SignalWorldData> {
  const files = await signalWorldFiles(ctx), world = signalWorldMetadata(files);
  const need = (name: string): Uint8Array => { const bytes = files.get(name); if (bytes === undefined) throw new Error('Missing world asset'); return bytes; };
  const blobs = pieces.map(name => nameBlob(`geometry/world/${name}.glb`, 'glb', need(`${name}.glb`)));
  for (const blob of blobs) if (ctx.asset(blob.bytes) !== blob.file.hash) throw new Error('World asset publication differs');
  return { world, blobs, files: { urls: Object.fromEntries(pieces.map(name => [name, `geometry/world/${name}.glb`])) } };
}

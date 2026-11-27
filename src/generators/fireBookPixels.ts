import type { ImagePixels } from '@wildshard/sdk/bake/image';
import { encodeBuildBytes } from '@wildshard/sdk/bake/byteCodec';
import { hashImmutableBytes } from '@wildshard/sdk/immutable';
import { assetCost } from '@wildshard/sdk/assets';
import { encodePng } from './png';

/** The fire book's library row (SF17, J525: an image the cook makes the KTX2 of). */
export interface FireBookFile { hash: string; kind: 'image'; compressed: number; decoded: number; gpu: number; triangles: number; draws: number; dependencies: string[]; critical: false }

/** The existing flipbook's exact RGBA pixels, in source row order, as a lossless PNG for a graph texture. */
export function bakeFireBook(image: ImagePixels): { bytes: Uint8Array; file: FireBookFile } {
  const pixels = new Uint8Array(image.pixels.buffer, image.pixels.byteOffset, image.pixels.byteLength);
  const bytes = encodePng(image.width, image.height, 4, pixels, data => encodeBuildBytes(data, 'deflate'));
  return { bytes, file: fireBookFile(bytes) };
}

/** Charge the actual PNG: its wire bytes and the decoded texture the cook or the client makes of it. */
export function fireBookFile(bytes: Uint8Array): FireBookFile {
  return { hash: hashImmutableBytes(bytes), kind: 'image', compressed: bytes.length, ...assetCost('image', bytes), dependencies: [], critical: false };
}

/**
 * SF17 (meta standalone shardfiles, J525): a shardfile carries images only and the cook makes every KTX2. The sand's data
 * maps and the fire book were raw single-level KTX2s; they are now lossless PNGs of the same texels: 8-bit grey for an R8
 * map, RGBA for an RGBA8 one (colour types 0 and 6, bit depth 8, no interlace, every row filter 0). The cook writes the
 * sand maps back as the same zstd R8 or RGBA8 KTX2 (`<blob URL>#data`), texels identical.
 *
 * Pure bytes: the zlib stream comes from the caller (`encodeBuildBytes(bytes, 'deflate')`, deterministic), so a bake is
 * the same file on every host.
 */

/** A zlib (RFC 1950) compressor. */
export type Deflate = (bytes: Uint8Array) => Uint8Array;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(parts: readonly Uint8Array[]): number {
  let c = 0xffffffff;
  for (const part of parts) for (const byte of part) c = (CRC_TABLE[(c ^ byte) & 0xff] ?? 0) ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length), view = new DataView(out.buffer), name = new TextEncoder().encode(type);
  view.setUint32(0, data.length);
  out.set(name, 4);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32([name, data]));
  return out;
}

/** A lossless PNG of `data` (`width` x `height` texels, `channels` bytes each, rows top first). */
export function encodePng(width: number, height: number, channels: 1 | 4, data: Uint8Array, deflate: Deflate): Uint8Array {
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1 || data.length !== width * height * channels) {
    throw new Error('Invalid PNG texels');
  }
  const stride = width * channels, raw = new Uint8Array(height * (stride + 1));
  for (let y = 0; y < height; y++) raw.set(data.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  const header = new Uint8Array(13), view = new DataView(header.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  header.set([8, channels === 1 ? 0 : 6, 0, 0, 0], 8);
  const parts = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflate(raw)), chunk('IEND', new Uint8Array())];
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let at = 0;
  for (const part of parts) { out.set(part, at); at += part.length; }
  return out;
}

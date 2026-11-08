import { expect, test } from 'vitest';
import { readTerrainTileSource } from '@wildshard/sharddev/bake/terrain';
import { encodeTerrainTile, decodeTerrainTile, terrainTileHeight } from '@wildshard/format/terrainTileBytes';

// Keep the actual interpolation law; schema identity and diagnostic-object
// comparisons are not this shard's content boundary (J186).

test('author terrain tile sampling keeps native interpolation, boundaries and malformed-byte refusals', () => {
  const resolution = 3, heights = Float32Array.from([0, 1, -2, 3.5, 4, 6, 2, -3, 1]);
  const bytes = encodeTerrainTile({ resolution, x: -2, z: -2, size: 4, heights });
  const ground = decodeTerrainTile(bytes), field = readTerrainTileSource(bytes);
  for (const [x, z] of [[-2, -2], [-1.5, -0.2], [0, 0], [0.75, 1.75], [2, 2]]) {
    if (x === undefined || z === undefined) throw new Error('Missing sample coordinate');
    expect(Object.is(field.heightAt(x, z), terrainTileHeight(ground, x, z))).toBe(true);
  }
  expect(() => field.heightAt(-3, 4)).toThrow('Point outside terrain');
  expect(() => terrainTileHeight(ground, -3, 4)).toThrow('Point outside terrain');
  expect(() => readTerrainTileSource(bytes.subarray(0, 8))).toThrow();
});

import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { DUNE_HD, DUNE_HD_URLS } from '../src/generators/rows/files';

// QA 11-24 row 50 (J510): the held whip is code geometry (whipModel.ts), so the old glove scan and the plait texture
// must not ship again: no glove model is preloaded or mounted, and the world bake carries no texture companion.
test('no glove scan or plait texture ships beside the code-built whip', () => {
  expect(DUNE_HD.filter(name => name.startsWith('glove'))).toEqual([]);
  expect(Object.keys(DUNE_HD_URLS)).not.toContain('glove-hd4');
  const mounts = readFileSync(new URL('../src/mounts.json', import.meta.url), 'utf8'), reads = readFileSync(new URL('../src/look/entry-reads.json', import.meta.url), 'utf8');
  for (const text of [mounts, reads]) expect(text).not.toMatch(/glove-hd|plait\.bin/u);
  const program = readFileSync(new URL('../src/generators/worldProgram.ts', import.meta.url), 'utf8');
  expect(program).not.toMatch(/plait\.bin|textures\//u);
});

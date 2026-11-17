// CI21 C9 port of engine test/sky-signal-fixed-layouts.test.ts (engine blob ec4fdb0f), the
// sunscar-dunes row of its discovery loop (the Sky half lives in shard-sky-reach
// test/sky-fixed-layouts.test.ts). Every Sunscar assertion is unchanged. Engine and SDK
// imports are public exports; the engine app-build reader takes a src/shards/<slug> root
// (SDK gen-shards), so this repo's src/ and public/ are linked into a scratch root.
import { expect, test } from 'vitest';
// oxlint-disable-next-line import/no-nodejs-modules -- Own and remove only this bounded app-build root.
import { mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs';
// oxlint-disable-next-line import/no-nodejs-modules -- Bind the manifest reader to this repository's source.
import { resolve } from 'node:path';
import { authoredManifestSource } from '@wildshard/engine/scripts/authored-manifest.mjs';
import { parseDiscoveryValues } from '@wildshard/format/discoveryValues';
import { generated as signalProgram } from './fixtures/sunscar-source-program';
import { SIGNAL_DUNES_MAP as signalMap } from '../src/generators/minimap';

/** The engine app build reads a shard at src/shards/<slug>; this repo's src/ and public/ are linked there. */
function appBuildRoot(): string {
  mkdirSync('tmp', { recursive: true });
  const root = mkdtempSync(resolve('tmp', 'sunscar-app-root-'));
  mkdirSync(resolve(root, 'src/shards'), { recursive: true });
  symlinkSync(resolve('src'), resolve(root, 'src/shards/sunscar-dunes'), 'dir');
  symlinkSync(resolve('public'), resolve(root, 'public'), 'dir');
  return root;
}

for (const [slug, palette] of [['sunscar-dunes', signalMap]] as const) {
  test(`${slug} discovery lends fixed palette JSON without executable authoring`, async () => {
    const discovery = parseDiscoveryValues(signalProgram.discovery);
    if (discovery === undefined) throw new Error('Missing current source discovery');
    const root = appBuildRoot();
    try {
      const source = authoredManifestSource(root, slug, { discovery });
      expect(source).toContain(`mapPalette: ${JSON.stringify(palette)}`);
      expect(source).not.toMatch(/from ["'][^"']*generators\/(?:layout|minimap)/u);
      expect(() => authoredManifestSource(root, slug)).toThrow('program discovery value budgets');
      for (const key of ['budgets', 'navigation', 'mapPalette', 'poses', 'audioCues', 'boot.files', 'boot.sources', 'boot.lateReads'] as const) {
        const missing = { ...parseDiscoveryValues(signalProgram.discovery) }; delete missing[key];
        expect(() => authoredManifestSource(root, slug, { discovery: missing })).toThrow(`program discovery value ${key}`);
      }
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
}

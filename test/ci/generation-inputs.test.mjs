import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';

test('the fresh Sunscar product proves its source generator without generated inputs', () => {
  const slug = 'sunscar-dunes';
  const source = `src/shards/${slug}/generators/generate.ts`;
  const key = `F ${source}`;
  const receipt = JSON.parse(readFileSync(`out/.app/product-inputs/${slug}.json`, 'utf8'));
  const product = JSON.parse(readFileSync(`out/${slug}/shard.json`, 'utf8'));
  assert.equal(product.identity.slug, slug);
  assert.ok(receipt.inputs.includes(key));
  assert.equal(receipt.values[key], createHash('sha256').update(readFileSync(source)).digest('hex'));
  assert.deepEqual(receipt.inputs.filter(input => input.startsWith(`F src/shards/${slug}/`)
    && input.includes('.generated.') && /^[a-f0-9]{64}$/u.test(receipt.values[input])), []);
});

test('the build preload refuses the retired scheduler before module resolution', () => {
  const preload = pathToFileURL(resolve('test/ci/refuse-legacy-generation.mjs')).href;
  const retired = pathToFileURL(resolve('scripts/generate.mjs'));
  retired.search = '?version=old';
  retired.hash = '#scheduler';
  for (const [cwd, specifier] of [
    [process.cwd(), './scripts/generate.mjs'],
    [resolve('scripts'), './generate.mjs'],
    [process.cwd(), retired.href],
  ]) {
    const control = spawnSync(process.execPath, [
      '--import', preload, '--input-type=module', '--eval', `await import(${JSON.stringify(specifier)})`,
    ], { cwd, encoding: 'utf8', timeout: 5_000 });
    assert.ifError(control.error);
    assert.equal(control.status, 1);
    assert.match(control.stderr, /The retired generation scheduler was resolved/u);
  }
});

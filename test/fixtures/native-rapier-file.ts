// oxlint-disable-next-line import/no-nodejs-modules -- The native proof resolves the installed engine's declared physics package.
import { createRequire } from 'node:module';

/** Engine's own tests read its checked-in src/static/assets/physics/rapier.wasm; a shard reads the
 * same package's bytes from the installed engine, as engine's native proof worker does. */
import { engineRequire as engine } from '@wildshard/sdk/headless';
export const nativeRapierFile = engine.resolve('@dimforge/rapier3d-simd/rapier_wasm3d_bg.wasm');

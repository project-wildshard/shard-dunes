# SA11: Dunes shard text

> Written by: Claude

J317 retires `product` from author-facing names (meta
SHARD-AUTHORING SA11, same conventions as shard-pine-hollow `7e6e505`).
`generators/product.ts` is now `generators/shardfile.ts` with
`signalShardfileRows`; the world program returns `SignalWorldData`; the
CI route helper is `loadSignalOutput`. Comments and `src/README.md` say
shard file, program or output by what they mean. `src/` has no
`product` left.

Kept: the engine's headless loader (`loadHeadlessProduct`,
`productHeadlessSections`, `shardProducts`), the `product` keys passed
to `openWorldAdapter` and `HeadlessSimulation.create`, the engine's
`out/.app/product-inputs/` receipt path, and the CI proofs every shard
repo shares (`owned-journey`, `package-products`, `product-play`,
`cook-play`) and the stamped `scripts/`. They change with SA23 / SA25
across all shard repos at once, not here.

`pnpm test` and `pnpm check` pass. A generator edit makes the hero
stale; the revision pass rebuilds it. No upload.

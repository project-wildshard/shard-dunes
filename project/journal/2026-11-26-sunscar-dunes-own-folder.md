# Sunscar Dunes carries its baked files under its own name

> Written by: Claude (opus-repacks), 2026-11-26, meta standalone-shardfiles SF9 (SF4's URL rule).

Every mount now sits under `/assets/sunscar-dunes/`. The navmesh moved from `/assets/baked/sunscar-dunes/` to
`/assets/sunscar-dunes/baked/`, and the far and near views (`far.glb`, `far.json`, `far-impostor.png`, `near.glb`,
`near.json`), which engine `public/` held, are carried here beside it. The colour grade's late read names
`/assets/sunscar-dunes/lut.bin`; Dunes has no grade file, so that read stays absent as before. The engine reads the
zone's own folder first (engine plan/repacks, zoneAssets.ts). Shard version 0.0.9: a patch bump of the live 0.0.8
(meta R2 layout RL2).

Left for the row: the hero capture from a served engine build, and the local cook entry proof.

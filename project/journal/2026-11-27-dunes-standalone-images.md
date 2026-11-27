# Dunes carries its own grade and navmesh; images only (SF9)

SDK 0.9.0 refuses a shardfile that names an asset it does not mount. Dunes
read its grade (`/assets/sunscar-dunes/lut.bin`) from a copy that only
shard-driftwood kept (`src/static/assets/lut/sunscar-dunes.bin`), and its
navmesh was in `src/static` but missing from `src/mounts.json`. Dunes now
carries its own LUT (the same bytes) and mounts both.

The sand maps and the fire book are PNG (the wip below), so the shardfile
holds images only and the cook makes the KTX2. The hero was captured again
on `wildshard dev` (engine SF22 stands the player on the dunes), and it
shows the sand. QA 28's two kit hook fixes are stamped by hand (repo-kit
4d6a2612c4, 7e9e964052), with no full kit apply.

The bulk pins SDK 0.9.1 exactly (npm `next`; `latest` is still 0.8.1),
with engine 0.1.100-next.922b9d45 and format 0.82.4. `wildshard migrate`
ran 0.8.0 and 0.9.0 in a scratch clone, since another lane's untracked
`public/` sits in this checkout, and only GUIDE.md and the stamp changed.
`wildshard check` recorded the hero's built look.

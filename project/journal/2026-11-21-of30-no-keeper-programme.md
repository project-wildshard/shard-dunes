# OF30: the keeper names no species programme

> Written by: Claude (opus-of-m8-species)

Dunes's runtime plan kept a keeper with no homes and no program species, so its `population.rows.program` was a dead copy
of the strikes. Format `62e3631` (v0.66.1) makes it optional and engine `0a9eff1512` reads none as empty, so the plan
leaves it out. Built and tested ahead (J475) against a packed format from main `b4d2f0a` and a packed engine from main
`0a9eff1512`: the build passes and every shard test passes. The publish waits on format v0.66.1 and an engine release
carrying `0a9eff1512`; the wip commit pinning the packs is replaced by that pin bump.

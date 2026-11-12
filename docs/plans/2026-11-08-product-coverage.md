# Shard product coverage

> Written by: Codex

Status: in progress 2026-11-08: installed product coverage.

| Row | State |
| --- | --- |
| Installed product admission, boot, walk and save continuation | CI-only outer-edge proof; 9.5 second cap per product |
| Ring 3 candidate | Full commit dispatch overrides all engine dependency edges and runs build plus own tests |
| Cook and served play | Real cold tar cook, hash-verified server packs, actual Sefa approach/talk earning scout, and five identical restored ticks. Ring 2: cold cook measured 12.35 s locally; hosted pinned/candidate proof is being verified |
| Cook size ceiling | Open: real manifests are emitted; no invented wire ceiling is asserted |
| Client title to play | Open: requires the installed dev-client path, not this server proof |
| Authored quest, fight and traversal tapes | Signal quest done 2026-11-12 (DUN-1): `test/ci/signal-journey.test.mjs` walks the built product through Sefa, logbook, crank and oil, three waymarks, the tower stair and fire, then fights the Matriarch to her fall, on page inputs only (routes, [E] acts, whip cracks, aimed attacks); refusals checked on the way. ~2-3.5 s locally. Durable Ledger done 2026-11-12 (SH-dunes-4): `test/ci/durable-ledger.test.mjs` files the quest's and the Matriarch's facts and purses once (exactly the product Ledger), restores from the worker's save wire alone, and plays on (strikes the fallen Matriarch, relights the fire from the deck) with nothing filed again. Sleeping hosts still open |
| Falling out of the world | Engine fixed 2026-11-12 (ENG-18, engine `cad0040b`..`ba99efa7`): a resident outside a room now puts a player under the floor back on their last firm ground, else the spawn; engine `test/fall-net.test.ts` walks this repro and drops a player under the basin. Found (DUN-1): headless, a player walking due south from the basin (x -14) leaves the terrain near z -250 and falls forever (y -150 000 after 9 000 ticks); no kill floor or respawn fires. Repro: after the fire, hold `{kind:'player',moveX:0,moveZ:-1,yaw:0}` from (-14, -140) for 3 000 ticks. Owner: engine world bounds or the shard's edge collider |
| Goldens and GPU | Existing graphical owner and Mac mini; outside this lane |

New coverage stays outside hooks under J186. Nothing uploads or deploys.

# 2026-11-12: Dunes builds once a push

Meta TEST-SPEED TS16e (BUILD-MAX-APPROACH RK-4), the shard template
from repo-kit `docs/shard-ci.md`. A push used to run `pnpm build:shards`
twice: `ci/check` built to walk and play the products (43 s), and
`ring-2-cook` built again (53 s) to cook and earn the scout.

Now `ci/check` skips its build and the steps that read `out/` on a
push, and a new `ci/ring-2-cook` job builds once, runs those steps, then the
Ring 2 steps on the same `out/` when the push touches the paths
`ring-2-cook.yml` used to watch (compare API; an unknown base plays).
`ring-2-cook.yml` keeps the nightly run and dispatches. Pull requests and
candidate runs still build in check.

The job's build keeps check's `refuse-legacy-generation` import, so
`generation-inputs.test.mjs` still proves the owned generator on
the build it runs against.

One job, as in Pine Hollow (TS16f), not Open Plots' products + play
split (TS16d): `pnpm check` is short here, so a hand-off would only
queue a second setup in front of the Ring 2 play.

# Publish the engine candidate cleanup

Status: in progress 2026-11-08: published, runner CI pending.

Owner: Codex. Receipt: A3.

| Step | State | Evidence / remaining work |
| --- | --- | --- |
| Disposition | verified | Five actual engine migrations and two J186 internal removals; no local pending candidates |
| Upstream integration | verified | Fresh clone atop b5d38fb preserves the runner build and upstream A2; original cleanup receipt retained as A3 |
| Engine gate | verified | Engine-only 9059d6ba175e passed its entire normal pre-push with the quick gameplay successors |
| Publish | verified | f155af5277a6 is on origin/main; normal hook green in 1.9 seconds, scan zero findings, SSH keepalives |
| CI | waiting | https://github.com/project-wildshard/shard-dunes/actions/runs/42444098975; verify the final receipt commit too |
| Receipt | closed | A3 closed after the cleanup landed with normal hooks green |

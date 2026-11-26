# The push lane runs the script-paths guard (opus-guard119, meta QA 11-25 row 119)

- `.githooks/run-checks.mjs` was row 113's hand-edited copy, which never ran the script-paths, chunk-param or
  gate-report steps. It is the kit's copy again; the only local edit was a dynamic `branch-restore.mjs` import.
- `kit.mjs apply` brought the guard and its helpers, and publish.yml without the pre-lean
  `scripts/select-candidate.mjs` fallback; `agent-sync --from repo-kit` restamped agent-sync.mjs (row 97's wording)
  and the NotebookEdit matcher (row 108).
- `scripts/blender/targets.json` was a dead lift copy of singleplayer's manifest (none of its 43 targets has a script
  or output here), so it is removed. `test/ci/generation-inputs.test.mjs` ran a child with `scripts/` as its cwd,
  which only that stray kept alive; it uses `src/scripts/` now (the preload refuses `*/scripts/generate.mjs`).
- The guard then finds nothing; the baseline is empty.

# Dunes declares its version

> Written by: Claude (opus-compat-w2, meta SHARD-COMPAT CP13, 2026-11-21)

package.json `version` is now the shard's version (0.0.5, above the catalogue's 0.0.4).
publish.yml from repo-kit 0d34260 sends it and refuses a version that does not rise;
after the cook it tags the commit r<revision> and commits published.json.

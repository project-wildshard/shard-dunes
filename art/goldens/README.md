# Goldens: sunscar-dunes

> Written by: Claude (opus-k9, REPO-KIT K9, 2026-11-11). Carried from singleplayer `art/shardfile-goldens/` and
> `art/legacy-goldens/` (`08e4a21f69`). Jake, 2026-11-11 (J273): "goldens has to go into each major shard".

The look to hold for `sunscar-dunes`: 24 cameras. The skill `goldens` runs them; the rules are engine `docs/goldens.md`.

- `shardfile/<nn>-<camera>.jpg`: the SHARDFILE goldens (G859, G873 L5), 22 px label strip on top.
- `legacy/<nn>-<camera>.jpg`: the frozen LEGACY record (10-28, G843). Never re-captured, never updated.
- `cameras24.json`: this shard's 24 cameras (eye, yaw, pitch, FOV, probe), the `sunscar-dunes` entry of engine
  `scripts/perf/cameras24.json`.
- `runs/<date>-<sha10>-board.jpg`: the rerun board (<= 500 KB) a look change lands with.

## Source

The clean 144-camera rerun on `744c3ab7e2`, captured 2026-10-29 with the capture now at engine
`scripts/goldens/capture.mjs --mode=shardfile` (muted Chromium, iPhone 16 Pro portrait, phone tier, 2x, seed 357,
midday / clear). Re-encoded at 540 x 915 with a 22 px label strip, JPEG quality 72.

## Updates

- 2026-11-04, sunscar-dunes 09, 21, 22: golden defects (G872, wildshard-new: the SHARDFILE golden's far horizon band is
  the outlier; NOW matches LEGACY). Every capture of the packs-on goldens pass draws the thinner band in Chromium and
  WebKit, on packs and Shardfile alike (`2f17110048`; D228 saw the same band since 11-03 09:25). Promoted from
  `c280532523` (Chromium, packs). Board: `../golden-runs/sunscar-dunes/2026-11-04-c280532523-packs-chromium-board.jpg`.

Add one line per promotion: date, cameras, ruling, board path.

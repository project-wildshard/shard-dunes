# Signal journey proof (DUN-1)

- Grew the Sefa approach/talk tape into the whole quest:
  `test/ci/signal-journey.test.mjs`. Routes walk the player; the [E]
  prompts and whip cracks are the same `sunscar.interact` script acts
  the page sends; the Matriarch fight steers and attacks by aiming at
  where she is. No flag or quest state is written.
- Prompt reach is from the eye and needs line of sight, so a few
  approach points were tuned: the logbook from the tailboard side
  (-76.6, 32.4), the north bowl from (35, -100.3), and the tower fire
  from the deck by the south stair (x 8.75).
- Headless, moveX/moveZ are world axes, not yaw-relative; lockTarget
  did not steer. Walking south off the basin falls forever (logged as
  an open row in the product-coverage plan).
- Wall time ~2-3.5 s locally; deterministic (same tick counts every
  run).

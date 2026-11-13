# Hero stamp

> Written by: Claude (opus-herostamp), 2026-11-12

sharddev now refuses a cut whose hero (the SHARD SELECT card) is older
than the shard's content, by a `hero.json` stamp beside the manifest.
This repo's heroes came with the lift on 2026-11-07 and had no stamp, so
the pin bump would have refused the next cut, and recapturing from the
spawn view would have put a plain shot over the curated art.

No commit has touched the dunes' content since the heroes were made. So the existing heroes are stamped as current with
`wildshard hero src/shards/sunscar-dunes --stamp-existing`. The next real
content change needs a capture:
`wildshard hero src/shards/sunscar-dunes --base <served-build-url>`.

sharddev main needs shardfile `0786a04` (`featureSides`), and engine
`80d5cc0` cannot play a product it builds (Driftwood's Ring 2: "Native
body scripts require admitted ground"), so format, its override and
engine move to sharddev's own pins (`0786a04`, `867f3b9`). The
`packageExtensions` selector named `@wildshard/engine@0.1.2`, which
engine 0.1.13 does not match, so it now names the package.

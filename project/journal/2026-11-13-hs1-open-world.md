# HS1: CI boots the room's world

> Written by: Claude (opus-hs1), 2026-11-13. Meta SERVER-PARITY HS1.

The CI journeys booted `createTrustedHeadlessAdapter` or `createTrustedHeadlessResident`, the bare trusted resident: a
world no player runs, with no chapters, doors, discoveries, owned book, room loot or real respawn. They now boot the room's
own composition through `@wildshard/engine/host/openWorld` (`openWorldAdapter`, or `openWorld(input, { room: true })` and
its `resident`), on engine `0238dc7e`. The engine pin is also a pnpm override, so sharddev shares the one copy: two engine
copies split the sim loader's module cache (Driftwood's owned journey failed on it).

The Matriarch's intro holds every player in her arena still, so the tape settles 300 ticks after the fire. A room pays
her 20 coins to the player who earned them, not to her body (J105).

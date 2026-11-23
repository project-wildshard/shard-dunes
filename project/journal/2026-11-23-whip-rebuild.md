# 2026-11-23: the whip, rebuilt

> Written by: Claude (opus-whip, QA-FEEDBACK-2026-11-23-b row 13)

Jake, ~12:40 Cancún: "In the dunes zone the attack animation and the whip is completely fucked, someone has to rebuild
that from scratch lol why do we have a static whip image lol".

Two causes. The thrown lash never drew at all: the engine's memory saver swapped the tube's position array out from
under the tube writer, so the GPU kept a zero-size tube (engine `97dda7021e`, rides the next engine release). And the
stroke itself only moved an empty `grip` group, so the glove and the coil sat still while the lash's start twitched.

The rebuild, all in source:

- `WHIP_SCENE`: the glove and the hero coil ride the grip; the coil is its own `coilHold` group (frozen from the old
  anchor), now the phase's resting part, so it goes while the lash is out and comes back after; a `crack` mesh (a
  procedural starburst baked into `lash.glb`) sits at the lash's end; the cord is unrimmed like the coil, so it reads as
  dark leather instead of a pale tan stick.
- `heldPlayback`: one phase p (ext, then slack) keys everything. The fist cocks up and back, snaps through, follows
  down and recoils (eased, 1.35x on a heavy). The lash rises over the fist, rolls out flat to the crosshair at the 0.12 s
  land, cracks, then drops and is drawn in. The heavy's double crack flashes twice, bigger.
- Contacts and timing are untouched (0.12 s land, 0.32 s second, 0.42 s show).

Frames: meta `project/evidence/qa-2026-11-23-look/row13-whip/`.

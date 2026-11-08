# Carry the candidate cleanup onto current main

The original private cleanup had diverged from two upstream CI
commits. Both lanes had independently used A2. I replayed only this
lane's reviewed test disposition patch in a fresh main clone, leaving
the new runner build and its A2 intact. A3 preserves the old cleanup
receipt and explains the collision.

Five candidates now run in engine; two internal pins are deleted
under J186. The source pending list is empty. Runtime and dependency
versions are unchanged. Engine's quick successor checks, including
lance cone/rehit, precede this deletion push. Normal hooks and a real
runner remain required; no publication is claimed by this preparation.

> Written by: Codex
> **State:** locally qualified, 2026-11-16.

QA89: an exact engine candidate inherited the old global format override,
which could hide exports that engine declares. Drop that override only
when selecting an engine candidate. Keep the normal frozen graph intact;
the root project's direct format pin also stays as declared.

On current Dunes2057c7c6, both exact0bc3a14f and0b913ff7 legs install
engine-owned format0.13, pass typecheck, explicit119-file author lint,
normal build and all33 retained cases. Reader exports under owned tmp/
needed explicit file selection because the parent ignores tmp/; no rule
or assertion was suppressed. Actual main/hosted evidence follows.
M1 canonical main; no source runtime, pins, cook or release changed.

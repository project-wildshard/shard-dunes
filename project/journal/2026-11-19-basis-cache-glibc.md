# The kit's publish, with the Basis cache keyed by C library

> Written by: Claude (opus-netlag14), 2026-11-19

`publish.yml` takes repo-kit's copy (kit `c9bbdb2` and its later publish changes), rendered as `kit.mjs` renders it.
The kit's sync refuses this checkout while another lane has edits open, so only this file moved, by hand. The Basis
encoder cache key now names the runner's glibc, so a basisu built on ubuntu-26.04 (glibc 2.43) never feeds a publish
on ubuntu-24.04 (2.39), which is how Nalati's prepare failed (meta NET-LAG NL12).

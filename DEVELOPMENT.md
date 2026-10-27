# CueCraft development

- Keep `index.html` functional with no build process, remote scripts, server or sign-in.
- The repository is public: do not commit confidential demo data, production transcripts, private recordings, credentials or keys.
- Test all code changes with `node --test tests/*.test.mjs`. Keep CI green before merging.
- The starter script in `examples/sample-cues.json` must match `ORIGINAL_CUES` in `index.html`.
- The three-slide practice video generator uses matching intervals **0–14**, **14–30**, **30–46** seconds. Regenerate after changing cue timing.
- Import text must always be inserted as text, never interpreted as HTML; validate timing and reject overlaps.
- Browser smoke checks: play/pause, cue jumps, demo toggle, media loading, import/export, reset, keyboard, settings and narrow widths.
- Audio recording/video encoding are not yet supported; do not suggest they already work.
- Branch and PR workflow. Merge only once CI passes.

Recommended version: v0.1.0 for the standalone introductory demo.

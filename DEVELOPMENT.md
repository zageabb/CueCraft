# CueCraft development

- Keep `index.html` functional with no build process, remote scripts, server or sign-in.
- The repository is public: do not commit confidential demo data, production transcripts, private recordings, credentials or keys.
- Test all code changes with `node --test tests/*.test.mjs`. Keep CI green before merging.
- The starter script in `examples/sample-cues.json` must match `ORIGINAL_CUES` in `index.html`.
- The three-slide practice video generator uses matching intervals **0–14**, **14–30**, **30–46** seconds. Regenerate after changing cue timing.
- Import text must always be inserted as text, never interpreted as HTML; validate timing and reject overlaps.
- Browser smoke checks: play/pause, cue jumps, demo toggle, media loading, import/export, reset, keyboard, settings and narrow widths.
- Microphone recording and WAV export work in supported browsers; one-click finished-video encoding remains unimplemented.
- Branch and PR workflow. Merge only once CI passes.

Versioning: keep the repository entrypoint `index.html` and downloadable `CueCraft.html` filenames stable. Increment only `<meta name="app-version">` in `index.html` using SemVer; the header reads that value dynamically. UDA deploys Git commits from registered apps, not HTML filename changes.

## Voiceover recording (v0.2.0)

- All microphone capture must remain local using getUserMedia and MediaRecorder. Never upload or persist raw audio without an explicit user action.
- Keep the 1× speed and playback/seek locks during capture; transport changes would invalidate timing.
- WAV export includes silent lead-in at the media start point; unit tests cover RIFF headers, 16-bit PCM and alignment.
- Recordings are ephemeral and download-only, not saved by localStorage. Revoke Blob URLs when deleting.
- Real microphone permissions and Safari MP4 recorder compatibility require manual hardware checks. Browser-automation uses mocked microphone capture.
- Keep CI green before merging and verify the demo remains functional without any media file.


## Adaptive layout (v0.2.2)

- Keep `index.html` as the canonical UDA entry point; release downloads always use `CueCraft.html`. The version is in the HTML meta tag.
- Desktop columns use the full viewport: flexible autocue, a keyboard/pointer resize handle, and a reference video column defaulting to 39%.
- Persist `videoColumnRatio` in existing CueCraft local settings, clamped to sensible minima/maxima. Store a *ratio*, not pixels: screen-size changes must retain usable layout.
- At viewport widths <=980px, use the stacked layout with a full-width video, and hide the divider.
- Check at 1600x900, 1366x768, 1024x768, 980x720 and 390x844; no horizontal page overflow. Double-click reset and keyboard arrow adjustment must work.
- Column resizing reflows the narration, which is re-positioned by the existing animation-frame loop.

## Synchronised take review and non-destructive trimming (v0.3.0)

- The reference video remains visible on desktop while the take list scrolls. In responsive stacked mode, the video returns to normal flow.
- Recorded take starts are in media time. Trim start/end are seconds removed from either edge. Clip beginning = `take.startAt + trimStart`.
- The source recording remains unchanged. Original download is raw; Trimmed WAV keeps selected samples and leading silence at the timeline location.
- Review seeks/pause resume with media. Seeking outside the retained segment ends preview. Stop review clears audio, pauses and restores original video mute and controls.
- Browser test with generated WAV and silent example MP4 must pass without JS errors.
- Multi-take mixing and finished-video export remain future work.

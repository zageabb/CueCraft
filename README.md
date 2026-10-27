# CueCraft

CueCraft is an **offline-first teleprompter and timed voiceover assistant**. It runs as a standalone HTML file: no account, installation, server or external API is required.

## Stable filename and version (UDA)

The canonical GitHub file is always **`index.html`**; the standalone download is always **`CueCraft.html`**. Never add a release number to either filename.

The current version is stored **inside the HTML** as `<meta name="app-version" content="0.2.2">` and is shown in the app header. The metadata is the single source of truth for the displayed version; update it for each release using semantic versioning.

**UDA compatibility:** the Universal Deployment Agent updates registered apps by following Git commits on the configured branch (normally `main`). A stable `index.html` allows a deployed checkout or static publisher to serve the same path after a Git update. The HTML version is for identifying the running build; adding metadata alone does **not** register CueCraft in UDA, configure a web server or enable automatic deployment.

## Responsive studio layout (v0.2.2)

The studio uses the browser's full available width. On desktop, the reference video occupies roughly **39%** of the layout by default and grows or shrinks with the window; the autocue fills the remaining space.

- **Resize:** drag the slim **↔** handle between the narration and video panels.
- **Keyboard:** focus the divider; use **Left** to enlarge the video and **Right** to enlarge the script; **Home** and **End** select the limits.
- **Reset:** double-click the divider for the original 39% split.
- **Remember:** the divider setting is saved as a proportion, not pixels, so it remains practical when moving between laptop and external monitors.
- **Smaller screens:** at widths of 980 pixels or less, the app stacks the autocue above a full-width reference video, avoiding horizontal scrolling.

Screen layout changes do not change the script or recording timings.

## Try the guided demo

1. Open `index.html` in a modern desktop browser.
2. Click **▶ Try demo** in the Reference Video section. Three sample cues and illustrated preview slides are built in.
3. Press **Space** or **Play**, then follow the scrolling text and cyan reading line.
4. Use the Script timeline to jump between sections at **00:00, 00:14 and 00:30** (total duration **46 seconds**).
5. Edit text/timings with **Edit cue**. Use **Import** to load JSON, CSV or SRT; use **Export** to save scripts.
6. For a real synced video, close the guided demo and use **Load video**.

The public starter script is `examples/sample-cues.json` and intentionally contains no company or customer-specific material.

## Generate the matching three-slide demo video

CueCraft includes `scripts/create_demo_video.py` to generate an illustrated **silent 46-second 1280×720 H.264 MP4**, with slide changes at 14 and 30 seconds.

Install FFmpeg and Pillow, then run:

```bash
python -m pip install Pillow
python scripts/create_demo_video.py
```

Load the resulting `examples/cuecraft_demo.mp4` through **Load video** and practise speaking the preloaded narration. The demo is **intentionally silent** so you can record your own replacement voiceover. Generated video is not committed to the repository to keep it small.

## Features

- Large time-synchronised autocue, word-by-word pace guidance, countdowns, next-cue preview
- Embedded beginner-friendly three-slide guided demo and downloadable/generated MP4 counterpart
- Local video playback locked to cue timing, cue list navigation and 5-second seek controls
- Adjustable reading font size, playback speed, video-to-script offset, mirrored text and full screen
- Edit timed cues; import JSON/CSV/SRT; export JSON/CSV; restore starter script
- Scripts and settings saved in local browser storage, when supported
- Runs entirely offline with plain HTML, CSS and JavaScript

**Important:** Word highlighting follows the timeline, not live speech. This version records microphone audio but does **not** synthesise voices, edit multiple takes, or render a final video directly.


## Record a narration take (v0.2.0)

1. Load a video, or use the three-slide guided demo. Timer-only mode also works.
2. Under **Record voiceover**, select **From start**, **Current cue** or **Current position**.
3. Press **● Record** and grant the browser microphone permission. CueCraft switches to **1× speed** and starts the teleprompter/video, with the reference video muted.
4. Follow the text, then press **■ Stop take**. Recording also stops automatically when the video/timeline finishes.
5. Review your take with its audio player. Download **Original** to keep the browser's native audio (often WebM/Opus on Chrome/Edge or MP4 audio on Safari).
6. Or download **Aligned WAV** for 16-bit mono PCM with leading silence added when you started partway through the video. WAV is intended for a video editor or FFmpeg.

**Take privacy:** audio is held only in browser memory until you explicitly download it. Closing or refreshing the tab loses unsaved takes. To avoid memory growth, at most twelve takes remain available at once. CueCraft makes no uploads and requests microphone-only capture.

Playback seek, pause, cue editing and script import are intentionally locked during capture. Use headphones to avoid capturing the reference audio. Browser recordings can have slight startup/codec latency, so check the final sync by listening. Recording requires browser microphone permission and a secure origin; trusted local files or localhost generally work, depending on your browser.

### Replace the soundtrack using FFmpeg (optional)

Download an aligned WAV, then run:

```bash
ffmpeg -i original.mp4 -i cuecraft_take_1_aligned.wav \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k \
  -af apad -shortest video_with_voiceover.mp4
```

This retains the source video without re-encoding, replaces its audio and pads missing audio to the video end. One-click edited video export is planned for a later release.


## Key commands

| Key | Action |
| --- | --- |
| Space | Play / pause |
| Left / Right arrows | Back / forward five seconds |
| N / P | Next / previous cue |
| R | Restart |
| F | Full screen |
| M | Mirror the script |

## Script format

Import a JSON array of cues containing `start`, `end`, `title`, `text`, and optional `note` fields (seconds from the video start). CSV supports `start_time`, `end_time`, `section`, `voiceover_text`, `screen_cue`. Timings must be valid, non-overlapping and within four hours.

## Privacy

The app performs no uploads. Video stays in your browser and local scripts/settings are stored only on your device. Export a copy if you want a durable backup. This is a **public repo**: do not commit confidential scripts, recordings, customer data or secrets.

## Development

```bash
node --test tests/*.test.mjs
```

See `AGENTS.md` and `DEVELOPMENT.md`. The app should remain functional by double-clicking `index.html`; a web server is optional.

Roadmap: multi-take editing and comping, synchronised take playback with the reference video, one-click completed-video export and optional local AI script assistance.

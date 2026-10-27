# CueCraft

CueCraft is an **offline-first teleprompter and timed voiceover assistant**. It runs as a standalone HTML file: no account, installation, server or external API is required.

## Stable filename and version (UDA)

The canonical GitHub file is always **`index.html`**; the standalone download is always **`CueCraft.html`**. Never add a release number to either filename.

The current version is stored **inside the HTML** as `<meta name="app-version" content="0.3.0">` and is shown in the app header. The metadata is the single source of truth for the displayed version; update it for each release using semantic versioning.

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

**Important:** Word highlighting follows the timeline, not live speech. CueCraft trims takes non-destructively and previews them beside the video; mixing multiple takes or rendering a finished video is not yet included.


## Cue-by-cue recording and narration assembly (v0.4.0)

The default recording mode is **Individual cue**. Choose the current cue or any cue in the script, then press **Record selected**. CueCraft plays an optional 2-second video lead-in (0/2/3/5 seconds available) before recording starts, and stops the recording automatically at the cue end. Pre-roll video is **not included** in the audio take.

You can record as many alternatives as necessary within the 120-take session cap. New takes are added without replacing existing recordings or overriding an earlier preferred take. Select the preferred take for each cue in **Narration assembly**; you can also click **★ Prefer for cue(s)** on a take to select it for all eligible cues.

Click **Review full narration** to play the assembled audio synchronized with the original video, or **Assemble WAV** to download a 44.1 kHz mono, 16-bit WAV aligned to the video's timeline. Unrecorded or underfilled cue intervals remain silent, so later sections never move forward. The app highlights timing gaps and out-of-window audio; tiny fades smooth boundaries between different takes.

**Selected cue range** mode lets you narrate several adjacent cues in one pass, retaining natural flow. The same take can supply several preferred-cue selections; the assembler joins adjacent slices of that take before applying fades. **Full / continuous recording** retains the existing uninterrupted narration workflow, including starting at the beginning, current cue or current playhead position.

Individual take review, non-destructive start/end trimming and native/aligned downloads remain available. The script and layout settings can be saved locally, but **recordings, trims, take selections and the assembled preview exist only in browser memory**. Download your work before refreshing or closing the tab. Cue/script or reference-video changes clear assignments for safety without deleting the source recordings.

For memory safety, assembled WAV export is limited to 15 minutes of timeline duration (use individually aligned WAVs for longer projects), and the app refuses to silently discard takes once 120 have accumulated. A real microphone requires user permission in a secure browser context; use headphones and verify sync because audio startup latency and codecs vary by device.

### Replace the video's original soundtrack

After exporting the assembled audio:

```bash
ffmpeg -i original.mp4 -i cuecraft_narration_assembled.wav \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k \
  -af apad -shortest video_with_voiceover.mp4
```

CueCraft does not yet export the final MP4 directly. Keep the original footage unchanged until you have reviewed the audio alignment.

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

Roadmap: waveform-assisted editing, sub-cue retakes, one-click video export and optional local AI assistance.

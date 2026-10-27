# CueCraft

CueCraft is an **offline-first teleprompter and timed voiceover assistant**. It runs as a standalone HTML file: no account, installation, server or external API is required.

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

## Features (v0.1.0)

- Large time-synchronised autocue, word-by-word pace guidance, countdowns, next-cue preview
- Embedded beginner-friendly three-slide guided demo and downloadable/generated MP4 counterpart
- Local video playback locked to cue timing, cue list navigation and 5-second seek controls
- Adjustable reading font size, playback speed, video-to-script offset, mirrored text and full screen
- Edit timed cues; import JSON/CSV/SRT; export JSON/CSV; restore starter script
- Scripts and settings saved in local browser storage, when supported
- Runs entirely offline with plain HTML, CSS and JavaScript

**Important:** Word highlighting follows the timer, not live speech. This version does **not** record from the microphone, synthesise voices or export a finished edited video. Those are possible later features.

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

Roadmap: microphone capture, recording takes, voiceover alignment, audio export, completed-video export and optional local AI script assistance.

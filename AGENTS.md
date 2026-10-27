# CueCraft — agent guidelines

1. Read README.md and DEVELOPMENT.md before changing features.
2. Maintain the single-file, offline-first user experience.
3. Never publish user/company footage, internal narration, source documents, transcripts or secrets to this public repository.
4. Keep beginner examples generic and use the common three-cue timeline.
5. Use accessible controls and keyboard shortcuts. Fail clearly on malformed input.
6. Extend tests and retain green CI before merging to main.
7. Only claim features that are implemented and tested.

8. Preserve audio privacy: microphone-only input, no upload, explicit download, volatile takes.
9. Do not remove the recorder's transport locks or 1× sync without replacing the timing algorithm and tests.

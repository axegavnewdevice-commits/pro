# Arabic Scrabble PWA

This repository is the original game HTML with Progressive Web App support added. The game UI, wording, layout, colors, and game logic were left unchanged.

## Deploy to Vercel

1. Push the contents of this folder to the root of your GitHub repository.
2. Import the repository in Vercel.
3. Select **Other** as the framework preset. Leave the build command empty and use `.` as the output directory (or leave the output directory at its detected default).
4. Deploy. The app must be served over HTTPS for service workers and installation to work.

## PWA files

- `index.html` — the original game plus PWA metadata and service-worker registration.
- `manifest.webmanifest` — install name, display mode, colors, and launcher icons.
- `sw.js` — app-shell and runtime caching for offline use.
- `icons/` — install/launcher icon assets.
- `vercel.json` — static hosting headers for the manifest and service worker.

The first visit should be online so the external Tailwind/font assets can be loaded and cached. External assets that have not been cached may still need a network connection.

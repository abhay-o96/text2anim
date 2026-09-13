# Text2Anim Basic — Free Browser Animation MVP

A very small text-to-animation web app designed for a tiny group (up to ~3 users).

Architecture:
- Cloudflare Pages hosts the static app for free.
- A Cloudflare Pages Function calls Gemini using a server-side API key.
- Gemini returns a small JSON scene plan.
- The browser renders the animation with Canvas/SVG-style primitives.
- No Python, Manim, FFmpeg, Docker, VM, or always-on PC is required after deployment.

## Important
The app is free only within the free quotas of Cloudflare and Gemini. Current Cloudflare Workers Free limits include 100,000 requests/day, while static asset requests on Pages are free/unlimited. Gemini 2.5 Flash-Lite currently has a free tier, subject to Google's quotas.

## Local test
You can open `public/index.html` directly for the UI preview, but the Generate button needs the Cloudflare Function and a Gemini key.

## Deploy (recommended: Cloudflare Pages)
1. Create a GitHub repository and upload this folder.
2. In Cloudflare Dashboard, go to Workers & Pages -> Create -> Pages -> Connect to Git.
3. Pick the GitHub repo.
4. Framework preset: None.
5. Build command: leave blank.
6. Build output directory: `public`.
7. Deploy.
8. In the Pages project, open Settings -> Variables and Secrets.
9. Add a secret named `GEMINI_API_KEY` containing your Google AI Studio Gemini API key.
10. Redeploy.

The `functions/api/generate.js` file is automatically deployed as `/api/generate` by Cloudflare Pages Functions.

## What users do
Open the Cloudflare Pages URL, type a scene description, click Generate, and the browser animates it. Nothing needs to be installed on the user's device.

## Current scene types
- process_flow
- comparison
- timeline

## Current animation actions
- fade_in
- move
- highlight
- scale
- show

## Notes
This MVP intentionally avoids server-side video rendering. The animation runs in the browser, which is what makes the free deployment practical. A later version can add browser-side WebM recording.

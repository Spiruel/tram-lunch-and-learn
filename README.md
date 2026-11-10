# Smaller Cities Ever Since — Trams Lunch & Learn Presentation

Interactive browser-based presentation modelled on the [Ai2 OlmoEarth narrative engine](https://narrative.allen.ai/olmoearth-embeddings), built for a Lunch & Learn on **effective city size, UK productivity, historical tramway digitisation (Crich → Surya OCR → GTFS → RAPTOR), and five-city findings from [Transit Time Machine](https://spiruel.github.io/transit-time-machine/)**.

## Quick Start

```bash
cd /Users/sambancroft/Documents/tram-lunch-and-learn
npm install
npm run dev
```

Open `http://127.0.0.1:5173/` in Chrome, Safari, or Firefox (press `F11` or `⌃⌘F` on macOS for full-screen presentation mode).

## Presenter Controls

- **`Space` / `→` / `PageDown` / `Enter`** — Advance linearly to the next choreographed beat
- **`←` / `Shift+Space` / `PageUp` / `Backspace`** — Step back one beat (to replay an animation)
- **Trackpad / Mouse Wheel** — Quantized linear step forward/backward
- **City Wipe Slides (`Leeds`, `Liverpool`, `Manchester`, `Sheffield`, `Birmingham`)**:
  - Automatically sweeps the glowing `.seam` divider from historical tram-era reach (amber) to 2026 modern reach (cyan) on slide entry.
  - **Drag the `↔` seam handle** horizontally to scrub 1930s/50s vs. 2026 live during talk pauses.
  - **Hover or click any historical route corridor** to highlight its surveyed geometry and open the original **Crich Tramway Village archival timetable scan** + transcription/kinematic provenance note (`Esc` or `Space` closes the lightbox).

## Rebuilding Data Bundles

All pre-processed geometries, LSOA arrays, route shapes, underserved neighbourhood hulls, and bundled Crich scans live in `public/data/` and `public/scans/` (generated via `scripts/build_data.py`).

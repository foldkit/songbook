# Coverchart

A Foldkit app for writing chord charts with lyrics.

## What it does

- Keep a library of songs in this browser (`localStorage`)
- Paste lyrics into named sections (Verse, Chorus, Bridge, …)
- Add chords to a song, then tap a word to place one above it
- Open a play view with large type, transpose, and capo (display only — stored chords stay in the original key)
- Copy a text chart you can paste elsewhere

## Run

```bash
pnpm install
pnpm dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

## Scripts

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm format
```

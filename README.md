# Notes

Minimal personal markdown notes (Tauri 2 + React).

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/tools/install) (for `cargo` / Tauri)
- macOS: Xcode Command Line Tools (`xcode-select --install`)

## Development

```bash
npm install
npm run tauri dev
```

## Build (macOS app)

```bash
npm run tauri build
```

The `.app` bundle is under `src-tauri/target/release/bundle/macos/`.

## Usage

1. On first launch, choose a folder for your `.md` notes.
2. **+ New** or **Cmd+N** creates a timestamped note.
3. Edits autosave after a short pause.
4. **Change folder…** switches the vault (stored in app data).

Notes are plain markdown files in the chosen folder (top level only).

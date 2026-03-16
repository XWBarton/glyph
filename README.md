<img src="glyph.png" width="72" alt="Glyph icon">

# Glyph

Desktop Typst editor for macOS. Write in a Monaco-powered source panel, see the compiled PDF update live alongside it.

## Features

- **Live PDF preview** — compiles on every keystroke with debouncing; errors shown inline
- **Slash commands** — type `/` to open a command palette: headings, lists, tables, images, math, code blocks, and more
- **File management** — open any `.typ` file; the editor tracks the active file path and passes it to the compiler
- **Project-aware imports** — walks up the directory tree to find `typst.toml` and sets the Typst root accordingly, so relative imports like `../_template.typ` work without access-denied errors
- **Syntax highlighting** — full Typst grammar with custom token colours

## Install (macOS)

Download the latest `.dmg` from the [Releases](https://github.com/XWBarton/glyph/releases) page, open it, and drag **Glyph** into your Applications folder.

Requires **Typst** to be installed and on your PATH (the app will find it automatically in Homebrew and Cargo locations):

```bash
brew install typst
```

## Build from source

Requirements: **Node.js 20+** and **Typst**.

```bash
git clone https://github.com/XWBarton/glyph.git
cd glyph
npm install
npm run build   # compiles TypeScript + bundles renderer
npm run dist    # packages the macOS .dmg into dist/
```

## Related

| | |
|---|---|
| **[Glyph Quorum](https://github.com/XWBarton/glyph-quorum)** | Self-hosted collaborative web editor — multiple people editing the same Typst document in real time |

---

## Development

```bash
npm install
npm run dev
```

Launches the app in development mode with hot reload.

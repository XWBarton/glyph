<img src="glyph.png" width="72" alt="Glyph icon">

# Glyph

Desktop Typst editor for macOS, Windows, and Linux. Write in a Monaco-powered source panel, see the compiled PDF update live alongside it.

## Features

- **Live PDF preview** — compiles on every keystroke with debouncing; errors shown inline
- **Slash commands** — type `/` to open a command palette: headings, lists, tables, images, math, code blocks, and more
- **File management** — open any `.typ` file; the editor tracks the active file path and passes it to the compiler
- **Project-aware imports** — walks up the directory tree to find `typst.toml` and uses it as the Typst root; add an empty `typst.toml` at your project root to allow `../` imports across subdirectories
- **Syntax highlighting** — full Typst grammar with custom token colours

## Install

Requires **Typst** on your PATH. The app searches standard install locations automatically (Homebrew, Cargo, system PATH).

A macOS (Apple Silicon) build is available on the [Releases](https://github.com/XWBarton/glyph/releases) page. For other platforms, build from source below.

## Build from source

Requirements: **Node.js 20+** and **Typst**.

```bash
git clone https://github.com/XWBarton/glyph.git
cd glyph
npm install
npm run dist    # produces a .dmg / .exe / .AppImage in dist/
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

---

Found this useful and want to help support maintenance?

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/xbarton)

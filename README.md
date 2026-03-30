<img src="glyph.png" width="72" alt="Glyph icon">

# Glyph

Desktop Typst editor for macOS, Windows, and Linux. Write in a Monaco-powered source panel, see the compiled PDF update live alongside it.

![Glyph screenshot](screenshot.png?v=2)

## Features

- **Live PDF preview** — compiles on every keystroke with debouncing; errors shown inline with a copy button; press **Cmd+R** to force a rerender at any time
- **PDF zoom** — zoom the preview from 50% to 300% with − / + controls docked below the preview pane
- **Find and replace** — press **Cmd+F** (or **Cmd+H** for replace) for a styled find/replace panel with match count, case/whole-word/regex toggles, and prev/next navigation
- **Bold and italic shortcuts** — select text and press **Cmd+B** for bold (`*...*`) or **Cmd+I** for italic (`_..._`); pressing again toggles them off
- **Editor font size** — adjust source text size with − / + controls in the editor pane corner
- **Book mode** — group multiple `.typ` files into a single project with front matter, chapters, and back matter; add, reorder, and delete sections from a sidebar panel
- **Per-chapter and full-book preview** — click a chapter to preview it in isolation, or click the book title to compile and preview the whole document at once
- **Bibliography** — `.bib` files in your book are scanned automatically; `@cite` keys resolve in chapter previews, and the references page always renders against the full book so every citation appears
- **Image completions** — place images in an `assets/` folder and get path completions when typing `#image("…")`
- **Slash commands** — type `/` to open a command palette: headings, lists, tables, images, math, code blocks, and more
- **File management** — open any `.typ` file; the editor tracks the active file path and passes it to the compiler
- **Project-aware imports** — walks up the directory tree to find `typst.toml` and uses it as the Typst root; add an empty `typst.toml` at your project root to allow `../` imports across subdirectories
- **Syntax highlighting** — full Typst grammar with custom token colours
- **Linux support** — native window decorations and a Quit menu item on Linux (Ubuntu, etc.)

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

<a href='https://ko-fi.com/X8X21WPZ2R' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi5.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

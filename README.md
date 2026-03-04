# Binary Insight

A powerful desktop application for binary file analysis, network traffic inspection, and protocol decoding. Built with **Tauri** (Rust + React).

## Features

- **Hex Viewer** — Virtualized hex view with color-coded regions, selection, bookmarks, go-to-offset
- **Structure Tree** — Automatic format parsing (PNG, PE, ELF) with expandable field hierarchy
- **Network Analysis** — PCAP import, packet list with BPF-like filtering, protocol layer drill-down, session flow diagrams
- **Visualization** — Shannon entropy graph, byte frequency histogram, side-by-side binary diff
- **AI Assistant** — Local LLM integration (Ollama) for structure analysis and field suggestions
- **Lua Scripting** — Monaco-based editor with built-in templates for custom format parsers
- **Export** — Hex dump, C byte array, JSON analysis report

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop | Tauri v1 (Rust) |
| Frontend | React 18 + TypeScript + Vite 5 |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand + Immer |
| Scripting | Lua 5.4 (mlua) |
| AI | Ollama (local LLM) |

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/) (stable)

### Development (Web Only)
```bash
npm install
npm run dev
```

### Development (Desktop with Tauri)
```bash
npm install
npm run tauri:dev
```

### Build for Production
```bash
npm run tauri:build
```

## Documentation

- [Architecture](docs/architecture.md) — System design and structure
- [Scripting API](docs/scripting-api.md) — Lua scripting reference
- [Contributing](docs/contributing.md) — Development guide

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+O` | Open file |
| `Ctrl+I` | Import PCAP |
| `Ctrl+G` | Go to offset |
| `Ctrl+F` | Search |
| `Ctrl+P` | Command palette |

## License

MIT

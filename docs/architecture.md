# Binary Insight — Architecture

## Overview

Binary Insight is a desktop application built with **Tauri** (Rust + React) for binary file analysis, network packet inspection, and protocol decoding.

## Tech Stack

### Frontend (React + TypeScript)
- **Vite 5** — Build tool and dev server
- **React 18** — UI framework
- **TypeScript 5.8** — Type safety
- **Tailwind CSS 3** — Utility-first styling
- **shadcn/ui** — Component primitives (dialog, tabs, buttons, etc.)
- **Zustand + Immer** — State management
- **Monaco Editor** — Lua script editor
- **react-virtuoso** — Virtualized scrolling for hex data and packet lists
- **Framer Motion** — Animations
- **Recharts** — Charts (entropy graph)

### Backend (Rust)
- **Tauri v1** — Desktop framework, IPC bridge
- **mlua** — Lua 5.4 scripting engine (for custom format templates)
- **pcap-parser** — PCAP/PCAPng file parsing
- **byteorder / nom** — Binary data parsing
- **memmap2** — Memory-mapped file access
- **reqwest** — HTTP client for Ollama AI API
- **rusqlite** — Local SQLite database (sessions, bookmarks)
- **sha2 / md5** — File hashing

## Project Structure

```
binary-insight/
├── src/                          # React frontend
│   ├── components/
│   │   ├── hex/                  # Hex viewer (HexViewer, HexCell, AsciiPanel, OffsetRuler)
│   │   ├── structure/            # Structure tree (StructureTree, FieldRow, FormatSelector)
│   │   ├── network/              # Network analysis (PacketList, FilterBar, PacketDetail, FlowDiagram)
│   │   ├── visualization/        # Visualizations (EntropyGraph, ByteHistogram, DiffView)
│   │   ├── ai/                   # AI assistant (AIPanel, SuggestionBubble, QueryBar)
│   │   ├── scripting/            # Script editor (ScriptEditor, TemplateLibrary)
│   │   ├── layout/               # Layout (AnalyzerSidebar, TabBar, StatusBar)
│   │   └── ui/                   # shadcn/ui components
│   ├── store/                    # Zustand stores (fileStore, networkStore, uiStore)
│   ├── hooks/                    # Custom hooks (useHexSelection, useFileSession, usePacketFilter, useAI)
│   ├── lib/                      # Utilities (formatters, tauri IPC, mockData, colorMap)
│   └── pages/                    # Page routes (Index, NotFound)
│
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── main.rs               # Tauri entry point
│   │   ├── core/                  # Core modules (file_reader, hex_view, magic_detector, entropy, diff)
│   │   ├── formats/               # Format parsers (PNG, PE, ELF, generic)
│   │   ├── network/               # Network (pcap_reader, session assembler)
│   │   ├── scripting/             # Lua runtime & template loader
│   │   ├── ai/                    # Ollama client & prompt builder
│   │   ├── storage/               # SQLite database
│   │   └── commands/              # Tauri command handlers
│   ├── templates/                 # Lua script templates
│   └── Cargo.toml
│
└── docs/                         # Documentation
```

## Data Flow

```
User Action → React Component → Zustand Store → Tauri IPC → Rust Backend
                                                                 │
                                                    ┌────────────┤
                                                    ▼            ▼
                                               File I/O     Network/AI
                                                    │            │
                                                    └────────────┤
                                                                 ▼
                                                          Result → IPC → Store → UI Update
```

## State Management

Three Zustand stores using Immer middleware:

1. **fileStore** — Open files, tabs, hex data cache, selection, bookmarks, diff mode
2. **networkStore** — Packets, sessions, filters, capture state, protocol stats
3. **uiStore** — Theme, active panels, layout, modals, search, loading states

## IPC Commands

All Tauri commands are typed and wrapped in `src/lib/tauri.ts`:

| Category | Commands |
|----------|----------|
| File | `open_file`, `read_file_bytes`, `get_file_info`, `detect_format`, `get_entropy`, `search_bytes`, `search_string`, `get_strings` |
| Network | `load_pcap`, `get_packet_detail`, `get_sessions`, `get_protocol_stats` |
| AI | `ai_analyze`, `ai_chat`, `ai_suggest_fields` |
| Export | `export_hex`, `export_c_array`, `export_json_report` |
| Script | `run_lua_script`, `list_templates`, `load_template` |

## Format Parsers

Built-in format parsers produce structured `FieldRegion` trees:

- **PNG** — Signature + chunk parsing (IHDR detail, chunk types)
- **PE** — DOS Header, COFF Header, Optional Header, Section table
- **ELF** — ELF identification, ELF Header, Program/Section headers
- **Generic** — Header detection, embedded string search

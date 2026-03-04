# Contributing to Binary Insight

## Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) 18+ (or [Bun](https://bun.sh/))
- [Rust](https://rustup.rs/) (stable)
- [Tauri CLI](https://tauri.app/) v1

### Getting Started

```bash
# Clone the repository
git clone https://github.com/your-org/binary-insight.git
cd binary-insight

# Install frontend dependencies
npm install

# Run in development mode (web only)
npm run dev

# Run with Tauri (desktop)
npm run tauri:dev

# Build for production
npm run tauri:build
```

### Project Structure

- `src/` — React frontend (TypeScript)
- `src-tauri/` — Rust backend (Tauri)
- `docs/` — Documentation
- `templates/` — Lua script templates (bundled with Rust)

## Code Style

### TypeScript/React
- Use functional components with hooks
- State management via Zustand stores
- Use `cn()` utility for conditional classnames
- Import aliases: `@/` maps to `src/`
- Prefer named exports for components

### Rust
- Follow standard Rust conventions
- Use `anyhow::Result` for error handling in internal code
- Use `Result<T, String>` for Tauri commands
- Serde for all IPC types
- Document public functions with `///` doc comments

## Adding a Format Parser

1. Create `src-tauri/src/formats/your_format.rs`
2. Implement a `parse_your_format(data: &[u8]) -> Vec<FieldRegion>` function
3. Add the format to `FileFormat` enum in `magic_detector.rs`
4. Add magic bytes to `SIGNATURES` in `magic_detector.rs`
5. Update the match in `formats/mod.rs::parse_file()`
6. Add a Lua template in `templates/your_format.lua`

## Adding a Tauri Command

1. Create the function in the appropriate commands file
2. Add `#[tauri::command]` attribute
3. Register in `main.rs` `invoke_handler`
4. Add TypeScript wrapper in `src/lib/tauri.ts`

## Testing

```bash
# Frontend tests
npm run test

# Rust tests
cd src-tauri && cargo test
```

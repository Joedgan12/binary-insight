# Binary Insight — Lua Scripting API

## Overview

Binary Insight embeds a Lua 5.4 runtime for writing custom binary format templates. Scripts have access to a set of built-in functions for reading binary data, marking regions, and producing output.

## Reading Functions

### Position Management

| Function | Description |
|----------|-------------|
| `seek(offset)` | Set the read position to `offset` |
| `tell()` | Return the current read position |
| `eof()` | Return `true` if at end of file |
| `file_size()` | Return the total file size in bytes |

### Integer Readers

| Function | Description |
|----------|-------------|
| `read_u8()` | Read 1 byte as unsigned integer |
| `read_u16_le()` | Read 2 bytes as little-endian unsigned 16-bit |
| `read_u16_be()` | Read 2 bytes as big-endian unsigned 16-bit |
| `read_u32_le()` | Read 4 bytes as little-endian unsigned 32-bit |
| `read_u32_be()` | Read 4 bytes as big-endian unsigned 32-bit |

### Data Readers

| Function | Description |
|----------|-------------|
| `read_bytes(n)` | Read `n` bytes, return as byte array |
| `read_string(n)` | Read `n` bytes as UTF-8 string |

## Output Functions

### Label / Region Marking

```lua
label(name, size, field_type)
```

Marks a region in the hex viewer. Called after reading the data (marks from `current_position - size` to `current_position`).

Parameters:
- `name` — Display name for the field
- `size` — Size in bytes
- `field_type` — Type string: `"header"`, `"metadata"`, `"payload"`, `"checksum"`, `"string"`, `"chunk"`, `"section"`, `"data"`

### Print

```lua
print(...)
```

Output text to the script output panel. Accepts multiple arguments (tab-separated).

## Example: PNG Parser

```lua
-- PNG Format Template
print("=== PNG Analysis ===")
print("File size: " .. file_size() .. " bytes")

-- Verify signature
local sig = read_bytes(8)
label("PNG Signature", 8, "header")

-- Parse chunks
while not eof() do
    local length = read_u32_be()
    local chunk_type = read_string(4)

    print(string.format("Chunk: %s (%d bytes)", chunk_type, length))
    label(chunk_type, length + 12, "chunk")

    -- Skip chunk data + CRC
    if length > 0 then
        read_bytes(length)
    end
    read_bytes(4) -- CRC

    if chunk_type == "IEND" then break end
end
```

## Example: Simple Header Inspector

```lua
print("=== Header Inspector ===")

-- Read first 16 bytes
seek(0)
for i = 0, 15 do
    local b = read_u8()
    print(string.format("  Offset %02X: %02X (%d) '%s'",
        i, b, b,
        (b >= 0x20 and b < 0x7F) and string.char(b) or "."))
end
label("File Header", 16, "header")

-- Check for common signatures
seek(0)
local b0, b1 = read_u8(), read_u8()

if b0 == 0x89 and b1 == 0x50 then
    print("Detected: PNG image")
elseif b0 == 0xFF and b1 == 0xD8 then
    print("Detected: JPEG image")
elseif b0 == 0x4D and b1 == 0x5A then
    print("Detected: PE executable")
elseif b0 == 0x7F and b1 == 0x45 then
    print("Detected: ELF binary")
else
    print(string.format("Unknown format (magic: %02X %02X)", b0, b1))
end
```

## Built-in Templates

| ID | Name | Format |
|----|------|--------|
| `png` | PNG Image | PNG |
| `pe32` | PE32 Executable | PE |
| `elf64` | ELF64 Binary | ELF |
| `generic_hex` | Generic Hex Dump | Any |

Load templates via the Template Library panel or the `load_template` command.

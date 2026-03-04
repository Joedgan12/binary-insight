-- Generic Hex Dump Template
-- Basic hex dump with ASCII representation

print("=== Generic Hex Dump ===")
print(string.format("File size: %d bytes (0x%X)", file_size(), file_size()))

-- Print first 256 bytes as hex dump
local rows = math.min(16, math.ceil(file_size() / 16))
print(string.format("\nShowing first %d rows (%d bytes):\n", rows, rows * 16))
print("Offset    00 01 02 03 04 05 06 07  08 09 0A 0B 0C 0D 0E 0F  ASCII")
print("--------  -----------------------------------------------  ----------------")

seek(0)
for row = 0, rows - 1 do
    local offset = row * 16
    local hex_parts = {}
    local ascii_parts = {}

    for col = 0, 15 do
        if eof() then
            table.insert(hex_parts, "  ")
            table.insert(ascii_parts, " ")
        else
            local b = read_u8()
            table.insert(hex_parts, string.format("%02X", b))
            if b >= 0x20 and b < 0x7F then
                table.insert(ascii_parts, string.char(b))
            else
                table.insert(ascii_parts, ".")
            end
        end
        if col == 7 then
            table.insert(hex_parts, "")
        end
    end

    local hex_str = table.concat(hex_parts, " ")
    local ascii_str = table.concat(ascii_parts)
    print(string.format("%08X  %-49s  %s", offset, hex_str, ascii_str))
    label(string.format("Row 0x%X", offset), 16, "data")
end

-- File statistics
print("\n--- File Statistics ---")
seek(0)
local byte_counts = {}
for i = 0, 255 do byte_counts[i] = 0 end

local total = file_size()
for i = 1, total do
    if eof() then break end
    local b = read_u8()
    byte_counts[b] = byte_counts[b] + 1
end

-- Find most common bytes
local sorted = {}
for i = 0, 255 do
    table.insert(sorted, {byte = i, count = byte_counts[i]})
end
table.sort(sorted, function(a, b) return a.count > b.count end)

print("\nTop 10 most common bytes:")
for i = 1, math.min(10, #sorted) do
    local entry = sorted[i]
    if entry.count > 0 then
        local pct = (entry.count / total) * 100
        print(string.format("  0x%02X: %d (%.1f%%)", entry.byte, entry.count, pct))
    end
end

-- Null byte percentage
local null_pct = (byte_counts[0] / total) * 100
print(string.format("\nNull bytes: %.1f%%", null_pct))

-- Check if likely ASCII text
local printable = 0
for i = 0x20, 0x7E do printable = printable + byte_counts[i] end
printable = printable + byte_counts[0x0A] + byte_counts[0x0D] + byte_counts[0x09]
local text_pct = (printable / total) * 100
print(string.format("Printable ASCII: %.1f%%", text_pct))

if text_pct > 90 then
    print("File appears to be TEXT")
elseif null_pct > 50 then
    print("File appears to contain mostly null/empty data")
else
    print("File appears to be BINARY")
end

print("\nAnalysis complete.")

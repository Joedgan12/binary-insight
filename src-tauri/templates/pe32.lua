-- PE32/PE32+ Executable Template
-- Parses Windows PE headers and section table

print("=== PE Executable Analysis ===")
print("File size: " .. file_size() .. " bytes")

-- DOS Header
local e_magic = read_u16_le()
if e_magic ~= 0x5A4D then
    print("ERROR: Not a valid PE file (missing MZ signature)")
    return
end
print("DOS Magic: MZ (0x5A4D)")
label("DOS Magic", 2, "header")

-- Skip to e_lfanew at offset 60
seek(60)
local e_lfanew = read_u32_le()
print(string.format("PE Header offset: 0x%08X", e_lfanew))

-- DOS Stub
label("DOS Header", 64, "header")

-- PE Signature
seek(e_lfanew)
local pe_sig = read_u32_le()
if pe_sig ~= 0x00004550 then
    print("ERROR: Invalid PE signature")
    return
end
print("PE Signature: PE\\0\\0")
label("PE Signature", 4, "header")

-- COFF File Header
local machine = read_u16_le()
local num_sections = read_u16_le()
local timestamp = read_u32_le()
local sym_table_ptr = read_u32_le()
local num_symbols = read_u32_le()
local opt_header_size = read_u16_le()
local characteristics = read_u16_le()

local machine_name = "Unknown"
if machine == 0x14C then machine_name = "x86"
elseif machine == 0x8664 then machine_name = "x86-64"
elseif machine == 0x1C0 then machine_name = "ARM"
elseif machine == 0xAA64 then machine_name = "ARM64"
end

print(string.format("Machine: %s (0x%04X)", machine_name, machine))
print(string.format("Sections: %d", num_sections))
print(string.format("Optional Header Size: %d", opt_header_size))
label("COFF Header", 20, "header")

-- Optional Header Magic
local opt_magic = read_u16_le()
local pe_type = "Unknown"
if opt_magic == 0x10B then pe_type = "PE32"
elseif opt_magic == 0x20B then pe_type = "PE32+"
end
print(string.format("PE Type: %s", pe_type))

-- Skip rest of optional header
if opt_header_size > 2 then
    read_bytes(opt_header_size - 2)
end
label("Optional Header", opt_header_size, "header")

-- Section Headers
print(string.format("\n--- Section Table (%d sections) ---", num_sections))
for i = 1, num_sections do
    local name = read_string(8)
    local virtual_size = read_u32_le()
    local virtual_addr = read_u32_le()
    local raw_size = read_u32_le()
    local raw_offset = read_u32_le()
    read_bytes(12) -- skip relocations, line numbers, characteristics (partial)
    local section_chars = read_u32_le()

    -- Trim null padding from section name
    name = name:gsub("%z+$", "")

    print(string.format("  %s: VA=0x%08X Size=0x%X Raw=0x%X",
        name, virtual_addr, virtual_size, raw_offset))
    label("Section: " .. name, 40, "section")
end

print("\nPE analysis complete.")

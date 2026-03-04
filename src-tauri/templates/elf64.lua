-- ELF64 Binary Template
-- Parses ELF headers, program headers, and section headers

print("=== ELF Binary Analysis ===")
print("File size: " .. file_size() .. " bytes")

-- ELF Magic
local mag0 = read_u8()
local mag1 = read_u8()
local mag2 = read_u8()
local mag3 = read_u8()

if mag0 ~= 0x7F or mag1 ~= 0x45 or mag2 ~= 0x4C or mag3 ~= 0x46 then
    print("ERROR: Not a valid ELF file")
    return
end
print("ELF Magic: \\x7FELF")

-- ELF identification
local ei_class = read_u8()
local ei_data = read_u8()
local ei_version = read_u8()
local ei_osabi = read_u8()
read_bytes(8) -- padding

local class_name = "Unknown"
if ei_class == 1 then class_name = "ELF32"
elseif ei_class == 2 then class_name = "ELF64"
end

local endian_name = "Unknown"
if ei_data == 1 then endian_name = "Little-endian"
elseif ei_data == 2 then endian_name = "Big-endian"
end

local osabi_name = "Unknown"
if ei_osabi == 0 then osabi_name = "UNIX System V"
elseif ei_osabi == 3 then osabi_name = "Linux"
elseif ei_osabi == 9 then osabi_name = "FreeBSD"
end

print(string.format("Class: %s", class_name))
print(string.format("Endianness: %s", endian_name))
print(string.format("OS/ABI: %s", osabi_name))
label("ELF Identification", 16, "header")

local is_64 = (ei_class == 2)
local read_addr = is_64 and function()
    local lo = read_u32_le()
    local hi = read_u32_le()
    return lo + hi * 0x100000000
end or read_u32_le

local read_off = read_addr

-- ELF Header
local e_type = read_u16_le()
local e_machine = read_u16_le()
local e_version = read_u32_le()
local e_entry = read_addr()
local e_phoff = read_off()
local e_shoff = read_off()
local e_flags = read_u32_le()
local e_ehsize = read_u16_le()
local e_phentsize = read_u16_le()
local e_phnum = read_u16_le()
local e_shentsize = read_u16_le()
local e_shnum = read_u16_le()
local e_shstrndx = read_u16_le()

local type_name = "Unknown"
if e_type == 1 then type_name = "Relocatable"
elseif e_type == 2 then type_name = "Executable"
elseif e_type == 3 then type_name = "Shared Object"
elseif e_type == 4 then type_name = "Core"
end

local machine_name = "Unknown"
if e_machine == 0x03 then machine_name = "x86"
elseif e_machine == 0x3E then machine_name = "x86-64"
elseif e_machine == 0x28 then machine_name = "ARM"
elseif e_machine == 0xB7 then machine_name = "AArch64"
elseif e_machine == 0xF3 then machine_name = "RISC-V"
end

print(string.format("Type: %s", type_name))
print(string.format("Machine: %s (0x%04X)", machine_name, e_machine))
print(string.format("Entry point: 0x%X", e_entry))
print(string.format("Program headers: %d at offset 0x%X", e_phnum, e_phoff))
print(string.format("Section headers: %d at offset 0x%X", e_shnum, e_shoff))
label("ELF Header", is_64 and 64 or 52, "header")

-- Program Headers
if e_phnum > 0 and e_phoff > 0 then
    print(string.format("\n--- Program Headers (%d entries) ---", e_phnum))
    seek(e_phoff)
    for i = 1, e_phnum do
        local p_type = read_u32_le()
        local p_flags, p_offset, p_vaddr, p_paddr, p_filesz, p_memsz, p_align

        if is_64 then
            p_flags = read_u32_le()
            p_offset = read_off()
            p_vaddr = read_addr()
            p_paddr = read_addr()
            p_filesz = read_off()
            p_memsz = read_off()
            p_align = read_off()
        else
            p_offset = read_off()
            p_vaddr = read_addr()
            p_paddr = read_addr()
            p_filesz = read_u32_le()
            p_memsz = read_u32_le()
            p_flags = read_u32_le()
            p_align = read_u32_le()
        end

        local pt_name = "UNKNOWN"
        if p_type == 0 then pt_name = "NULL"
        elseif p_type == 1 then pt_name = "LOAD"
        elseif p_type == 2 then pt_name = "DYNAMIC"
        elseif p_type == 3 then pt_name = "INTERP"
        elseif p_type == 4 then pt_name = "NOTE"
        elseif p_type == 6 then pt_name = "PHDR"
        elseif p_type == 7 then pt_name = "TLS"
        end

        print(string.format("  [%d] %-8s offset=0x%X vaddr=0x%X filesz=0x%X memsz=0x%X",
            i - 1, pt_name, p_offset, p_vaddr, p_filesz, p_memsz))
        label("PHDR: " .. pt_name, e_phentsize, "section")
    end
end

print("\nELF analysis complete.")

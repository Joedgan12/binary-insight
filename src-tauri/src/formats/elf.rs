use super::FieldRegion;
use byteorder::{LittleEndian, BigEndian, ReadBytesExt};
use std::io::Cursor;

/// Parse ELF (Executable and Linkable Format) file structure.
pub fn parse_elf(data: &[u8]) -> Vec<FieldRegion> {
    let mut regions = Vec::new();

    if data.len() < 52 {
        return regions;
    }

    // ELF magic: 7F 45 4C 46
    regions.push(FieldRegion::new(
        "ELF Magic",
        0,
        4,
        "header",
        "ELF identification magic: \\x7FELF",
        "\\x7FELF",
    ));

    // ELF identification bytes (e_ident)
    let ei_class = data[4];
    let ei_data = data[5];
    let ei_version = data[6];
    let ei_osabi = data[7];

    let class_name = match ei_class {
        1 => "32-bit (ELF32)",
        2 => "64-bit (ELF64)",
        _ => "Unknown class",
    };

    let endian_name = match ei_data {
        1 => "Little-endian",
        2 => "Big-endian",
        _ => "Unknown endian",
    };

    let osabi_name = match ei_osabi {
        0 => "UNIX System V",
        1 => "HP-UX",
        2 => "NetBSD",
        3 => "Linux",
        6 => "Solaris",
        9 => "FreeBSD",
        _ => "Other",
    };

    let is_64bit = ei_class == 2;
    let is_little_endian = ei_data == 1;

    regions.push(FieldRegion::new(
        "ELF Identification",
        0,
        16,
        "header",
        &format!("{}, {}, {}", class_name, endian_name, osabi_name),
        class_name,
    ).with_children(vec![
        FieldRegion::new("ei_class", 4, 5, "metadata", class_name, &ei_class.to_string()),
        FieldRegion::new("ei_data", 5, 6, "metadata", endian_name, &ei_data.to_string()),
        FieldRegion::new("ei_version", 6, 7, "metadata", "ELF version", &ei_version.to_string()),
        FieldRegion::new("ei_osabi", 7, 8, "metadata", osabi_name, &ei_osabi.to_string()),
    ]));

    // ELF Header (after e_ident)
    let header_size = if is_64bit { 64 } else { 52 };
    if data.len() < header_size {
        return regions;
    }

    // Read e_type and e_machine
    let (e_type, e_machine, e_entry, e_phoff, e_shoff, e_phnum, e_shnum) = if is_64bit {
        let mut c = Cursor::new(&data[16..64]);
        let e_type = if is_little_endian { c.read_u16::<LittleEndian>().unwrap_or(0) } else { c.read_u16::<BigEndian>().unwrap_or(0) };
        let e_machine = if is_little_endian { c.read_u16::<LittleEndian>().unwrap_or(0) } else { c.read_u16::<BigEndian>().unwrap_or(0) };
        let _e_version = if is_little_endian { c.read_u32::<LittleEndian>().unwrap_or(0) } else { c.read_u32::<BigEndian>().unwrap_or(0) };
        let e_entry = if is_little_endian { c.read_u64::<LittleEndian>().unwrap_or(0) } else { c.read_u64::<BigEndian>().unwrap_or(0) };
        let e_phoff = if is_little_endian { c.read_u64::<LittleEndian>().unwrap_or(0) } else { c.read_u64::<BigEndian>().unwrap_or(0) };
        let e_shoff = if is_little_endian { c.read_u64::<LittleEndian>().unwrap_or(0) } else { c.read_u64::<BigEndian>().unwrap_or(0) };
        let _e_flags = if is_little_endian { c.read_u32::<LittleEndian>().unwrap_or(0) } else { c.read_u32::<BigEndian>().unwrap_or(0) };
        let _e_ehsize = if is_little_endian { c.read_u16::<LittleEndian>().unwrap_or(0) } else { c.read_u16::<BigEndian>().unwrap_or(0) };
        let _e_phentsize = if is_little_endian { c.read_u16::<LittleEndian>().unwrap_or(0) } else { c.read_u16::<BigEndian>().unwrap_or(0) };
        let e_phnum = if is_little_endian { c.read_u16::<LittleEndian>().unwrap_or(0) } else { c.read_u16::<BigEndian>().unwrap_or(0) };
        let _e_shentsize = if is_little_endian { c.read_u16::<LittleEndian>().unwrap_or(0) } else { c.read_u16::<BigEndian>().unwrap_or(0) };
        let e_shnum = if is_little_endian { c.read_u16::<LittleEndian>().unwrap_or(0) } else { c.read_u16::<BigEndian>().unwrap_or(0) };
        (e_type, e_machine, e_entry, e_phoff, e_shoff, e_phnum, e_shnum)
    } else {
        let mut c = Cursor::new(&data[16..52]);
        let e_type = if is_little_endian { c.read_u16::<LittleEndian>().unwrap_or(0) } else { c.read_u16::<BigEndian>().unwrap_or(0) };
        let e_machine = if is_little_endian { c.read_u16::<LittleEndian>().unwrap_or(0) } else { c.read_u16::<BigEndian>().unwrap_or(0) };
        let _e_version = if is_little_endian { c.read_u32::<LittleEndian>().unwrap_or(0) } else { c.read_u32::<BigEndian>().unwrap_or(0) };
        let e_entry = if is_little_endian { c.read_u32::<LittleEndian>().unwrap_or(0) as u64 } else { c.read_u32::<BigEndian>().unwrap_or(0) as u64 };
        let e_phoff = if is_little_endian { c.read_u32::<LittleEndian>().unwrap_or(0) as u64 } else { c.read_u32::<BigEndian>().unwrap_or(0) as u64 };
        let e_shoff = if is_little_endian { c.read_u32::<LittleEndian>().unwrap_or(0) as u64 } else { c.read_u32::<BigEndian>().unwrap_or(0) as u64 };
        let _e_flags = if is_little_endian { c.read_u32::<LittleEndian>().unwrap_or(0) } else { c.read_u32::<BigEndian>().unwrap_or(0) };
        let _e_ehsize = if is_little_endian { c.read_u16::<LittleEndian>().unwrap_or(0) } else { c.read_u16::<BigEndian>().unwrap_or(0) };
        let _e_phentsize = if is_little_endian { c.read_u16::<LittleEndian>().unwrap_or(0) } else { c.read_u16::<BigEndian>().unwrap_or(0) };
        let e_phnum = if is_little_endian { c.read_u16::<LittleEndian>().unwrap_or(0) } else { c.read_u16::<BigEndian>().unwrap_or(0) };
        let _e_shentsize = if is_little_endian { c.read_u16::<LittleEndian>().unwrap_or(0) } else { c.read_u16::<BigEndian>().unwrap_or(0) };
        let e_shnum = if is_little_endian { c.read_u16::<LittleEndian>().unwrap_or(0) } else { c.read_u16::<BigEndian>().unwrap_or(0) };
        (e_type, e_machine, e_entry, e_phoff, e_shoff, e_phnum, e_shnum)
    };

    let type_name = match e_type {
        0 => "None",
        1 => "Relocatable",
        2 => "Executable",
        3 => "Shared Object",
        4 => "Core",
        _ => "Unknown",
    };

    let machine_name = match e_machine {
        0x03 => "x86",
        0x28 => "ARM",
        0x3E => "x86-64",
        0xB7 => "AArch64",
        0xF3 => "RISC-V",
        _ => "Unknown",
    };

    regions.push(FieldRegion::new(
        "ELF Header",
        16,
        header_size,
        "header",
        &format!("{} {} — entry 0x{:X}", type_name, machine_name, e_entry),
        type_name,
    ).with_children(vec![
        FieldRegion::new("e_type", 16, 18, "metadata", type_name, &format!("0x{:04X}", e_type)),
        FieldRegion::new("e_machine", 18, 20, "metadata", machine_name, &format!("0x{:04X}", e_machine)),
        FieldRegion::new("e_entry", if is_64bit { 24 } else { 24 }, if is_64bit { 32 } else { 28 }, "pointer", "Entry point address", &format!("0x{:X}", e_entry)),
        FieldRegion::new("e_phoff", if is_64bit { 32 } else { 28 }, if is_64bit { 40 } else { 32 }, "pointer", "Program header table offset", &format!("0x{:X}", e_phoff)),
        FieldRegion::new("e_shoff", if is_64bit { 40 } else { 32 }, if is_64bit { 48 } else { 36 }, "pointer", "Section header table offset", &format!("0x{:X}", e_shoff)),
    ]));

    // Add program headers info
    if e_phnum > 0 {
        regions.push(FieldRegion::new(
            "Program Headers",
            e_phoff as usize,
            e_phoff as usize + 1,
            "section",
            &format!("{} program headers at offset 0x{:X}", e_phnum, e_phoff),
            &e_phnum.to_string(),
        ));
    }

    // Add section headers info
    if e_shnum > 0 {
        regions.push(FieldRegion::new(
            "Section Headers",
            e_shoff as usize,
            e_shoff as usize + 1,
            "section",
            &format!("{} section headers at offset 0x{:X}", e_shnum, e_shoff),
            &e_shnum.to_string(),
        ));
    }

    regions
}

use super::FieldRegion;
use byteorder::{LittleEndian, ReadBytesExt};
use std::io::Cursor;

/// Parse PE (Portable Executable) file structure.
pub fn parse_pe(data: &[u8]) -> Vec<FieldRegion> {
    let mut regions = Vec::new();

    if data.len() < 64 {
        return regions;
    }

    // DOS Header
    regions.push(FieldRegion::new(
        "DOS Header",
        0,
        64,
        "header",
        "MS-DOS MZ header",
        "MZ",
    ).with_children(vec![
        FieldRegion::new("e_magic", 0, 2, "metadata", "Magic number (MZ)", "0x5A4D"),
        FieldRegion::new(
            "e_lfanew",
            60,
            64,
            "pointer",
            "File address of new exe header",
            &format!("0x{:08X}", {
                let mut c = Cursor::new(&data[60..64]);
                c.read_u32::<LittleEndian>().unwrap_or(0)
            }),
        ),
    ]));

    // Get PE header offset
    let mut cursor = Cursor::new(&data[60..64]);
    let pe_offset = match cursor.read_u32::<LittleEndian>() {
        Ok(o) => o as usize,
        Err(_) => return regions,
    };

    if pe_offset + 4 > data.len() {
        return regions;
    }

    // DOS Stub (between DOS header and PE header)
    if pe_offset > 64 {
        regions.push(FieldRegion::new(
            "DOS Stub",
            64,
            pe_offset,
            "payload",
            "DOS stub program",
            &format!("[{} bytes]", pe_offset - 64),
        ));
    }

    // PE Signature
    if &data[pe_offset..pe_offset + 4] != b"PE\x00\x00" {
        return regions;
    }
    regions.push(FieldRegion::new(
        "PE Signature",
        pe_offset,
        pe_offset + 4,
        "header",
        "PE\\0\\0 signature",
        "PE",
    ));

    let coff_offset = pe_offset + 4;
    if coff_offset + 20 > data.len() {
        return regions;
    }

    // COFF File Header
    let mut c = Cursor::new(&data[coff_offset..coff_offset + 20]);
    let machine = c.read_u16::<LittleEndian>().unwrap_or(0);
    let num_sections = c.read_u16::<LittleEndian>().unwrap_or(0);
    let _timestamp = c.read_u32::<LittleEndian>().unwrap_or(0);
    let _sym_table = c.read_u32::<LittleEndian>().unwrap_or(0);
    let _num_symbols = c.read_u32::<LittleEndian>().unwrap_or(0);
    let opt_header_size = c.read_u16::<LittleEndian>().unwrap_or(0);
    let characteristics = c.read_u16::<LittleEndian>().unwrap_or(0);

    let machine_name = match machine {
        0x14c => "x86 (i386)",
        0x8664 => "x86-64 (AMD64)",
        0x1c0 => "ARM",
        0xaa64 => "ARM64",
        _ => "Unknown",
    };

    let is_dll = characteristics & 0x2000 != 0;
    let is_exe = characteristics & 0x0002 != 0;
    let file_type = if is_dll { "DLL" } else if is_exe { "EXE" } else { "Unknown" };

    regions.push(FieldRegion::new(
        "COFF File Header",
        coff_offset,
        coff_offset + 20,
        "header",
        &format!("{} {} — {} sections", machine_name, file_type, num_sections),
        machine_name,
    ).with_children(vec![
        FieldRegion::new("Machine", coff_offset, coff_offset + 2, "metadata", machine_name, &format!("0x{:04X}", machine)),
        FieldRegion::new("NumberOfSections", coff_offset + 2, coff_offset + 4, "metadata", "Number of sections", &num_sections.to_string()),
        FieldRegion::new("SizeOfOptionalHeader", coff_offset + 16, coff_offset + 18, "metadata", "Size of optional header", &opt_header_size.to_string()),
        FieldRegion::new("Characteristics", coff_offset + 18, coff_offset + 20, "flags", &format!("File type: {}", file_type), &format!("0x{:04X}", characteristics)),
    ]));

    // Optional Header
    let opt_offset = coff_offset + 20;
    if opt_header_size > 0 && opt_offset + (opt_header_size as usize) <= data.len() {
        let opt_end = opt_offset + opt_header_size as usize;
        let magic = if opt_offset + 2 <= data.len() {
            let mut c = Cursor::new(&data[opt_offset..opt_offset + 2]);
            c.read_u16::<LittleEndian>().unwrap_or(0)
        } else {
            0
        };

        let pe_type = match magic {
            0x10b => "PE32",
            0x20b => "PE32+",
            _ => "Unknown",
        };

        regions.push(FieldRegion::new(
            "Optional Header",
            opt_offset,
            opt_end,
            "header",
            &format!("{} Optional Header", pe_type),
            pe_type,
        ));

        // Section headers
        let sections_offset = opt_end;
        for i in 0..num_sections as usize {
            let sec_start = sections_offset + i * 40;
            let sec_end = sec_start + 40;
            if sec_end > data.len() {
                break;
            }

            let name_bytes = &data[sec_start..sec_start + 8];
            let section_name = String::from_utf8_lossy(name_bytes)
                .trim_end_matches('\0')
                .to_string();

            let mut c = Cursor::new(&data[sec_start + 8..sec_start + 16]);
            let virtual_size = c.read_u32::<LittleEndian>().unwrap_or(0);
            let virtual_addr = c.read_u32::<LittleEndian>().unwrap_or(0);

            regions.push(FieldRegion::new(
                &format!("Section: {}", section_name),
                sec_start,
                sec_end,
                "section",
                &format!("VA: 0x{:08X}, Size: 0x{:X}", virtual_addr, virtual_size),
                &section_name,
            ));
        }
    }

    regions
}

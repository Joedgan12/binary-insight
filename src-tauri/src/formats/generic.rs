use super::FieldRegion;

/// Generic binary parser — attempts to identify common structures.
pub fn parse_generic(data: &[u8]) -> Vec<FieldRegion> {
    let mut regions = Vec::new();

    if data.is_empty() {
        return regions;
    }

    // Header region (first 16 bytes or less)
    let header_size = 16.min(data.len());
    let header_hex: Vec<String> = data[..header_size].iter().map(|b| format!("{:02X}", b)).collect();

    regions.push(FieldRegion::new(
        "File Header",
        0,
        header_size,
        "header",
        "First bytes of file (magic bytes region)",
        &header_hex.join(" "),
    ));

    // Try to find null-terminated strings in the first 1KB
    let scan_len = 1024.min(data.len());
    let mut string_start = None;
    let mut current_string = String::new();

    for i in 0..scan_len {
        let b = data[i];
        if b >= 0x20 && b < 0x7F {
            if string_start.is_none() {
                string_start = Some(i);
            }
            current_string.push(b as char);
        } else {
            if current_string.len() >= 8 {
                if let Some(start) = string_start {
                    regions.push(FieldRegion::new(
                        &format!("String: \"{}\"", &current_string[..current_string.len().min(32)]),
                        start,
                        i,
                        "string",
                        "Embedded ASCII string",
                        &current_string,
                    ));
                }
            }
            current_string.clear();
            string_start = None;
        }
    }

    // If file is large enough, add a data region for the rest
    if data.len() > header_size {
        regions.push(FieldRegion::new(
            "Data",
            header_size,
            data.len(),
            "payload",
            &format!("File data ({} bytes)", data.len() - header_size),
            &format!("[{} bytes]", data.len() - header_size),
        ));
    }

    regions
}

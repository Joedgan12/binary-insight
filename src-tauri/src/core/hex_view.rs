use serde::{Deserialize, Serialize};

/// Represents a single row in hex view output.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HexRow {
    pub offset: usize,
    pub hex: Vec<String>,
    pub ascii: String,
}

/// Format bytes into hex view rows (16 bytes per row).
pub fn format_hex_view(data: &[u8], start: usize, count: usize) -> Vec<HexRow> {
    let end = (start + count).min(data.len());
    let slice = &data[start..end];
    let mut rows = Vec::new();

    for (chunk_idx, chunk) in slice.chunks(16).enumerate() {
        let offset = start + chunk_idx * 16;
        let hex: Vec<String> = chunk.iter().map(|b| format!("{:02X}", b)).collect();
        let ascii: String = chunk
            .iter()
            .map(|&b| {
                if b >= 0x20 && b < 0x7F {
                    b as char
                } else {
                    '.'
                }
            })
            .collect();
        rows.push(HexRow { offset, hex, ascii });
    }

    rows
}

/// Format a single byte as hex string.
pub fn to_hex(byte: u8) -> String {
    format!("{:02X}", byte)
}

/// Format offset with padding.
pub fn format_offset(offset: usize) -> String {
    format!("{:08X}", offset)
}

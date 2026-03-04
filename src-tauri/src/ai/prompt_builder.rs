use crate::core::file_reader::FileInfo;

/// Build an analysis prompt with file context.
pub fn build_analysis_prompt(file_info: &FileInfo, hex_preview: &str, question: &str) -> String {
    format!(
        r#"File: {} ({})
Size: {} bytes
Format: {}
SHA-256: {}

First 128 bytes (hex):
{}

User question: {}"#,
        file_info.name,
        file_info.format,
        file_info.size,
        file_info.format,
        file_info.sha256,
        hex_preview,
        question
    )
}

/// Build a field suggestion prompt.
pub fn build_suggest_prompt(format: &str, hex_bytes: &str, offset: usize) -> String {
    format!(
        r#"File format: {}
Offset: 0x{:08X}
Hex bytes at this region:
{}

Based on the file format and byte values, what fields are these bytes likely to represent?
Return a JSON array of objects with: name, offset, size, type, description, value"#,
        format, offset, hex_bytes
    )
}

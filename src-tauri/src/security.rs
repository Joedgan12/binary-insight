/// Security hardening helpers for Binary Insight.
///
/// Centralises all input-validation and path-safety logic so that every Tauri
/// command can call one function rather than duplicating ad-hoc checks.

use std::path::Path;

// ─── Global limits ────────────────────────────────────────────────────────────

/// Maximum number of byte-search / string-search results returned to the UI.
pub const MAX_SEARCH_RESULTS: usize = 10_000;

/// Maximum number of extracted strings returned to the UI.
pub const MAX_STRING_RESULTS: usize = 10_000;

/// Maximum number of packets loaded from a PCAP file.
pub const MAX_PCAP_PACKETS: usize = 100_000;

/// Maximum number of bytes that may be read in a single `read_file_bytes` call.
pub const MAX_SINGLE_READ: usize = 64 * 1024 * 1024; // 64 MiB

/// Maximum allowed `block_size` for entropy calculations.
pub const MAX_BLOCK_SIZE: usize = 1024 * 1024; // 1 MiB

/// Maximum output lines captured from a Lua script.
pub const MAX_LUA_OUTPUT_LINES: usize = 1_000;

/// Maximum labelled regions produced by a Lua script.
pub const MAX_LUA_REGIONS: usize = 500;

/// Maximum bytes returned by Lua `read_bytes(n)` per call.
pub const MAX_LUA_READ_BYTES: usize = 64 * 1024; // 64 KiB

/// Lua instruction limit (guards against infinite loops).
pub const LUA_INSTRUCTION_LIMIT: u32 = 50_000_000;

// ─── Path validation ─────────────────────────────────────────────────────────

/// Validate a path that is used for **reading** a file.
///
/// Rules enforced:
/// * Non-empty.
/// * No embedded null bytes.
/// * Must be absolute.
/// * No `..` (parent-directory) traversal components.
pub fn validate_input_path(path: &str) -> Result<(), String> {
    if path.is_empty() {
        return Err("File path cannot be empty".to_string());
    }
    if path.contains('\0') {
        return Err("File path contains null bytes".to_string());
    }

    let p = Path::new(path);

    if !p.is_absolute() {
        return Err("File path must be absolute".to_string());
    }

    for component in p.components() {
        if matches!(component, std::path::Component::ParentDir) {
            return Err("Path traversal ('..') is not allowed".to_string());
        }
    }

    Ok(())
}

/// Validate a path that is used for **writing** a file (exports / save).
///
/// In addition to `validate_input_path` rules this also:
/// * Rejects writes into OS system directories.
/// * Requires a whitelisted file extension.
/// * Validates that the C identifier characters for var names are safe (not
///   called here, but `validate_c_identifier` exists for that).
pub fn validate_output_path(path: &str) -> Result<(), String> {
    validate_input_path(path)?;

    // Extension whitelist – only safe output formats are allowed.
    let p = Path::new(path);
    let ext = p
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    const ALLOWED: &[&str] = &["txt", "hex", "bin", "c", "h", "json", "csv", "xml", "lua"];
    if !ALLOWED.contains(&ext.as_str()) {
        return Err(format!(
            "Output extension '{}' is not permitted (allowed: {})",
            ext,
            ALLOWED.join(", ")
        ));
    }

    // System-directory block list (cross-platform).
    let path_lower = path.to_lowercase().replace('\\', "/");
    const BLOCKED: &[&str] = &[
        "c:/windows",
        "c:/program files",
        "c:/program files (x86)",
        "c:/programdata",
        "c:/system volume information",
        "/etc",
        "/sys",
        "/proc",
        "/dev",
        "/boot",
        "/usr",
        "/bin",
        "/sbin",
        "/lib",
        "/lib64",
    ];
    for blocked in BLOCKED {
        if path_lower.starts_with(blocked) {
            return Err(format!(
                "Writing to system directory is not permitted: {}",
                path
            ));
        }
    }

    Ok(())
}

// ─── Numeric range validation ─────────────────────────────────────────────────

/// Ensure `start` and `length` describe a sane byte range within a file.
pub fn validate_read_range(start: usize, length: usize, file_size: usize) -> Result<(), String> {
    if length > MAX_SINGLE_READ {
        return Err(format!(
            "Requested read length {} exceeds the maximum of {} bytes",
            length, MAX_SINGLE_READ
        ));
    }
    if file_size > 0 && start >= file_size {
        return Err(format!(
            "Start offset {} is beyond end of file (size {})",
            start, file_size
        ));
    }
    Ok(())
}

/// Validate an entropy block size: must be ≥ 1 and ≤ MAX_BLOCK_SIZE.
pub fn validate_block_size(block_size: usize) -> Result<(), String> {
    if block_size == 0 {
        return Err("Block size must be at least 1".to_string());
    }
    if block_size > MAX_BLOCK_SIZE {
        return Err(format!(
            "Block size {} exceeds the maximum of {} bytes",
            block_size, MAX_BLOCK_SIZE
        ));
    }
    Ok(())
}

// ─── Identifier / string sanitisation ────────────────────────────────────────

/// Validate a C identifier used as the variable name in C-array exports.
///
/// Allowed characters: ASCII letters, digits, and underscore.  Must not start
/// with a digit.  Maximum length: 128 characters.
pub fn validate_c_identifier(name: &str) -> Result<(), String> {
    if name.is_empty() {
        return Err("Variable name cannot be empty".to_string());
    }
    if name.len() > 128 {
        return Err("Variable name is too long (max 128 chars)".to_string());
    }
    let mut chars = name.chars();
    if let Some(first) = chars.next() {
        if !first.is_ascii_alphabetic() && first != '_' {
            return Err(format!(
                "Variable name must start with a letter or underscore, got '{}'",
                first
            ));
        }
    }
    for ch in chars {
        if !ch.is_ascii_alphanumeric() && ch != '_' {
            return Err(format!(
                "Variable name contains invalid character '{}' (only ASCII letters, digits, and '_' are allowed)",
                ch
            ));
        }
    }
    Ok(())
}

/// Validate a search query string: non-empty and within a reasonable length.
pub fn validate_search_query(query: &str, max_len: usize) -> Result<(), String> {
    if query.is_empty() {
        return Err("Search query cannot be empty".to_string());
    }
    if query.len() > max_len {
        return Err(format!(
            "Search query exceeds the maximum length of {} bytes",
            max_len
        ));
    }
    Ok(())
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_input_path_rejects_null() {
        assert!(validate_input_path("/tmp/foo\0bar").is_err());
    }

    #[test]
    fn test_input_path_rejects_relative() {
        assert!(validate_input_path("relative/path.bin").is_err());
    }

    #[test]
    fn test_input_path_rejects_traversal() {
        assert!(validate_input_path("/tmp/../etc/passwd").is_err());
    }

    #[cfg(windows)]
    #[test]
    fn test_input_path_accepts_windows_absolute() {
        assert!(validate_input_path("C:\\Users\\user\\test.bin").is_ok());
    }

    #[test]
    fn test_output_path_rejects_bad_extension() {
        assert!(validate_output_path("/tmp/output.exe").is_err());
    }

    #[test]
    fn test_output_path_rejects_system_dir() {
        assert!(validate_output_path("/etc/malicious.txt").is_err());
    }

    #[test]
    fn test_block_size_zero_rejected() {
        assert!(validate_block_size(0).is_err());
    }

    #[test]
    fn test_block_size_valid() {
        assert!(validate_block_size(256).is_ok());
    }

    #[test]
    fn test_c_identifier_valid() {
        assert!(validate_c_identifier("my_buffer").is_ok());
        assert!(validate_c_identifier("_BUF").is_ok());
    }

    #[test]
    fn test_c_identifier_starts_with_digit() {
        assert!(validate_c_identifier("1bad").is_err());
    }

    #[test]
    fn test_c_identifier_special_chars() {
        assert!(validate_c_identifier("bad-name").is_err());
        assert!(validate_c_identifier("drop table").is_err());
    }
}

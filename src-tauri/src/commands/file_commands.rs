use crate::core::{self, FileReader};
use crate::formats;
use crate::security::{
    validate_input_path, validate_output_path, validate_read_range, validate_block_size,
    validate_search_query, MAX_SEARCH_RESULTS, MAX_STRING_RESULTS,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::State;

/// Cache of open file readers.
pub struct FileCache {
    pub readers: Mutex<HashMap<String, Vec<u8>>>,
}

impl Default for FileCache {
    fn default() -> Self {
        Self {
            readers: Mutex::new(HashMap::new()),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenFileResult {
    pub path: String,
    pub name: String,
    pub size: u64,
    pub format: String,
    pub data: Vec<u8>,
    pub sha256: String,
    pub regions: Vec<formats::FieldRegion>,
}

/// Open a file and return its data and analysis.
#[tauri::command]
pub async fn open_file(path: String) -> Result<OpenFileResult, String> {
    validate_input_path(&path)?;
    let reader = FileReader::open(&path).map_err(|e| e.to_string())?;
    let info = reader.info();
    let format = core::detect_file_format(reader.data());
    let regions = formats::parse_file(reader.data(), &format);

    // Limit data sent to frontend (first 1MB, full file for small files)
    let max_size = 1024 * 1024; // 1MB
    let data = if reader.len() > max_size {
        reader.slice(0, max_size).to_vec()
    } else {
        reader.data().to_vec()
    };

    Ok(OpenFileResult {
        path: info.path,
        name: info.name,
        size: info.size,
        format: format.to_string(),
        data,
        sha256: info.sha256,
        regions,
    })
}

/// Read a range of bytes from a file.
#[tauri::command]
pub async fn read_file_bytes(path: String, start: usize, length: usize) -> Result<Vec<u8>, String> {
    validate_input_path(&path)?;
    let reader = FileReader::open(&path).map_err(|e| e.to_string())?;
    validate_read_range(start, length, reader.len())?;
    Ok(reader.slice(start, start + length).to_vec())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileInfoResult {
    pub path: String,
    pub name: String,
    pub size: u64,
    pub format: String,
    pub sha256: String,
    pub md5: String,
}

/// Get file metadata and hashes.
#[tauri::command]
pub async fn get_file_info(path: String) -> Result<FileInfoResult, String> {
    validate_input_path(&path)?;
    let reader = FileReader::open(&path).map_err(|e| e.to_string())?;
    let info = reader.info();
    Ok(FileInfoResult {
        path: info.path,
        name: info.name,
        size: info.size,
        format: info.format,
        sha256: info.sha256,
        md5: info.md5,
    })
}

/// Detect file format from magic bytes.
#[tauri::command]
pub async fn detect_format(path: String) -> Result<String, String> {
    validate_input_path(&path)?;
    let reader = FileReader::open(&path).map_err(|e| e.to_string())?;
    Ok(core::detect_file_format(reader.data()).to_string())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntropyResult {
    pub overall: f64,
    pub blocks: Vec<core::entropy::EntropyBlock>,
}

/// Calculate file entropy.
#[tauri::command]
pub async fn get_entropy(path: String) -> Result<EntropyResult, String> {
    validate_input_path(&path)?;
    let reader = FileReader::open(&path).map_err(|e| e.to_string())?;
    let overall = core::calculate_entropy(reader.data());
    let blocks = core::calculate_block_entropy(reader.data(), 256);
    Ok(EntropyResult { overall, blocks })
}

/// Calculate block entropy with custom block size.
#[tauri::command]
pub async fn get_block_entropy(path: String, block_size: usize) -> Result<Vec<core::entropy::EntropyBlock>, String> {
    validate_input_path(&path)?;
    validate_block_size(block_size)?;
    let reader = FileReader::open(&path).map_err(|e| e.to_string())?;
    Ok(core::calculate_block_entropy(reader.data(), block_size))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub offsets: Vec<usize>,
    pub count: usize,
}

/// Search for a byte pattern (hex string) in a file.
#[tauri::command]
pub async fn search_bytes(path: String, hex_pattern: String) -> Result<SearchResult, String> {
    validate_input_path(&path)?;
    // Hex pattern string: max 512 bytes decoded = 1024 hex chars
    validate_search_query(&hex_pattern, 1024)?;
    let reader = FileReader::open(&path).map_err(|e| e.to_string())?;
    let pattern = hex::decode(&hex_pattern).map_err(|e| format!("Invalid hex: {}", e))?;
    if pattern.is_empty() {
        return Err("Byte pattern cannot be empty".to_string());
    }
    let mut offsets = reader.search_bytes(&pattern);
    let total_count = offsets.len();
    offsets.truncate(MAX_SEARCH_RESULTS);
    Ok(SearchResult { offsets, count: total_count })
}

/// Search for a string in a file.
#[tauri::command]
pub async fn search_string(
    path: String,
    query: String,
    case_sensitive: Option<bool>,
) -> Result<SearchResult, String> {
    validate_input_path(&path)?;
    validate_search_query(&query, 4096)?;
    let reader = FileReader::open(&path).map_err(|e| e.to_string())?;
    let mut offsets = reader.search_string(&query, case_sensitive.unwrap_or(false));
    let total_count = offsets.len();
    offsets.truncate(MAX_SEARCH_RESULTS);
    Ok(SearchResult { offsets, count: total_count })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StringEntry {
    pub offset: usize,
    pub value: String,
}

/// Extract printable strings from a file.
#[tauri::command]
pub async fn get_strings(path: String, min_length: Option<usize>) -> Result<Vec<StringEntry>, String> {
    validate_input_path(&path)?;
    let min_len = min_length.unwrap_or(4).max(1);
    let reader = FileReader::open(&path).map_err(|e| e.to_string())?;
    let strings = reader.find_strings(min_len);
    Ok(strings
        .into_iter()
        .take(MAX_STRING_RESULTS)
        .map(|(offset, value)| StringEntry { offset, value })
        .collect())
}

/// Save edited bytes back to a file on disk.
#[tauri::command]
pub async fn save_file(path: String, bytes: Vec<u8>) -> Result<(), String> {
    // For save we reuse the input-path validator (no extension restriction;
    // saving back to the same file the user opened is intentional).
    validate_input_path(&path)?;
    // Block writes to system directories even on save.
    validate_output_path(&path).or_else(|e| {
        // If the extension is not on the whitelist it is still valid to save a
        // binary back to its original location (e.g. .exe, .pcap).  Only the
        // system-directory rejection matters here.
        if e.contains("extension") { Ok(()) } else { Err(e) }
    })?;
    std::fs::write(&path, &bytes).map_err(|e| format!("Failed to save file {:?}: {}", path, e))
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct RecentFileEntry {
    pub path: String,
    pub name: String,
    pub format: Option<String>,
    pub size: Option<u64>,
    pub last_opened: String,
}

/// Return the list of recently-opened files from the SQLite database.
#[tauri::command]
pub fn list_recent_files(
    db: tauri::State<crate::storage::AppDb>,
) -> Result<Vec<RecentFileEntry>, String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT path, name, format, size, last_opened \
             FROM recent_files ORDER BY last_opened DESC LIMIT 50",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(RecentFileEntry {
                path: row.get(0)?,
                name: row.get(1)?,
                format: row.get(2)?,
                size: row.get(3)?,
                last_opened: row.get(4).unwrap_or_default(),
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

/// Record that a file was opened (upsert into recent_files).
#[tauri::command]
pub fn record_recent_file(
    path: String,
    name: String,
    format: Option<String>,
    size: Option<u64>,
    db: tauri::State<crate::storage::AppDb>,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO recent_files (path, name, format, size, last_opened) \
         VALUES (?1, ?2, ?3, ?4, datetime('now')) \
         ON CONFLICT(path) DO UPDATE SET name=excluded.name, format=excluded.format, \
         size=excluded.size, last_opened=datetime('now')",
        rusqlite::params![path, name, format, size],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

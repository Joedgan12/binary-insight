use crate::core::{self, FileReader};
use crate::formats;
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
    let reader = FileReader::open(&path).map_err(|e| e.to_string())?;
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
    let reader = FileReader::open(&path).map_err(|e| e.to_string())?;
    let overall = core::calculate_entropy(reader.data());
    let blocks = core::calculate_block_entropy(reader.data(), 256);
    Ok(EntropyResult { overall, blocks })
}

/// Calculate block entropy with custom block size.
#[tauri::command]
pub async fn get_block_entropy(path: String, block_size: usize) -> Result<Vec<core::entropy::EntropyBlock>, String> {
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
    let reader = FileReader::open(&path).map_err(|e| e.to_string())?;
    let pattern = hex::decode(&hex_pattern).map_err(|e| format!("Invalid hex: {}", e))?;
    let offsets = reader.search_bytes(&pattern);
    let count = offsets.len();
    Ok(SearchResult { offsets, count })
}

/// Search for a string in a file.
#[tauri::command]
pub async fn search_string(
    path: String,
    query: String,
    case_sensitive: Option<bool>,
) -> Result<SearchResult, String> {
    let reader = FileReader::open(&path).map_err(|e| e.to_string())?;
    let offsets = reader.search_string(&query, case_sensitive.unwrap_or(false));
    let count = offsets.len();
    Ok(SearchResult { offsets, count })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StringEntry {
    pub offset: usize,
    pub value: String,
}

/// Extract printable strings from a file.
#[tauri::command]
pub async fn get_strings(path: String, min_length: Option<usize>) -> Result<Vec<StringEntry>, String> {
    let reader = FileReader::open(&path).map_err(|e| e.to_string())?;
    let strings = reader.find_strings(min_length.unwrap_or(4));
    Ok(strings
        .into_iter()
        .map(|(offset, value)| StringEntry { offset, value })
        .collect())
}

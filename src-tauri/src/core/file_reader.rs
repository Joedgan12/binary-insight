use anyhow::{Context, Result};
use memmap2::Mmap;
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::path::Path;

/// Represents loaded file data and metadata.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileInfo {
    pub path: String,
    pub name: String,
    pub size: u64,
    pub format: String,
    pub sha256: String,
    pub md5: String,
}

/// Memory-mapped file reader for efficient binary access.
pub struct FileReader {
    mmap: Mmap,
    path: String,
}

impl FileReader {
    /// Open a file and memory-map it.
    pub fn open<P: AsRef<Path>>(path: P) -> Result<Self> {
        let path_str = path.as_ref().to_string_lossy().to_string();
        let file = File::open(&path).with_context(|| format!("Failed to open file: {}", path_str))?;
        let mmap = unsafe { Mmap::map(&file)? };
        Ok(Self {
            mmap,
            path: path_str,
        })
    }

    /// Get the full file data as a byte slice.
    pub fn data(&self) -> &[u8] {
        &self.mmap
    }

    /// Get a range of bytes.
    pub fn slice(&self, start: usize, end: usize) -> &[u8] {
        let end = end.min(self.mmap.len());
        let start = start.min(end);
        &self.mmap[start..end]
    }

    /// Get the file size.
    pub fn len(&self) -> usize {
        self.mmap.len()
    }

    pub fn is_empty(&self) -> bool {
        self.mmap.is_empty()
    }

    /// Get the file path.
    pub fn path(&self) -> &str {
        &self.path
    }

    /// Compute SHA-256 hash.
    pub fn sha256(&self) -> String {
        use sha2::{Sha256, Digest};
        let mut hasher = Sha256::new();
        hasher.update(self.data());
        format!("{:x}", hasher.finalize())
    }

    /// Compute MD5 hash.
    pub fn md5(&self) -> String {
        use md5::Digest;
        let mut hasher = md5::Md5::new();
        hasher.update(self.data());
        format!("{:x}", hasher.finalize())
    }

    /// Get file info including hashes and detected format.
    pub fn info(&self) -> FileInfo {
        let path = Path::new(&self.path);
        let name = path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_default();
        let format = super::detect_file_format(self.data()).to_string();
        FileInfo {
            path: self.path.clone(),
            name,
            size: self.mmap.len() as u64,
            format,
            sha256: self.sha256(),
            md5: self.md5(),
        }
    }

    /// Search for a byte pattern in the file. Returns offsets.
    pub fn search_bytes(&self, pattern: &[u8]) -> Vec<usize> {
        if pattern.is_empty() || pattern.len() > self.len() {
            return vec![];
        }
        let data = self.data();
        let mut results = Vec::new();
        let mut i = 0;
        while i <= data.len() - pattern.len() {
            if &data[i..i + pattern.len()] == pattern {
                results.push(i);
                i += pattern.len(); // skip past match
            } else {
                i += 1;
            }
        }
        results
    }

    /// Search for a string (UTF-8) in the file. Returns offsets.
    pub fn search_string(&self, query: &str, case_sensitive: bool) -> Vec<usize> {
        if query.is_empty() {
            return vec![];
        }
        let data = self.data();
        let query_bytes = if case_sensitive {
            query.as_bytes().to_vec()
        } else {
            query.to_lowercase().as_bytes().to_vec()
        };
        let mut results = Vec::new();
        for i in 0..data.len().saturating_sub(query_bytes.len() - 1) {
            let slice = &data[i..i + query_bytes.len()];
            let matches = if case_sensitive {
                slice == query_bytes.as_slice()
            } else {
                slice
                    .iter()
                    .zip(query_bytes.iter())
                    .all(|(a, b)| a.to_ascii_lowercase() == *b)
            };
            if matches {
                results.push(i);
            }
        }
        results
    }

    /// Extract printable ASCII strings of at least `min_length`.
    pub fn find_strings(&self, min_length: usize) -> Vec<(usize, String)> {
        let data = self.data();
        let mut results = Vec::new();
        let mut current = String::new();
        let mut start = 0;
        for (i, &byte) in data.iter().enumerate() {
            if byte >= 0x20 && byte < 0x7F {
                if current.is_empty() {
                    start = i;
                }
                current.push(byte as char);
            } else {
                if current.len() >= min_length {
                    results.push((start, current.clone()));
                }
                current.clear();
            }
        }
        if current.len() >= min_length {
            results.push((start, current));
        }
        results
    }
}

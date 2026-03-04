use serde::{Deserialize, Serialize};

/// Calculate Shannon entropy of data (0.0 = uniform, 8.0 = maximum for bytes).
pub fn calculate_entropy(data: &[u8]) -> f64 {
    if data.is_empty() {
        return 0.0;
    }

    let mut freq = [0u64; 256];
    for &byte in data {
        freq[byte as usize] += 1;
    }

    let len = data.len() as f64;
    let mut entropy = 0.0;

    for &count in &freq {
        if count > 0 {
            let p = count as f64 / len;
            entropy -= p * p.log2();
        }
    }

    entropy
}

/// A single block entropy measurement.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntropyBlock {
    pub offset: usize,
    pub size: usize,
    pub entropy: f64,
}

/// Calculate entropy per block across the file.
pub fn calculate_block_entropy(data: &[u8], block_size: usize) -> Vec<EntropyBlock> {
    if data.is_empty() || block_size == 0 {
        return vec![];
    }

    data.chunks(block_size)
        .enumerate()
        .map(|(i, chunk)| EntropyBlock {
            offset: i * block_size,
            size: chunk.len(),
            entropy: calculate_entropy(chunk),
        })
        .collect()
}

/// Byte frequency distribution.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ByteFrequency {
    pub byte_value: u8,
    pub count: u64,
    pub percentage: f64,
}

/// Calculate byte frequency distribution.
pub fn byte_frequency(data: &[u8]) -> Vec<ByteFrequency> {
    let mut freq = [0u64; 256];
    for &byte in data {
        freq[byte as usize] += 1;
    }
    let len = data.len() as f64;

    (0..=255u8)
        .map(|b| ByteFrequency {
            byte_value: b,
            count: freq[b as usize],
            percentage: if len > 0.0 {
                (freq[b as usize] as f64 / len) * 100.0
            } else {
                0.0
            },
        })
        .collect()
}

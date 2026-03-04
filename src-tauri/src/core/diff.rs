use serde::{Deserialize, Serialize};

/// Type of difference between two byte sequences.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum DiffKind {
    Equal,
    Modified,
    OnlyA,
    OnlyB,
}

/// A single diff region.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffRegion {
    pub offset: usize,
    pub size: usize,
    pub kind: DiffKind,
}

/// Result of a binary diff comparison.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiffResult {
    pub size_a: usize,
    pub size_b: usize,
    pub regions: Vec<DiffRegion>,
    pub changed_bytes: usize,
    pub similarity: f64,
}

/// Compare two byte arrays and produce diff regions.
pub fn binary_diff(a: &[u8], b: &[u8]) -> DiffResult {
    let max_len = a.len().max(b.len());
    let _min_len = a.len().min(b.len());
    let mut regions = Vec::new();
    let mut changed_bytes = 0usize;

    if max_len == 0 {
        return DiffResult {
            size_a: 0,
            size_b: 0,
            regions: vec![],
            changed_bytes: 0,
            similarity: 1.0,
        };
    }

    let mut current_kind: Option<DiffKind> = None;
    let mut region_start = 0;

    for i in 0..max_len {
        let kind = if i < a.len() && i < b.len() {
            if a[i] == b[i] {
                DiffKind::Equal
            } else {
                changed_bytes += 1;
                DiffKind::Modified
            }
        } else if i < a.len() {
            changed_bytes += 1;
            DiffKind::OnlyA
        } else {
            changed_bytes += 1;
            DiffKind::OnlyB
        };

        match &current_kind {
            Some(ck) if *ck == kind => {
                // continue same region
            }
            _ => {
                // close previous region
                if let Some(ck) = current_kind.take() {
                    regions.push(DiffRegion {
                        offset: region_start,
                        size: i - region_start,
                        kind: ck,
                    });
                }
                current_kind = Some(kind);
                region_start = i;
            }
        }
    }

    // close last region
    if let Some(ck) = current_kind {
        regions.push(DiffRegion {
            offset: region_start,
            size: max_len - region_start,
            kind: ck,
        });
    }

    let similarity = if max_len > 0 {
        1.0 - (changed_bytes as f64 / max_len as f64)
    } else {
        1.0
    };

    DiffResult {
        size_a: a.len(),
        size_b: b.len(),
        regions,
        changed_bytes,
        similarity,
    }
}

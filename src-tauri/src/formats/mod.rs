pub mod png;
pub mod pe;
pub mod elf;
pub mod generic;

use serde::{Deserialize, Serialize};

/// A field/region detected in a binary file with its type and value.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldRegion {
    pub name: String,
    pub start: usize,
    pub end: usize,
    pub size: usize,
    pub field_type: String,
    pub description: String,
    pub value: String,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub children: Vec<FieldRegion>,
}

impl FieldRegion {
    pub fn new(name: &str, start: usize, end: usize, field_type: &str, description: &str, value: &str) -> Self {
        Self {
            name: name.to_string(),
            start,
            end,
            size: end - start,
            field_type: field_type.to_string(),
            description: description.to_string(),
            value: value.to_string(),
            children: vec![],
        }
    }

    pub fn with_children(mut self, children: Vec<FieldRegion>) -> Self {
        self.children = children;
        self
    }
}

/// Parse a binary file into structured field regions based on detected format.
pub fn parse_file(data: &[u8], format: &crate::core::FileFormat) -> Vec<FieldRegion> {
    match format {
        crate::core::FileFormat::PNG => png::parse_png(data),
        crate::core::FileFormat::PE => pe::parse_pe(data),
        crate::core::FileFormat::ELF => elf::parse_elf(data),
        _ => generic::parse_generic(data),
    }
}

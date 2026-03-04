use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Template metadata.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateInfo {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: String,
    pub format: String,
    pub author: String,
}

/// Built-in templates.
fn builtin_templates() -> HashMap<String, (TemplateInfo, &'static str)> {
    let mut map = HashMap::new();

    map.insert("png".to_string(), (
        TemplateInfo {
            id: "png".to_string(),
            name: "PNG Image".to_string(),
            description: "Parse PNG image chunks and IHDR data".to_string(),
            category: "Images".to_string(),
            format: "PNG".to_string(),
            author: "Binary Insight".to_string(),
        },
        include_str!("../../templates/png.lua"),
    ));

    map.insert("pe32".to_string(), (
        TemplateInfo {
            id: "pe32".to_string(),
            name: "PE32 Executable".to_string(),
            description: "Parse Windows PE32/PE32+ headers and sections".to_string(),
            category: "Executables".to_string(),
            format: "PE".to_string(),
            author: "Binary Insight".to_string(),
        },
        include_str!("../../templates/pe32.lua"),
    ));

    map.insert("elf64".to_string(), (
        TemplateInfo {
            id: "elf64".to_string(),
            name: "ELF64 Binary".to_string(),
            description: "Parse ELF64 header, program and section headers".to_string(),
            category: "Executables".to_string(),
            format: "ELF".to_string(),
            author: "Binary Insight".to_string(),
        },
        include_str!("../../templates/elf64.lua"),
    ));

    map.insert("generic_hex".to_string(), (
        TemplateInfo {
            id: "generic_hex".to_string(),
            name: "Generic Hex Dump".to_string(),
            description: "Basic hex dump with ASCII representation".to_string(),
            category: "General".to_string(),
            format: "*".to_string(),
            author: "Binary Insight".to_string(),
        },
        include_str!("../../templates/generic_hex.lua"),
    ));

    map
}

/// List all available templates.
pub fn list_templates() -> Vec<TemplateInfo> {
    builtin_templates().into_values().map(|(info, _)| info).collect()
}

/// Load a template by ID and return its source code.
pub fn load_template(id: &str) -> Result<String> {
    let templates = builtin_templates();
    match templates.get(id) {
        Some((_, source)) => Ok(source.to_string()),
        None => anyhow::bail!("Template '{}' not found", id),
    }
}

use crate::core::FileReader;
use crate::scripting;
use serde::{Deserialize, Serialize};

/// Run a Lua script against a file.
#[tauri::command]
pub async fn run_lua_script(
    script: String,
    file_path: Option<String>,
) -> Result<scripting::lua_runtime::ScriptResult, String> {
    let data = if let Some(path) = file_path {
        let reader = FileReader::open(&path).map_err(|e| e.to_string())?;
        reader.data().to_vec()
    } else {
        vec![]
    };

    scripting::run_lua_script(&script, &data).map_err(|e| e.to_string())
}

/// List available script templates.
#[tauri::command]
pub async fn list_templates() -> Result<Vec<scripting::TemplateInfo>, String> {
    Ok(scripting::list_templates())
}

/// Load a template by ID.
#[tauri::command]
pub async fn load_template(id: String) -> Result<String, String> {
    scripting::load_template(&id).map_err(|e| e.to_string())
}

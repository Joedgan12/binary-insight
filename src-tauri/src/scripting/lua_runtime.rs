use anyhow::Result;
use mlua::prelude::*;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

/// Result of running a Lua script.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScriptResult {
    pub output: String,
    pub regions: Vec<ScriptRegion>,
    pub success: bool,
    pub error: Option<String>,
    pub execution_time_ms: u64,
}

/// A region identified by the Lua script.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScriptRegion {
    pub name: String,
    pub start: usize,
    pub end: usize,
    pub field_type: String,
    pub value: String,
}

/// Format a Lua value as a string.
fn lua_val_to_str(v: &mlua::Value) -> String {
    match v {
        mlua::Value::Nil => "nil".to_string(),
        mlua::Value::Boolean(b) => b.to_string(),
        mlua::Value::Integer(i) => i.to_string(),
        mlua::Value::Number(n) => n.to_string(),
        mlua::Value::String(s) => s.to_str().unwrap_or("?").to_string(),
        _ => "[table/userdata]".to_string(),
    }
}

/// Execute a Lua script with binary data context.
pub fn run_lua_script(script: &str, data: &[u8]) -> Result<ScriptResult> {
    let start_time = std::time::Instant::now();
    let lua = Lua::new();

    // Shared state accessible from all Lua functions and from outside the closures
    let output_lines: Arc<Mutex<Vec<String>>> = Arc::new(Mutex::new(Vec::new()));
    let regions: Arc<Mutex<Vec<ScriptRegion>>> = Arc::new(Mutex::new(Vec::new()));
    let pos: Arc<Mutex<usize>> = Arc::new(Mutex::new(0));
    let data_arc: Arc<Vec<u8>> = Arc::new(data.to_vec());

    let globals = lua.globals();

    // file_size()
    let dc = Arc::clone(&data_arc);
    globals.set("file_size", lua.create_function(move |_, ()| {
        Ok(dc.len() as u64)
    })?)?;

    // seek(pos)
    let pos2 = Arc::clone(&pos);
    let dc = Arc::clone(&data_arc);
    globals.set("seek", lua.create_function(move |_, new_pos: usize| {
        *pos2.lock().unwrap() = new_pos.min(dc.len());
        Ok(())
    })?)?;

    // tell()
    let pos2 = Arc::clone(&pos);
    globals.set("tell", lua.create_function(move |_, ()| {
        Ok(*pos2.lock().unwrap() as u64)
    })?)?;

    // eof()
    let pos2 = Arc::clone(&pos);
    let dc = Arc::clone(&data_arc);
    globals.set("eof", lua.create_function(move |_, ()| {
        Ok(*pos2.lock().unwrap() >= dc.len())
    })?)?;

    // read_u8()
    let pos2 = Arc::clone(&pos);
    let dc = Arc::clone(&data_arc);
    globals.set("read_u8", lua.create_function(move |_, ()| {
        let mut p = pos2.lock().unwrap();
        if *p < dc.len() {
            let val = dc[*p] as u64;
            *p += 1;
            Ok(val)
        } else { Ok(0) }
    })?)?;

    // read_u16_le()
    let pos2 = Arc::clone(&pos);
    let dc = Arc::clone(&data_arc);
    globals.set("read_u16_le", lua.create_function(move |_, ()| {
        let mut p = pos2.lock().unwrap();
        if *p + 2 <= dc.len() {
            let val = (dc[*p] as u64) | ((dc[*p + 1] as u64) << 8);
            *p += 2;
            Ok(val)
        } else { Ok(0) }
    })?)?;

    // read_u16_be()
    let pos2 = Arc::clone(&pos);
    let dc = Arc::clone(&data_arc);
    globals.set("read_u16_be", lua.create_function(move |_, ()| {
        let mut p = pos2.lock().unwrap();
        if *p + 2 <= dc.len() {
            let val = ((dc[*p] as u64) << 8) | (dc[*p + 1] as u64);
            *p += 2;
            Ok(val)
        } else { Ok(0) }
    })?)?;

    // read_u32_le()
    let pos2 = Arc::clone(&pos);
    let dc = Arc::clone(&data_arc);
    globals.set("read_u32_le", lua.create_function(move |_, ()| {
        let mut p = pos2.lock().unwrap();
        if *p + 4 <= dc.len() {
            let val = (dc[*p] as u64)
                | ((dc[*p + 1] as u64) << 8)
                | ((dc[*p + 2] as u64) << 16)
                | ((dc[*p + 3] as u64) << 24);
            *p += 4;
            Ok(val)
        } else { Ok(0) }
    })?)?;

    // read_u32_be()
    let pos2 = Arc::clone(&pos);
    let dc = Arc::clone(&data_arc);
    globals.set("read_u32_be", lua.create_function(move |_, ()| {
        let mut p = pos2.lock().unwrap();
        if *p + 4 <= dc.len() {
            let val = ((dc[*p] as u64) << 24)
                | ((dc[*p + 1] as u64) << 16)
                | ((dc[*p + 2] as u64) << 8)
                | (dc[*p + 3] as u64);
            *p += 4;
            Ok(val)
        } else { Ok(0) }
    })?)?;

    // read_bytes(n)
    let pos2 = Arc::clone(&pos);
    let dc = Arc::clone(&data_arc);
    globals.set("read_bytes", lua.create_function(move |_, n: usize| {
        let mut p = pos2.lock().unwrap();
        let end = (*p + n).min(dc.len());
        let bytes: Vec<u8> = dc[*p..end].to_vec();
        *p = end;
        Ok(bytes)
    })?)?;

    // read_string(n)
    let pos2 = Arc::clone(&pos);
    let dc = Arc::clone(&data_arc);
    globals.set("read_string", lua.create_function(move |_, n: usize| {
        let mut p = pos2.lock().unwrap();
        let end = (*p + n).min(dc.len());
        let s = String::from_utf8_lossy(&dc[*p..end]).to_string();
        *p = end;
        Ok(s)
    })?)?;

    // print() - capture output
    let out2 = Arc::clone(&output_lines);
    globals.set("print", lua.create_function(move |_, args: mlua::MultiValue| {
        let line: Vec<String> = args.iter().map(lua_val_to_str).collect();
        out2.lock().unwrap().push(line.join("\t"));
        Ok(())
    })?)?;

    // label(name, size, type) - mark a region
    let reg2 = Arc::clone(&regions);
    let pos2 = Arc::clone(&pos);
    globals.set("label", lua.create_function(move |_, (name, size, field_type): (String, usize, String)| {
        let p = *pos2.lock().unwrap();
        reg2.lock().unwrap().push(ScriptRegion {
            name,
            start: p.saturating_sub(size),
            end: p,
            field_type,
            value: String::new(),
        });
        Ok(())
    })?)?;

    // Execute the script
    let exec_result = lua.load(script).exec();

    let elapsed = start_time.elapsed().as_millis() as u64;
    let output = Arc::try_unwrap(output_lines).unwrap().into_inner().unwrap().join("\n");
    let regions_out = Arc::try_unwrap(regions).unwrap().into_inner().unwrap();

    match exec_result {
        Ok(()) => Ok(ScriptResult {
            output,
            regions: regions_out,
            success: true,
            error: None,
            execution_time_ms: elapsed,
        }),
        Err(e) => Ok(ScriptResult {
            output,
            regions: regions_out,
            success: false,
            error: Some(e.to_string()),
            execution_time_ms: elapsed,
        }),
    }
}

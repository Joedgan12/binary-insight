#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod commands;
mod core;
mod formats;
mod network;
mod scripting;
mod ai;
mod storage;

use commands::{file_commands, network_commands, ai_commands, export_commands, script_commands};

fn main() {
    env_logger::init();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // File commands
            file_commands::open_file,
            file_commands::read_file_bytes,
            file_commands::get_file_info,
            file_commands::detect_format,
            file_commands::get_entropy,
            file_commands::get_block_entropy,
            file_commands::search_bytes,
            file_commands::search_string,
            file_commands::get_strings,
            // Network commands
            network_commands::load_pcap,
            network_commands::get_packet_detail,
            network_commands::get_sessions,
            network_commands::get_protocol_stats,
            // AI commands
            ai_commands::ai_analyze,
            ai_commands::ai_chat,
            ai_commands::ai_suggest_fields,
            // Export commands
            export_commands::export_hex,
            export_commands::export_c_array,
            export_commands::export_json_report,
            // Script commands
            script_commands::run_lua_script,
            script_commands::list_templates,
            script_commands::load_template,
        ])
        .setup(|app| {
            log::info!("Binary Insight starting up...");
            storage::init_db(app.handle())?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Binary Insight");
}

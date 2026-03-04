use anyhow::Result;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

/// Global database state.
pub struct AppDb {
    pub conn: Mutex<Connection>,
}

/// Initialize the SQLite database for storing sessions, bookmarks, etc.
pub fn init_db(app: AppHandle) -> Result<()> {
    let app_dir = app
        .path_resolver()
        .app_data_dir()
        .unwrap_or_else(|| std::path::PathBuf::from("."));

    std::fs::create_dir_all(&app_dir)?;
    let db_path = app_dir.join("binary_insight.db");

    let conn = Connection::open(&db_path)?;

    // Create tables
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            file_path TEXT,
            format TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now')),
            metadata TEXT
        );

        CREATE TABLE IF NOT EXISTS bookmarks (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            offset INTEGER NOT NULL,
            length INTEGER DEFAULT 1,
            label TEXT NOT NULL,
            color TEXT DEFAULT '#3b82f6',
            notes TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS recent_files (
            path TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            format TEXT,
            size INTEGER,
            last_opened TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS custom_templates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT,
            source TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        ",
    )?;

    log::info!("Database initialized at {:?}", db_path);

    // Store in app state
    app.manage(AppDb {
        conn: Mutex::new(conn),
    });

    Ok(())
}

/// Bookmark data type for serialization.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BookmarkRecord {
    pub id: String,
    pub session_id: String,
    pub offset: usize,
    pub length: usize,
    pub label: String,
    pub color: String,
    pub notes: Option<String>,
}

/// Recent file record.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentFile {
    pub path: String,
    pub name: String,
    pub format: Option<String>,
    pub size: Option<u64>,
    pub last_opened: String,
}

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::{AppHandle, Manager};
use tauri_plugin_store::StoreBuilder;

const HISTORY_FILENAME: &str = "lyrics_history.json";
const MAX_HISTORY_ENTRIES: usize = 100;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct LyricsHistoryEntry {
    pub track_id: String,
    pub track_name: String,
    pub artist: String,
    pub lyrics: Vec<SyncedLyricEntry>,
    pub source: String,
    pub fetched_at: i64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SyncedLyricEntry {
    pub time: i64,
    pub text: String,
}

#[tauri::command]
pub async fn save_lyrics_to_history_cmd(
    app: AppHandle,
    track_id: String,
    track_name: String,
    artist: String,
    lyrics: Vec<SyncedLyricEntry>,
    source: String,
) -> Result<(), String> {
    save_lyrics_to_history(&app, &track_id, &track_name, &artist, &lyrics, &source)
}

#[tauri::command]
pub async fn get_lyrics_from_history_cmd(
    app: AppHandle,
    track_id: String,
) -> Result<Option<LyricsHistoryEntry>, String> {
    get_lyrics_from_history(&app, &track_id)
}

fn save_lyrics_to_history(
    app: &AppHandle,
    track_id: &str,
    track_name: &str,
    artist: &str,
    lyrics: &[SyncedLyricEntry],
    source: &str,
) -> Result<(), String> {
    let store_path = app
        .path()
        .app_config_dir()
        .map_err(|e| e.to_string())?
        .join(HISTORY_FILENAME);

    let store = StoreBuilder::new(app, store_path)
        .build()
        .map_err(|e| format!("Failed to open history store: {}", e))?;

    store
        .reload()
        .map_err(|e| format!("Failed to reload history: {}", e))?;

    let mut history: HashMap<String, LyricsHistoryEntry> = store
        .get("history")
        .and_then(|v| serde_json::from_value(v.clone()).ok())
        .unwrap_or_default();

    let entry = LyricsHistoryEntry {
        track_id: track_id.to_string(),
        track_name: track_name.to_string(),
        artist: artist.to_string(),
        lyrics: lyrics.to_vec(),
        source: source.to_string(),
        fetched_at: chrono::Utc::now().timestamp(),
    };

    history.insert(track_id.to_string(), entry);

    if history.len() > MAX_HISTORY_ENTRIES {
        let mut entries: Vec<_> = history.into_iter().collect();
        entries.sort_by(|a, b| b.1.fetched_at.cmp(&a.1.fetched_at));
        entries.truncate(MAX_HISTORY_ENTRIES);
        history = entries.into_iter().collect();
    }

    store.set("history", serde_json::to_value(&history).unwrap());
    store
        .save()
        .map_err(|e| format!("Failed to save history: {}", e))?;

    println!("[History] Saved lyrics for: {} - {}", artist, track_name);
    Ok(())
}

fn get_lyrics_from_history(
    app: &AppHandle,
    track_id: &str,
) -> Result<Option<LyricsHistoryEntry>, String> {
    let store_path = app
        .path()
        .app_config_dir()
        .map_err(|e| e.to_string())?
        .join(HISTORY_FILENAME);

    if !store_path.exists() {
        return Ok(None);
    }

    let store = StoreBuilder::new(app, store_path)
        .build()
        .map_err(|e| format!("Failed to open history store: {}", e))?;

    store
        .reload()
        .map_err(|e| format!("Failed to reload history: {}", e))?;

    let history: HashMap<String, LyricsHistoryEntry> = store
        .get("history")
        .and_then(|v| serde_json::from_value(v.clone()).ok())
        .unwrap_or_default();

    Ok(history.get(track_id).cloned())
}

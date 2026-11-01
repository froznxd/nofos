mod vault;

use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{Manager, State};

struct AppState {
    vault_path: Mutex<Option<PathBuf>>,
}

fn app_data_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| e.to_string())
}

fn require_vault(state: &State<'_, AppState>) -> Result<PathBuf, String> {
    let guard = state.vault_path.lock().map_err(|_| "lock poisoned".to_string())?;
    guard.clone().ok_or_else(|| vault::VaultError::NoVault.to_string())
}

#[tauri::command]
fn get_vault_path(state: State<'_, AppState>) -> Result<Option<String>, String> {
    let guard = state.vault_path.lock().map_err(|_| "lock poisoned".to_string())?;
    Ok(guard.as_ref().map(|p| p.to_string_lossy().into_owned()))
}

#[tauri::command]
fn set_vault_path(app: tauri::AppHandle, state: State<'_, AppState>, path: String) -> Result<(), String> {
    let validated = vault::validate_vault_dir(PathBuf::from(&path).as_path())
        .map_err(|e| e.to_string())?;
    let data_dir = app_data_dir(&app)?;
    vault::save_vault_path(&data_dir, &validated).map_err(|e| e.to_string())?;
    let mut guard = state.vault_path.lock().map_err(|_| "lock poisoned".to_string())?;
    *guard = Some(validated);
    Ok(())
}

#[tauri::command]
fn list_notes(state: State<'_, AppState>) -> Result<Vec<vault::NoteMeta>, String> {
    let vault = require_vault(&state)?;
    vault::list_notes(&vault).map_err(|e| e.to_string())
}

#[tauri::command]
fn read_note(state: State<'_, AppState>, name: String) -> Result<String, String> {
    let vault = require_vault(&state)?;
    vault::read_note(&vault, &name).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_note(state: State<'_, AppState>, name: String, content: String) -> Result<(), String> {
    let vault = require_vault(&state)?;
    vault::write_note(&vault, &name, &content).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_note(state: State<'_, AppState>) -> Result<vault::CreatedNote, String> {
    let vault = require_vault(&state)?;
    vault::create_note(&vault).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .manage(AppState {
            vault_path: Mutex::new(None),
        })
        .setup(|app| {
            let data_dir = app
                .path()
                .app_data_dir()
                .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
            if let Ok(Some(path)) = vault::load_vault_path(&data_dir) {
                if let Ok(validated) = vault::validate_vault_dir(&path) {
                    let state = app.state::<AppState>();
                    let mut guard = state.vault_path.lock().unwrap();
                    *guard = Some(validated);
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_vault_path,
            set_vault_path,
            list_notes,
            read_note,
            write_note,
            create_note,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

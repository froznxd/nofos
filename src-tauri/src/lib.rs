use serde::Serialize;
use std::fs;

#[derive(Serialize)]
struct Note {
    name: String,
    content: String,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
// #[tauri::command]
// fn create_note() -> Result<(), String> {
//     println!("creating note");
//     let note_path = "sahil-test-12345.md";
//     let note_content = File::create(note_path).expect("Failed to create note");
//     println!("note created: {}", note_path);

//     Ok(())
// }

#[tauri::command]
fn load_notes(vault_path: String) -> Result<Vec<Note>, String> {
    let mut notes: Vec<Note> = vec![];
    let entries = fs::read_dir(vault_path).expect("unable to read dir");

    for entry in entries {
        let entry = entry.unwrap();
        // let entry_path = entry.path();
        // let entry_file_type = entry.file_type().unwrap();
        let entry_file_name = entry.file_name();

        notes.push(Note {
            name: entry_file_name.to_string_lossy().to_string(),
            content: entry_file_name.to_string_lossy().to_string(),
        });
    }

    Ok(notes)
}

#[tauri::command]
fn load_note_content(note_path: String) -> Result<String, String> {
    let note_content: String;
    note_content = fs::read_to_string(note_path).expect("unable to read content");

    Ok(note_content)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![load_notes, load_note_content])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum VaultError {
    #[error("no notes folder configured")]
    NoVault,
    #[error("invalid note name")]
    InvalidName,
    #[error("path is outside the notes folder")]
    PathEscape,
    #[error("notes folder not found")]
    VaultNotFound,
    #[error("notes folder is not readable or writable")]
    VaultNotAccessible,
    #[error("{0}")]
    Io(#[from] std::io::Error),
    #[error("{0}")]
    Json(#[from] serde_json::Error),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteMeta {
    pub id: String,
    pub title: String,
    pub modified_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatedNote {
    pub name: String,
    pub content: String,
}

#[derive(Debug, Default, Serialize, Deserialize)]
struct AppConfig {
    vault_path: Option<String>,
}

pub fn config_path(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join("config.json")
}

pub fn load_vault_path(app_data_dir: &Path) -> Result<Option<PathBuf>, VaultError> {
    let path = config_path(app_data_dir);
    if !path.exists() {
        return Ok(None);
    }
    let data = fs::read_to_string(&path)?;
    let config: AppConfig = serde_json::from_str(&data)?;
    Ok(config.vault_path.map(PathBuf::from))
}

pub fn save_vault_path(app_data_dir: &Path, vault: &Path) -> Result<(), VaultError> {
    fs::create_dir_all(app_data_dir)?;
    let config = AppConfig {
        vault_path: Some(vault.to_string_lossy().into_owned()),
    };
    let data = serde_json::to_string_pretty(&config)?;
    fs::write(config_path(app_data_dir), data)?;
    Ok(())
}

pub fn validate_vault_dir(path: &Path) -> Result<PathBuf, VaultError> {
    if !path.exists() || !path.is_dir() {
        return Err(VaultError::VaultNotFound);
    }
    let canonical = path.canonicalize()?;
    let test_file = canonical.join(".notes_write_test");
    fs::write(&test_file, b"")?;
    fs::remove_file(&test_file)?;
    Ok(canonical)
}

fn validate_note_name(name: &str) -> Result<(), VaultError> {
    if name.is_empty() || name.len() > 255 {
        return Err(VaultError::InvalidName);
    }
    if name.contains("..") || name.contains('/') || name.contains('\\') {
        return Err(VaultError::InvalidName);
    }
    if !name.ends_with(".md") || name == ".md" {
        return Err(VaultError::InvalidName);
    }
    Ok(())
}

pub fn safe_note_path(vault: &Path, name: &str) -> Result<PathBuf, VaultError> {
    validate_note_name(name)?;
    let vault_canon = vault.canonicalize()?;
    let candidate = vault_canonical_join(&vault_canon, name);

    if candidate.exists() {
        let note_canon = candidate.canonicalize()?;
        if !note_canon.starts_with(&vault_canon) {
            return Err(VaultError::PathEscape);
        }
        return Ok(note_canon);
    }

    let parent = candidate
        .parent()
        .ok_or(VaultError::InvalidName)?;
    if !parent.exists() {
        return Err(VaultError::PathEscape);
    }
    let parent_canon = parent.canonicalize()?;
    if !parent_canon.starts_with(&vault_canon) {
        return Err(VaultError::PathEscape);
    }
    Ok(candidate)
}

fn vault_canonical_join(vault_canon: &Path, name: &str) -> PathBuf {
    vault_canon.join(name)
}

pub fn list_notes(vault: &Path) -> Result<Vec<NoteMeta>, VaultError> {
    let vault_canon = vault.canonicalize()?;
    let mut notes = Vec::new();

    for entry in fs::read_dir(&vault_canon)? {
        let entry = entry?;
        let path = entry.path();
        if !path.is_file() {
            continue;
        }
        let Some(file_name) = path.file_name().and_then(|n| n.to_str()) else {
            continue;
        };
        if !file_name.ends_with(".md") {
            continue;
        }
        let meta = fs::metadata(&path)?;
        let modified_ms = meta
            .modified()
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0);

        let title = file_name.trim_end_matches(".md").to_string();
        notes.push(NoteMeta {
            id: file_name.to_string(),
            title,
            modified_ms,
        });
    }

    notes.sort_by(|a, b| b.modified_ms.cmp(&a.modified_ms));
    Ok(notes)
}

pub fn read_note(vault: &Path, name: &str) -> Result<String, VaultError> {
    let path = safe_note_path(vault, name)?;
    if !path.is_file() {
        return Err(VaultError::InvalidName);
    }
    Ok(fs::read_to_string(path)?)
}

pub fn write_note(vault: &Path, name: &str, content: &str) -> Result<(), VaultError> {
    let path = safe_note_path(vault, name)?;
    fs::write(path, content)?;
    Ok(())
}

pub fn create_note(vault: &Path) -> Result<CreatedNote, VaultError> {
    let vault_canon = vault.canonicalize()?;
    let timestamp = chrono::Local::now().format("%Y-%m-%d-%H%M%S");
    let mut name = format!("note-{timestamp}.md");
    let mut path = vault_canonical_join(&vault_canon, &name);

    if path.exists() {
        let mut suffix = 1u32;
        loop {
            name = format!("note-{timestamp}-{suffix}.md");
            path = vault_canonical_join(&vault_canon, &name);
            if !path.exists() {
                break;
            }
            suffix += 1;
            if suffix > 10_000 {
                return Err(VaultError::Io(std::io::Error::new(
                    std::io::ErrorKind::AlreadyExists,
                    "could not allocate unique note name",
                )));
            }
        }
    }

    fs::write(&path, "")?;
    Ok(CreatedNote {
        name,
        content: String::new(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_vault() -> PathBuf {
        let id = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let path = std::env::temp_dir().join(format!("notes-vault-test-{id}"));
        fs::create_dir_all(&path).unwrap();
        path
    }

    #[test]
    fn rejects_path_traversal_in_name() {
        let vault = temp_vault();
        assert!(matches!(
            safe_note_path(&vault, "../secret.md"),
            Err(VaultError::InvalidName)
        ));
        let _ = fs::remove_dir_all(vault);
    }

    #[test]
    fn write_and_read_roundtrip() {
        let vault = temp_vault();
        let created = create_note(&vault).unwrap();
        write_note(&vault, &created.name, "hello").unwrap();
        let content = read_note(&vault, &created.name).unwrap();
        assert_eq!(content, "hello");
        let listed = list_notes(&vault).unwrap();
        assert!(listed.iter().any(|n| n.id == created.name));
        let _ = fs::remove_dir_all(vault);
    }
}

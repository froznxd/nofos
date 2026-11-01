import { invoke } from "@tauri-apps/api/core";

export interface NoteMeta {
  id: string;
  title: string;
  modified_ms: number;
}

export interface CreatedNote {
  name: string;
  content: string;
}

export function getVaultPath(): Promise<string | null> {
  return invoke<string | null>("get_vault_path");
}

export function setVaultPath(path: string): Promise<void> {
  return invoke("set_vault_path", { path });
}

export function listNotes(): Promise<NoteMeta[]> {
  return invoke<NoteMeta[]>("list_notes");
}

export function readNote(name: string): Promise<string> {
  return invoke<string>("read_note", { name });
}

export function writeNote(name: string, content: string): Promise<void> {
  return invoke("write_note", { name, content });
}

export function createNote(): Promise<CreatedNote> {
  return invoke<CreatedNote>("create_note");
}

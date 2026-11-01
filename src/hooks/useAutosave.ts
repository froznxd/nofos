import { useCallback, useEffect, useRef, useState } from "react";
import { writeNote } from "../lib/tauriNotes";

export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 500;

export function useAutosave(noteName: string | null, content: string) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const contentRef = useRef(content);
  const noteRef = useRef(noteName);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generationRef = useRef(0);

  contentRef.current = content;
  noteRef.current = noteName;

  const flush = useCallback(async () => {
    const name = noteRef.current;
    if (!name) {
      return;
    }
    const gen = ++generationRef.current;
    setStatus("saving");
    try {
      await writeNote(name, contentRef.current);
      if (gen === generationRef.current) {
        setStatus("saved");
      }
    } catch {
      if (gen === generationRef.current) {
        setStatus("error");
      }
    }
  }, []);

  useEffect(() => {
    if (!noteName) {
      setStatus("idle");
      return;
    }

    setStatus("pending");
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      void flush();
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [noteName, content, flush]);

  return status;
}

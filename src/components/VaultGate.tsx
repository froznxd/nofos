interface VaultGateProps {
  onChooseFolder: () => void;
  busy: boolean;
}

export function VaultGate({ onChooseFolder, busy }: VaultGateProps) {
  return (
    <div className="vault-gate">
      <h1>Notes</h1>
      <p>Choose a folder on your Mac to store markdown notes.</p>
      <button type="button" className="btn" onClick={onChooseFolder} disabled={busy}>
        {busy ? "Opening…" : "Choose notes folder"}
      </button>
    </div>
  );
}

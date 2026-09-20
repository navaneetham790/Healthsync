import "./ConfirmDialog.css";

export default function ConfirmDialog({ open, title = "Delete record?", message = "This action cannot be undone.", onCancel, onConfirm, busy, textValue, onTextChange, textPlaceholder, confirmLabel = "Delete" }) {
  if (!open) return null;
  const requiresMessage = typeof onTextChange === "function";
  return <div className="dialog-backdrop" role="presentation"><section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title">
    <h2 id="dialog-title">{title}</h2><p>{message}</p>
    {requiresMessage && <textarea className="dialog-textarea" value={textValue} onChange={(event) => onTextChange(event.target.value)} placeholder={textPlaceholder} rows="4" autoFocus />}
    <div><button onClick={onCancel} disabled={busy}>Cancel</button><button className="danger" onClick={onConfirm} disabled={busy || (requiresMessage && !textValue.trim())}>{busy ? "Sending…" : confirmLabel}</button></div>
  </section></div>;
}

import { useEffect, useState } from "react";
import "./RecordDialog.css";

const labelFor = (key) => key.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase());

export default function RecordDialog({ record, mode = "view", title, fields, onClose, onSave }) {
  const [values, setValues] = useState(record || {});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => setValues(record || {}), [record]);
  if (!record) return null;
  const keys = fields || Object.keys(record);
  const submit = async (event) => {
    event.preventDefault();
    if (keys.some((key) => key !== "id" && !String(values[key] ?? "").trim())) { setError("Please complete all fields."); return; }
    setSaving(true); setError("");
    try { await onSave(values); } catch (saveError) { setError(saveError.response?.data?.message || "Unable to save the record."); setSaving(false); }
  };
  return <div className="record-backdrop" onMouseDown={onClose} role="presentation"><form className="record-dialog" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="record-dialog-title">
    <header><h2 id="record-dialog-title">{title || (mode === "edit" ? "Edit record" : "Record details")}</h2><button type="button" aria-label="Close" onClick={onClose}>×</button></header>
    <div className="record-fields">{keys.map((key) => <label key={key}>{labelFor(key)}{mode === "view" ? <output>{String(values[key] ?? "—")}</output> : <input value={values[key] ?? ""} disabled={key === "id"} onChange={(event) => setValues({ ...values, [key]: event.target.value })} required={key !== "id"} />}</label>)}</div>
    {error && <p className="record-error" role="alert">{error}</p>}<footer><button type="button" onClick={onClose}>Close</button>{mode === "edit" && <button className="record-save" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>}</footer>
  </form></div>;
}

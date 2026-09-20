import { useState, useEffect } from "react";
import "./AddHealthRecord.css";
import DoctorService from "../../services/DoctorService";
import { notify } from "../../components/ToastProvider";

const initialForm = { workerId: "", workerName: "", visitDate: "", weight: "", height: "", bloodPressure: "", heartRate: "", temperature: "", sugar: "", symptoms: "", diagnosis: "", treatment: "" };
const Field = ({ label, name, fullWidth = false, children }) => <div className={`formGroup${fullWidth ? " fullWidth" : ""}`}><label htmlFor={name}>{label} <span className="required-mark">*</span></label>{children}</div>;

function AddHealthRecord() {
  const [form, setForm] = useState(initialForm); const [errors, setErrors] = useState({}); const [submitting, setSubmitting] = useState(false);
  const [workersList, setWorkersList] = useState([]);
  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const { data } = await DoctorService.getWorkerDirectory();
        setWorkersList(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load workers list", err);
      }
    };
    fetchWorkers();
  }, []);
  useEffect(() => {
    if (form.workerId.trim()) {
      const match = workersList.find((item) => item.workerCode?.trim().toLowerCase() === form.workerId.trim().toLowerCase());
      if (match) {
        setForm((prev) => ({ ...prev, workerName: match.fullName.trim() }));
      }
    }
  }, [form.workerId, workersList]);
  const change = (name, value) => { setForm({ ...form, [name]: value }); setErrors({ ...errors, [name]: "" }); };
  const validate = () => { const next = {}; Object.entries(form).forEach(([name, value]) => { if (!String(value).trim()) next[name] = "This field is required."; });
    if (form.workerId && !/^MW[0-9]{3,}$/i.test(form.workerId)) next.workerId = "Use an ID such as MW001.";
    if (form.visitDate && form.visitDate > new Date().toISOString().slice(0, 10)) next.visitDate = "Visit date cannot be in the future.";
    if (form.weight && (Number(form.weight) < 20 || Number(form.weight) > 300)) next.weight = "Enter a weight between 20 and 300 kg.";
    if (form.height && (Number(form.height) < 80 || Number(form.height) > 250)) next.height = "Enter a height between 80 and 250 cm.";
    if (form.bloodPressure && !/^\d{2,3}\/\d{2,3}$/.test(form.bloodPressure)) next.bloodPressure = "Use format 120/80.";
    if (form.heartRate && (Number(form.heartRate) < 30 || Number(form.heartRate) > 240)) next.heartRate = "Enter a heart rate between 30 and 240.";
    if (form.temperature && (Number(form.temperature) < 30 || Number(form.temperature) > 45)) next.temperature = "Enter temperature in °C between 30 and 45.";
    ["symptoms", "diagnosis", "treatment"].forEach((name) => { if (form[name] && form[name].trim().length < 3) next[name] = "Enter at least 3 characters."; });
    setErrors(next); return Object.keys(next).length === 0; };
  const submit = async (event) => { event.preventDefault(); if (!validate()) { notify.warning("Please complete all required health record information."); return; } setSubmitting(true); try { const { data } = await DoctorService.getWorkerDirectory(); const worker = (Array.isArray(data) ? data : []).find((item) => item.workerCode?.trim().toLowerCase() === form.workerId.trim().toLowerCase()); if (!worker) throw new Error("Worker ID was not found in the database."); const heightInMetres = Number(form.height) / 100; await DoctorService.addHealthRecord({ workerId: worker.id, visitDate: form.visitDate, diagnosis: form.diagnosis, summary: form.symptoms, bloodPressure: form.bloodPressure, sugar: form.sugar, bmi: Number((Number(form.weight) / (heightInMetres * heightInMetres)).toFixed(1)), notes: form.treatment }); notify.success("Health record saved successfully."); setForm(initialForm); } catch (error) { notify.error(error.response?.data?.message || error.message || "Unable to save the health record."); } finally { setSubmitting(false); } };
  const input = (name, type, placeholder, props = {}) => <input id={name} type={type} value={form[name]} onChange={(e) => change(name, e.target.value)} placeholder={placeholder} aria-invalid={Boolean(errors[name])} required {...props} />;
  return <div className="addHealthRecord"><div className="pageHeader"><h2>Add Health Record</h2><p>Create a medical record. Fields marked <span className="required-mark">*</span> are required.</p></div><div className="formContainer"><form onSubmit={submit} noValidate><div className="formGrid">
    <Field label="Worker ID" name="workerId">{input("workerId", "text", "Search or select a worker ID", { list: "health-record-workers", onChange: (e) => change("workerId", e.target.value.toUpperCase()) })}<datalist id="health-record-workers">{workersList.map((worker) => <option key={worker.id} value={worker.workerCode}>{worker.fullName}</option>)}</datalist></Field><Field label="Worker Name" name="workerName">{input("workerName", "text", "Auto-filled after selecting worker ID", { readOnly: true })}</Field>
    <Field label="Visit Date" name="visitDate">{input("visitDate", "date", "", { max: new Date().toISOString().slice(0, 10) })}</Field><Field label="Weight (kg)" name="weight">{input("weight", "number", "Enter weight", { min: "20", max: "300", step: "0.1" })}</Field>
    <Field label="Height (cm)" name="height">{input("height", "number", "Enter height", { min: "80", max: "250", step: "0.1" })}</Field><Field label="Blood Pressure" name="bloodPressure">{input("bloodPressure", "text", "Example: 120/80")}</Field>
    <Field label="Heart Rate (bpm)" name="heartRate">{input("heartRate", "number", "Heart rate", { min: "30", max: "240" })}</Field><Field label="Temperature (°C)" name="temperature">{input("temperature", "number", "Example: 37", { min: "30", max: "45", step: "0.1" })}</Field>
    <Field label="Sugar Level (mg/dL)" name="sugar">{input("sugar", "text", "Example: 140")}</Field>
    {["symptoms", "diagnosis", "treatment"].map((name) => <Field key={name} label={name.charAt(0).toUpperCase() + name.slice(1)} name={name} fullWidth><textarea id={name} rows="4" value={form[name]} onChange={(e) => change(name, e.target.value)} placeholder={`Enter ${name}`} aria-invalid={Boolean(errors[name])} required /></Field>)}
  </div><div className="buttonArea"><button type="submit" className="createBtn" disabled={submitting}>{submitting ? "Saving…" : "Save Health Record"}</button></div></form></div></div>;
}
export default AddHealthRecord;

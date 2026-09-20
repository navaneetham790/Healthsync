import { useState, useEffect } from "react";
import "./CreatePrescription.css";
import DoctorService from "../../services/DoctorService";
import { notify } from "../../components/ToastProvider";

const initialForm = { workerId: "", workerName: "", prescriptionDate: "", doctorName: "", duration: "", diagnosis: "", medicines: "", advice: "" };
const Field = ({ label, name, fullWidth = false, children }) => <div className={`formGroup${fullWidth ? " fullWidth" : ""}`}><label htmlFor={name}>{label} <span className="required-mark">*</span></label>{children}</div>;

function CreatePrescription() {
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
    if (form.prescriptionDate && form.prescriptionDate > new Date().toISOString().slice(0, 10)) next.prescriptionDate = "Prescription date cannot be in the future.";
    ["diagnosis", "medicines", "advice"].forEach((name) => { if (form[name] && form[name].trim().length < 3) next[name] = "Enter at least 3 characters."; }); setErrors(next); return Object.keys(next).length === 0; };
  const submit = async (event) => { event.preventDefault(); if (!validate()) { notify.warning("Please complete all required prescription information."); return; } setSubmitting(true); try { const { data } = await DoctorService.getWorkerDirectory(); const worker = (Array.isArray(data) ? data : []).find((item) => item.workerCode?.trim().toLowerCase() === form.workerId.trim().toLowerCase()); if (!worker) throw new Error("Worker ID was not found in the database."); await DoctorService.createPrescription({ workerId: worker.id, prescriptionDate: form.prescriptionDate, medicine: form.medicines.trim(), dosage: "-", frequency: "-", duration: form.duration, instructions: `${form.diagnosis}. ${form.advice}` }); notify.success("Prescription generated successfully."); setForm(initialForm); } catch (error) { notify.error(error.response?.data?.message || error.message || "Unable to generate prescription."); } finally { setSubmitting(false); } };
  const input = (name, type, placeholder, props = {}) => <input id={name} type={type} value={form[name]} onChange={(e) => change(name, e.target.value)} placeholder={placeholder} aria-invalid={Boolean(errors[name])} required {...props} />;
  return <div className="createPrescription"><div className="pageHeader"><h2>Create Prescription</h2><p>Create and issue a prescription. Fields marked <span className="required-mark">*</span> are required.</p></div><div className="formContainer"><form onSubmit={submit} noValidate><div className="formGrid">
    <Field label="Worker ID" name="workerId">{input("workerId", "text", "Search or select a worker ID", { list: "prescription-workers", onChange: (e) => change("workerId", e.target.value.toUpperCase()) })}<datalist id="prescription-workers">{workersList.map((worker) => <option key={worker.id} value={worker.workerCode}>{worker.fullName}</option>)}</datalist></Field><Field label="Worker Name" name="workerName">{input("workerName", "text", "Auto-filled after selecting worker ID", { readOnly: true })}</Field>
    <Field label="Prescription Date" name="prescriptionDate">{input("prescriptionDate", "date", "", { max: new Date().toISOString().slice(0, 10) })}</Field><Field label="Doctor Name" name="doctorName">{input("doctorName", "text", "Enter doctor name")}</Field>
    <Field label="Duration" name="duration">{input("duration", "text", "Example: 5 days")}</Field>
    <div className="formGroup"></div>
    {[{ name: "diagnosis", label: "Diagnosis", rows: 3, placeholder: "Enter diagnosis" }, { name: "medicines", label: "Medicines", rows: 5, placeholder: "Example: Paracetamol 500mg - 1 tablet - twice daily" }, { name: "advice", label: "Doctor Advice", rows: 4, placeholder: "Enter doctor advice" }].map((field) => <Field key={field.name} label={field.label} name={field.name} fullWidth><textarea id={field.name} rows={field.rows} value={form[field.name]} onChange={(e) => change(field.name, e.target.value)} placeholder={field.placeholder} aria-invalid={Boolean(errors[field.name])} required /></Field>)}
  </div><div className="buttonArea"><button type="submit" className="createBtn" disabled={submitting}>{submitting ? "Generating…" : "Generate Prescription"}</button></div></form></div></div>;
}
export default CreatePrescription;

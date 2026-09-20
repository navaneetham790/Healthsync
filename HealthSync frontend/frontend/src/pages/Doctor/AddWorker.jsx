import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./AddWorker.css";
import DoctorService from "../../services/DoctorService";
import { notify } from "../../components/ToastProvider";
import EmailOtpVerification from "../../components/EmailOtpVerification";
import { addNotification } from "../../utils/notifications";

const initialForm = { workerId: "", name: "", password: "", age: "", gender: "", bloodGroup: "", company: "", phone: "", email: "", address: "", emergencyContact: "" };
const Field = ({ label, name, children, fullWidth = false }) => <div className={`formGroup${fullWidth ? " fullWidth" : ""}`}><label htmlFor={name}>{label} <span className="required-mark">*</span></label>{children}</div>;

function AddWorker() {
  const [form, setForm] = useState(initialForm); const [errors, setErrors] = useState({}); const [submitting, setSubmitting] = useState(false); const [emailVerificationToken, setEmailVerificationToken] = useState(null); const [showPassword, setShowPassword] = useState(false);
  const doctor = JSON.parse(localStorage.getItem("user") || "{}");
  const change = (key, value) => { setForm({ ...form, [key]: value }); setErrors({ ...errors, [key]: "" }); if (key === "email") setEmailVerificationToken(null); };
  const validate = () => {
    const next = {}; const required = ["workerId", "name", "password", "age", "gender", "bloodGroup", "company", "phone", "email", "address", "emergencyContact"];
    required.forEach((field) => { if (!String(form[field]).trim()) next[field] = "This field is required."; });
    if (form.workerId && !/^MW[0-9]{3,}$/i.test(form.workerId.trim())) next.workerId = "Use an ID such as MW001.";
    if (form.age && (Number(form.age) < 18 || Number(form.age) > 100)) next.age = "Age must be between 18 and 100.";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address.";
    if (form.phone && !/^\d{10}$/.test(form.phone.replace(/\s|-/g, ""))) next.phone = "Enter a valid 10-digit phone number.";
    if (form.emergencyContact && !/^\d{10}$/.test(form.emergencyContact.replace(/\s|-/g, ""))) next.emergencyContact = "Enter a valid 10-digit contact number.";
    setErrors(next); return Object.keys(next).length === 0;
  };
  const submit = async (event) => { event.preventDefault(); if (!validate()) { notify.warning("Please correct the required worker information."); return; } setSubmitting(true); try {
    if (!emailVerificationToken) { notify.warning("Verify the email with the code before adding the worker."); return; }
    await DoctorService.addWorker({ fullName: form.name.trim(), email: form.email.trim(), password: form.password.trim(), age: Number(form.age), phone: form.phone.trim(), emailVerificationToken, workerCode: form.workerId.trim(), diseases: form.diseases || "", healthHistory: form.healthHistory || form.address });
    addNotification("admin", `Dr. ${doctor.fullName || "Doctor"} created worker ${form.name.trim()} (${form.workerId.trim()}).`, "success");
    notify.success("Worker added successfully."); setForm(initialForm); setEmailVerificationToken(null);
  } catch (error) { notify.error(error.response?.data?.message || error.message || "Unable to add worker."); } finally { setSubmitting(false); } };
  return <div className="addWorker"><div className="pageHeader"><h2>Add Worker</h2><p>Register a new migrant worker. Fields marked <span className="required-mark">*</span> are required.</p></div><div className="formContainer"><form onSubmit={submit} noValidate><div className="formGrid">
    <Field label="Worker ID" name="workerId"><input id="workerId" value={form.workerId} onChange={(e) => change("workerId", e.target.value.toUpperCase())} placeholder="Example: MW001" aria-invalid={Boolean(errors.workerId)} required /></Field>
    <Field label="Worker Name" name="name"><input id="name" value={form.name} onChange={(e) => change("name", e.target.value)} placeholder="Enter worker name" aria-invalid={Boolean(errors.name)} required /></Field>
    <Field label="Password" name="password"><div className="password-toggle"><input id="password" type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => change("password", e.target.value)} placeholder="Minimum 6 characters" minLength="6" aria-invalid={Boolean(errors.password)} required /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((current) => !current)}>{showPassword ? <FaEyeSlash /> : <FaEye />}</button></div></Field>
    <Field label="Age" name="age"><input id="age" type="number" min="18" max="100" value={form.age} onChange={(e) => change("age", e.target.value)} placeholder="Enter age" aria-invalid={Boolean(errors.age)} required /></Field>
    <Field label="Gender" name="gender"><select id="gender" value={form.gender} onChange={(e) => change("gender", e.target.value)} aria-invalid={Boolean(errors.gender)} required><option value="">Select gender</option><option>Male</option><option>Female</option><option>Other</option></select></Field>
    <Field label="Blood Group" name="bloodGroup"><select id="bloodGroup" value={form.bloodGroup} onChange={(e) => change("bloodGroup", e.target.value)} aria-invalid={Boolean(errors.bloodGroup)} required><option value="">Select blood group</option>{["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => <option key={group}>{group}</option>)}</select></Field>
    <Field label="Company" name="company"><input id="company" value={form.company} onChange={(e) => change("company", e.target.value)} placeholder="Company name" aria-invalid={Boolean(errors.company)} required /></Field>
    <Field label="Phone Number" name="phone"><input id="phone" type="tel" inputMode="numeric" value={form.phone} onChange={(e) => change("phone", e.target.value)} placeholder="10-digit phone number" aria-invalid={Boolean(errors.phone)} required /></Field>
    <Field label="Email" name="email"><input id="email" type="email" value={form.email} onChange={(e) => change("email", e.target.value)} placeholder="Email address" aria-invalid={Boolean(errors.email)} required /></Field>
    <Field label="Address" name="address" fullWidth><textarea id="address" rows="4" value={form.address} onChange={(e) => change("address", e.target.value)} placeholder="Enter address" aria-invalid={Boolean(errors.address)} required /></Field>
    <Field label="Emergency Contact" name="emergencyContact"><input id="emergencyContact" type="tel" inputMode="numeric" value={form.emergencyContact} onChange={(e) => change("emergencyContact", e.target.value)} placeholder="10-digit contact number" aria-invalid={Boolean(errors.emergencyContact)} required /></Field>
  </div><div className="buttonArea"><button type="submit" className="createBtn" disabled={submitting}>{submitting ? "Adding…" : "Add Worker"}</button></div></form></div></div>;
}
export default AddWorker;


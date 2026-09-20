import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./CreateDoctor.css";
import { notify } from "../../components/ToastProvider";
import AdminService from "../../services/AdminService";
import EmailOtpVerification from "../../components/EmailOtpVerification";
import { addNotification } from "../../utils/notifications";

const initialDoctor = { doctorId: "", name: "", email: "", mobile: "", gender: "", specialization: "", hospital: "", localAddress: "", city: "", state: "", pincode: "", experience: "", password: "", confirmPassword: "" };
const fieldLabels = { doctorId: "Doctor ID", name: "Doctor name", email: "Email", mobile: "Mobile number", gender: "Gender", specialization: "Specialization", hospital: "Hospital", experience: "Experience", password: "Password", confirmPassword: "Confirm password" };
const specializations = ["General Medicine", "General Surgery", "Cardiology", "Dermatology", "Emergency Medicine", "ENT", "Gastroenterology", "Internal Medicine", "Medical Oncology", "Nephrology", "Neurology", "Obstetrics and Gynaecology", "Ophthalmology", "Orthopaedics", "Paediatrics", "Psychiatry", "Pulmonology", "Radiology", "Urology", "Physiotherapy"];

function CreateDoctor() {
  const location = useLocation();
  const approvedApplication = location.state?.approvedApplication || null;
  const [doctor, setDoctor] = useState(initialDoctor);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [emailVerificationToken, setEmailVerificationToken] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [hospitalLoading, setHospitalLoading] = useState(true);
  const [isOtherHospital, setIsOtherHospital] = useState(false);

  useEffect(() => { 
    AdminService.getHospitals()
      .then(({ data }) => setHospitals(Array.isArray(data) && data.length > 0 ? data : []))
      .catch(() => {})
      .finally(() => setHospitalLoading(false)); 
  }, []);
  useEffect(() => {
    if (!approvedApplication) return;
    setDoctor((current) => ({ ...current, name: approvedApplication.fullName || "", email: approvedApplication.email || "", mobile: approvedApplication.phone || "", specialization: approvedApplication.specialization || "", hospital: approvedApplication.hospital || "", localAddress: approvedApplication.hospitalAddress || "", experience: String(approvedApplication.experience || "").replace(/\D/g, ""), password: "verified-password", confirmPassword: "verified-password" }));
  }, [approvedApplication]);
  const validate = (values) => {
    const next = {};
    Object.entries(fieldLabels).forEach(([field, label]) => { if (approvedApplication && ["password", "confirmPassword"].includes(field)) return; if (!String(values[field] || "").trim()) next[field] = `${label} is required.`; });
    if (values.doctorId && !/^DR[0-9]{3,}$/i.test(values.doctorId.trim())) next.doctorId = "Use an ID such as DR001.";
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = "Enter a valid email address.";
    if (values.mobile && !/^\d{10}$/.test(values.mobile.trim())) next.mobile = "Enter a valid 10-digit mobile number.";
    if (values.experience && (!Number.isInteger(Number(values.experience)) || Number(values.experience) < 0 || Number(values.experience) > 60)) next.experience = "Experience must be between 0 and 60 years.";
    if (!approvedApplication && values.password && values.password.length < 6) next.password = "Password must contain at least 6 characters.";
    if (values.password && values.confirmPassword && values.password !== values.confirmPassword) next.confirmPassword = "Passwords do not match.";
    if (isOtherHospital) ["hospital", "localAddress", "city", "state", "pincode"].forEach((field) => { if (!String(values[field] || "").trim()) next[field] = "Enter the hospital's complete address."; });
    return next;
  };
  const change = (event) => { const next = { ...doctor, [event.target.name]: event.target.value }; setDoctor(next); if (event.target.name === "email") setEmailVerificationToken(null); setErrors((current) => ({ ...current, [event.target.name]: validate(next)[event.target.name] })); };
  const hospitalOptionValue = (hospital) => `${hospital.hospital}|||${hospital.city}|||${hospital.pincode}`;
  const selectHospital = (event) => { const isOther = event.target.value === "__other__"; setIsOtherHospital(isOther); const selected = hospitals.find((item) => hospitalOptionValue(item) === event.target.value); const next = { ...doctor, hospital: isOther ? "" : selected?.hospital || "", localAddress: isOther ? "" : selected?.localAddress || "", city: isOther ? "" : selected?.city || "", state: isOther ? "" : selected?.state || "", pincode: isOther ? "" : selected?.pincode || "" }; setDoctor(next); setErrors((current) => ({ ...current, hospital: validate(next).hospital })); };
  const submit = async (event) => { event.preventDefault(); const validation = validate(doctor); setErrors(validation); if (Object.keys(validation).length) return notify.warning("Please correct the highlighted fields."); if (!approvedApplication && !emailVerificationToken) return notify.warning("Verify the email with the code before creating the doctor."); setSubmitting(true); try { const hospitalAddress = [doctor.localAddress, doctor.city, doctor.state, doctor.pincode].filter(Boolean).join(", "); await AdminService.createDoctor({ fullName: doctor.name.trim(), email: doctor.email.trim().toLowerCase(), password: doctor.password, phone: doctor.mobile.trim(), emailVerificationToken, applicationId: approvedApplication?.id, specialization: doctor.specialization.trim(), hospital: doctor.hospital.trim(), hospitalAddress }); addNotification("admin", `Doctor ${doctor.name.trim()} was created successfully.`, "success"); notify.success("Doctor created successfully."); setDoctor(initialDoctor); setIsOtherHospital(false); setEmailVerificationToken(null); setErrors({}); } catch (error) { notify.error(error.response?.data?.message || "Unable to create doctor."); } finally { setSubmitting(false); } };
  const FieldError = ({ name }) => errors[name] && <span className="field-error">{errors[name]}</span>;
  return <div className="createDoctor"><div className="pageHeader"><h2>Create Doctor</h2><p>Add a new doctor to the HealthSync system.</p></div><div className="formContainer"><form onSubmit={submit}><div className="formGrid">
    <div className="formGroup"><label>Doctor ID <span className="required-mark">*</span></label><input name="doctorId" value={doctor.doctorId} onChange={change} placeholder="DR001" aria-invalid={Boolean(errors.doctorId)} /><FieldError name="doctorId" /></div>
    <div className="formGroup"><label>Doctor Name <span className="required-mark">*</span></label><input name="name" value={doctor.name} onChange={change} placeholder="Enter Doctor Name" aria-invalid={Boolean(errors.name)} /><FieldError name="name" /></div>
    <div className="formGroup"><label>Email <span className="required-mark">*</span></label><input type="email" name="email" value={doctor.email} onChange={change} placeholder="doctor@gmail.com" aria-invalid={Boolean(errors.email)} /><FieldError name="email" /><EmailOtpVerification email={doctor.email} onVerified={setEmailVerificationToken} /></div>
    <div className="formGroup"><label>Mobile <span className="required-mark">*</span></label><input type="tel" name="mobile" value={doctor.mobile} onChange={change} placeholder="9876543210" maxLength="10" aria-invalid={Boolean(errors.mobile)} /><FieldError name="mobile" /></div>
    <div className="formGroup"><label>Gender <span className="required-mark">*</span></label><select name="gender" value={doctor.gender} onChange={change} aria-invalid={Boolean(errors.gender)}><option value="">Select gender</option><option>Male</option><option>Female</option><option>Other</option></select><FieldError name="gender" /></div>
    <div className="formGroup"><label>Specialization <span className="required-mark">*</span></label><select name="specialization" value={doctor.specialization} onChange={change} aria-invalid={Boolean(errors.specialization)}><option value="">Select specialization</option>{specializations.map((item) => <option key={item}>{item}</option>)}</select><FieldError name="specialization" /></div>
    <div className="formGroup"><label>Hospital <span className="required-mark">*</span></label><select value={isOtherHospital ? "__other__" : doctor.hospital ? hospitalOptionValue({ hospital: doctor.hospital, city: doctor.city, pincode: doctor.pincode }) : ""} onChange={selectHospital} aria-invalid={Boolean(errors.hospital)}><option value="">{hospitalLoading ? "Loading hospital dataset..." : "Select hospital"}</option>{hospitals.map((item) => <option key={`${item.hospital}-${item.city}-${item.pincode}`} value={hospitalOptionValue(item)}>{item.hospital} — {item.city}</option>)}<option value="__other__">Other hospital (enter manually)</option></select><FieldError name="hospital" /></div>
    <div className="formGroup"><label>Experience (years) <span className="required-mark">*</span></label><input type="number" name="experience" value={doctor.experience} onChange={change} min="0" max="60" placeholder="5" aria-invalid={Boolean(errors.experience)} /><FieldError name="experience" /></div>
    {isOtherHospital ? <><div className="formGroup full-width"><label>Other hospital name <span className="required-mark">*</span></label><input name="hospital" value={doctor.hospital} onChange={change} placeholder="Enter hospital name" aria-invalid={Boolean(errors.hospital)} /><FieldError name="hospital" /></div><div className="formGroup full-width"><label>Hospital local address <span className="required-mark">*</span></label><input name="localAddress" value={doctor.localAddress} onChange={change} placeholder="Street / area" aria-invalid={Boolean(errors.localAddress)} /><FieldError name="localAddress" /></div><div className="formGroup"><label>City <span className="required-mark">*</span></label><input name="city" value={doctor.city} onChange={change} placeholder="City" aria-invalid={Boolean(errors.city)} /><FieldError name="city" /></div><div className="formGroup"><label>State <span className="required-mark">*</span></label><input name="state" value={doctor.state} onChange={change} placeholder="State" aria-invalid={Boolean(errors.state)} /><FieldError name="state" /></div><div className="formGroup"><label>Pincode <span className="required-mark">*</span></label><input name="pincode" value={doctor.pincode} onChange={change} placeholder="Pincode" aria-invalid={Boolean(errors.pincode)} /><FieldError name="pincode" /></div></> : <><div className="formGroup full-width"><label>Hospital local address</label><input value={doctor.localAddress} readOnly /></div><div className="formGroup"><label>State</label><input value={doctor.state} readOnly /></div><div className="formGroup"><label>Pincode</label><input value={doctor.pincode} readOnly /></div></>}
    <div className="formGroup"><label>Password <span className="required-mark">*</span></label><div className="password-toggle"><input type={showPassword ? "text" : "password"} name="password" value={doctor.password} onChange={change} aria-invalid={Boolean(errors.password)} /><button type="button" onClick={() => setShowPassword((current) => !current)}>{showPassword ? <FaEyeSlash /> : <FaEye />}</button></div><FieldError name="password" /></div>
    <div className="formGroup"><label>Confirm Password <span className="required-mark">*</span></label><div className="password-toggle"><input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={doctor.confirmPassword} onChange={change} aria-invalid={Boolean(errors.confirmPassword)} /><button type="button" onClick={() => setShowConfirmPassword((current) => !current)}>{showConfirmPassword ? <FaEyeSlash /> : <FaEye />}</button></div><FieldError name="confirmPassword" /></div>
  </div><div className="buttonArea"><button type="submit" className="createBtn" disabled={submitting}>{submitting ? "Creating..." : "Create Doctor"}</button></div></form></div></div>;
}
export default CreateDoctor;

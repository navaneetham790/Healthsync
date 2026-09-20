import { useState, useEffect } from "react";
import "./Appointment.css";
import WorkerService from "../../services/WorkerService";
import AdminService from "../../services/AdminService";
import { notify } from "../../components/ToastProvider";
import { addNotification } from "../../utils/notifications";
import { useLanguage } from "../../i18n/LanguageContext";

function Appointment() {
  const { t } = useLanguage();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const initialForm = {
    workerId: user.workerCode || "MW001",
    workerName: user.fullName || "",
    doctor: "",
    date: "",
    time: "",
    reason: "",
  };

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const selectedDoctor = doctors.find((doctor) => doctor.email === form.doctor || doctor.fullName === form.doctor);

  // Load doctor list from backend
  useEffect(() => {
    AdminService.getDoctors()
      .then(({ data }) => setDoctors(Array.isArray(data) ? data : []))
      .catch(() => setDoctors([]));
  }, []);

  const change = (key, value) => { setForm({ ...form, [key]: value }); setErrors({ ...errors, [key]: "" }); };

  const validate = () => {
    const next = {};
    if (!form.doctor) next.doctor = "Please select a doctor.";
    if (!form.date) next.date = "Please select an appointment date.";
    else if (form.date < new Date().toISOString().slice(0, 10)) next.date = "Choose today or a future date.";
    if (!form.time) next.time = "Please select an appointment time.";
    if (form.reason.trim().length < 5) next.reason = "Reason must contain at least 5 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) { notify.warning("Please complete all required appointment information."); return; }
    setSubmitting(true);
    try {
      if (!selectedDoctor) throw new Error("Please choose a registered doctor.");
      await WorkerService.bookAppointment({ ...form, workerId: user.id || form.workerId, doctor: selectedDoctor.fullName, doctorEmail: selectedDoctor.email });
      addNotification("doctor", `New appointment request from ${form.workerName} for ${form.date} at ${form.time}.`, "info");
      notify.success("Appointment booked successfully.");
      setForm(initialForm);
    } catch (error) {
      notify.error(error.response?.data?.message || "Unable to book appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  const minDate = new Date().toISOString().slice(0, 10);

  return (
    <div className="appointment">
      <div className="page-header">
        <h2>{t("Book Appointment")}</h2>
        <p>Fields marked <span className="required-mark">*</span> are required.</p>
      </div>
      <div className="appointment-card">
        <form onSubmit={submit} noValidate>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="worker-id">{t("Worker ID")}</label>
              <input id="worker-id" type="text" value={form.workerId} readOnly />
            </div>
            <div className="form-group">
              <label htmlFor="worker-name">{t("Worker Name")}</label>
              <input id="worker-name" type="text" value={form.workerName} readOnly />
            </div>
            <div className="form-group">
              <label htmlFor="doctor">{t("Select Doctor")} <span className="required-mark">*</span></label>
              <select id="doctor" value={form.doctor} onChange={(e) => change("doctor", e.target.value)} aria-invalid={Boolean(errors.doctor)} required>
                <option value="">{t("Choose a doctor")}</option>
                {doctors.length ? doctors.map((d) => (
                  <option key={d.id} value={d.email || d.fullName}>{d.fullName} — {d.specialization}</option>
                )) : (
                  <>
                    <option>Dr. Kumar</option>
                    <option>Dr. Priya</option>
                    <option>Dr. Arun</option>
                  </>
                )}
              </select>
              {errors.doctor && <small className="field-error">{errors.doctor}</small>}
            </div>
            {selectedDoctor && (
              <div className="doctor-location" aria-live="polite">
                <div><span>{t("Hospital")}</span><strong>{selectedDoctor.hospital || "Hospital information is unavailable"}</strong></div>
                <div><span>{t("Hospital address")}</span><strong>{selectedDoctor.hospitalAddress || "Address information is unavailable"}</strong></div>
              </div>
            )}
            <div className="form-group">
              <label htmlFor="appointment-date">{t("Appointment Date")} <span className="required-mark">*</span></label>
              <input id="appointment-date" type="date" min={minDate} value={form.date} onChange={(e) => change("date", e.target.value)} aria-invalid={Boolean(errors.date)} required />
              {errors.date && <small className="field-error">{errors.date}</small>}
            </div>
            <div className="form-group">
              <label htmlFor="appointment-time">{t("Appointment Time")} <span className="required-mark">*</span></label>
              <input id="appointment-time" type="time" value={form.time} onChange={(e) => change("time", e.target.value)} aria-invalid={Boolean(errors.time)} required />
              {errors.time && <small className="field-error">{errors.time}</small>}
            </div>
            <div className="form-group">
              <label htmlFor="reason">{t("Reason")} <span className="required-mark">*</span></label>
              <input id="reason" type="text" value={form.reason} onChange={(e) => change("reason", e.target.value)} placeholder={t("Describe the reason for your visit")} minLength="5" aria-invalid={Boolean(errors.reason)} required />
              {errors.reason && <small className="field-error">{errors.reason}</small>}
            </div>
          </div>
          <button type="submit" className="book-btn" disabled={submitting}>
            {submitting ? t("Booking…") : t("Book Appointment")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Appointment;

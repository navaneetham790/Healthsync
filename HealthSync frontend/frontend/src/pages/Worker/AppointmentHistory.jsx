import { useCallback, useEffect, useState } from "react";
import "./AppointmentHistory.css";
import RecordDialog from "../../components/RecordDialog";
import WorkerService from "../../services/WorkerService";
import { notify } from "../../components/ToastProvider";
import { useLanguage } from "../../i18n/LanguageContext";

function AppointmentHistory() {
  const { t } = useLanguage();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);

  const workerId = JSON.parse(localStorage.getItem("user") || "{}").id || 1;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await WorkerService.getAppointments(workerId);
      setAppointments(Array.isArray(data) ? data : []);
    } catch (error) {
      notify.error(error.response?.data?.message || "Unable to load appointments.");
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => { load(); }, [load]);

  const getDialogFields = (record) => {
    if (!record) return [];
    const baseFields = ["id", "workerId", "workerName", "doctor", "doctorEmail", "appointmentAt", "reason", "status"];
    if (record.status === "COMPLETED") return [...baseFields, "followUpDate", "doctorNotes", "completedAt"];
    if (record.status === "CANCELLED") return [...baseFields, "cancelReason"];
    return baseFields;
  };

  return (
    <div className="appointment-history">
      <div className="page-header">
        <h2>{t("Appointment History")}</h2>
        <p>{t("View all your previous appointments.")}</p>
      </div>

      <div className="history-card">
        <table>
          <thead>
            <tr>
              <th>{t("Appointment ID")}</th><th>{t("Doctor")}</th><th>{t("Date")}</th><th>{t("Time")}</th><th>{t("Status")}</th><th>{t("Action")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6">Loading…</td></tr>
            ) : appointments.length ? appointments.map((item) => (
              <tr key={item.id || item._id}>
                <td>{item.appointmentId || item.id || item._id}</td>
                <td>{item.doctorName || item.doctor || "—"}</td>
                <td>{item.appointmentAt ? new Date(item.appointmentAt).toLocaleDateString("en-IN") : (item.date ? new Date(item.date).toLocaleDateString() : item.appointmentDate || "—")}</td>
                <td>{item.appointmentAt ? new Date(item.appointmentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : (item.time || item.appointmentTime || "—")}</td>
                <td>
                  <span className={
                    item.status === "CONFIRMED" || item.status === "Confirmed" ? "completed"
                      : item.status === "PENDING" || item.status === "Pending" ? "pending"
                      : "cancelled"
                  }>
                    {item.status || "Pending"}
                  </span>
                  {item.status === "CANCELLED" && item.cancelReason && (
                    <div style={{ fontSize: "0.85rem", color: "#d92d20", marginTop: "0.4rem" }}>
                      <strong>Reason:</strong> {item.cancelReason}
                    </div>
                  )}
                </td>
                <td>
                  <button className="view-btn" onClick={() => setViewing(item)}>{t("View")}</button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="6">No appointments found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <RecordDialog record={viewing} title="Appointment details" fields={getDialogFields(viewing)} onClose={() => setViewing(null)} />
    </div>
  );
}

export default AppointmentHistory;

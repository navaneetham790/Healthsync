import { useCallback, useEffect, useState } from "react";
import "./Dashboard.css";
import DashboardCard from "../../components/DashboardCard";
import { FaHeartbeat, FaFileMedical, FaCalendarCheck } from "react-icons/fa";
import WorkerService from "../../services/WorkerService";
import { notify } from "../../components/ToastProvider";
import { useLanguage } from "../../i18n/LanguageContext";

function Dashboard() {
  const { t } = useLanguage();
  const [data, setData] = useState({ healthRecords: [], prescriptions: [], appointments: [] });
  const [loading, setLoading] = useState(true);

  // Get worker info stored at login
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const workerId = user.id || 1;
  const userName = user.fullName ? user.fullName.trim() : "Worker";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [hrRes, rxRes, apRes] = await Promise.allSettled([
        WorkerService.getHealthRecords(workerId),
        WorkerService.getPrescriptions(workerId),
        WorkerService.getAppointments(workerId),
      ]);
      setData({
        healthRecords: hrRes.status === "fulfilled" && Array.isArray(hrRes.value?.data) ? hrRes.value.data : [],
        prescriptions: rxRes.status === "fulfilled" && Array.isArray(rxRes.value?.data) ? rxRes.value.data : [],
        appointments:  apRes.status === "fulfilled" && Array.isArray(apRes.value?.data) ? apRes.value.data : [],
      });
    } catch (_) {
      setData({ healthRecords: [], prescriptions: [], appointments: [] });
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => { load(); }, [load]);

  const recent = data.healthRecords.slice(0, 4);

  return (
    <div className="worker-dashboard">
      <div className="worker-welcome">
        <h2>{t("Welcome")} {userName} 👋</h2>
        <p>{t("View your health records, prescriptions and appointments.")}</p>
      </div>

      <div className="worker-cards">
        <DashboardCard title={t("Health Records")} value={loading ? "—" : data.healthRecords.length} icon={<FaHeartbeat />} color="#0F8F83" />
        <DashboardCard title={t("Prescriptions")} value={loading ? "—" : data.prescriptions.length} icon={<FaFileMedical />} color="#1976D2" />
        <DashboardCard title={t("Appointments")} value={loading ? "—" : data.appointments.length} icon={<FaCalendarCheck />} color="#43A047" />
      </div>

      <div className="worker-table">
        <h3>{t("Recent Health Records")}</h3>
        <table>
          <thead>
            <tr>
              <th>{t("Record ID")}</th><th>{t("Date")}</th><th>{t("Doctor")}</th><th>{t("Diagnosis")}</th><th>{t("Status")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5">{t("Loading…")}</td></tr>
            ) : recent.length ? recent.map((record) => (
              <tr key={record.id || record._id}>
                <td>{record.recordId || record.id || record._id}</td>
                <td>{record.date || record.visitDate || record.recordedOn || "—"}</td>
                <td>{record.doctorName || record.doctor || "Dr. Ramesh Kumar"}</td>
                <td>{record.diagnosis || record.disease || "—"}</td>
                <td>
                  <span className={
                    record.status === "Recovered" ? "worker-healthy"
                      : record.status === "Stable" ? "worker-follow"
                      : "worker-healthy"
                  } style={record.status === "Stable" ? undefined : { backgroundColor: "#d4f6d9", color: "#065f46", border: "1px solid #86efac", fontWeight: 800 }}>
                    {record.status || "Recorded"}
                  </span>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="5">{t("No health records found.")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;

import { useCallback, useEffect, useState } from "react";
import "./HealthRecords.css";
import RecordDialog from "../../components/RecordDialog";
import WorkerService from "../../services/WorkerService";
import { notify } from "../../components/ToastProvider";
import { useLanguage } from "../../i18n/LanguageContext";

function HealthRecords() {
  const { t } = useLanguage();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);

  const workerId = JSON.parse(localStorage.getItem("user") || "{}").id || 1;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await WorkerService.getHealthRecords(workerId);
      setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      notify.error(error.response?.data?.message || "Unable to load health records.");
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="health-records">
      <div className="page-header">
        <h2>{t("Health Records")}</h2>
        <p>{t("View all your medical history.")}</p>
      </div>

      <div className="records-table">
        <table>
          <thead>
            <tr>
              <th>{t("Record ID")}</th><th>{t("Date")}</th><th>{t("Doctor")}</th><th>{t("Diagnosis")}</th><th>{t("Status")}</th><th>{t("Action")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6">Loading…</td></tr>
            ) : records.length ? records.map((record) => (
              <tr key={record.id || record._id}>
                <td>{record.recordId || record.id || record._id}</td>
                <td>{record.date || record.visitDate || record.recordedOn || "—"}</td>
                <td>{record.doctorName || record.doctor || "Dr. Ramesh Kumar"}</td>
                <td>{record.diagnosis || record.disease || "—"}</td>
                <td>
                  <span className={
                    record.status === "Recovered" ? "healthy"
                      : record.status === "Stable" ? "follow"
                      : "healthy"
                  } style={record.status === "Stable" ? undefined : { backgroundColor: "#d4f6d9", color: "#065f46", border: "1px solid #86efac", fontWeight: 800 }}>
                    {record.status || "Recorded"}
                  </span>
                </td>
                <td>
                  <button className="view-btn" onClick={() => setViewing(record)}>{t("View")}</button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="6">No health records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <RecordDialog 
        record={viewing ? { ...viewing, doctorName: viewing.doctorName || viewing.doctor || "Dr. Ramesh Kumar" } : null} 
        title="Health record details" 
        fields={["id", "date", "doctorName", "diagnosis", "summary", "bloodPressure", "sugar", "bmi", "notes"]}
        onClose={() => setViewing(null)} 
      />
    </div>
  );
}

export default HealthRecords;

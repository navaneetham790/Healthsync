import { useCallback, useEffect, useState } from "react";
import "./Prescriptions.css";
import RecordDialog from "../../components/RecordDialog";
import WorkerService from "../../services/WorkerService";
import { notify } from "../../components/ToastProvider";
import { useLanguage } from "../../i18n/LanguageContext";

function Prescriptions() {
  const { t } = useLanguage();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);

  const workerId = JSON.parse(localStorage.getItem("user") || "{}").id || 1;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await WorkerService.getPrescriptions(workerId);
      setPrescriptions(Array.isArray(data) ? data : []);
    } catch (error) {
      notify.error(error.response?.data?.message || "Unable to load prescriptions.");
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="prescriptions">
      <div className="page-header">
        <h2>{t("My Prescriptions")}</h2>
        <p>{t("View all prescribed medicines.")}</p>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>{t("Prescription ID")}</th><th>{t("Date")}</th><th>{t("Doctor")}</th><th>{t("Medicine")}</th><th>{t("Duration")}</th><th>{t("Action")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6">Loading…</td></tr>
            ) : prescriptions.length ? prescriptions.map((item) => {
              const parsedDuration = item.duration || (item.instructions ? (item.instructions.match(/for\s+(\d+\s+(?:days|weeks|months|day|week|month))/i)?.[1] || item.instructions.match(/(\d+\s+(?:days|weeks|months|day|week|month))/i)?.[1] || "3 days") : "3 days");
              return (
                <tr key={item.id || item._id}>
                  <td>{item.prescriptionId || item.id || item._id}</td>
                  <td>{item.date ? new Date(item.date).toLocaleDateString() : "—"}</td>
                  <td>{item.doctorName || item.doctor || "Dr. Navaneetha M"}</td>
                  <td>{item.medicines?.[0]?.name || item.medicine || item.medicineName || "—"}</td>
                  <td>{parsedDuration}</td>
                  <td>
                    <button className="view-btn" onClick={() => setViewing({ ...item, duration: parsedDuration })}>{t("View")}</button>
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan="6">No prescriptions found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <RecordDialog 
        record={viewing ? { 
          ...viewing, 
          doctorName: viewing.doctorName || viewing.doctor || "Dr. Navaneetha M",
          medicine: [viewing.medicine, viewing.dosage !== "-" ? viewing.dosage : "", viewing.frequency !== "-" ? viewing.frequency : ""].filter(Boolean).join("\n") 
        } : null} 
        title="Prescription details" 
        fields={["id", "date", "doctorName", "medicine", "duration", "instructions"]}
        onClose={() => setViewing(null)} 
      />
    </div>
  );
}

export default Prescriptions;

import { useCallback, useEffect, useState } from "react";
import "./ManageWorkers.css";
import AdminService from "../../services/AdminService";
import WorkerService from "../../services/WorkerService";
import RecordDialog from "../../components/RecordDialog";
import { notify } from "../../components/ToastProvider";

const normalizeWorker = (worker) => ({
  id: worker.id,
  workerId: worker.workerCode || `MW${worker.id}`,
  name: worker.fullName || worker.name,
  email: worker.email,
  phone: worker.phone || "—",
  age: worker.age ?? "—",
  prescriptions: "Loading latest prescription…",
  address: worker.healthHistory || "Address not recorded",
  riskLevel: worker.riskLevel || "Not assessed",
});

function ManageWorkers() {
  const [workers, setWorkers] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [loading, setLoading] = useState(true);
  const loadWorkers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await AdminService.getWorkers();
      setWorkers((Array.isArray(data) ? data : data.content || []).map(normalizeWorker));
    } catch (error) {
      setWorkers([]);
      notify.error(error.response?.data?.message || "Unable to load workers from the database.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { loadWorkers(); }, [loadWorkers]);
  const riskBadge = (riskLevel) => {
    const level = String(riskLevel || "NOT ASSESSED").toUpperCase();
    if (level === "LOW") return "admin-risk admin-risk-low";
    if (level === "MEDIUM") return "admin-risk admin-risk-medium";
    if (level === "HIGH") return "admin-risk admin-risk-high";
    return "admin-risk admin-risk-neutral";
  };

  const viewWorker = async (worker) => {
    setViewing(worker);
    try {
      const { data } = await WorkerService.getPrescriptions(worker.id);
      const prescriptions = Array.isArray(data) ? data : [];
      const latest = prescriptions
        .slice()
        .sort((first, second) => String(second.date || "").localeCompare(String(first.date || "")))[0];
      const summary = latest
        ? `${latest.medicine || "Medicine"}${latest.dosage ? ` — ${latest.dosage}` : ""}${prescriptions.length > 1 ? ` (+${prescriptions.length - 1} more)` : ""}`
        : "No prescriptions recorded";
      setViewing((current) => current?.id === worker.id ? { ...current, prescriptions: summary } : current);
    } catch {
      setViewing((current) => current?.id === worker.id ? { ...current, prescriptions: "No prescriptions recorded" } : current);
    }
  };

  return <div className="manageWorkers"><div className="pageHeader"><h2>Manage Workers</h2><p>View workers stored in the HealthSync database.</p></div><div className="tableContainer"><table><thead><tr><th>Worker ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Risk Level</th><th>Action</th></tr></thead><tbody>{loading ? <tr><td colSpan="6">Loading real database data...</td></tr> : workers.length ? workers.map((worker) => <tr key={worker.id}><td>{worker.workerId}</td><td>{worker.name}</td><td>{worker.email}</td><td>{worker.phone}</td><td><span className={riskBadge(worker.riskLevel)}>{worker.riskLevel}</span></td><td><button className="viewBtn" onClick={() => viewWorker(worker)}>View</button></td></tr>) : <tr><td colSpan="6">No workers found in the database.</td></tr>}</tbody></table></div><RecordDialog record={viewing} title="Worker details" fields={["id", "workerId", "name", "email", "phone", "age", "prescriptions", "address", "riskLevel"]} onClose={() => setViewing(null)}/></div>;
}
export default ManageWorkers;

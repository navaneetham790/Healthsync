import { useCallback, useEffect, useState } from "react";
import "./SearchWorker.css";
import WorkerHealthDetails from "../../components/WorkerHealthDetails";
import DoctorService from "../../services/DoctorService";
import { notify } from "../../components/ToastProvider";

function SearchWorker() {
  const [search, setSearch] = useState("");
  const [workers, setWorkers] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadWorkers = useCallback(async () => {
    setLoading(true);
    try {
      // Older running backends do not have the directory route yet. Fall back
      // gracefully while the backend is being restarted.
      const { data } = await DoctorService.getWorkerDirectory()
        .catch(() => DoctorService.getWorkers());
      setWorkers(Array.isArray(data) ? data : []);
    } catch (error) {
      setWorkers([]);
      notify.error(error.response?.data?.message || "Unable to load workers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadWorkers(); }, [loadWorkers]);

  const filtered = workers.filter((worker) =>
    `${worker.fullName} ${worker.workerCode} ${worker.id}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="doctor-search-page">
      <div className="doctor-page-header">
        <h2>Search Worker</h2>
        <p>Search all registered workers. Full health records are available after the worker selects you for an appointment.</p>
      </div>
      <div className="doctor-search-card">
        <input type="text" placeholder="Search Worker..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="doctor-worker-table">
        <table>
          <thead><tr><th>Worker ID</th><th>Name</th><th>Age</th><th>Risk level</th><th>Action</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="5">Loading workers...</td></tr>
              : filtered.length ? filtered.map((worker) => <tr key={worker.id}>
                <td>{worker.workerCode || `MW${worker.id}`}</td><td>{worker.fullName}</td><td>{worker.age ?? "-"}</td>
                <td>{worker.riskLevel || "Not assessed"}</td><td><button className="doctor-view-btn" onClick={() => setViewing(worker)}>View record</button></td>
              </tr>) : <tr><td colSpan="5">No workers found.</td></tr>}
          </tbody>
        </table>
      </div>
      <WorkerHealthDetails worker={viewing} onClose={() => setViewing(null)} latestOnly />
    </div>
  );
}

export default SearchWorker;

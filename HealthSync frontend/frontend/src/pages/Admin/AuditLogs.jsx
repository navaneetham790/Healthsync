import { useCallback, useEffect, useState } from "react";
import "./AuditLogs.css";
import AdminService from "../../services/AdminService";
import { notify } from "../../components/ToastProvider";

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await AdminService.getAuditLogs();
      setLogs(Array.isArray(data) ? data : data.logs || []);
    } catch (error) {
      notify.error(error.response?.data?.message || "Unable to load audit logs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const formatDate = (timestamp) =>
    timestamp ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(timestamp)) : "—";

  const formatTime = (timestamp) =>
    timestamp ? new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).format(new Date(timestamp)) : "—";

  // Get display name and badge color from role field
  const getRoleBadge = (role) => {
    const r = String(role || "").toLowerCase();
    if (r === "admin")  return { label: "Admin",  className: "role-admin" };
    if (r === "doctor") return { label: "Doctor", className: "role-doctor" };
    if (r === "worker") return { label: "Worker", className: "role-worker" };
    return { label: role || "System", className: "role-system" };
  };

  return (
    <div className="auditLogs">
      <div className="pageHeader">
        <h2>Audit Logs</h2>
        <p>Track all system activities.</p>
      </div>

      <div className="tableContainer">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>User</th>
              <th>Action</th>
              <th>Details</th>
              <th>Date</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="audit-state">Loading live data…</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan="6" className="audit-state">No audit activity yet.</td></tr>
            ) : logs.map((log, index) => {
              const badge = getRoleBadge(log.role || log.user);
              return (
                <tr key={log.id}>
                  <td>{index + 1}</td>
                  <td>
                    <span className={`role-badge ${badge.className}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td>{log.action || "—"}</td>
                  <td>{log.details || "—"}</td>
                  <td>{formatDate(log.timestamp)}</td>
                  <td>{formatTime(log.timestamp)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AuditLogs;

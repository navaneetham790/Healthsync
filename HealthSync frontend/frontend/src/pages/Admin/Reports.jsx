import { useCallback, useEffect, useState } from "react";
import "./Reports.css";
import AdminService from "../../services/AdminService";
import { notify } from "../../components/ToastProvider";
import { FaFileAlt } from "react-icons/fa";

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await AdminService.getReports();
      setReports(Array.isArray(data) ? data : data.reports || []);
    } catch (error) {
      notify.error(error.response?.data?.message || "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadReport = async (id) => {
    try {
      const response = await AdminService.downloadReport(id, "pdf");
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `report-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      notify.success("Report downloaded successfully.");
    } catch (error) {
      notify.error("Failed to download report.");
    }
  };

  useEffect(() => { loadReports(); }, [loadReports]);

  const displayDate = (date) =>
    date ? new Date(`${date}T00:00:00`).toLocaleDateString("en-IN") : "—";

  return (
    <div className="reports">
      <div className="pageHeader">
        <h2>Analytics &amp; Reports</h2>
        <p>Reports generated from HealthSync live data.</p>
      </div>

      <div className="tableContainer">
        {loading ? (
          <div className="report-empty-state">
            <p>Loading reports…</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="report-empty-state">
            <FaFileAlt className="report-empty-icon" />
            <h3>No Reports Yet</h3>
            <p>Reports will appear here once doctors and workers are registered and health data is recorded.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Type</th>
                <th>Title</th>
                <th>Date</th>
                <th>Status</th>
                <th>Details</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>{report.id}</td>
                  <td>{report.type || "—"}</td>
                  <td>{report.title || report.name || "—"}</td>
                  <td>{displayDate(report.date)}</td>
                  <td>
                    <span className={
                      report.status === "COMPLETED" ? "report-status report-completed"
                        : report.status === "PENDING" ? "report-status report-pending"
                        : "report-status report-processing"
                    }>
                      {report.status || "—"}
                    </span>
                  </td>
                  <td>{report.details || "—"}</td>
                  <td>
                    <button className="downloadBtn" onClick={() => downloadReport(report.id)}>
                      Download PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Reports;

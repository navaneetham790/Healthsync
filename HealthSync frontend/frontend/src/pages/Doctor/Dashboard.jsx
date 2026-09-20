import { useCallback, useEffect, useState } from "react";
import "./Dashboard.css";
import DashboardCard from "../../components/DashboardCard";
import { FaCalendarCheck, FaClock, FaCheckCircle } from "react-icons/fa";
import DoctorService from "../../services/DoctorService";

function Dashboard() {
  const [data, setData] = useState({ workers: [], appointments: [] });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch both independently — never show error toast for empty data
      const [profileRes, workersRes, appointmentsRes] = await Promise.allSettled([DoctorService.getProfile(), DoctorService.getWorkers(), DoctorService.getAppointments()]);
      const workers = workersRes.status === "fulfilled" && Array.isArray(workersRes.value?.data) ? workersRes.value.data : [];
      const signedInEmail = String(profileRes.status === "fulfilled" ? profileRes.value?.data?.email : JSON.parse(localStorage.getItem("user") || "{}").email || "").trim().toLowerCase();
      const appointments = appointmentsRes.status === "fulfilled" && Array.isArray(appointmentsRes.value?.data)
        ? appointmentsRes.value.data.filter((appointment) => String(appointment.doctorEmail || "").trim().toLowerCase() === signedInEmail)
        : [];

      setData({ workers, appointments });
    } catch (_) {
      // Silent fail — dashboard shows zeros, no red error popups
      setData({ workers: [], appointments: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const recent = data.workers.slice(0, 5);
  // Calendar-day counts: yesterday's completed/pending visits never carry into today.
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const appointmentDate = (value) => {
    const text = String(value || "");
    const isoDate = text.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoDate) return isoDate[1];
    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? "" : `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
  };
  const todayAppointments = data.appointments.filter((appointment) => appointmentDate(appointment.appointmentAt) === today);
  const pendingAppointments = todayAppointments.filter((appointment) => String(appointment.status || "").toUpperCase() === "PENDING");
  const completedAppointments = todayAppointments.filter((appointment) => String(appointment.status || "").toUpperCase() === "COMPLETED");
  const riskClass = (riskLevel) => {
    const level = String(riskLevel || "NOT ASSESSED").toUpperCase();
    if (level === "LOW") return "doctor-risk doctor-risk-low";
    if (level === "MEDIUM") return "doctor-risk doctor-risk-medium";
    if (level === "HIGH") return "doctor-risk doctor-risk-high";
    return "doctor-risk doctor-risk-neutral";
  };

  return (
    <div className="doctor-dashboard">
      <div className="doctor-welcome">
        <h2>Doctor Dashboard</h2>
        <p>Live information from the HealthSync database.</p>
      </div>

      <div className="doctor-cards">
        <DashboardCard title="Today's Appointments"   value={loading ? "—" : todayAppointments.length}     icon={<FaCalendarCheck />} color="#8E24AA" />
        <DashboardCard title="Pending Appointments"   value={loading ? "—" : pendingAppointments.length}   icon={<FaClock />}         color="#F59E0B" />
        <DashboardCard title="Completed Appointments" value={loading ? "—" : completedAppointments.length} icon={<FaCheckCircle />}   color="#16A34A" />
      </div>

      <div className="doctor-table">
        <h3>Recent Workers</h3>
        <table>
          <thead>
            <tr>
              <th>Worker ID</th>
              <th>Name</th>
              <th>Health History</th>
              <th>Risk Level</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4">Loading live data…</td></tr>
            ) : recent.length ? (
              recent.map((worker) => (
                <tr key={worker.id}>
                  <td>{worker.workerCode || `MW${worker.id}`}</td>
                  <td>{worker.fullName}</td>
                  <td>{worker.healthHistory || "—"}</td>
                  <td>
                    <span className={riskClass(worker.riskLevel)}>
                      {worker.riskLevel || "Not assessed"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4">No workers found. Add a worker to get started.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;

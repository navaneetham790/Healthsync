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

    // 1. Fetch workers directly (< 200ms from user-service)
    let apiWorkers = [];
    try {
      const res = await DoctorService.getWorkers().catch(() => DoctorService.getWorkerDirectory());
      if (Array.isArray(res?.data) && res.data.length > 0) apiWorkers = res.data;
    } catch (_) {}

    if (!apiWorkers.length) {
      try {
        const dirRes = await DoctorService.getWorkerDirectory();
        if (Array.isArray(dirRes?.data) && dirRes.data.length > 0) apiWorkers = dirRes.data;
      } catch (_) {}
    }

    // Always merge backend workers with local registered workers (e.g. newly added workers like Bavana)
    const localRegistry = JSON.parse(localStorage.getItem("healthsync_registered_workers") || "{}");
    const mergedMap = new Map();

    apiWorkers.forEach((w) => {
      const code = (w.workerCode || (w.id ? `MW${w.id}` : "") || "").toUpperCase();
      if (code) mergedMap.set(code, w);
    });

    Object.values(localRegistry).forEach((w) => {
      const code = (w.workerCode || w.workerId || "").toUpperCase();
      if (code) {
        const existing = mergedMap.get(code) || {};
        mergedMap.set(code, { ...existing, ...w });
      }
    });

    const finalWorkers = Array.from(mergedMap.values());
    setData((prev) => ({ ...prev, workers: finalWorkers }));

    // 2. Fetch profile & appointments asynchronously with fast timeout
    try {
      const [profileRes, appointmentsRes] = await Promise.allSettled([
        DoctorService.getProfile(),
        DoctorService.getAppointments()
      ]);
      const signedInEmail = String(
        profileRes.status === "fulfilled"
          ? profileRes.value?.data?.email
          : JSON.parse(localStorage.getItem("user") || "{}").email || ""
      ).trim().toLowerCase();

      let appointments = appointmentsRes.status === "fulfilled" && Array.isArray(appointmentsRes.value?.data)
        ? appointmentsRes.value.data
        : [];
      if (appointments.length && signedInEmail) {
        const filtered = appointments.filter((appointment) => String(appointment.doctorEmail || "").trim().toLowerCase() === signedInEmail);
        if (filtered.length > 0) appointments = filtered;
      }

      setData((prev) => ({ ...prev, appointments }));
    } catch (_) {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const recent = data.workers.slice(0, 5);

  // Compare using doctor's local calendar day (YYYY-MM-DD)
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const getLocalDateString = (value) => {
    if (!value) return "";
    const text = String(value).trim();
    // If already in plain YYYY-MM-DD format with no timestamp
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return text;
    }
    // Parse timestamp and format into local calendar date
    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) return "";
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayAppointments = data.appointments.filter(
    (appointment) => getLocalDateString(appointment.appointmentAt || appointment.date) === today
  );
  const pendingAppointments = data.appointments.filter(
    (appointment) => String(appointment.status || "").toUpperCase() === "PENDING"
  );
  const completedAppointments = data.appointments.filter(
    (appointment) => String(appointment.status || "").toUpperCase() === "COMPLETED"
  );
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
                <tr key={worker.id || worker.workerCode || Math.random()}>
                  <td>{worker.workerCode || `MW${worker.id}`}</td>
                  <td>{worker.fullName}</td>
                  <td>{worker.address || worker.healthHistory || "—"}</td>
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

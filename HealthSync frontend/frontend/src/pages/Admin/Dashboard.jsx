import { useCallback, useEffect, useState } from "react";
import "./Dashboard.css";
import { FaUsers, FaUserMd, FaHospital } from "react-icons/fa";
import AdminService from "../../services/AdminService";
import { notify } from "../../components/ToastProvider";

const emptyAnalytics = { totalWorkers: 0, totalDoctors: 0, totalHospitals: 0, monthlyRegistrations: [], riskOverview: [] };
const number = (value) => Number(value || 0);

function Dashboard() {
  const [analytics, setAnalytics] = useState(emptyAnalytics);
  const [loading, setLoading] = useState(true);
  const loadAnalytics = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const [analyticsResult, hospitalsResult] = await Promise.allSettled([AdminService.getAnalytics(), AdminService.getHospitals()]);
      if (analyticsResult.status !== "fulfilled") throw analyticsResult.reason;
      const { data } = analyticsResult.value;
      const hospitals = hospitalsResult.status === "fulfilled" && Array.isArray(hospitalsResult.value.data) ? hospitalsResult.value.data : [];
      const totalHospitals = new Set(hospitals.map((hospital) => `${hospital.hospital || ""}|${hospital.localAddress || ""}|${hospital.city || ""}|${hospital.pincode || ""}`)).size;
      setAnalytics({ ...emptyAnalytics, ...data, totalHospitals, monthlyRegistrations: data.monthlyRegistrations || data.registrationsByMonth || [], riskOverview: data.riskOverview || data.riskLevels || [] });
    } catch (error) { if (!quiet) notify.error(error.response?.data?.message || "Unable to load dashboard analytics."); }
    finally { if (!quiet) setLoading(false); }
  }, []);
  useEffect(() => { loadAnalytics(); const refresh = window.setInterval(() => loadAnalytics(true), 30000); return () => window.clearInterval(refresh); }, [loadAnalytics]);
  const registrations = analytics.monthlyRegistrations.map((item) => ({ label: item.month || item.label, value: number(item.count ?? item.registrations ?? item.value) }));
  const maxRegistration = Math.max(...registrations.map((item) => item.value), 1);
  const risks = analytics.riskOverview.map((item) => ({ label: item.riskLevel || item.level || item.label, value: number(item.count ?? item.value) }));
  const cards = [[FaUsers, analytics.totalWorkers ?? analytics.workers, "Total Workers", "workers"], [FaUserMd, analytics.totalDoctors ?? analytics.doctors, "Total Doctors", "doctors"], [FaHospital, analytics.totalHospitals, "Total Hospitals", "hospitals"]];
  return <div className="admin-dashboard"><div className="admin-welcome"><div><h2>Dashboard</h2><p>Live organization overview. Refreshes every 30 seconds.</p></div><button className="analytics-refresh" onClick={() => loadAnalytics()} disabled={loading}>{loading ? "Loading…" : "Refresh"}</button></div>
    <div className="admin-cards">{cards.map(([Icon, value, label, color]) => <div className="dashboard-card" key={label}><div className={`card-icon ${color}`}><Icon /></div><div className="card-info"><h3>{loading ? "—" : number(value).toLocaleString()}</h3><p>{label}</p></div></div>)}</div>
    <div className="chart-section"><section className="chart-card"><h3>Monthly registrations</h3><p className="chart-subtitle">New users registered each month</p>{loading ? <div className="chart-loading">Loading chart data…</div> : registrations.length ? <div className="bar-chart" role="img" aria-label="Monthly registration chart">{registrations.map((item) => <div className="bar-column" key={item.label}><span className="bar-value">{item.value}</span><div className="bar-track"><div className="bar-fill" style={{ height: `${(item.value / maxRegistration) * 100}%` }} /></div><span>{item.label}</span></div>)}</div> : <p className="empty-state">No registration data is available yet.</p>}</section>
    <section className="chart-card"><h3>Risk level overview</h3><p className="chart-subtitle">Current user risk distribution</p>{loading ? <div className="chart-loading">Loading chart data…</div> : risks.length ? <ul className="risk-list">{risks.map((item) => <li key={item.label}><span className={`risk-dot risk-${String(item.label).toLowerCase()}`} /><span>{item.label} Risk</span><strong>{item.value}</strong></li>)}</ul> : <p className="empty-state">No risk data is available yet.</p>}</section></div>
  </div>;
}
export default Dashboard;

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./WorkerQrDetails.css";

function WorkerQrDetails() {
  const { token } = useParams(); const [data, setData] = useState(null); const [error, setError] = useState("");
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`/api/public/workers/${token}`);
        setData(response.data);
      } catch (e) {
        setError(e.response?.data?.message || "Unable to load patient details.");
      }
    };
    fetchData();
  }, [token]);

  if (error) return <main className="qr-details qr-otp-page"><section className="qr-card qr-otp-card"><p className="qr-error">{error}</p></section></main>;
  if (!data) return <main className="qr-details"><h1>HealthSync</h1><p>Loading patient details...</p></main>;
  const worker = data.worker || {};
  const newestFirst = (items) => [...(items || [])].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  const provider = (item) => item.doctorName || "-";
  const hospital = (item) => {
    const name = item.hospitalName || "-"; const address = item.hospitalAddress || "";
    return address && !name.toLowerCase().includes(address.toLowerCase()) ? `${name}, ${address}` : name;
  };
  return <main className="qr-details"><header><span>HealthSync</span><h1>Patient Details</h1><p>Complete QR-linked medical history</p></header>
    <section className="qr-card"><h2>{worker.fullName}</h2><dl className="qr-profile"><div><dt>Worker ID</dt><dd>{worker.workerCode || "-"}</dd></div><div><dt>Age</dt><dd>{worker.age ?? "-"}</dd></div><div><dt>Phone</dt><dd>{worker.phone || "-"}</dd></div><div><dt>Risk Level</dt><dd>{worker.riskLevel || "Not assessed"}</dd></div></dl></section>
    <section className="qr-card"><h2>Health Record History</h2>{data.healthRecords?.length ? <div className="qr-table-wrap"><table className="qr-history-table"><thead><tr><th>Date</th><th>Doctor Name</th><th>Hospital</th><th>Problem</th><th>Diagnosis</th><th>Treatment</th></tr></thead><tbody>{newestFirst(data.healthRecords).map((r) => <tr key={r.id}><td>{r.date || "-"}</td><td>{provider(r)}</td><td>{hospital(r)}</td><td>{r.summary || "-"}</td><td>{r.diagnosis || "-"}</td><td>{r.notes || "-"}</td></tr>)}</tbody></table></div> : <p>No health records available.</p>}</section>
    <section className="qr-card"><h2>Prescription History</h2>{data.prescriptions?.length ? <div className="qr-table-wrap"><table className="qr-history-table qr-prescription-table"><thead><tr><th>Date</th><th>Doctor Name</th><th>Hospital</th><th>Medicines (Dosage & Frequency)</th><th>Duration</th><th>Instructions</th></tr></thead><tbody>{newestFirst(data.prescriptions).map((p) => <tr key={p.id}><td>{p.date || "-"}</td><td>{provider(p)}</td><td>{hospital(p)}</td><td style={{ whiteSpace: "pre-wrap" }}>{[p.medicine, p.dosage !== "-" ? p.dosage : "", p.frequency !== "-" ? p.frequency : ""].filter(Boolean).join(" - ")}</td><td>{p.duration || "-"}</td><td>{p.instructions || "-"}</td></tr>)}</tbody></table></div> : <p>No prescriptions available.</p>}</section>
  </main>;
}
export default WorkerQrDetails;

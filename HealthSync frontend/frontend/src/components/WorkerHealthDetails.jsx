import { useEffect, useState } from "react";
import { FaQrcode } from "react-icons/fa";
import QRCode from "qrcode";
import DoctorService from "../services/DoctorService";
import { notify } from "./ToastProvider";
import "./WorkerHealthDetails.css";

export default function WorkerHealthDetails({ worker, onClose, latestOnly = false }) {
  const [details, setDetails] = useState(null);
  const [qrSrc, setQrSrc]     = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!worker) return undefined;
    let current = true;

    const load = async () => {
      setLoading(true);
      try {
        const [profileResult, recordsResult, prescriptionsResult, qrResult] = await Promise.all([
          DoctorService.searchWorker(worker.id),
          DoctorService.getWorkerHealthRecords(worker.id),
          DoctorService.getWorkerPrescriptions(worker.id),
          DoctorService.generateQR(worker.id).catch(() => ({ data: null }))
        ]);

        if (!current) return;

        const profile = profileResult.data || worker;
        const records = recordsResult.data || [];
        const prescriptions = prescriptionsResult.data || [];

        // Extract diseases from records
        const uniqueDiseases = Array.from(new Set(records.map(r => r.diagnosis).filter(Boolean)));

        // Handle QR Code
        let qr = qrResult.data;
        
        setDetails({
          ...profile,
          diseases: uniqueDiseases.length > 0 ? uniqueDiseases : ["None"],
          healthHistory: records,
          prescriptions: prescriptions
        });

        if (qr instanceof Blob && qr.size > 0 && qr.type?.includes("image")) {
          setQrSrc(URL.createObjectURL(qr));
        } else if (typeof qr === "string" && qr) {
          setQrSrc(qr.startsWith("data:") || qr.startsWith("http") ? qr : `data:image/png;base64,${qr}`);
        } else {
          try {
            const qrTargetUrl = `${window.location.origin}/worker-qr/${worker.workerCode || worker.id}`;
            const dataUrl = await QRCode.toDataURL(qrTargetUrl, { width: 250, margin: 2 });
            setQrSrc(dataUrl);
          } catch {
            setQrSrc("");
          }
        }
      } catch (error) {
        if (current) notify.error("Unable to load the complete worker record.");
      } finally {
        if (current) setLoading(false);
      }
    };

    load();
    return () => { current = false; };
  }, [worker]);

  useEffect(() => {
    return () => {
      if (qrSrc && qrSrc.startsWith("blob:")) {
        URL.revokeObjectURL(qrSrc);
      }
    };
  }, [qrSrc]);

  if (!worker) return null;

  const record = details || worker;
  const history = latestOnly ? (record.healthHistory || []).slice(-1) : (record.healthHistory || []);
  const prescriptions = latestOnly ? (record.prescriptions || []).slice(-1) : (record.prescriptions || []);
  const providerFor = (item) => {
    if (item.doctorName || item.hospitalName) return item;
    return [...(record.healthHistory || []), ...(record.prescriptions || [])].find((other) =>
      other.date === item.date && (other.doctorName || other.hospitalName)
    ) || item;
  };
  const diseases = record.diseases || [];

  return (
    <div className="worker-detail-backdrop" role="presentation" onMouseDown={onClose}>
      <section 
        className="worker-health-dialog" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="worker-health-title" 
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <h2 id="worker-health-title">Worker health profile</h2>
            <p>{record.fullName} · {record.workerCode || `MW${record.id}`}</p>
          </div>
          <button aria-label="Close worker details" onClick={onClose}>×</button>
        </header>

        {loading ? (
          <div className="health-loading">Loading complete health record…</div>
        ) : (
          <div className="health-detail-content">
            <aside className="qr-panel">
              <div className="qr-image">
                {qrSrc ? (
                  <img src={qrSrc} alt={`QR code for ${record.fullName}`} />
                ) : (
                  <FaQrcode />
                )}
              </div>
              <strong>Health record QR</strong>
              <small>Scan this QR code to open the verified health record.</small>
            </aside>

            <main>
              <div className="health-summary">
                <div>
                  <span>Email</span>
                  <strong>{record.email || "—"}</strong>
                </div>
                <div>
                  <span>Age</span>
                  <strong>{record.age || "—"}</strong>
                </div>
                <div>
                  <span>Phone</span>
                  <strong>{record.phone || "—"}</strong>
                </div>
              </div>

              <section>
                <h3>Current diseases & conditions</h3>
                {diseases.length && diseases[0] !== "None" ? (
                  <div className="condition-list">
                    {diseases.map((disease) => (
                      <span key={disease}>{disease}</span>
                    ))}
                  </div>
                ) : (
                  <p>No active conditions recorded.</p>
                )}
              </section>

              <section>
                <h3>Past health history</h3>
                <div className="health-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Diagnosis</th>
                        <th>Symptoms</th>
                        <th>Treatment/Notes</th>
                        <th>Doctor & Hospital</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.length ? (
                        history.map((item, index) => (
                          <tr key={item.id || index}>
                            <td>{item.date}</td>
                            <td>{item.diagnosis}</td>
                            <td>{item.summary || "—"}</td>
                            <td>{item.notes || "—"}</td>
                            <td>{providerFor(item).doctorName || "—"}<br /><small>{providerFor(item).hospitalName || "—"}<br />{providerFor(item).hospitalAddress || ""}</small></td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5">No past health records found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h3>Prescription history</h3>
                <div className="tableContainer">
                  <table className="records-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Doctor Name</th>
                        <th>Hospital</th>
                        <th>Medicines (Dosage & Frequency)</th>
                        <th>Duration</th>
                        <th>Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prescriptions.length === 0 ? (
                        <tr><td colSpan="6" style={{ textAlign: "center" }}>No prescriptions found.</td></tr>
                      ) : (
                        prescriptions.map((item, index) => (
                          <tr key={item.id || index}>
                            <td>{item.date ? new Date(item.date).toLocaleDateString() : item.date}</td>
                            <td>{providerFor(item).doctorName || item.doctorName || "-"}</td>
                            <td>{providerFor(item).hospitalName || item.hospitalName || "-"}</td>
                            <td style={{ whiteSpace: "pre-wrap" }}>{[item.medicine, item.dosage !== "-" ? item.dosage : "", item.frequency !== "-" ? item.frequency : ""].filter(Boolean).join(" - ")}</td>
                            <td>{item.duration || "-"}</td>
                            <td>{item.instructions || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </main>
          </div>
        )}
        <footer>
          <button onClick={onClose}>Close</button>
        </footer>
      </section>
    </div>
  );
}

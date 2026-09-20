import { useEffect, useState } from "react";
import "./GenerateQR.css";
import { FaQrcode, FaDownload } from "react-icons/fa";
import DoctorService from "../../services/DoctorService";
import { downloadBlob } from "../../utils/download";
import { hasGeneratedQr, markQrGenerated } from "../../utils/qrRegistry";
import { notify } from "../../components/ToastProvider";

function GenerateQR() {
  const [worker, setWorker] = useState({ id: "", name: "" }); const [qrBlob, setQrBlob] = useState(null); const [previewUrl, setPreviewUrl] = useState(""); const [loading, setLoading] = useState(false);
  const [workersList, setWorkersList] = useState([]);
  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const { data } = await DoctorService.getWorkerDirectory();
        setWorkersList(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load workers list for auto-fill", err);
      }
    };
    fetchWorkers();
  }, []);
  useEffect(() => {
    if (worker.id.trim()) {
      const match = workersList.find((item) => item.workerCode?.trim().toLowerCase() === worker.id.trim().toLowerCase());
      if (match) {
        setWorker((prev) => ({ ...prev, name: match.fullName.trim() }));
      }
    }
  }, [worker.id, workersList]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  const findWorker = async () => { const { data } = await DoctorService.getWorkerDirectory(); const match = (Array.isArray(data) ? data : []).find((item) => item.workerCode?.trim().toLowerCase() === worker.id.trim().toLowerCase()); if (!match) throw new Error("Worker ID was not found in the database."); if (worker.name.trim() && match.fullName.trim().toLowerCase() !== worker.name.trim().toLowerCase()) throw new Error("Worker name does not match the entered Worker ID."); return match; };
  const showQr = (blob) => { const url = URL.createObjectURL(blob); setPreviewUrl((current) => { if (current) URL.revokeObjectURL(current); return url; }); setQrBlob(blob); };
  const errorMessage = async (error) => { const data = error.response?.data; if (data instanceof Blob) { try { return JSON.parse(await data.text()).message || error.message; } catch { return error.message; } } return data?.message || error.message || "Unable to generate QR code."; };
  const generate = async () => { if (!worker.id.trim() || !worker.name.trim()) { notify.warning("Enter both worker ID and worker name."); return; } setLoading(true); let match; try { match = await findWorker(); if (hasGeneratedQr(match.id)) { const response = await DoctorService.downloadQR(match.id); showQr(response.data); notify.warning("This worker already has a QR code."); return; } const response = await DoctorService.generateQR(match.id); showQr(response.data); markQrGenerated(match.id); notify.success("QR code generated successfully."); } catch (error) { if (error.response?.status === 409 && match) { try { const response = await DoctorService.downloadQR(match.id); showQr(response.data); } catch { /* The duplicate warning is still more useful than a second error. */ } notify.warning("This worker already has a QR code."); return; } notify.error(await errorMessage(error)); } finally { setLoading(false); } };
  const download = () => { if (!qrBlob) return; downloadBlob(qrBlob, `healthsync-qr-${worker.id}`, "png"); notify.success("QR code download started."); };
  return <div className="doctor-generate-qr"><div className="doctor-page-header"><h2>Generate QR Code</h2><p>Generate a QR Code for the worker's medical records.</p></div><div className="doctor-qr-card"><form className="doctor-qr-form" onSubmit={(event) => { event.preventDefault(); generate(); }}><div className="doctor-form-group"><label htmlFor="worker-id">Worker ID</label><input id="worker-id" type="text" value={worker.id} onChange={(event) => setWorker({ ...worker, id: event.target.value })} placeholder="Enter Worker ID" required /></div><div className="doctor-form-group"><label htmlFor="worker-name">Worker Name</label><input id="worker-name" type="text" value={worker.name} onChange={(event) => setWorker({ ...worker, name: event.target.value })} placeholder="Enter Worker Name" required /></div><button type="submit" className="doctor-generate-btn" disabled={loading}><FaQrcode />{loading ? "Generating…" : "Generate QR"}</button></form><div className="doctor-qr-preview"><div className="doctor-qr-box">{previewUrl ? <img src={previewUrl} alt={`QR code for ${worker.name}`} /> : <FaQrcode />}</div><p>{previewUrl ? `QR ready for ${worker.name}` : "QR Preview"}</p><button className="doctor-download-btn" disabled={!previewUrl || loading} onClick={download}><FaDownload />{loading ? "Preparing…" : "Download QR"}</button></div></div></div>;
}
export default GenerateQR;

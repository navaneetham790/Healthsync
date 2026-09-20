import { useEffect, useState } from "react";
import "./GenerateQR.css";
import { FaQrcode, FaDownload } from "react-icons/fa";
import QRCode from "qrcode";
import DoctorService from "../../services/DoctorService";
import { downloadBlob } from "../../utils/download";
import { hasGeneratedQr, markQrGenerated } from "../../utils/qrRegistry";
import { notify } from "../../components/ToastProvider";

function GenerateQR() {
  const [worker, setWorker] = useState({ id: "", name: "" });
  const [qrBlob, setQrBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
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
      const match = workersList.find(
        (item) => item.workerCode?.trim().toLowerCase() === worker.id.trim().toLowerCase()
      );
      if (match) {
        setWorker((prev) => ({ ...prev, name: match.fullName.trim() }));
      }
    }
  }, [worker.id, workersList]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const findWorker = async () => {
    const { data } = await DoctorService.getWorkerDirectory();
    const list = Array.isArray(data) ? data : [];
    const match = list.find(
      (item) => item.workerCode?.trim().toLowerCase() === worker.id.trim().toLowerCase()
    );
    if (!match) throw new Error("Worker ID was not found in the database.");
    if (worker.name.trim() && match.fullName.trim().toLowerCase() !== worker.name.trim().toLowerCase()) {
      throw new Error("Worker name does not match the entered Worker ID.");
    }
    return match;
  };

  const showQr = (blob) => {
    const url = URL.createObjectURL(blob);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return url;
    });
    setQrBlob(blob);
  };

  const createLocalQrBlob = async (workerIdentifier) => {
    const qrTargetUrl = `${window.location.origin}/worker-qr/${workerIdentifier}`;
    const dataUrl = await QRCode.toDataURL(qrTargetUrl, {
      width: 320,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" }
    });
    const res = await fetch(dataUrl);
    return await res.blob();
  };

  const generate = async () => {
    if (!worker.id.trim() || !worker.name.trim()) {
      notify.warning("Enter both worker ID and worker name.");
      return;
    }
    setLoading(true);
    let match;
    try {
      match = await findWorker();
      const alreadyHas = hasGeneratedQr(match.id);
      let blob = null;

      // 1. Try to fetch existing or generate from backend
      try {
        if (alreadyHas) {
          const response = await DoctorService.downloadQR(match.id);
          if (response.data instanceof Blob && response.data.size > 0 && response.data.type?.includes("image")) {
            blob = response.data;
          }
        } else {
          const response = await DoctorService.generateQR(match.id);
          if (response.data instanceof Blob && response.data.size > 0 && response.data.type?.includes("image")) {
            blob = response.data;
          }
        }
      } catch (backendErr) {
        console.warn("Backend QR service unreachable (using client-side generator):", backendErr);
      }

      // 2. If backend is sleeping/unreachable or returned 502/empty, generate high-quality QR client-side
      if (!blob) {
        blob = await createLocalQrBlob(match.workerCode || match.id);
      }

      showQr(blob);
      markQrGenerated(match.id);

      if (alreadyHas) {
        notify.info("Worker QR code ready.");
      } else {
        notify.success("QR code generated successfully.");
      }
    } catch (error) {
      notify.error(error.message || "Unable to generate QR code.");
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!qrBlob) return;
    downloadBlob(qrBlob, `healthsync-qr-${worker.id}`, "png");
    notify.success("QR code download started.");
  };

  return (
    <div className="doctor-generate-qr">
      <div className="doctor-page-header">
        <h2>Generate QR Code</h2>
        <p>Generate a QR Code for the worker's medical records.</p>
      </div>

      <div className="doctor-qr-card">
        <form
          className="doctor-qr-form"
          onSubmit={(event) => {
            event.preventDefault();
            generate();
          }}
        >
          <div className="doctor-form-group">
            <label htmlFor="worker-id">Worker ID</label>
            <input
              id="worker-id"
              type="text"
              value={worker.id}
              onChange={(event) => setWorker({ ...worker, id: event.target.value })}
              placeholder="Enter Worker ID"
              required
            />
          </div>

          <div className="doctor-form-group">
            <label htmlFor="worker-name">Worker Name</label>
            <input
              id="worker-name"
              type="text"
              value={worker.name}
              onChange={(event) => setWorker({ ...worker, name: event.target.value })}
              placeholder="Enter Worker Name"
              required
            />
          </div>

          <button type="submit" className="doctor-generate-btn" disabled={loading}>
            <FaQrcode />
            {loading ? "Generating…" : "Generate QR"}
          </button>
        </form>

        <div className="doctor-qr-preview">
          <div className="doctor-qr-box">
            {previewUrl ? (
              <img src={previewUrl} alt={`QR code for ${worker.name}`} />
            ) : (
              <FaQrcode />
            )}
          </div>
          <p>{previewUrl ? `QR ready for ${worker.name}` : "QR Preview"}</p>
          <button
            className="doctor-download-btn"
            disabled={!previewUrl || loading}
            onClick={download}
          >
            <FaDownload />
            {loading ? "Preparing…" : "Download QR"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GenerateQR;

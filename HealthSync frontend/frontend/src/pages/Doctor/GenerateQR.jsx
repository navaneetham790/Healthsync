import { useEffect, useState } from "react";
import "./GenerateQR.css";
import { FaQrcode, FaDownload, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
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
  const [qrStatus, setQrStatus] = useState(null); // null | "exists" | "new"

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

  const showQr = (blob) => {
    const url = URL.createObjectURL(blob);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return url;
    });
    setQrBlob(blob);
  };

  // When worker ID changes: auto-fill name if known, but DO NOT show QR or "already exists" until clicking Generate
  const handleIdChange = (newId) => {
    setWorker((prev) => {
      const match = workersList.find(
        (item) =>
          item.workerCode?.trim().toLowerCase() === newId.trim().toLowerCase() ||
          String(item.id).trim() === newId.trim()
      );
      return {
        id: newId,
        name: match ? match.fullName.trim() : prev.name
      };
    });
    // Clear preview and status so nothing shows before clicking Generate
    setPreviewUrl("");
    setQrBlob(null);
    setQrStatus(null);
  };

  const handleNameChange = (newName) => {
    setWorker((prev) => ({ ...prev, name: newName }));
    setPreviewUrl("");
    setQrBlob(null);
    setQrStatus(null);
  };

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const findWorker = async () => {
    let list = workersList;
    if (!list || list.length === 0) {
      try {
        const { data } = await DoctorService.getWorkerDirectory();
        list = Array.isArray(data) ? data : [];
        setWorkersList(list);
      } catch (_) {}
    }
    const match = list.find(
      (item) =>
        item.workerCode?.trim().toLowerCase() === worker.id.trim().toLowerCase() ||
        String(item.id).trim() === worker.id.trim()
    );
    if (!match) throw new Error("Worker ID was not found in the database.");
    if (
      worker.name.trim() &&
      match.fullName.trim().toLowerCase() !== worker.name.trim().toLowerCase()
    ) {
      throw new Error("Worker name does not match the entered Worker ID.");
    }
    return match;
  };

  // Only trigger on clicking "Generate QR"
  const generate = async () => {
    if (!worker.id.trim() || !worker.name.trim()) {
      notify.warning("Enter both worker ID and worker name.");
      return;
    }
    setLoading(true);
    try {
      const match = await findWorker();
      const code = match.workerCode || `MW${match.id}`;
      const blob = await createLocalQrBlob(code);
      showQr(blob);

      const alreadyExists = hasGeneratedQr(match.id, code);

      if (alreadyExists) {
        setQrStatus("exists");
        notify.warning(`QR code already exists for ${match.fullName || worker.name} (${code}). Existing QR displayed.`);
      } else {
        markQrGenerated(match.id, code);
        setQrStatus("new");
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
              onChange={(e) => handleIdChange(e.target.value)}
              placeholder="Enter Worker ID (e.g. MW001)"
              required
            />
          </div>

          <div className="doctor-form-group">
            <label htmlFor="worker-name">Worker Name</label>
            <input
              id="worker-name"
              type="text"
              value={worker.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter Worker Name"
              required
            />
          </div>

          {qrStatus === "exists" && (
            <div className="doctor-qr-exists-alert">
              <FaExclamationTriangle className="exists-icon" />
              <div>
                <strong>QR Code Already Exists</strong>
                <p>This worker already has a registered QR code in the system. The existing QR code is displayed on the right.</p>
              </div>
            </div>
          )}

          {qrStatus === "new" && (
            <div className="doctor-qr-success-alert">
              <FaCheckCircle className="success-icon" />
              <div>
                <strong>QR Code Generated Successfully</strong>
                <p>A new QR code has been generated and registered for this worker.</p>
              </div>
            </div>
          )}

          <div className="qr-actions-row">
            <button
              type="submit"
              className="doctor-generate-btn"
              disabled={loading}
            >
              <FaQrcode />
              {loading ? "Checking & Generating…" : "Generate QR"}
            </button>
          </div>
        </form>

        <div className="doctor-qr-preview">
          <div className="doctor-qr-box">
            {previewUrl ? (
              <img src={previewUrl} alt={`QR code for ${worker.name}`} />
            ) : (
              <FaQrcode />
            )}
          </div>
          {previewUrl ? (
            <div className={`qr-preview-tag ${qrStatus === "exists" ? "tag-exists" : "tag-ready"}`}>
              {qrStatus === "exists"
                ? `⚠️ Existing QR Code for ${worker.name}`
                : `✅ QR Code generated for ${worker.name}`}
            </div>
          ) : (
            <p className="qr-preview-placeholder">QR Preview</p>
          )}
          <button
            type="button"
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

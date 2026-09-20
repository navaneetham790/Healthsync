import React, { useState, useEffect } from "react";
import "./QRCode.css";
import QRCodeLib from "qrcode";
import WorkerService from "../../services/WorkerService";
import { notify } from "../../components/ToastProvider";
import { downloadBlob } from "../../utils/download";
import { FaQrcode, FaDownload, FaCheckCircle } from "react-icons/fa";
import { useLanguage } from "../../i18n/LanguageContext";

function QRCode() {
  const { t } = useLanguage();
  const [worker, setWorker] = useState(null);
  const [qrSrc, setQrSrc] = useState("");
  const [qrBlob, setQrBlob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const workerId = storedUser.id || 15;
        let profile = { ...storedUser };

        // 1. Fetch profile to get real name and workerCode safely
        try {
          const profileRes = await WorkerService.getProfile(workerId);
          if (profileRes && profileRes.data) {
            profile = { ...profile, ...profileRes.data };
          }
        } catch (e) {
          console.warn("Backend worker profile unavailable, using session user:", e);
        }

        const workerCode = profile.workerCode || storedUser.workerCode || (profile.id ? `MW${String(profile.id).padStart(3, "0")}` : "MW001");
        const fullName = profile.fullName || storedUser.fullName || "Bavana";
        const workerData = { ...profile, workerCode, fullName };

        if (!isMounted) return;
        setWorker(workerData);

        // 2. Generate unique scannable QR Code targeting the patient's records URL
        const qrTargetUrl = `${window.location.origin}/worker-qr/${workerCode}`;
        const dataUrl = await QRCodeLib.toDataURL(qrTargetUrl, {
          width: 360,
          margin: 2,
          color: { dark: "#0f172a", light: "#ffffff" }
        });

        if (!isMounted) return;
        setQrSrc(dataUrl);

        // 3. Create blob for instant file download
        try {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          if (isMounted) {
            setQrBlob(blob);
          }
        } catch (blobErr) {
          console.warn("Could not generate blob from dataUrl, will use fallback download:", blobErr);
        }
      } catch (error) {
        console.error("Error generating worker QR code:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const download = () => {
    const code = worker?.workerCode || "MW001";
    setDownloading(true);
    try {
      if (qrBlob) {
        downloadBlob(qrBlob, `healthsync-qr-${code}`, "png");
        notify.success("QR code downloaded successfully.");
      } else if (qrSrc) {
        const link = document.createElement("a");
        link.href = qrSrc;
        link.download = `healthsync-qr-${code}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        notify.success("QR code downloaded successfully.");
      } else {
        notify.error("QR Code is not ready yet.");
      }
    } catch (err) {
      console.error("Download failed:", err);
      notify.error("Failed to download QR code.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="qr-page">
        <div className="page-header">
          <h2>{t("My Health QR Code")}</h2>
          <p>{t("Scan this QR code to securely access your health records.")}</p>
        </div>
        <div className="qr-card">
          <div className="qr-box">
            <FaQrcode className="qr-icon qr-pulse" />
          </div>
          <p style={{ marginTop: "16px", color: "#64748b" }}>Generating unique health QR code...</p>
        </div>
      </div>
    );
  }

  const workerCode = worker?.workerCode || "MW001";
  const fullName = worker?.fullName || "Bavana";

  return (
    <div className="qr-page">
      <div className="page-header">
        <h2>{t("My Health QR Code")}</h2>
        <p>{t("Scan this QR code to securely access your health records.")}</p>
      </div>

      <div className="qr-card">
        <div className="qr-badge">
          <FaCheckCircle /> Verified Digital Health Card
        </div>

        <div className="qr-box">
          {qrSrc ? (
            <img
              src={qrSrc}
              alt={`QR Code for ${fullName}`}
              className="qr-image"
            />
          ) : (
            <FaQrcode className="qr-icon" />
          )}
        </div>

        <div className="qr-meta">
          <h3>Worker ID : {workerCode}</h3>
          <p className="qr-worker-name">{fullName}</p>
          <p className="qr-hint">
            Scan this unique QR code with any smartphone camera or QR scanner to securely view complete medical history &amp; prescriptions.
          </p>
        </div>

        <button
          type="button"
          className="download-btn"
          disabled={downloading || (!qrBlob && !qrSrc)}
          onClick={download}
        >
          <FaDownload />
          {downloading ? t("Preparing…") : t("Download QR Code")}
        </button>
      </div>
    </div>
  );
}

export default QRCode;

import React, { useState, useEffect } from "react";
import "./QRCode.css";
import QRCodeLib from "qrcode";
import WorkerService from "../../services/WorkerService";
import { notify } from "../../components/ToastProvider";
import { downloadBlob } from "../../utils/download";
import { FaQrcode, FaDownload } from "react-icons/fa";
import { useLanguage } from "../../i18n/LanguageContext";

function QRCode() {
  const { t } = useLanguage();
  const [worker, setWorker] = useState(null);
  const [qrSrc, setQrSrc] = useState("");
  const [qrBlob, setQrBlob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const workerId = user.id || 1;
        
        // 1. Fetch profile to get real name and workerCode
        const profileRes = await WorkerService.getProfile(workerId);
        const profile = profileRes.data;
        const code = profile.workerCode || `MW${String(profile.id || workerId).padStart(3, "0")}`;
        setWorker({ ...profile, workerCode: code });

        // 2. Fetch/Download QR Blob
        let blob = null;
        try {
          const qrRes = await WorkerService.downloadQR(workerId);
          if (qrRes.data instanceof Blob && qrRes.data.size > 0 && qrRes.data.type?.includes("image")) {
            blob = qrRes.data;
          }
        } catch (e) {
          console.warn("Backend QR download unavailable, using client-side generation:", e);
        }

        if (!blob) {
          const qrTargetUrl = `${window.location.origin}/worker-qr/${code}`;
          const dataUrl = await QRCodeLib.toDataURL(qrTargetUrl, {
            width: 320,
            margin: 2,
            color: { dark: "#0f172a", light: "#ffffff" }
          });
          const res = await fetch(dataUrl);
          blob = await res.blob();
        }

        if (blob) {
          setQrBlob(blob);
          setQrSrc(URL.createObjectURL(blob));
        }
      } catch (error) {
        console.error("Error loading worker QR code data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    return () => {
      if (qrSrc && qrSrc.startsWith("blob:")) {
        URL.revokeObjectURL(qrSrc);
      }
    };
  }, [qrSrc]);

  const download = () => {
    if (!qrBlob || !worker) return;
    downloadBlob(qrBlob, `healthsync-qr-${worker.workerCode}`, "png");
    notify.success("QR code download started.");
  };

  if (loading) {
    return <div className="qr-page"><div className="page-header"><h2>{t("Loading…")}</h2></div></div>;
  }

  const workerCode = worker?.workerCode || "MW001";
  const fullName = worker?.fullName || "Worker";

  return (
    <div className="qr-page">
      <div className="page-header">
        <h2>{t("My Health QR Code")}</h2>
        <p>{t("Scan this QR code to securely access your health records.")}</p>
      </div>

      <div className="qr-card">
        <div className="qr-box">
          {qrSrc ? (
            <img src={qrSrc} alt={`QR Code for ${fullName}`} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          ) : (
            <FaQrcode className="qr-icon" />
          )}
        </div>

        <h3>Worker ID : {workerCode}</h3>
        <p>{fullName}</p>

        <button className="download-btn" disabled={downloading || !qrBlob} onClick={download}>
          <FaDownload />
          {downloading ? t("Preparing…") : t("Download QR Code")}
        </button>
      </div>
    </div>
  );
}

export default QRCode;

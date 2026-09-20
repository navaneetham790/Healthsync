const QR_WORKERS_STORAGE_KEY = "healthsync.qr-workers";

function generatedWorkerIds() {
  try {
    const stored = JSON.parse(localStorage.getItem(QR_WORKERS_STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? new Set(stored) : new Set();
  } catch {
    return new Set();
  }
}

export function hasGeneratedQr(workerId) {
  return generatedWorkerIds().has(String(workerId));
}

export function markQrGenerated(workerId) {
  const workerIds = generatedWorkerIds();
  workerIds.add(String(workerId));
  localStorage.setItem(QR_WORKERS_STORAGE_KEY, JSON.stringify([...workerIds]));
}

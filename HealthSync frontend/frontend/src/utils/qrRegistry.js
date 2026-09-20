const QR_WORKERS_STORAGE_KEY = "healthsync.qr-workers";

// Pre-seeded or previously generated workers who have existing QR codes
const DEFAULT_EXISTING_QR_WORKERS = ["1", "15", "mw001", "mw002"];

function generatedWorkerIds() {
  try {
    const stored = JSON.parse(localStorage.getItem(QR_WORKERS_STORAGE_KEY) || "[]");
    return new Set([
      ...DEFAULT_EXISTING_QR_WORKERS,
      ...(Array.isArray(stored) ? stored : [])
    ].map((s) => String(s).trim().toLowerCase()));
  } catch {
    return new Set(DEFAULT_EXISTING_QR_WORKERS);
  }
}

export function hasGeneratedQr(workerId, workerCode) {
  const set = generatedWorkerIds();
  if (workerId && set.has(String(workerId).trim().toLowerCase())) return true;
  if (workerCode && set.has(String(workerCode).trim().toLowerCase())) return true;
  return false;
}

export function markQrGenerated(workerId, workerCode) {
  const current = JSON.parse(localStorage.getItem(QR_WORKERS_STORAGE_KEY) || "[]");
  const set = new Set([
    ...DEFAULT_EXISTING_QR_WORKERS,
    ...(Array.isArray(current) ? current : [])
  ].map((s) => String(s).trim().toLowerCase()));

  if (workerId) set.add(String(workerId).trim().toLowerCase());
  if (workerCode) set.add(String(workerCode).trim().toLowerCase());

  localStorage.setItem(QR_WORKERS_STORAGE_KEY, JSON.stringify([...set]));
}

const timestamp = () => new Date().toISOString().replace(/[:.]/g, "-");

const safeName = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "download";

export function downloadBlob(blob, name, extension = "bin") {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = `${safeName(name)}-${timestamp()}.${extension}`;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export function filenameFromResponse(response, fallback, extension) {
  const disposition = response.headers?.["content-disposition"] || "";
  const match = disposition.match(/filename[^=]*=(?:UTF-8''|\")?([^;\"]+)/i);
  return match ? decodeURIComponent(match[1].replace(/\"/g, "")) : `${safeName(fallback)}-${timestamp()}.${extension}`;
}

export function saveApiFile(response, fallback, extension) {
  const url = URL.createObjectURL(new Blob([response.data], { type: response.headers?.["content-type"] }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = filenameFromResponse(response, fallback, extension);
  document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export function createDemoQr(workerId, workerName) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" fill="white"/><rect x="35" y="35" width="530" height="530" rx="24" fill="#00897b"/><text x="300" y="260" text-anchor="middle" fill="white" font-family="Arial" font-size="42">HealthSync QR</text><text x="300" y="325" text-anchor="middle" fill="white" font-family="Arial" font-size="28">${workerName}</text><text x="300" y="370" text-anchor="middle" fill="white" font-family="Arial" font-size="24">${workerId}</text></svg>`;
  return new Blob([svg], { type: "image/svg+xml" });
}

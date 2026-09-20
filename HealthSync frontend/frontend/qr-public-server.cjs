const http = require("http");

const escape = (value) => String(value ?? "—").replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
const records = (items, render, empty) => items?.length ? items.map(render).join("") : `<p>${empty}</p>`;

http.createServer((request, response) => {
  const match = new URL(request.url, "http://localhost").pathname.match(/^\/worker-qr\/([a-f0-9-]{36})$/i);
  if (!match || request.method !== "GET") { response.writeHead(404, { "Content-Type": "text/plain" }); return response.end("Not found"); }
  http.get(`http://localhost:8081/api/public/workers/${match[1]}`, (api) => {
    let body = ""; api.on("data", (chunk) => body += chunk); api.on("end", () => {
      if (api.statusCode !== 200) { response.writeHead(404, { "Content-Type": "text/html" }); return response.end("<h1>HealthSync</h1><p>Worker details could not be found.</p>"); }
      const data = JSON.parse(body), worker = data.worker || {};
      const healthRecords = records(data.healthRecords, (record) => `<article><b>${escape(record.diagnosis)}</b><small>${escape(record.recordedOn)}</small><p>${escape(record.summary || record.notes || "No additional notes.")}</p></article>`, "No health records available.");
      const prescriptions = records(data.prescriptions, (prescription) => `<article><b>${escape(prescription.medicine)}</b><small>${escape(prescription.prescribedOn)}</small><p>${escape(prescription.dosage)} · ${escape(prescription.frequency)}</p><p>${escape(prescription.instructions)}</p></article>`, "No prescriptions available.");
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      response.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>HealthSync Patient Details</title><style>body{margin:0;background:#f1f8f8;color:#17323a;font-family:Arial,sans-serif}.page{max-width:850px;margin:auto;padding:24px}header{text-align:center;margin:16px 0 28px}header b,h2{color:#008f83}.card{background:#fff;border-radius:16px;padding:20px;margin:16px 0;box-shadow:0 4px 18px #17323a14}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}.item{background:#f7fbfb;padding:12px;border-radius:8px}.item small,article small{display:block;color:#64748b;margin-top:4px}article{border-left:4px solid #159589;background:#f7fbfb;padding:12px;margin:10px 0}p{line-height:1.45}</style></head><body><main class="page"><header><b>HealthSync</b><h1>Patient Details</h1><p>QR-linked medical profile</p></header><section class="card"><h2>${escape(worker.fullName)}</h2><div class="grid"><div class="item">Worker ID<small>${escape(worker.workerCode)}</small></div><div class="item">Age<small>${escape(worker.age)}</small></div><div class="item">Phone<small>${escape(worker.phone)}</small></div><div class="item">Risk level<small>${escape(worker.riskLevel)}</small></div><div class="item">Known conditions<small>${escape(worker.diseases)}</small></div><div class="item">Health history<small>${escape(worker.healthHistory)}</small></div></div></section><section class="card"><h2>Health Records</h2>${healthRecords}</section><section class="card"><h2>Prescriptions</h2>${prescriptions}</section></main></body></html>`);
    });
  }).on("error", () => { response.writeHead(502, { "Content-Type": "text/plain" }); response.end("HealthSync backend is unavailable."); });
}).listen(8090, "127.0.0.1", () => console.log("QR details server listening on http://127.0.0.1:8090"));

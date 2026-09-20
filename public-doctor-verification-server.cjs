// Public edge for doctor verification only.  It intentionally does not proxy
// admin, worker, doctor, or authentication APIs.
const http = require("http");
const fs = require("fs");
const path = require("path");

const port = Number(process.env.PUBLIC_VERIFICATION_PORT || 5180);
const dist = path.join(__dirname, "HealthSync frontend", "frontend", "dist");
const allowedApi = new Set([
  "GET /api/doctor-applications/form",
  "POST /api/doctor-applications/submit",
]);
const contentTypes = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8", ".png":"image/png", ".jpg":"image/jpeg", ".jpeg":"image/jpeg", ".svg":"image/svg+xml", ".ico":"image/x-icon" };

http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const apiKey = `${request.method} ${requestUrl.pathname}`;
  if (requestUrl.pathname.startsWith("/api/")) {
    if (!allowedApi.has(apiKey)) { response.writeHead(404).end("Not found"); return; }
    const upstream = http.request({ hostname:"127.0.0.1", port:8082, path:requestUrl.pathname + requestUrl.search, method:request.method, headers:{ ...request.headers, host:"localhost:8082" } }, (upstreamResponse) => {
      response.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers); upstreamResponse.pipe(response);
    });
    upstream.on("error", () => response.writeHead(502).end("Verification service is unavailable")); request.pipe(upstream); return;
  }
  const requested = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const safePath = path.normalize(path.join(dist, requested));
  const serve = safePath.startsWith(dist) && fs.existsSync(safePath) && fs.statSync(safePath).isFile() ? safePath : path.join(dist, "index.html");
  fs.readFile(serve, (error, data) => { if (error) { response.writeHead(500).end("Unable to load verification form"); return; } response.writeHead(200, { "Content-Type":contentTypes[path.extname(serve).toLowerCase()] || "application/octet-stream", "Cache-Control":serve.endsWith("index.html") ? "no-store" : "public, max-age=3600" }); response.end(data); });
// This edge only exposes the verification form and its two required APIs.
// Binding to the LAN interface lets the invited doctor open it from another
// laptop on the same private network.
}).listen(port, "0.0.0.0", () => console.log(`Public doctor verification server listening on ${port}`));

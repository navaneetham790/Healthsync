const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8081;

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:8082';
const HEALTH_SERVICE_URL = process.env.HEALTH_SERVICE_URL || 'http://localhost:8083';
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8084';

app.use(cors());

// Log requests
app.use((req, res, next) => {
  console.log(`[Gateway] ${req.method} ${req.path}`);
  next();
});

// Routing Rules
// 1. Auth and Admin always go to User Service
app.use('/api/auth', createProxyMiddleware({ target: USER_SERVICE_URL, changeOrigin: true }));
app.use('/api/admin', createProxyMiddleware({ target: USER_SERVICE_URL, changeOrigin: true }));
app.use('/api/doctor-applications', createProxyMiddleware({ target: USER_SERVICE_URL, changeOrigin: true }));

// 2. Doctor specific routes routing:
// Profile, Workers, Settings, Health Records, and Prescriptions go to User Service
app.use('/api/doctor/profile', createProxyMiddleware({ target: USER_SERVICE_URL, changeOrigin: true }));
app.use('/api/doctor/settings', createProxyMiddleware({ target: USER_SERVICE_URL, changeOrigin: true }));
app.use('/api/doctor/health-records', createProxyMiddleware({ target: USER_SERVICE_URL, changeOrigin: true }));
app.use('/api/doctor/prescriptions', createProxyMiddleware({ target: USER_SERVICE_URL, changeOrigin: true }));
app.use('/api/doctor/workers', (req, res, next) => {
  // If the path is workers/:workerId/qr, it should go to Health Service
  if (req.path.includes('/qr')) {
    return createProxyMiddleware({ target: HEALTH_SERVICE_URL, changeOrigin: true })(req, res, next);
  }
  return createProxyMiddleware({ target: USER_SERVICE_URL, changeOrigin: true })(req, res, next);
});
// Other Doctor routes (appointments, risk-prediction) go to Health Service
app.use('/api/doctor', createProxyMiddleware({ target: HEALTH_SERVICE_URL, changeOrigin: true }));

// 3. Worker specific routes routing:
// Profiles, Settings, Health Records, and Prescriptions go to User Service
app.use('/api/worker/profile', createProxyMiddleware({ target: USER_SERVICE_URL, changeOrigin: true }));
app.use('/api/worker/settings', createProxyMiddleware({ target: USER_SERVICE_URL, changeOrigin: true }));
app.use('/api/worker/healthrecords', createProxyMiddleware({ target: USER_SERVICE_URL, changeOrigin: true }));
app.use('/api/worker/prescriptions', createProxyMiddleware({ target: USER_SERVICE_URL, changeOrigin: true }));
// Other Worker routes (appointments, riskprediction, qr) go to Health Service
app.use('/api/worker', createProxyMiddleware({ target: HEALTH_SERVICE_URL, changeOrigin: true }));

// 4. Public API routes (e.g., QR profile view)
app.use('/api/public/workers', createProxyMiddleware({ target: USER_SERVICE_URL, changeOrigin: true }));
app.use('/api/internal', createProxyMiddleware({ target: USER_SERVICE_URL, changeOrigin: true }));
app.use('/api/public', createProxyMiddleware({ target: HEALTH_SERVICE_URL, changeOrigin: true }));

// 5. ML Service routes (AI Risk Prediction)
app.use('/api/ml', createProxyMiddleware({
  target: ML_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/ml': '' }
}));

// Default health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', gateway: true });
});

app.listen(PORT, () => {
  console.log(`[Gateway] API Gateway running on port ${PORT}`);
  console.log(`[Gateway] Routing /api/auth, /api/admin, /api/doctor/profile, /api/doctor/workers (except /qr), /api/worker/profile -> ${USER_SERVICE_URL}`);
  console.log(`[Gateway] Routing /api/doctor (clinical), /api/worker (clinical) -> ${HEALTH_SERVICE_URL}`);
  console.log(`[Gateway] Routing /api/ml -> ${ML_SERVICE_URL}`);
});

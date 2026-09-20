import axios from "axios";
const BASE_URL = "/api/doctor";
const DoctorService = {
  getProfile: () => axios.get(`${BASE_URL}/profile`),
  updateProfile: (data) => axios.put(`${BASE_URL}/profile`, data),
  getSettings: () => axios.get(`${BASE_URL}/settings`),
  updateSettings: (data) => axios.put(`${BASE_URL}/settings`, data),
  getWorkers: (search = "") => axios.get(`${BASE_URL}/workers`, { params: search ? { search } : {}, timeout: 4000 }),
  getWorkerDirectory: (search = "") => axios.get(`${BASE_URL}/workers/directory`, { params: search ? { search } : {}, timeout: 4000 }),
  addWorker: (data) => axios.post(`${BASE_URL}/workers`, data, { timeout: 8000 }),
  searchWorker: (id) => axios.get(`${BASE_URL}/workers/${id}`, { timeout: 4000 }),
  deleteWorker: (id) => axios.delete(`${BASE_URL}/workers/${id}`, { timeout: 5000 }),
  getHealthRecords: () => axios.get(`${BASE_URL}/health-records`, { timeout: 4000 }),
  addHealthRecord: (data) => axios.post(`${BASE_URL}/health-records`, data, { timeout: 6000 }),
  createPrescription: (data) => axios.post(`${BASE_URL}/prescriptions`, data, { timeout: 6000 }),
  getAppointments: () => axios.get(`${BASE_URL}/appointments`, { timeout: 3500 }),
  updateAppointmentStatus: (id, status, details = {}) => axios.patch(`${BASE_URL}/appointments/${id}`, { status, ...details }, { timeout: 5000 }),
  generateQR: (workerId) => axios.post(`${BASE_URL}/workers/${workerId}/qr`, null, { responseType: "blob", timeout: 4000 }),
  downloadQR: (workerId) => axios.get(`${BASE_URL}/workers/${workerId}/qr`, { responseType: "blob", timeout: 4000 }),
  predictRisk: (data) => axios.post(`${BASE_URL}/risk-prediction`, data, { timeout: 5000 }),
  checkDrugInteraction: (medicines) => axios.post(`/api/ml/drug-interaction`, { medicines }, { timeout: 5000 }),
  getWorkerHealthRecords: (workerId) => axios.get(`/api/worker/healthrecords/${workerId}`, { timeout: 4000 }),
  getWorkerPrescriptions: (workerId) => axios.get(`/api/worker/prescriptions/${workerId}`, { timeout: 4000 }),
  updateWorkerRiskByCode: (workerCode, riskLevel) => axios.put(`/api/doctor/workers/code/${workerCode}/risk`, { riskLevel }, { timeout: 5000 }),
};
export default DoctorService;

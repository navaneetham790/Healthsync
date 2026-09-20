import axios from "axios";
const BASE_URL = "/api/doctor";
const DoctorService = {
  getProfile: () => axios.get(`${BASE_URL}/profile`),
  updateProfile: (data) => axios.put(`${BASE_URL}/profile`, data),
  getSettings: () => axios.get(`${BASE_URL}/settings`),
  updateSettings: (data) => axios.put(`${BASE_URL}/settings`, data),
  getWorkers: (search = "") => axios.get(`${BASE_URL}/workers`, { params: search ? { search } : {} }),
  getWorkerDirectory: (search = "") => axios.get(`${BASE_URL}/workers/directory`, { params: search ? { search } : {} }),
  addWorker: (data) => axios.post(`${BASE_URL}/workers`, data),
  searchWorker: (id) => axios.get(`${BASE_URL}/workers/${id}`),
  deleteWorker: (id) => axios.delete(`${BASE_URL}/workers/${id}`),
  getHealthRecords: () => axios.get(`${BASE_URL}/health-records`),
  addHealthRecord: (data) => axios.post(`${BASE_URL}/health-records`, data),
  createPrescription: (data) => axios.post(`${BASE_URL}/prescriptions`, data),
  getAppointments: () => axios.get(`${BASE_URL}/appointments`),
  updateAppointmentStatus: (id, status, details = {}) => axios.patch(`${BASE_URL}/appointments/${id}`, { status, ...details }),
  generateQR: (workerId) => axios.post(`${BASE_URL}/workers/${workerId}/qr`, null, { responseType: "blob" }),
  downloadQR: (workerId) => axios.get(`${BASE_URL}/workers/${workerId}/qr`, { responseType: "blob" }),
  predictRisk: (data) => axios.post(`${BASE_URL}/risk-prediction`, data),
  checkDrugInteraction: (medicines) => axios.post(`/api/ml/drug-interaction`, { medicines }),
  getWorkerHealthRecords: (workerId) => axios.get(`/api/worker/healthrecords/${workerId}`),
  getWorkerPrescriptions: (workerId) => axios.get(`/api/worker/prescriptions/${workerId}`),
  updateWorkerRiskByCode: (workerCode, riskLevel) => axios.put(`/api/doctor/workers/code/${workerCode}/risk`, { riskLevel }),
};
export default DoctorService;

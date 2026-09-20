import axios from "axios";
import {
  saveLocalHealthRecord,
  getLocalHealthRecords,
  getAllLocalHealthRecords,
  saveLocalPrescription,
  getLocalPrescriptions,
  getAllLocalPrescriptions
} from "../utils/clinicalStorage";

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

  getHealthRecords: async () => {
    let backendRecords = [];
    try {
      const res = await axios.get(`${BASE_URL}/health-records`, { timeout: 2500 });
      if (Array.isArray(res.data)) backendRecords = res.data;
    } catch (_) {}
    const local = getAllLocalHealthRecords();
    const merged = [...local, ...backendRecords.filter((b) => !local.some((l) => l.id === b.id))];
    return { data: merged };
  },

  addHealthRecord: async (data) => {
    // Save locally first to guarantee zero data loss
    const localDoc = saveLocalHealthRecord(data);
    try {
      const res = await axios.post(`${BASE_URL}/health-records`, data, { timeout: 2500 });
      return res;
    } catch (err) {
      console.warn("Backend health record endpoint unavailable, saved locally:", err);
      return { data: localDoc };
    }
  },

  createPrescription: async (data) => {
    const localDoc = saveLocalPrescription(data);
    try {
      const res = await axios.post(`${BASE_URL}/prescriptions`, data, { timeout: 2500 });
      return res;
    } catch (err) {
      console.warn("Backend prescription endpoint unavailable, saved locally:", err);
      return { data: localDoc };
    }
  },

  getAppointments: () => axios.get(`${BASE_URL}/appointments`, { timeout: 3500 }),
  updateAppointmentStatus: (id, status, details = {}) => axios.patch(`${BASE_URL}/appointments/${id}`, { status, ...details }, { timeout: 5000 }),
  generateQR: (workerId) => axios.post(`${BASE_URL}/workers/${workerId}/qr`, null, { responseType: "blob", timeout: 4000 }),
  downloadQR: (workerId) => axios.get(`${BASE_URL}/workers/${workerId}/qr`, { responseType: "blob", timeout: 4000 }),
  predictRisk: (data) => axios.post(`${BASE_URL}/risk-prediction`, data, { timeout: 5000 }),
  checkDrugInteraction: (medicines) => axios.post(`/api/ml/drug-interaction`, { medicines }, { timeout: 5000 }),

  getWorkerHealthRecords: async (workerId) => {
    let backendRecords = [];
    try {
      const res = await axios.get(`/api/worker/healthrecords/${workerId}`, { timeout: 2500 });
      if (Array.isArray(res.data)) backendRecords = res.data;
    } catch (_) {}
    const local = getLocalHealthRecords(workerId);
    const merged = [...local, ...backendRecords.filter((b) => !local.some((l) => l.id === b.id))];
    return { data: merged };
  },

  getWorkerPrescriptions: async (workerId) => {
    let backendPrescriptions = [];
    try {
      const res = await axios.get(`/api/worker/prescriptions/${workerId}`, { timeout: 2500 });
      if (Array.isArray(res.data)) backendPrescriptions = res.data;
    } catch (_) {}
    const local = getLocalPrescriptions(workerId);
    const merged = [...local, ...backendPrescriptions.filter((b) => !local.some((l) => l.id === b.id))];
    return { data: merged };
  },

  updateWorkerRiskByCode: (workerCode, riskLevel) => axios.put(`/api/doctor/workers/code/${workerCode}/risk`, { riskLevel }, { timeout: 5000 }),
};
export default DoctorService;

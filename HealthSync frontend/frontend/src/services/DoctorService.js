import {
  saveLocalHealthRecord,
  getLocalHealthRecords,
  getAllLocalHealthRecords,
  saveLocalPrescription,
  getLocalPrescriptions,
  getAllLocalPrescriptions,
  getAllLocalAppointments,
  updateLocalAppointmentStatus,
  deduplicateHealthRecords,
  deduplicatePrescriptions
} from "../utils/clinicalStorage";
import { evaluateDrugInteractions } from "../utils/drugInteractionEngine";

const BASE_URL = "/api/doctor";

const DoctorService = {
  getProfile: () => axios.get(`${BASE_URL}/profile`),
  updateProfile: (data) => axios.put(`${BASE_URL}/profile`, data),
  getSettings: async () => {
    try {
      const res = await axios.get(`${BASE_URL}/settings`, { timeout: 3500 });
      if (res?.data) return res;
    } catch (_) {}
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const local = JSON.parse(localStorage.getItem("healthsync-settings-doctor") || "{}");
    return {
      data: {
        name: user.fullName || "Dr. Navaneetha M",
        email: user.email || "717824i335@kce.ac.in",
        phone: user.phone || "9876543210",
        twoFactor: false,
        emailNotifications: true,
        pushNotifications: true,
        theme: localStorage.getItem("healthsync-theme") || "light",
        language: "English",
        ...local
      }
    };
  },
  updateSettings: async (data) => {
    try {
      const res = await axios.put(`${BASE_URL}/settings`, data, { timeout: 3500 });
      if (res?.data) return res;
    } catch (_) {}
    localStorage.setItem("healthsync-settings-doctor", JSON.stringify(data));
    return { data };
  },
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
    const merged = deduplicateHealthRecords(local, backendRecords);
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

  getAppointments: async () => {
    let backendAppointments = [];
    try {
      const res = await axios.get(`${BASE_URL}/appointments`, { timeout: 2500 });
      if (Array.isArray(res.data)) backendAppointments = res.data;
    } catch (err) {
      console.warn("Backend appointments unavailable, using local appointment store:", err);
    }
    const local = getAllLocalAppointments();
    const merged = [...local, ...backendAppointments.filter((b) => !local.some((l) => String(l.id) === String(b.id)))];
    return { data: merged };
  },
  updateAppointmentStatus: async (id, status, details = {}) => {
    updateLocalAppointmentStatus(id, status, details);
    try {
      const res = await axios.patch(`${BASE_URL}/appointments/${id}`, { status, ...details }, { timeout: 2500 });
      return res;
    } catch (err) {
      console.warn("Backend update appointment status failed, updated locally:", err);
      return { data: { id, status, ...details } };
    }
  },
  generateQR: (workerId) => axios.post(`${BASE_URL}/workers/${workerId}/qr`, null, { responseType: "blob", timeout: 4000 }),
  downloadQR: (workerId) => axios.get(`${BASE_URL}/workers/${workerId}/qr`, { responseType: "blob", timeout: 4000 }),
  predictRisk: (data) => axios.post(`${BASE_URL}/risk-prediction`, data, { timeout: 5000 }),
  checkDrugInteraction: async (medicines) => {
    try {
      const res = await axios.post(`/api/ml/drug-interaction`, { medicines }, { timeout: 3500 });
      if (res && res.data && Array.isArray(res.data.interactions) && res.data.interactions.length > 0) {
        return res;
      }
    } catch (err) {
      console.warn("ML service unavailable or timed out, evaluating via clinical pharmacology engine:", err);
    }
    const localResult = evaluateDrugInteractions(medicines);
    return { data: localResult };
  },

  getWorkerHealthRecords: async (workerId) => {
    let backendRecords = [];
    try {
      const res = await axios.get(`/api/worker/healthrecords/${workerId}`, { timeout: 2500 });
      if (Array.isArray(res.data)) backendRecords = res.data;
    } catch (_) {}
    const local = getLocalHealthRecords(workerId);
    const merged = deduplicateHealthRecords(local, backendRecords);
    return { data: merged };
  },

  getWorkerPrescriptions: async (workerId) => {
    let backendPrescriptions = [];
    try {
      const res = await axios.get(`/api/worker/prescriptions/${workerId}`, { timeout: 2500 });
      if (Array.isArray(res.data)) backendPrescriptions = res.data;
    } catch (_) {}
    const local = getLocalPrescriptions(workerId);
    const merged = deduplicatePrescriptions(local, backendPrescriptions);
    return { data: merged };
  },

  updateWorkerRiskByCode: (workerCode, riskLevel) => axios.put(`/api/doctor/workers/code/${workerCode}/risk`, { riskLevel }, { timeout: 5000 }),
};
export default DoctorService;

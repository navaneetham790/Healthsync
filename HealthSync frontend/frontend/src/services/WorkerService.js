import axios from "axios";
import {
  getLocalHealthRecords,
  getLocalPrescriptions,
  getAllLocalAppointments,
  saveLocalAppointment
} from "../utils/clinicalStorage";

const BASE_URL = "/api/worker";

const WorkerService = {
  getProfile(id) {
    return axios.get(`${BASE_URL}/profile/${id}`);
  },

  async getHealthRecords(id) {
    let backendRecords = [];
    try {
      const res = await axios.get(`${BASE_URL}/healthrecords/${id}`, { timeout: 2500 });
      if (Array.isArray(res.data)) backendRecords = res.data;
    } catch (_) {}
    const local = getLocalHealthRecords(id);
    const merged = [...local, ...backendRecords.filter((b) => !local.some((l) => l.id === b.id))];
    return { data: merged };
  },

  async getPrescriptions(id) {
    let backendPrescriptions = [];
    try {
      const res = await axios.get(`${BASE_URL}/prescriptions/${id}`, { timeout: 2500 });
      if (Array.isArray(res.data)) backendPrescriptions = res.data;
    } catch (_) {}
    const local = getLocalPrescriptions(id);
    const merged = [...local, ...backendPrescriptions.filter((b) => !local.some((l) => l.id === b.id))];
    return { data: merged };
  },

  async getAppointments(id) {
    let backendAppointments = [];
    try {
      const res = await axios.get(`${BASE_URL}/appointments/${id}`, { timeout: 2500 });
      if (Array.isArray(res.data)) backendAppointments = res.data;
    } catch (_) {}
    const local = getAllLocalAppointments().filter(
      (a) =>
        !id ||
        String(a.workerId) === String(id) ||
        String(a.workerCode || "").toLowerCase() === String(id).toLowerCase()
    );
    const merged = [...local, ...backendAppointments.filter((b) => !local.some((l) => String(l.id) === String(b.id)))];
    return { data: merged };
  },

  async bookAppointment(data) {
    const localDoc = saveLocalAppointment(data);
    try {
      const res = await axios.post(`${BASE_URL}/appointments`, data, { timeout: 2500 });
      return res;
    } catch (_) {
      return { data: localDoc };
    }
  },

  updateProfile(data) {
    return axios.put(`${BASE_URL}/profile`, data);
  },

  getSettings() {
    return axios.get(`${BASE_URL}/settings`);
  },

  updateSettings(data) {
    return axios.put(`${BASE_URL}/settings`, data);
  },

  getAIRisk(id) {
    return axios.get(`${BASE_URL}/riskprediction/${id}`);
  },

  downloadQR(id) {
    return axios.get(`${BASE_URL}/qr/${id}/download`, { responseType: "blob" });
  }
};

export default WorkerService;

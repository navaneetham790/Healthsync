import axios from "axios";
import {
  getLocalHealthRecords,
  getLocalPrescriptions,
  getAllLocalAppointments,
  saveLocalAppointment,
  deduplicateHealthRecords,
  deduplicatePrescriptions
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
    const merged = deduplicateHealthRecords(local, backendRecords);
    return { data: merged };
  },

  async getPrescriptions(id) {
    let backendPrescriptions = [];
    try {
      const res = await axios.get(`${BASE_URL}/prescriptions/${id}`, { timeout: 2500 });
      if (Array.isArray(res.data)) backendPrescriptions = res.data;
    } catch (_) {}
    const local = getLocalPrescriptions(id);
    const merged = deduplicatePrescriptions(local, backendPrescriptions);
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

  async getSettings() {
    try {
      const res = await axios.get(`${BASE_URL}/settings`, { timeout: 3500 });
      if (res?.data) return res;
    } catch (_) {}
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const local = JSON.parse(localStorage.getItem("healthsync-settings-worker") || "{}");
    return {
      data: {
        name: user.fullName || "Bavana",
        email: user.email || "717824f108@gmail.com",
        phone: user.phone || "9876543210",
        twoFactor: false,
        emailNotifications: true,
        pushNotifications: true,
        theme: localStorage.getItem("healthsync-theme") || "light",
        language: localStorage.getItem("healthsync-language") || "English",
        ...local
      }
    };
  },

  async updateSettings(data) {
    try {
      const res = await axios.put(`${BASE_URL}/settings`, data, { timeout: 3500 });
      if (res?.data) return res;
    } catch (_) {}
    localStorage.setItem("healthsync-settings-worker", JSON.stringify(data));
    return { data };
  },

  getAIRisk(id) {
    return axios.get(`${BASE_URL}/riskprediction/${id}`);
  },

  downloadQR(id) {
    return axios.get(`${BASE_URL}/qr/${id}/download`, { responseType: "blob" });
  }
};

export default WorkerService;

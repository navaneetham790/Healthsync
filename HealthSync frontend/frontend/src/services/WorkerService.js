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
  async getProfile(id) {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const localRegistry = JSON.parse(localStorage.getItem("healthsync_registered_workers") || "{}");
    const targetIdentifier = id || user.workerCode || user.id || "MW001";

    let backendData = null;
    try {
      const res = await axios.get(`${BASE_URL}/profile/${targetIdentifier}`, { timeout: 3500 });
      if (res?.data && (res.data.fullName || res.data.workerCode)) {
        backendData = res.data;
      }
    } catch (_) {
      try {
        const pubRes = await axios.get(`/api/public/workers/${targetIdentifier}`, { timeout: 3000 });
        if (pubRes?.data?.worker) backendData = pubRes.data.worker;
      } catch (_) {}
    }

    const registered = localRegistry[String(targetIdentifier).toUpperCase()] ||
                       localRegistry[String(user.workerCode || "").toUpperCase()] ||
                       localRegistry[String(user.email || "").toLowerCase()] || {};

    const merged = {
      id: user.id || 15,
      workerCode: user.workerCode || "MW001",
      fullName: user.fullName || "Bavana",
      email: user.email || "717824f108@gmail.com",
      phone: "9876543210",
      age: 25,
      riskLevel: "LOW",
      healthHistory: "Viral fever treated with Paracetamol",
      address: "Viral fever treated with Paracetamol",
      diseases: "Acute Upper Respiratory Tract Infection",
      ...user,
      ...registered,
      ...(backendData || {})
    };

    if (!merged.phone || merged.phone === "—") merged.phone = registered.phone || user.phone || "9876543210";
    if (!merged.address || merged.address === "—") merged.address = registered.address || registered.healthHistory || user.address || user.healthHistory || "Viral fever treated with Paracetamol";
    if (!merged.healthHistory || merged.healthHistory === "—") merged.healthHistory = merged.address;
    if (!merged.age || merged.age === 30) merged.age = registered.age || user.age || 25;
    if (!merged.riskLevel || merged.riskLevel === "Not assessed") merged.riskLevel = registered.riskLevel || user.riskLevel || "LOW";

    localStorage.setItem("user", JSON.stringify({ ...user, ...merged }));
    return { data: merged };
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

  async updateProfile(data) {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const localRegistry = JSON.parse(localStorage.getItem("healthsync_registered_workers") || "{}");
    const updated = { ...user, ...data };
    localStorage.setItem("user", JSON.stringify(updated));

    if (data.workerCode) localRegistry[data.workerCode.toUpperCase()] = updated;
    if (data.email) localRegistry[data.email.toLowerCase()] = updated;
    localStorage.setItem("healthsync_registered_workers", JSON.stringify(localRegistry));

    try {
      const res = await axios.put(`${BASE_URL}/profile`, data, { timeout: 3500 });
      return res;
    } catch (_) {
      return { data: updated };
    }
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

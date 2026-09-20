import axios from "axios";

const BASE_URL = "/api/admin";

const AdminService = {

    createDoctor(data) {

        return axios.post(`${BASE_URL}/doctor`, data);

    },

    getDoctors(search = "") {

        return axios.get(`${BASE_URL}/doctors`, { params: search ? { search } : {} });

    },
    inviteDoctorApplication(data) { return axios.post(`${BASE_URL}/doctor-applications/invite`, data); },
    getDoctorApplications() { return axios.get(`${BASE_URL}/doctor-applications`); },
    approveDoctorApplication(id) { return axios.post(`${BASE_URL}/doctor-applications/${id}/approve`); },
    rejectDoctorApplication(id, reason) { return axios.post(`${BASE_URL}/doctor-applications/${id}/reject`, { reason }); },
    cancelDoctorApplication(id) { return axios.delete(`${BASE_URL}/doctor-applications/${id}`); },
    getDoctorApplicationDocument(id, type) { return axios.get(`${BASE_URL}/doctor-applications/${id}/documents/${type}`, { responseType: "blob" }); },
    getHospitals() { return axios.get("/api/ml/hospitals"); },
    createWorker(data) { return axios.post(`${BASE_URL}/workers`, data); },

    updateDoctor(id, data) { return axios.put(`${BASE_URL}/doctors/${id}`, data); },
    deleteDoctor(id, message) { return axios.delete(`${BASE_URL}/doctors/${id}`, { data: { message } }); },

    getWorkers() {

        return axios.get(`${BASE_URL}/workers`);

    },


    updateProfile(data) { return axios.put(`${BASE_URL}/profile`, data); },
    getProfile() { return axios.get(`${BASE_URL}/profile`); },
    getSettings() { return axios.get(`${BASE_URL}/settings`); },
    updateSettings(data) { return axios.put(`${BASE_URL}/settings`, data); },
    logoutAllSessions() { return axios.post(`${BASE_URL}/sessions/logout-all`); },

    getAnalytics() {

        return axios.get(`${BASE_URL}/analytics`);

    },

    getAuditLogs() {

        return axios.get(`${BASE_URL}/auditlogs`);

    },

    getReports() {

        return axios.get(`${BASE_URL}/reports`);

    }
    ,downloadReport(id, format = "pdf") { return axios.get(`${BASE_URL}/reports/${id}/download`, { params: { format }, responseType: "blob" }); }

};

export default AdminService;

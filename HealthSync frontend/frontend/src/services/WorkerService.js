import axios from "axios";

const BASE_URL = "/api/worker";

const WorkerService = {

    getProfile(id) {

        return axios.get(`${BASE_URL}/profile/${id}`);

    },

    getHealthRecords(id) {

        return axios.get(`${BASE_URL}/healthrecords/${id}`);

    },

    getPrescriptions(id) {

        return axios.get(`${BASE_URL}/prescriptions/${id}`);

    },

    getAppointments(id) {

        return axios.get(`${BASE_URL}/appointments/${id}`);

    },

    bookAppointment(data) { return axios.post(`${BASE_URL}/appointments`, data); },
    updateProfile(data) { return axios.put(`${BASE_URL}/profile`, data); },
    getSettings() { return axios.get(`${BASE_URL}/settings`); },
    updateSettings(data) { return axios.put(`${BASE_URL}/settings`, data); },

    getAIRisk(id) {

        return axios.get(`${BASE_URL}/riskprediction/${id}`);

    }
    ,downloadQR(id) { return axios.get(`${BASE_URL}/qr/${id}/download`, { responseType: "blob" }); }

};

export default WorkerService;

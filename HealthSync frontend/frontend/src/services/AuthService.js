import axios from "axios";

const BASE_URL = "/api/auth";

const AuthService = {

    login(data) {
        return axios.post(`${BASE_URL}/login`, data);
    },

    adminLogin(data) {

        return axios.post(`${BASE_URL}/admin/login`, data);

    },

    doctorLogin(data) {

        return axios.post(`${BASE_URL}/doctor/login`, data);

    },

    workerLogin(data) {

        return axios.post(`${BASE_URL}/worker/login`, data);

    },

    forgotPassword(email) {

        return axios.post(`${BASE_URL}/forgot-password`, {

            email

        });

    },

    resetPassword(token, newPassword) {
        return axios.post(`${BASE_URL}/reset-password`, { token, newPassword });
    },

    sendEmailOtp(email) {
        return axios.post(`${BASE_URL}/email-otp/send`, { email }, { timeout: 12000 });
    },

    verifyEmailOtp(email, otp) {
        return axios.post(`${BASE_URL}/email-otp/verify`, { email, otp }, { timeout: 12000 });
    },

    verifyTwoFactor(loginToken, otp) {
        return axios.post(`${BASE_URL}/2fa/verify`, { loginToken, otp }, { timeout: 12000 });
    }

};

export default AuthService;
